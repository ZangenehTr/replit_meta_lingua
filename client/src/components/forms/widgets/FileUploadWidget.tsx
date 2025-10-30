/**
 * File Upload Widget for DynamicForm
 * 
 * Supports:
 * - Drag and drop
 * - Multiple files
 * - File type validation
 * - Size limits
 * - Upload progress
 * - Preview for images
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WidgetProps } from './WidgetRegistry';
import { apiRequest } from '@/lib/queryClient';

export function FileUploadWidget({ field, value, onChange, error, disabled, language }: WidgetProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = field.fileConfig || {};
  const multiple = config.multiple || false;
  const maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
  const accept = config.accept?.join(',') || '*/*';
  const showPreview = config.showPreview !== false;

  // Get localized text
  const getLabel = (key: string): string => {
    if (language === 'fa' && field[`${key}Fa`]) return field[`${key}Fa`];
    if (language === 'ar' && field[`${key}Ar`]) return field[`${key}Ar`];
    return field[`${key}En`] || field[key] || '';
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validate file size
    for (const file of fileArray) {
      if (file.size > maxSize) {
        alert(`File ${file.name} exceeds maximum size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
    }

    // Upload files
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (multiple) {
        fileArray.forEach(file => formData.append('files', file));
      } else {
        formData.append('file', fileArray[0]);
      }

      formData.append('subfolder', config.subfolder || config.uploadPath || field.id);
      if (config.accept) {
        formData.append('allowedTypes', JSON.stringify(config.accept));
      }
      if (config.maxSize) {
        formData.append('maxSize', config.maxSize.toString());
      }
      formData.append('multiple', multiple.toString());

      const result = await apiRequest<any>('/api/form-files/upload', {
        method: 'POST',
        body: formData,
        // FormData is handled specially by apiRequest
      });

      // Update form value with file metadata
      if (multiple) {
        const existingFiles = Array.isArray(value) ? value : [];
        onChange([...existingFiles, ...(result.files || [])]);
      } else {
        onChange(result.file);
      }

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error: any) {
      console.error('File upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleRemoveFile = (indexOrUrl: number | string) => {
    if (multiple && Array.isArray(value)) {
      const newFiles = value.filter((_, i) => i !== indexOrUrl);
      onChange(newFiles);
    } else {
      onChange(null);
    }
  };

  const renderFilePreview = (file: any, index?: number) => {
    const isImage = file.mimeType?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
      <div key={index || file.url} className="relative group border rounded-lg p-3 flex items-center gap-3">
        {showPreview && isImage ? (
          <img 
            src={file.url} 
            alt={file.originalName} 
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <File className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.originalName || file.filename}</p>
          <p className="text-xs text-gray-500">
            {file.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
          </p>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveFile(index !== undefined ? index : file.url)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  const files = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);
  const hasFiles = files.length > 0;

  return (
    <div className="space-y-3" data-testid={`file-upload-${field.id}`}>
      {/* Upload area */}
      {(!hasFiles || multiple) && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 transition-colors",
            dragActive && "border-primary bg-primary/5",
            error && "border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:border-primary cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            disabled={disabled || uploading}
            className="hidden"
            data-testid={`input-${field.id}`}
          />

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading... {uploadProgress}%
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium">
                  {getLabel('placeholder') || 'Click or drag files to upload'}
                </p>
                <p className="text-xs text-gray-500">
                  {`Max size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`}
                </p>
              </>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="mt-4" />
          )}
        </div>
      )}

      {/* File list */}
      {hasFiles && (
        <div className="space-y-2">
          {files.map((file: any, index: number) => renderFilePreview(file, index))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
