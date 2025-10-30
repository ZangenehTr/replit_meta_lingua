/**
 * Widget Registry for DynamicForm
 * 
 * Maps field types to their corresponding React components.
 * Allows easy addition of new field types without modifying DynamicForm core.
 */

import { ComponentType } from 'react';

export interface WidgetProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  language: string;
}

// Widget registry
const widgetRegistry = new Map<string, ComponentType<WidgetProps>>();

/**
 * Register a widget for a specific field type
 */
export function registerWidget(fieldType: string, component: ComponentType<WidgetProps>) {
  widgetRegistry.set(fieldType, component);
}

/**
 * Get widget component for a field type
 */
export function getWidget(fieldType: string): ComponentType<WidgetProps> | undefined {
  return widgetRegistry.get(fieldType);
}

/**
 * Check if a widget is registered for a field type
 */
export function hasWidget(fieldType: string): boolean {
  return widgetRegistry.has(fieldType);
}

/**
 * Get all registered widget types
 */
export function getRegisteredTypes(): string[] {
  return Array.from(widgetRegistry.keys());
}

/**
 * Clear all registered widgets (useful for testing)
 */
export function clearRegistry() {
  widgetRegistry.clear();
}
