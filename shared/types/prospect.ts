/**
 * Canonical Prospect Data Transfer Object
 * Standardizes data contract across ProspectLifecycle system
 * Uses Drizzle schema field names as the source of truth
 */

import { z } from 'zod';

// Prospect status enum (matches leads table)
export const ProspectStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  NEGOTIATING: 'negotiating',
  LOST: 'lost',
  CONVERTED: 'converted'
} as const;

export type ProspectStatusType = typeof ProspectStatus[keyof typeof ProspectStatus];

// Prospect priority enum (matches leads table)
export const ProspectPriority = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  NORMAL: 'normal'
} as const;

export type ProspectPriorityType = typeof ProspectPriority[keyof typeof ProspectPriority];

// Prospect source enum
export const ProspectSource = {
  WALK_IN: 'walk-in',
  CALL_CENTER: 'call-center',
  WEBSITE: 'website',
  PLACEMENT_TEST: 'placement_test',
  REFERRAL: 'referral',
  SOCIAL_MEDIA: 'social_media',
  MANUAL: 'manual',
  GUEST: 'guest'
} as const;

export type ProspectSourceType = typeof ProspectSource[keyof typeof ProspectSource];

/**
 * ProspectDTO - Unified data structure for prospects
 * Field names match Drizzle schema (leads/users tables)
 */
export interface ProspectDTO {
  // Identity fields
  id: number;
  leadId?: number;
  userId?: number;
  
  // Name fields  
  firstName?: string;
  lastName?: string;
  
  // Contact fields (using canonical phoneNumber, not phone)
  email?: string;
  phoneNumber?: string; // CANONICAL: matches Drizzle schema
  
  // Status fields
  source?: ProspectSourceType;
  status?: ProspectStatusType;
  priority?: ProspectPriorityType;
  
  // Interest fields (using canonical names from leads table)
  interestedLanguage?: string; // CANONICAL: matches leads table
  level?: string; // CANONICAL: matches leads table (not skillLevel)
  preferredFormat?: string;
  budget?: number;
  
  // Tracking fields
  lastContact?: string;
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Additional fields
  notes?: string;
  nationalId?: string;
  age?: number;
  gender?: string;
}

/**
 * Zod schema for ProspectDTO validation
 */
export const ProspectDTOSchema = z.object({
  id: z.number(),
  leadId: z.number().optional(),
  userId: z.number().optional(),
  
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(), // CANONICAL field name
  
  source: z.enum([
    ProspectSource.WALK_IN,
    ProspectSource.CALL_CENTER,
    ProspectSource.WEBSITE,
    ProspectSource.PLACEMENT_TEST,
    ProspectSource.REFERRAL,
    ProspectSource.SOCIAL_MEDIA,
    ProspectSource.MANUAL,
    ProspectSource.GUEST
  ]).optional(),
  
  status: z.enum([
    ProspectStatus.NEW,
    ProspectStatus.CONTACTED,
    ProspectStatus.QUALIFIED,
    ProspectStatus.NEGOTIATING,
    ProspectStatus.LOST,
    ProspectStatus.CONVERTED
  ]).optional(),
  
  priority: z.enum([
    ProspectPriority.HOT,
    ProspectPriority.WARM,
    ProspectPriority.COLD,
    ProspectPriority.NORMAL
  ]).optional(),
  
  interestedLanguage: z.string().optional(),
  level: z.string().optional(),
  preferredFormat: z.string().optional(),
  budget: z.number().optional(),
  
  lastContact: z.string().optional(),
  followUpDate: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  
  notes: z.string().optional(),
  nationalId: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional()
});

/**
 * Input schema for creating/updating prospects
 * Allows flexible field naming at boundaries but normalizes internally
 */
export const ProspectInputSchema = z.object({
  // Support both phone and phoneNumber at input boundary
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(), // Full name - will be split
  
  email: z.string().email().optional(),
  phone: z.string().optional(), // Legacy field name
  phoneNumber: z.string().optional(), // Canonical field name
  
  source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  
  interestedLanguage: z.string().optional(),
  interestedIn: z.array(z.string()).optional(), // Legacy array field
  level: z.string().optional(),
  skillLevel: z.string().optional(), // Legacy field name
  
  preferredFormat: z.string().optional(),
  preferredSchedule: z.string().optional(), // Legacy field name
  budget: z.union([z.string(), z.number()]).optional(),
  
  notes: z.string().optional(),
  nationalId: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional()
});

export type ProspectInput = z.infer<typeof ProspectInputSchema>;

/**
 * Normalizes input data to canonical ProspectDTO format
 * Handles field name variations and legacy formats
 */
export function normalizeProspectInput(input: ProspectInput): Partial<ProspectDTO> {
  const normalized: Partial<ProspectDTO> = {};
  
  // Handle name fields
  if (input.name && !input.firstName && !input.lastName) {
    const nameParts = input.name.trim().split(' ');
    normalized.firstName = nameParts[0];
    normalized.lastName = nameParts.slice(1).join(' ') || '';
  } else {
    if (input.firstName) normalized.firstName = input.firstName;
    if (input.lastName) normalized.lastName = input.lastName;
  }
  
  // Normalize phone field to canonical phoneNumber
  normalized.phoneNumber = input.phoneNumber || input.phone;
  
  // Normalize level field (skillLevel -> level)
  normalized.level = input.level || input.skillLevel;
  
  // Normalize preferredFormat (preferredSchedule -> preferredFormat)
  normalized.preferredFormat = input.preferredFormat || input.preferredSchedule;
  
  // Convert interestedIn array to interestedLanguage (take first)
  if (input.interestedIn && input.interestedIn.length > 0) {
    normalized.interestedLanguage = input.interestedLanguage || input.interestedIn[0];
  } else {
    normalized.interestedLanguage = input.interestedLanguage;
  }
  
  // Normalize budget to number
  if (input.budget) {
    normalized.budget = typeof input.budget === 'string' 
      ? parseFloat(input.budget) || 0 
      : input.budget;
  }
  
  // Copy over standard fields
  if (input.email) normalized.email = input.email;
  if (input.source) normalized.source = input.source as ProspectSourceType;
  if (input.status) normalized.status = input.status as ProspectStatusType;
  if (input.priority) normalized.priority = input.priority as ProspectPriorityType;
  if (input.notes) normalized.notes = input.notes;
  if (input.nationalId) normalized.nationalId = input.nationalId;
  if (input.age) normalized.age = input.age;
  if (input.gender) normalized.gender = input.gender;
  
  return normalized;
}

/**
 * Maps database lead record to ProspectDTO
 */
export function leadToProspectDTO(lead: any): ProspectDTO {
  return {
    id: lead.id,
    leadId: lead.id,
    userId: undefined,
    
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phoneNumber: lead.phoneNumber, // Already canonical in DB
    
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    
    interestedLanguage: lead.interestedLanguage,
    level: lead.level,
    preferredFormat: lead.preferredFormat,
    budget: lead.budget,
    
    lastContact: lead.lastContact,
    followUpDate: lead.followUpDate,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    
    notes: lead.notes,
    nationalId: lead.nationalId,
    age: lead.age,
    gender: lead.gender
  };
}

/**
 * Maps database user record to ProspectDTO
 */
export function userToProspectDTO(user: any): ProspectDTO {
  return {
    id: user.id,
    leadId: undefined,
    userId: user.id,
    
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber, // Already canonical in DB
    
    source: 'converted', // User is a converted lead
    status: ProspectStatus.CONVERTED,
    priority: ProspectPriority.NORMAL,
    
    interestedLanguage: user.targetLanguage || 'english',
    level: user.proficiencyLevel,
    
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    
    nationalId: user.nationalId,
    age: user.age,
    gender: user.gender
  };
}