/**
 * Widget Registration
 * 
 * Registers all available widgets for the DynamicForm system.
 * Import this file to ensure all widgets are registered.
 */

import { registerWidget } from './WidgetRegistry';
import { FileUploadWidget } from './FileUploadWidget';
import { RichTextWidget } from './RichTextWidget';
import { AudioRecorderWidget } from './AudioRecorderWidget';

// Register all widgets
export function registerAllWidgets() {
  registerWidget('file', FileUploadWidget);
  registerWidget('richtext', RichTextWidget);
  registerWidget('audio', AudioRecorderWidget);
}

// Auto-register on import
registerAllWidgets();

// Re-export widgets and registry
export { registerWidget, getWidget, hasWidget } from './WidgetRegistry';
export { FileUploadWidget } from './FileUploadWidget';
export { RichTextWidget } from './RichTextWidget';
export { AudioRecorderWidget } from './AudioRecorderWidget';
export type { WidgetProps } from './WidgetRegistry';
