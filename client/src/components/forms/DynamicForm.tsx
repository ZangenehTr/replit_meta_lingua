import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customMessage?: string;
}

interface FormField {
  id: string;
  type: string;
  label?: string;
  labelEn?: string;
  labelFa?: string;
  labelAr?: string;
  placeholder?: string;
  placeholderEn?: string;
  placeholderFa?: string;
  placeholderAr?: string;
  helpText?: string;
  helpTextEn?: string;
  helpTextFa?: string;
  helpTextAr?: string;
  options?: Array<{
    value: string;
    labelEn?: string;
    labelFa?: string;
    labelAr?: string;
  }>;
  validation?: FieldValidation;
  defaultValue?: string;
  order: number;
}

interface FormDefinition {
  id?: number;
  title?: string;
  titleEn?: string;
  titleFa?: string;
  titleAr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionFa?: string;
  descriptionAr?: string;
  category?: string;
  fields: FormField[];
  submitButtonText?: string;
  submitButtonTextEn?: string;
  submitButtonTextFa?: string;
  submitButtonTextAr?: string;
}

interface DynamicFormProps {
  formDefinition: FormDefinition;
  onSubmit: (data: any) => Promise<void>;
  initialValues?: Record<string, any>;
  disabled?: boolean;
  showTitle?: boolean;
  className?: string;
}

// Build Zod schema from form fields
function buildValidationSchema(fields: FormField[]) {
  const shape: Record<string, any> = {};

  fields.forEach(field => {
    let fieldSchema: any;

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email(field.validation?.customMessage || 'Invalid email address');
        break;
      case 'phone':
        fieldSchema = z.string();
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(
            new RegExp(field.validation.pattern),
            field.validation.customMessage || 'Invalid phone number'
          );
        }
        break;
      case 'number':
        fieldSchema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = fieldSchema.min(field.validation.min);
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = fieldSchema.max(field.validation.max);
        }
        break;
      case 'date':
        fieldSchema = z.date();
        break;
      case 'checkbox':
        fieldSchema = z.array(z.string());
        break;
      case 'boolean':
        fieldSchema = z.boolean();
        break;
      case 'file':
        fieldSchema = z.any();
        break;
      default:
        fieldSchema = z.string();
        if (field.validation?.minLength) {
          fieldSchema = fieldSchema.min(field.validation.minLength);
        }
        if (field.validation?.maxLength) {
          fieldSchema = fieldSchema.max(field.validation.maxLength);
        }
        if (field.validation?.pattern) {
          fieldSchema = fieldSchema.regex(
            new RegExp(field.validation.pattern),
            field.validation.customMessage || 'Invalid format'
          );
        }
    }

    if (field.validation?.required) {
      if (field.type === 'checkbox') {
        fieldSchema = fieldSchema.min(1, 'At least one option must be selected');
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }

    shape[field.id] = fieldSchema;
  });

  return z.object(shape);
}

export default function DynamicForm({
  formDefinition,
  onSubmit,
  initialValues = {},
  disabled = false,
  showTitle = true,
  className = ""
}: DynamicFormProps) {
  const { t, i18n } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validationSchema = buildValidationSchema(formDefinition.fields);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues
  });

  const handleFormSubmit = async (data: any) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit(data);
      setSubmitSuccess(true);
      reset();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setSubmitting(false);
    }
  };

  // Get localized text based on current language
  const getLocalizedText = (base?: string, en?: string, fa?: string, ar?: string): string => {
    const lang = i18n.language;
    if (lang === 'fa' && fa) return fa;
    if (lang === 'ar' && ar) return ar;
    if (en) return en;
    return base || '';
  };

  const getLocalizedOptionLabel = (option: any): string => {
    const lang = i18n.language;
    if (lang === 'fa' && option.labelFa) return option.labelFa;
    if (lang === 'ar' && option.labelAr) return option.labelAr;
    return option.labelEn || option.value;
  };

  const title = getLocalizedText(
    formDefinition.title,
    formDefinition.titleEn,
    formDefinition.titleFa,
    formDefinition.titleAr
  );

  const description = getLocalizedText(
    formDefinition.description,
    formDefinition.descriptionEn,
    formDefinition.descriptionFa,
    formDefinition.descriptionAr
  );

  const submitButtonText = getLocalizedText(
    formDefinition.submitButtonText || 'Submit',
    formDefinition.submitButtonTextEn || 'Submit',
    formDefinition.submitButtonTextFa || 'ارسال',
    formDefinition.submitButtonTextAr || 'إرسال'
  );

  const sortedFields = [...formDefinition.fields].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("w-full", className)} data-testid="dynamic-form">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {showTitle && (title || description) && (
          <div className="space-y-2">
            {title && (
              <h2 className="text-2xl font-bold" data-testid="form-title">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-gray-600 dark:text-gray-400" data-testid="form-description">
                {description}
              </p>
            )}
          </div>
        )}

        {submitSuccess && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Form submitted successfully!
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {sortedFields.map(field => {
            const fieldLabel = getLocalizedText(
              field.label,
              field.labelEn,
              field.labelFa,
              field.labelAr
            );

            const fieldPlaceholder = getLocalizedText(
              field.placeholder,
              field.placeholderEn,
              field.placeholderFa,
              field.placeholderAr
            );

            const fieldHelpText = getLocalizedText(
              field.helpText,
              field.helpTextEn,
              field.helpTextFa,
              field.helpTextAr
            );

            const fieldError = errors[field.id]?.message as string | undefined;

            return (
              <div key={field.id} className="space-y-2" data-testid={`field-${field.id}`}>
                <Label htmlFor={field.id} className={field.validation?.required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}>
                  {fieldLabel}
                </Label>

                {field.type === 'text' && (
                  <Input
                    id={field.id}
                    {...register(field.id)}
                    placeholder={fieldPlaceholder}
                    disabled={disabled || submitting}
                    className={fieldError ? 'border-red-500' : ''}
                    data-testid={`input-${field.id}`}
                  />
                )}

                {field.type === 'email' && (
                  <Input
                    id={field.id}
                    type="email"
                    {...register(field.id)}
                    placeholder={fieldPlaceholder}
                    disabled={disabled || submitting}
                    className={fieldError ? 'border-red-500' : ''}
                    data-testid={`input-${field.id}`}
                  />
                )}

                {field.type === 'phone' && (
                  <Input
                    id={field.id}
                    type="tel"
                    {...register(field.id)}
                    placeholder={fieldPlaceholder}
                    disabled={disabled || submitting}
                    className={fieldError ? 'border-red-500' : ''}
                    data-testid={`input-${field.id}`}
                  />
                )}

                {field.type === 'number' && (
                  <Input
                    id={field.id}
                    type="number"
                    {...register(field.id)}
                    placeholder={fieldPlaceholder}
                    disabled={disabled || submitting}
                    className={fieldError ? 'border-red-500' : ''}
                    data-testid={`input-${field.id}`}
                  />
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    id={field.id}
                    {...register(field.id)}
                    placeholder={fieldPlaceholder}
                    disabled={disabled || submitting}
                    rows={4}
                    className={fieldError ? 'border-red-500' : ''}
                    data-testid={`textarea-${field.id}`}
                  />
                )}

                {field.type === 'select' && (
                  <Controller
                    name={field.id}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select
                        value={controllerField.value}
                        onValueChange={controllerField.onChange}
                        disabled={disabled || submitting}
                      >
                        <SelectTrigger className={fieldError ? 'border-red-500' : ''} data-testid={`select-${field.id}`}>
                          <SelectValue placeholder={fieldPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {getLocalizedOptionLabel(option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}

                {field.type === 'radio' && (
                  <Controller
                    name={field.id}
                    control={control}
                    render={({ field: controllerField }) => (
                      <RadioGroup
                        value={controllerField.value}
                        onValueChange={controllerField.onChange}
                        disabled={disabled || submitting}
                        data-testid={`radio-${field.id}`}
                      >
                        {field.options?.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                            <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                              {getLocalizedOptionLabel(option)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  />
                )}

                {field.type === 'checkbox' && (
                  <Controller
                    name={field.id}
                    control={control}
                    defaultValue={[]}
                    render={({ field: controllerField }) => (
                      <div className="space-y-2" data-testid={`checkbox-${field.id}`}>
                        {field.options?.map(option => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${option.value}`}
                              checked={(controllerField.value as string[])?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = controllerField.value as string[] || [];
                                if (checked) {
                                  controllerField.onChange([...currentValue, option.value]);
                                } else {
                                  controllerField.onChange(currentValue.filter(v => v !== option.value));
                                }
                              }}
                              disabled={disabled || submitting}
                            />
                            <Label htmlFor={`${field.id}-${option.value}`} className="font-normal cursor-pointer">
                              {getLocalizedOptionLabel(option)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                )}

                {field.type === 'boolean' && (
                  <Controller
                    name={field.id}
                    control={control}
                    defaultValue={field.defaultValue !== undefined ? field.defaultValue : false}
                    render={({ field: controllerField }) => (
                      <div className="flex items-center space-x-2" data-testid={`boolean-${field.id}`}>
                        <Switch
                          id={field.id}
                          checked={controllerField.value ?? false}
                          onCheckedChange={controllerField.onChange}
                          disabled={disabled || submitting}
                        />
                      </div>
                    )}
                  />
                )}

                {field.type === 'date' && (
                  <Controller
                    name={field.id}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !controllerField.value && "text-muted-foreground",
                              fieldError && "border-red-500"
                            )}
                            disabled={disabled || submitting}
                            data-testid={`date-${field.id}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {controllerField.value ? (
                              format(new Date(controllerField.value), "PPP")
                            ) : (
                              <span>{fieldPlaceholder || 'Pick a date'}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={controllerField.value ? new Date(controllerField.value) : undefined}
                            onSelect={(date) => controllerField.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                )}

                {field.type === 'file' && (
                  <div className="flex items-center gap-2">
                    <Input
                      id={field.id}
                      type="file"
                      {...register(field.id)}
                      disabled={disabled || submitting}
                      className={fieldError ? 'border-red-500' : ''}
                      data-testid={`file-${field.id}`}
                    />
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                {fieldHelpText && (
                  <p className="text-sm text-gray-500 dark:text-gray-400" data-testid={`helptext-${field.id}`}>
                    {fieldHelpText}
                  </p>
                )}

                {fieldError && (
                  <p className="text-sm text-red-500 dark:text-red-400" data-testid={`error-${field.id}`}>
                    {fieldError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Button
          type="submit"
          disabled={disabled || submitting}
          className="w-full"
          data-testid="button-submit-form"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </form>
    </div>
  );
}
