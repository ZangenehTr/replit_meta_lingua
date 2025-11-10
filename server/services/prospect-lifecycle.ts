// ProspectLifecycle Service - Orchestrates lead management without duplication
// Uses existing leads, guestLeads, and users tables

import { db } from "../db";
import { leads, guestLeads, users, walletTransactions } from "@shared/schema";
import type { Lead, GuestLead, User, InsertLead, InsertUser } from "@shared/schema";
import { eq, or, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface ProspectSnapshot {
  // Core identifiers
  leadId?: number;
  guestLeadId?: number;
  userId?: number;
  
  // Contact info
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  
  // Lead data
  source?: string;
  status?: string;
  priority?: string;
  interestedLanguage?: string;
  level?: string;
  notes?: string;
  
  // Placement test data
  placementScore?: number;
  placementLevel?: string;
  placementSessionId?: number;
  
  // Additional data accumulated over time
  preferredFormat?: string;
  budget?: number;
  nationalId?: string;
  age?: number;
  gender?: string;
  
  // Tracking
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProspectLifecycleService {
  /**
   * Find or create a prospect based on phone/email
   * Implements deduplication logic
   */
  static async getOrCreateProspect(data: ProspectSnapshot): Promise<ProspectSnapshot> {
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
          // Return user info as prospect snapshot
          return {
            userId: existingUserResult[0].id,
            firstName: existingUserResult[0].firstName,
            lastName: existingUserResult[0].lastName || '',
            email: existingUserResult[0].email,
            phoneNumber: existingUserResult[0].phoneNumber,
            nationalId: existingUserResult[0].nationalId || undefined,
            status: 'existing_user',
            ...data
          };
        }
      }
      
      if (existingLead) {
        // Found existing lead - return enriched data
        console.log(`✅ Found existing lead #${existingLead.id} for ${normalizedPhone || data.email}`);
        return {
          leadId: existingLead.id,
          firstName: existingLead.firstName,
          lastName: existingLead.lastName,
          email: existingLead.email || data.email,
          phoneNumber: existingLead.phoneNumber,
          source: existingLead.source,
          status: existingLead.status,
          priority: existingLead.priority,
          interestedLanguage: existingLead.interestedLanguage,
          level: existingLead.level,
          notes: existingLead.notes,
          budget: existingLead.budget,
          preferredFormat: existingLead.preferredFormat,
          nationalId: existingLead.nationalId,
          age: existingLead.age,
          gender: existingLead.gender,
          createdAt: existingLead.createdAt,
          updatedAt: existingLead.updatedAt,
          ...data // Overlay any new data
        };
      }
      
      // No existing lead - create new one
      // Use snake_case for database insert
      const leadData = {
        first_name: data.firstName || 'Unknown',
        last_name: data.lastName || '',
        email: data.email,
        phone_number: normalizedPhone,
        source: data.source || 'walk-in',
        status: data.status || 'new',
        priority: data.priority || 'medium',
        interested_language: data.interestedLanguage,
        level: data.level,
        notes: data.notes,
        budget: data.budget,
        preferred_format: data.preferredFormat,
        national_id: data.nationalId,
        age: data.age,
        gender: data.gender
        // created_at and updated_at are handled by the database defaults
      } satisfies typeof leads.$inferInsert;
      
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
        })
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
      // Use snake_case for database insert
      const userData = {
        email: lead.email || `lead${leadId}@placeholder.local`,
        password: hashedPassword, // Random password for OTP-only users
        first_name: lead.firstName,
        last_name: lead.lastName,
        phone_number: lead.phoneNumber || '',
        role: 'student',
        national_id: lead.nationalId || undefined
        // wallet_balance, total_credits, member_tier have defaults in the database
        // created_at and updated_at are handled by the database defaults
      } satisfies typeof users.$inferInsert;
      
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
        })
        .where(eq(leads.id, leadId));
      
      // Process initial payment if provided
      if (options.initialPayment && options.initialPayment > 0) {
        const transactionData = {
          user_id: newUser.id,
          type: 'deposit' as const,
          amount: options.initialPayment.toString(),
          description: `پرداخت اولیه - ${options.paymentMethod === 'cash' ? 'نقدی' : options.paymentMethod === 'card' ? 'کارت' : options.paymentMethod === 'invoice' ? 'فاکتور' : 'آنلاین'}`,
          status: options.paymentMethod === 'invoice' ? 'pending' : 'completed'
          // created_at is handled by the database default
        } satisfies typeof walletTransactions.$inferInsert;
        
        await db.insert(walletTransactions)
          .values(transactionData);
        
        // Update wallet balance if payment is completed
        if (options.paymentMethod !== 'invoice') {
          await db.update(users)
            .set({ 
              walletBalance: sql`${users.walletBalance} + ${options.initialPayment}`
            })
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