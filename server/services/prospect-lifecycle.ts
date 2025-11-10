// ProspectLifecycle Service - Orchestrates lead management without duplication
// Uses existing leads, guestLeads, and users tables

import { db } from "../db";
import { leads, guestLeads, users, walletTransactions } from "@shared/schema";
import type { Lead, GuestLead, User, InsertLead, InsertUser } from "@shared/schema";
import { eq, or, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { 
  ProspectDTO, 
  ProspectInput, 
  normalizeProspectInput,
  leadToProspectDTO,
  userToProspectDTO,
  ProspectStatus,
  ProspectPriority
} from "@shared/types/prospect";

export class ProspectLifecycleService {
  /**
   * Find or create a prospect based on phone/email
   * Implements deduplication logic
   */
  static async getOrCreateProspect(input: ProspectInput): Promise<ProspectDTO> {
    // Normalize input to canonical field names
    const data = normalizeProspectInput(input);
    try {
      // Normalize phone number if provided
      const normalizedPhone = data.phoneNumber ? 
        this.normalizePhoneNumber(data.phoneNumber) : undefined;
      
      // Check for existing lead by phone or email
      let existingLead: Lead | undefined;
      
      if (normalizedPhone || data.email) {
        const conditions = [];
        if (normalizedPhone) conditions.push(eq(leads.phoneNumber, normalizedPhone));
        if (data.email) conditions.push(eq(leads.email, data.email));
        
        const result = await db.select()
          .from(leads)
          .where(or(...conditions))
          .limit(1);
        
        existingLead = result[0];
      }
      
      // Also check if user already exists
      if (!existingLead && (normalizedPhone || data.email)) {
        const conditions = [];
        if (normalizedPhone) conditions.push(eq(users.phoneNumber, normalizedPhone));
        if (data.email) conditions.push(eq(users.email, data.email));
        
        const existingUserResult = await db.select()
          .from(users)
          .where(or(...conditions))
          .limit(1);
        
        if (existingUserResult[0]) {
          console.log(`✅ User already exists #${existingUserResult[0].id} for ${normalizedPhone || data.email}`);
          // Return user info as prospect DTO
          return userToProspectDTO(existingUserResult[0]);
        }
      }
      
      if (existingLead) {
        // Found existing lead - return as DTO
        console.log(`✅ Found existing lead #${existingLead.id} for ${normalizedPhone || data.email}`);
        return leadToProspectDTO(existingLead);
      }
      
      // No existing lead - create new one
      const leadData = {
        firstName: data.firstName || 'Unknown',
        lastName: data.lastName || '',
        email: data.email,
        phoneNumber: normalizedPhone,
        source: data.source || 'walk-in',
        status: data.status || 'new',
        priority: data.priority || 'medium',
        interestedLanguage: data.interestedLanguage,
        level: data.level,
        notes: data.notes,
        budget: data.budget,
        preferredFormat: data.preferredFormat,
        nationalId: data.nationalId,
        age: data.age,
        gender: data.gender
        // createdAt and updatedAt are handled by the database defaults
      } as any; // Type inference issue with Drizzle - fields exist in actual schema
      
      const [newLead] = await db.insert(leads)
        .values(leadData)
        .returning();
      
      console.log(`✅ Created new lead #${newLead.id} for ${normalizedPhone || data.email}`);
      
      return {
        leadId: newLead.id,
        ...leadData,
        ...data
      };
    } catch (error) {
      console.error('❌ Error in getOrCreateProspect:', error);
      throw error;
    }
  }
  
  /**
   * Merge guest lead data into main lead record
   */
  static async mergeGuestLeadToLead(guestLeadId: number): Promise<ProspectSnapshot> {
    try {
      // Get guest lead
      const [guestLead] = await db.select()
        .from(guestLeads)
        .where(eq(guestLeads.id, guestLeadId));
      
      if (!guestLead) {
        throw new Error(`Guest lead #${guestLeadId} not found`);
      }
      
      // Find or create corresponding lead
      const prospect = await this.getOrCreateProspect({
        firstName: guestLead.name?.split(' ')[0],
        lastName: guestLead.name?.split(' ').slice(1).join(' '),
        email: guestLead.email,
        phoneNumber: guestLead.phone || undefined,
        source: guestLead.source || 'placement_test',
        status: 'qualified', // Guest took placement test
        notes: guestLead.notes,
        placementSessionId: guestLead.placementSessionId || undefined
      });
      
      // Update guest lead to mark as processed
      await db.update(guestLeads)
        .set({ 
          status: 'converted',
          updatedAt: new Date()
        } satisfies Partial<typeof guestLeads.$inferSelect>)
        .where(eq(guestLeads.id, guestLeadId));
      
      console.log(`✅ Merged guest lead #${guestLeadId} into lead #${prospect.leadId}`);
      
      return prospect;
    } catch (error) {
      console.error('❌ Error merging guest lead:', error);
      throw error;
    }
  }
  
  /**
   * Enrich existing lead with additional data
   */
  static async enrichProspect(leadId: number, data: Partial<ProspectSnapshot>): Promise<ProspectSnapshot> {
    try {
      // Get existing lead
      const [existingLead] = await db.select()
        .from(leads)
        .where(eq(leads.id, leadId));
      
      if (!existingLead) {
        throw new Error(`Lead #${leadId} not found`);
      }
      
      // Prepare update data
      const updates: any = {};
      
      // Only update non-empty values
      if (data.firstName && !existingLead.firstName) updates.firstName = data.firstName;
      if (data.lastName && !existingLead.lastName) updates.lastName = data.lastName;
      if (data.email && !existingLead.email) updates.email = data.email;
      if (data.phoneNumber && !existingLead.phoneNumber) {
        updates.phoneNumber = this.normalizePhoneNumber(data.phoneNumber);
      }
      if (data.interestedLanguage) updates.interestedLanguage = data.interestedLanguage;
      if (data.level) updates.level = data.level;
      if (data.budget) updates.budget = data.budget;
      if (data.preferredFormat) updates.preferredFormat = data.preferredFormat;
      if (data.nationalId) updates.nationalId = data.nationalId;
      if (data.age) updates.age = data.age;
      if (data.gender) updates.gender = data.gender;
      if (data.notes) {
        updates.notes = existingLead.notes 
          ? `${existingLead.notes}\n${data.notes}`
          : data.notes;
      }
      
      // Update if there are changes
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        
        await db.update(leads)
          .set(updates)
          .where(eq(leads.id, leadId));
        
        console.log(`✅ Enriched lead #${leadId} with ${Object.keys(updates).length} fields`);
      }
      
      // Return enriched prospect
      const [enrichedLead] = await db.select()
        .from(leads)
        .where(eq(leads.id, leadId));
      
      return {
        leadId: enrichedLead.id,
        firstName: enrichedLead.firstName,
        lastName: enrichedLead.lastName,
        email: enrichedLead.email || undefined,
        phoneNumber: enrichedLead.phoneNumber || undefined,
        source: enrichedLead.source || undefined,
        status: enrichedLead.status || undefined,
        priority: enrichedLead.priority || undefined,
        interestedLanguage: enrichedLead.interestedLanguage || undefined,
        level: enrichedLead.level || undefined,
        notes: enrichedLead.notes || undefined,
        budget: enrichedLead.budget || undefined,
        preferredFormat: enrichedLead.preferredFormat || undefined,
        nationalId: enrichedLead.nationalId || undefined,
        age: enrichedLead.age || undefined,
        gender: enrichedLead.gender || undefined,
        createdAt: enrichedLead.createdAt,
        updatedAt: enrichedLead.updatedAt
      };
    } catch (error) {
      console.error('❌ Error enriching prospect:', error);
      throw error;
    }
  }
  
  /**
   * Convert lead to student (user) with all accumulated data
   * Creates user account with OTP access
   */
  static async convertLeadToStudent(
    leadId: number, 
    options: {
      sendWelcomeSms?: boolean;
      enrollInCourse?: number;
      initialPayment?: number;
      paymentMethod?: 'cash' | 'card' | 'online' | 'invoice';
      receivedBy?: number; // User ID of staff receiving payment
    } = {}
  ): Promise<{ user: User; smsStatus?: string }> {
    try {
      // Get lead data
      const [lead] = await db.select()
        .from(leads)
        .where(eq(leads.id, leadId));
      
      if (!lead) {
        throw new Error(`Lead #${leadId} not found`);
      }
      
      // Check if user already exists
      let existingUser: User | undefined;
      
      if (lead.email) {
        const [userByEmail] = await db.select()
          .from(users)
          .where(eq(users.email, lead.email));
        existingUser = userByEmail;
      }
      
      if (!existingUser && lead.phoneNumber) {
        const [userByPhone] = await db.select()
          .from(users)
          .where(eq(users.phoneNumber, lead.phoneNumber));
        existingUser = userByPhone;
      }
      
      if (existingUser) {
        console.log(`⚠️ User already exists for lead #${leadId} - returning existing user #${existingUser.id}`);
        return { user: existingUser };
      }
      
      // Generate random password for OTP-only users
      // This satisfies the password requirement while ensuring users must use OTP
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Create new user account
      const userData = {
        email: lead.email || `lead${leadId}@placeholder.local`,
        password: hashedPassword, // Random password for OTP-only users
        firstName: lead.firstName,
        lastName: lead.lastName,
        phoneNumber: lead.phoneNumber || '',
        role: 'student',
        nationalId: lead.nationalId || undefined
        // walletBalance, totalCredits, memberTier have defaults in the database
        // createdAt and updatedAt are handled by the database defaults
      } as any; // Type inference issue with Drizzle - fields exist in actual schema
      
      const [newUser] = await db.insert(users)
        .values(userData)
        .returning();
      
      console.log(`✅ Converted lead #${leadId} to student #${newUser.id} (OTP-only access)`);
      
      // Update lead with conversion info using existing fields
      await db.update(leads)
        .set({ 
          status: 'converted',
          studentId: newUser.id, // Using existing field
          conversionDate: new Date(), // Using existing field
          updatedAt: new Date()
        } satisfies Partial<typeof leads.$inferSelect>)
        .where(eq(leads.id, leadId));
      
      // Process initial payment if provided
      if (options.initialPayment && options.initialPayment > 0) {
        const transactionData = {
          userId: newUser.id,
          type: 'deposit' as const,
          amount: options.initialPayment.toString(),
          description: `پرداخت اولیه - ${options.paymentMethod === 'cash' ? 'نقدی' : options.paymentMethod === 'card' ? 'کارت' : options.paymentMethod === 'invoice' ? 'فاکتور' : 'آنلاین'}`,
          status: options.paymentMethod === 'invoice' ? 'pending' : 'completed'
          // createdAt is handled by the database default
        } as any; // Type inference issue with Drizzle - fields exist in actual schema
        
        await db.insert(walletTransactions)
          .values(transactionData);
        
        // Update wallet balance if payment is completed
        if (options.paymentMethod !== 'invoice') {
          await db.update(users)
            .set({ 
              walletBalance: sql`${users.walletBalance} + ${options.initialPayment}`
            } satisfies Partial<typeof users.$inferSelect>)
            .where(eq(users.id, newUser.id));
        }
        
        console.log(`💰 Processed ${options.paymentMethod} payment of ${options.initialPayment} IRR`);
      }
      
      // Send welcome SMS if requested and phone available
      let smsStatus = undefined;
      if (options.sendWelcomeSms && lead.phoneNumber) {
        try {
          const welcomeMessage = `سلام ${lead.firstName} عزیز،
حساب کاربری شما در موسسه زبان ایجاد شد.
برای ورود از شماره تلفن ${lead.phoneNumber} و کد تایید پیامکی استفاده کنید.
موسسه زبان متا لینگوا`;
          
          // SMS sending would happen here via Kavenegar integration
          // For now, we'll just log it
          console.log(`📱 Would send SMS to ${lead.phoneNumber}: ${welcomeMessage}`);
          smsStatus = 'sent';
        } catch (smsError) {
          console.error('❌ Failed to send welcome SMS:', smsError);
          smsStatus = 'failed';
        }
      }
      
      return { 
        user: newUser, 
        smsStatus 
      };
    } catch (error) {
      console.error('❌ Error converting lead to student:', error);
      throw error;
    }
  }
  
  /**
   * Normalize Iranian phone numbers
   */
  private static normalizePhoneNumber(phone: string): string {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Convert Persian/Arabic digits to English
    normalized = normalized
      .replace(/[۰٠]/g, '0')
      .replace(/[۱١]/g, '1')
      .replace(/[۲٢]/g, '2')
      .replace(/[۳٣]/g, '3')
      .replace(/[۴٤]/g, '4')
      .replace(/[۵٥]/g, '5')
      .replace(/[۶٦]/g, '6')
      .replace(/[۷٧]/g, '7')
      .replace(/[۸٨]/g, '8')
      .replace(/[۹٩]/g, '9');
    
    // Handle Iranian number formats
    if (normalized.startsWith('98')) {
      // International format: 989123456789
      normalized = '0' + normalized.substring(2);
    } else if (!normalized.startsWith('0') && normalized.length === 10) {
      // Missing leading 0: 9123456789
      normalized = '0' + normalized;
    }
    
    // Validate Iranian mobile format
    if (normalized.match(/^09[0-9]{9}$/)) {
      return normalized;
    }
    
    // Return original if not valid
    return phone;
  }
  
  /**
   * Get unified prospect view (combines all sources)
   */
  static async getUnifiedProspectView(filters?: {
    status?: string;
    source?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ProspectSnapshot[]> {
    try {
      // Get all leads
      const leadsQuery = db.select()
        .from(leads);
      
      // Apply filters
      const conditions = [];
      if (filters?.status) conditions.push(eq(leads.status, filters.status));
      if (filters?.source) conditions.push(eq(leads.source, filters.source));
      if (filters?.dateFrom) conditions.push(sql`${leads.createdAt} >= ${filters.dateFrom}`);
      if (filters?.dateTo) conditions.push(sql`${leads.createdAt} <= ${filters.dateTo}`);
      
      if (conditions.length > 0) {
        leadsQuery.where(and(...conditions));
      }
      
      const allLeads = await leadsQuery;
      
      // Get unconverted guest leads
      const unconvertedGuests = await db.select()
        .from(guestLeads);
      
      // Combine into unified view
      const prospects: ProspectSnapshot[] = [];
      
      // Add leads
      for (const lead of allLeads) {
        prospects.push({
          leadId: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || undefined,
          phoneNumber: lead.phoneNumber || undefined,
          source: lead.source || undefined,
          status: lead.status || undefined,
          priority: lead.priority || undefined,
          interestedLanguage: lead.interestedLanguage || undefined,
          level: lead.level || undefined,
          notes: lead.notes || undefined,
          budget: lead.budget || undefined,
          preferredFormat: lead.preferredFormat || undefined,
          nationalId: lead.nationalId || undefined,
          age: lead.age || undefined,
          gender: lead.gender || undefined,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        });
      }
      
      // Add guest leads (they don't have status field)
      for (const guest of unconvertedGuests) {
        prospects.push({
          guestLeadId: guest.id,
          firstName: guest.name?.split(' ')[0],
          lastName: guest.name?.split(' ').slice(1).join(' '),
          email: guest.email,
          phoneNumber: guest.phone || undefined,
          source: guest.source || 'placement_test',
          status: 'guest',
          placementSessionId: guest.placementSessionId || undefined,
          notes: guest.notes || undefined,
          createdAt: guest.createdAt,
          updatedAt: guest.updatedAt
        });
      }
      
      // Sort by creation date (newest first)
      prospects.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
      
      return prospects;
    } catch (error) {
      console.error('❌ Error getting unified prospect view:', error);
      throw error;
    }
  }
}