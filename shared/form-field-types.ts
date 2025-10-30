/**
 * Extended Form Field Types for DynamicForm System
 * 
 * This file defines the schema for advanced field types including:
 * - File uploads (images, documents, videos)
 * - Rich text editors (TipTap)
 * - Audio recording
 * 
 * All types support multi-language labels and are backward-compatible
 * with existing basic field types.
 */

import { z } from "zod";

// ============================================================================
// BASE FIELD TYPES (Existing + Extended)
// ============================================================================

export type FieldType =
  // Basic types (existing)
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'boolean'
  | 'date'
  // Advanced types (new)
  | 'file'
  | 'richtext'
  | 'audio';

// ============================================================================
// FILE UPLOAD FIELD CONFIGURATION
// ============================================================================

export interface FileUploadConfig {
  // Accepted file types (MIME types or extensions)
  accept?: string[]; // e.g., ['image/*', '.pdf', '.doc']
  
  // Maximum file size in bytes
  maxSize?: number; // e.g., 5 * 1024 * 1024 for 5MB
  
  // Minimum file size in bytes
  minSize?: number;
  
  // Allow multiple files
  multiple?: boolean;
  
  // Maximum number of files (if multiple is true)
  maxFiles?: number;
  
  // Upload destination folder
  uploadPath?: string; // e.g., 'profile-images', 'student-documents'
  
  // Preview mode for images
  showPreview?: boolean;
  
  // Generate thumbnail for images
  generateThumbnail?: boolean;
  
  // Thumbnail dimensions
  thumbnailSize?: {
    width: number;
    height: number;
  };
}

// ============================================================================
// RICH TEXT EDITOR CONFIGURATION
// ============================================================================

export interface RichTextConfig {
  // TipTap editor features to enable
  toolbar?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    heading?: boolean;
    bulletList?: boolean;
    orderedList?: boolean;
    blockquote?: boolean;
    codeBlock?: boolean;
    link?: boolean;
    image?: boolean;
    table?: boolean;
    textAlign?: boolean;
    highlight?: boolean;
  };
  
  // Minimum content length (in characters)
  minLength?: number;
  
  // Maximum content length (in characters)
  maxLength?: number;
  
  // Placeholder text
  placeholder?: string;
  placeholderEn?: string;
  placeholderFa?: string;
  placeholderAr?: string;
  
  // Allow HTML input
  allowHtml?: boolean;
  
  // Editor height in pixels
  height?: number;
}

// ============================================================================
// AUDIO RECORDING CONFIGURATION
// ============================================================================

export interface AudioRecordingConfig {
  // Maximum recording duration in seconds
  maxDuration?: number; // e.g., 300 for 5 minutes
  
  // Minimum recording duration in seconds
  minDuration?: number;
  
  // Audio format (MIME type)
  format?: string; // e.g., 'audio/webm', 'audio/mp4'
  
  // Sample rate in Hz
  sampleRate?: number; // e.g., 44100
  
  // Number of audio channels
  channels?: 1 | 2; // mono or stereo
  
  // Show waveform visualization
  showWaveform?: boolean;
  
  // Allow playback before submit
  allowPlayback?: boolean;
  
  // Allow re-recording
  allowReRecord?: boolean;
  
  // Upload destination folder
  uploadPath?: string; // e.g., 'audio-feedback', 'voice-notes'
}

// ============================================================================
// UNIFIED FIELD CONFIGURATION
// ============================================================================

export interface FormFieldConfig {
  // Field identifier
  id: string;
  
  // Field type
  type: FieldType;
  
  // Display order
  order: number;
  
  // Multi-language labels
  label?: string;
  labelEn?: string;
  labelFa?: string;
  labelAr?: string;
  
  // Multi-language placeholders
  placeholder?: string;
  placeholderEn?: string;
  placeholderFa?: string;
  placeholderAr?: string;
  
  // Multi-language help text
  helpText?: string;
  helpTextEn?: string;
  helpTextFa?: string;
  helpTextAr?: string;
  
  // Options for select/radio/checkbox fields
  options?: Array<{
    value: string;
    labelEn?: string;
    labelFa?: string;
    labelAr?: string;
  }>;
  
  // Basic validation
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };
  
  // Default value
  defaultValue?: any;
  
  // Type-specific configurations
  fileConfig?: FileUploadConfig;
  richTextConfig?: RichTextConfig;
  audioConfig?: AudioRecordingConfig;
  
  // Conditional visibility rules
  conditional?: {
    // Field ID to watch
    watchField: string;
    // Show when watch field has these values
    showWhen: string | string[];
    // Hide when watch field has these values
    hideWhen?: string | string[];
  };
  
  // Computed field rules (auto-fill)
  computed?: {
    // Expression or function name to compute value
    expression: string;
    // Fields that trigger recomputation
    dependsOn: string[];
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const fileUploadConfigSchema = z.object({
  accept: z.array(z.string()).optional(),
  maxSize: z.number().positive().optional(),
  minSize: z.number().positive().optional(),
  multiple: z.boolean().optional(),
  maxFiles: z.number().positive().optional(),
  uploadPath: z.string().optional(),
  showPreview: z.boolean().optional(),
  generateThumbnail: z.boolean().optional(),
  thumbnailSize: z.object({
    width: z.number().positive(),
    height: z.number().positive()
  }).optional()
});

export const richTextConfigSchema = z.object({
  toolbar: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    code: z.boolean().optional(),
    heading: z.boolean().optional(),
    bulletList: z.boolean().optional(),
    orderedList: z.boolean().optional(),
    blockquote: z.boolean().optional(),
    codeBlock: z.boolean().optional(),
    link: z.boolean().optional(),
    image: z.boolean().optional(),
    table: z.boolean().optional(),
    textAlign: z.boolean().optional(),
    highlight: z.boolean().optional()
  }).optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  placeholder: z.string().optional(),
  placeholderEn: z.string().optional(),
  placeholderFa: z.string().optional(),
  placeholderAr: z.string().optional(),
  allowHtml: z.boolean().optional(),
  height: z.number().positive().optional()
});

export const audioRecordingConfigSchema = z.object({
  maxDuration: z.number().positive().optional(),
  minDuration: z.number().positive().optional(),
  format: z.string().optional(),
  sampleRate: z.number().positive().optional(),
  channels: z.union([z.literal(1), z.literal(2)]).optional(),
  showWaveform: z.boolean().optional(),
  allowPlayback: z.boolean().optional(),
  allowReRecord: z.boolean().optional(),
  uploadPath: z.string().optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FileUploadConfigType = z.infer<typeof fileUploadConfigSchema>;
export type RichTextConfigType = z.infer<typeof richTextConfigSchema>;
export type AudioRecordingConfigType = z.infer<typeof audioRecordingConfigSchema>;
