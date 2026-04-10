// Role-based navigation system according to PRD specifications
// PRD User Roles: Admin, Teacher/Tutor, Mentor, Student, Supervisor, Call Center Agent, Accountant

import { generateDynamicNavigation, NavigationItem as DynamicNavItem } from '@shared/subsystem-permissions';

// Role color mapping for sidebar visual indicators
export const ROLE_COLORS: Record<string, string> = {
  "Admin": "bg-purple-500",
  "Teacher/Tutor": "bg-blue-500",
  "Mentor": "bg-green-500",
  "Student": "bg-yellow-500",
  "Supervisor": "bg-orange-500",
  "Call Center Agent": "bg-pink-500",
  "Accountant": "bg-teal-500",
  "Front Desk Clerk": "bg-indigo-500",
};

// Normalize a role name to match the ROLE_COLORS keys
const normalizeRole = (role: string): string => {
  const normalized = role.toLowerCase();
  
  switch (normalized) {
    case "admin": return "Admin";
    case "teacher": case "tutor": case "teacher/tutor": return "Teacher/Tutor";
    case "mentor": return "Mentor";
    case "student": return "Student";
    case "supervisor": return "Supervisor";
    case "call center agent": case "call_center": case "callcenter": return "Call Center Agent";
    case "accountant": return "Accountant";
    case "front desk clerk": case "front_desk_clerk": case "frontdesk": return "Front Desk Clerk";
    default: return role;
  }
};

// Get role color for display - returns color based on the menu item's accessible roles
// If multiple roles can access an item, returns the color of the primary/first role
export const getRoleColor = (roles: string[]): string => {
  if (!roles || roles.length === 0) return "bg-gray-500";
  
  const mappedRole = normalizeRole(roles[0]);
  return ROLE_COLORS[mappedRole] || "bg-gray-500";
};

// Get all role colors for multi-role items - returns array of colors
export const getRoleColors = (roles: string[]): string[] => {
  if (!roles || roles.length === 0) return ["bg-gray-500"];
  
  return roles.map(role => {
    const mappedRole = normalizeRole(role);
    return ROLE_COLORS[mappedRole] || "bg-gray-500";
  });
};

export interface NavigationItem {
  path: string;
  icon: any;
  label: string;
  badge?: number;
  roles: string[];
  roleColor?: string; // Color indicator for the role(s) that have access to this item
  order?: number; // Immutable order for stable sorting regardless of translation state
  section?: string;
}

// Convert dynamic navigation items to component-compatible format
const convertDynamicToNavigation = (dynamicItems: DynamicNavItem[], currentLang: string): NavigationItem[] => {
  const usePersian = currentLang === 'fa';
  const useArabic = currentLang === 'ar';
  
  return dynamicItems.map(item => ({
    path: item.path,
    icon: item.icon,
    label: (usePersian || useArabic) ? (item.label || item.nameEn || 'Navigation Item') : 
           (item.nameEn || item.label || 'Navigation Item'),
    roles: item.roles,
    order: item.order || 0,
    section: item.section
  }));
};

// Get navigation based on user role using dynamic generation
export const getNavigationForRole = (role: string, t: any, currentLang: string = 'en'): NavigationItem[] => {
  // Normalize role to handle both lowercase and capitalized versions
  const normalizedRole = role.toLowerCase();
  
  // Map normalized roles to exact role names used in permissions
  const roleMapping: Record<string, string> = {
    "student": "Student",
    "teacher/tutor": "Teacher/Tutor", 
    "teacher": "Teacher/Tutor",
    "tutor": "Teacher/Tutor",
    "mentor": "Mentor",
    "admin": "Admin",
    "supervisor": "Supervisor",
    "call center agent": "Call Center Agent",
    "callcenter": "Call Center Agent",
    "call center": "Call Center Agent",
    "accountant": "Accountant",
    "front_desk_clerk": "Front Desk Clerk",
    "frontdesk": "Front Desk Clerk",
    "front_desk": "Front Desk Clerk",
    "front desk clerk": "Front Desk Clerk",
    "front desk": "Front Desk Clerk"
  };

  const mappedRole = roleMapping[normalizedRole] || "Student";
  
  // Debug logging to see what role is being processed
  console.log('Processing navigation for role:', role, 'normalized:', normalizedRole, 'mapped:', mappedRole, 'language:', currentLang);
  
  // Generate dynamic navigation based on SUBSYSTEM_TREE and role permissions
  const dynamicItems = generateDynamicNavigation(mappedRole, t);
  const navigationItems = convertDynamicToNavigation(dynamicItems, currentLang);
  
  // Add dashboard as the first item for all roles except students
  if (normalizedRole !== "student") {
    const dashboardItem = {
      path: "/dashboard",
      icon: "Home", 
      label: t ? t('common:navigation.dashboard') : 'Dashboard',
      roles: [mappedRole],
      order: -1 // Ensure dashboard is always first
    };
    
    // Remove any existing dashboard item and filter out the rest
    const filteredItems = navigationItems.filter(item => item.path !== "/dashboard");
    
    // Sort remaining items alphabetically by label
    const sortedItems = filteredItems.sort((a, b) => a.label.localeCompare(b.label));
    
    // Return dashboard first, then alphabetically sorted items
    return [dashboardItem, ...sortedItems];
  }
  
  // For students, sort alphabetically
  const sortedItems = navigationItems.sort((a, b) => a.label.localeCompare(b.label));
  
  console.log(`Generated ${sortedItems.length} navigation items for role ${mappedRole}:`, 
    sortedItems.map(item => ({ path: item.path, label: item.label })));
  
  return sortedItems;
};

// Check if user has access to a specific route
export const hasAccess = (userRole: string, routePath: string, navigationItems: NavigationItem[]): boolean => {
  const item = navigationItems.find(nav => nav.path === routePath);
  return item ? item.roles.includes(userRole) : false;
};