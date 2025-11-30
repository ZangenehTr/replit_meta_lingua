import type { Lead } from "@shared/schema";

export interface LeadSummary {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  status: string;
  priority?: string | null;
  source?: string | null;
  interestedLanguage?: string | null;
  interestedLevel?: string | null;
  notes?: string | null;
  lastContact?: Date | null;
  assignedTo?: number | null;
  tags?: string[];
}

export function normalizeLeadToSummary(lead: Lead): LeadSummary {
  return {
    id: lead.id,
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    firstName: lead.firstName,
    lastName: lead.lastName,
    phoneNumber: lead.phoneNumber || "",
    email: lead.email,
    status: lead.status,
    priority: lead.priority,
    source: lead.source,
    interestedLanguage: lead.interestedLanguage,
    interestedLevel: lead.interestedLevel,
    notes: lead.notes,
    lastContact: lead.lastContactDate ? new Date(lead.lastContactDate) : null,
    assignedTo: lead.assignedTo,
    tags: [],
  };
}

export function normalizeLeadsToSummaries(leads: Lead[]): LeadSummary[] {
  return leads.map(normalizeLeadToSummary);
}

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interested: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  qualified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  converted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  follow_up: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  no_response: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  level_assessment: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  withdrawal: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}
