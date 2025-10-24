import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, GripVertical, Trash2, Copy, Settings, 
  Type, Mail, Phone, Hash, Calendar, FileText,
  CheckSquare, Circle, ChevronDown, Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Field type definitions
const FIELD_TYPES = [
  { id: "text", label: "Text Input", icon: Type, description: "Single line text" },
  { id: "email", label: "Email", icon: Mail, description: "Email address" },
  { id: "phone", label: "Phone", icon: Phone, description: "Phone number" },
  { id: "number", label: "Number", icon: Hash, description: "Numeric input" },
  { id: "textarea", label: "Text Area", icon: FileText, description: "Multi-line text" },
  { id: "select", label: "Dropdown", icon: ChevronDown, description: "Select from options" },
  { id: "radio", label: "Radio Buttons", icon: Circle, description: "Choose one option" },
  { id: "checkbox", label: "Checkboxes", icon: CheckSquare, description: "Multiple choices" },
  { id: "date", label: "Date Picker", icon: Calendar, description: "Date selection" },
  { id: "file", label: "File Upload", icon: Upload, description: "Upload files" },
];

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
  label: string;
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

interface FormBuilderProps {
  initialFields?: FormField[];
  onFieldsChange?: (fields: FormField[]) => void;
}

// Sortable field item component
function SortableField({ field, onEdit, onDuplicate, onDelete }: {
  field: FormField;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation(['admin']);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldTypeInfo = FIELD_TYPES.find(ft => ft.id === field.type);
  const Icon = fieldTypeInfo?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border rounded-lg mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </button>

      <Icon className="w-4 h-4 text-gray-500" />
      
      <div className="flex-1">
        <p className="font-medium text-sm">{field.label || field.labelEn || 'Untitled'}</p>
        <p className="text-xs text-gray-500">{fieldTypeInfo?.label}</p>
      </div>

      {field.validation?.required && (
        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">
          Required
        </span>
      )}

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          data-testid={`button-edit-field-${field.id}`}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDuplicate}
          data-testid={`button-duplicate-field-${field.id}`}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
          data-testid={`button-delete-field-${field.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Field editor dialog
function FieldEditor({ field, open, onOpenChange, onSave }: {
  field: FormField | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: FormField) => void;
}) {
  const { t } = useTranslation(['admin']);
  const [editedField, setEditedField] = useState<FormField>(field || {
    id: `field-${Date.now()}`,
    type: 'text',
    label: '',
    order: 0,
    validation: {}
  });

  const handleSave = () => {
    onSave(editedField);
    onOpenChange(false);
  };

  const updateField = (updates: Partial<FormField>) => {
    setEditedField(prev => ({ ...prev, ...updates }));
  };

  const updateValidation = (updates: Partial<FieldValidation>) => {
    setEditedField(prev => ({
      ...prev,
      validation: { ...prev.validation, ...updates }
    }));
  };

  const addOption = () => {
    const newOption = { value: `option-${Date.now()}`, labelEn: '', labelFa: '', labelAr: '' };
    updateField({ options: [...(editedField.options || []), newOption] });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...(editedField.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    updateField({ options: newOptions });
  };

  const removeOption = (index: number) => {
    updateField({ options: editedField.options?.filter((_, i) => i !== index) });
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(editedField.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit Field' : 'Add Field'}</DialogTitle>
          <DialogDescription>
            Configure the field properties and validation rules
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="labels">Multi-language</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div>
              <Label>Field Type</Label>
              <Select
                value={editedField.type}
                onValueChange={(value) => updateField({ type: value })}
              >
                <SelectTrigger data-testid="select-field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.id} value={ft.id}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Label (English)</Label>
              <Input
                value={editedField.labelEn || ''}
                onChange={(e) => updateField({ labelEn: e.target.value, label: e.target.value })}
                placeholder="Enter field label"
                data-testid="input-field-label-en"
              />
            </div>

            <div>
              <Label>Placeholder (English)</Label>
              <Input
                value={editedField.placeholderEn || ''}
                onChange={(e) => updateField({ placeholderEn: e.target.value, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
                data-testid="input-field-placeholder-en"
              />
            </div>

            <div>
              <Label>Help Text (English)</Label>
              <Textarea
                value={editedField.helpTextEn || ''}
                onChange={(e) => updateField({ helpTextEn: e.target.value, helpText: e.target.value })}
                placeholder="Additional guidance for this field"
                rows={2}
                data-testid="textarea-field-helptext-en"
              />
            </div>

            {needsOptions && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Options</Label>
                  <Button size="sm" onClick={addOption} data-testid="button-add-option">
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </Button>
                </div>
                <ScrollArea className="h-40 border rounded-lg p-2">
                  {editedField.options?.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) => updateOption(index, { value: e.target.value })}
                        className="flex-1"
                        data-testid={`input-option-value-${index}`}
                      />
                      <Input
                        placeholder="Label (EN)"
                        value={option.labelEn || ''}
                        onChange={(e) => updateOption(index, { labelEn: e.target.value })}
                        className="flex-1"
                        data-testid={`input-option-label-en-${index}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        className="text-red-500"
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}

            <div>
              <Label>Default Value</Label>
              <Input
                value={editedField.defaultValue || ''}
                onChange={(e) => updateField({ defaultValue: e.target.value })}
                placeholder="Default value (optional)"
                data-testid="input-field-default-value"
              />
            </div>
          </TabsContent>

          <TabsContent value="labels" className="space-y-4">
            <div>
              <Label>Label (Persian)</Label>
              <Input
                value={editedField.labelFa || ''}
                onChange={(e) => updateField({ labelFa: e.target.value })}
                placeholder="برچسب فیلد"
                dir="rtl"
                data-testid="input-field-label-fa"
              />
            </div>

            <div>
              <Label>Label (Arabic)</Label>
              <Input
                value={editedField.labelAr || ''}
                onChange={(e) => updateField({ labelAr: e.target.value })}
                placeholder="تسمية الحقل"
                dir="rtl"
                data-testid="input-field-label-ar"
              />
            </div>

            <div>
              <Label>Placeholder (Persian)</Label>
              <Input
                value={editedField.placeholderFa || ''}
                onChange={(e) => updateField({ placeholderFa: e.target.value })}
                placeholder="متن راهنما"
                dir="rtl"
                data-testid="input-field-placeholder-fa"
              />
            </div>

            <div>
              <Label>Placeholder (Arabic)</Label>
              <Input
                value={editedField.placeholderAr || ''}
                onChange={(e) => updateField({ placeholderAr: e.target.value })}
                placeholder="نص العنصر النائب"
                dir="rtl"
                data-testid="input-field-placeholder-ar"
              />
            </div>

            <div>
              <Label>Help Text (Persian)</Label>
              <Textarea
                value={editedField.helpTextFa || ''}
                onChange={(e) => updateField({ helpTextFa: e.target.value })}
                placeholder="راهنمای تکمیلی"
                dir="rtl"
                rows={2}
                data-testid="textarea-field-helptext-fa"
              />
            </div>

            <div>
              <Label>Help Text (Arabic)</Label>
              <Textarea
                value={editedField.helpTextAr || ''}
                onChange={(e) => updateField({ helpTextAr: e.target.value })}
                placeholder="إرشادات إضافية"
                dir="rtl"
                rows={2}
                data-testid="textarea-field-helptext-ar"
              />
            </div>

            {needsOptions && (
              <div>
                <Label>Option Labels (Multilingual)</Label>
                <ScrollArea className="h-60 border rounded-lg p-2 mt-2">
                  {editedField.options?.map((option, index) => (
                    <div key={index} className="mb-4 p-3 border-b">
                      <p className="font-medium text-sm mb-2">Option: {option.value}</p>
                      <div className="space-y-2">
                        <Input
                          placeholder="Persian Label"
                          value={option.labelFa || ''}
                          onChange={(e) => updateOption(index, { labelFa: e.target.value })}
                          dir="rtl"
                          data-testid={`input-option-label-fa-${index}`}
                        />
                        <Input
                          placeholder="Arabic Label"
                          value={option.labelAr || ''}
                          onChange={(e) => updateOption(index, { labelAr: e.target.value })}
                          dir="rtl"
                          data-testid={`input-option-label-ar-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Required Field</Label>
              <Switch
                checked={editedField.validation?.required || false}
                onCheckedChange={(checked) => updateValidation({ required: checked })}
                data-testid="switch-field-required"
              />
            </div>

            {editedField.type === 'text' || editedField.type === 'textarea' ? (
              <>
                <div>
                  <Label>Minimum Length</Label>
                  <Input
                    type="number"
                    value={editedField.validation?.minLength || ''}
                    onChange={(e) => updateValidation({ minLength: parseInt(e.target.value) || undefined })}
                    placeholder="Minimum characters"
                    data-testid="input-min-length"
                  />
                </div>
                <div>
                  <Label>Maximum Length</Label>
                  <Input
                    type="number"
                    value={editedField.validation?.maxLength || ''}
                    onChange={(e) => updateValidation({ maxLength: parseInt(e.target.value) || undefined })}
                    placeholder="Maximum characters"
                    data-testid="input-max-length"
                  />
                </div>
              </>
            ) : null}

            {editedField.type === 'number' ? (
              <>
                <div>
                  <Label>Minimum Value</Label>
                  <Input
                    type="number"
                    value={editedField.validation?.min || ''}
                    onChange={(e) => updateValidation({ min: parseFloat(e.target.value) || undefined })}
                    placeholder="Minimum value"
                    data-testid="input-min-value"
                  />
                </div>
                <div>
                  <Label>Maximum Value</Label>
                  <Input
                    type="number"
                    value={editedField.validation?.max || ''}
                    onChange={(e) => updateValidation({ max: parseFloat(e.target.value) || undefined })}
                    placeholder="Maximum value"
                    data-testid="input-max-value"
                  />
                </div>
              </>
            ) : null}

            <div>
              <Label>Pattern (Regex)</Label>
              <Input
                value={editedField.validation?.pattern || ''}
                onChange={(e) => updateValidation({ pattern: e.target.value })}
                placeholder="Regular expression pattern"
                data-testid="input-validation-pattern"
              />
            </div>

            <div>
              <Label>Custom Error Message</Label>
              <Input
                value={editedField.validation?.customMessage || ''}
                onChange={(e) => updateValidation({ customMessage: e.target.value })}
                placeholder="Error message for validation failure"
                data-testid="input-custom-error-message"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-field">
            Save Field
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FormBuilder({ initialFields = [], onFieldsChange }: FormBuilderProps) {
  const { t } = useTranslation(['admin']);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        const newFields = arrayMove(items, oldIndex, newIndex).map((f, index) => ({
          ...f,
          order: index
        }));
        onFieldsChange?.(newFields);
        return newFields;
      });
    }
  };

  const addNewField = () => {
    setEditingField({
      id: `field-${Date.now()}`,
      type: 'text',
      label: '',
      order: fields.length,
      validation: {}
    });
    setEditorOpen(true);
  };

  const editField = (field: FormField) => {
    setEditingField(field);
    setEditorOpen(true);
  };

  const duplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`,
      labelEn: field.labelEn ? `${field.labelEn} (Copy)` : undefined,
      order: fields.length
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    onFieldsChange?.(newFields);
  };

  const deleteField = (fieldId: string) => {
    const newFields = fields.filter(f => f.id !== fieldId).map((f, index) => ({
      ...f,
      order: index
    }));
    setFields(newFields);
    onFieldsChange?.(newFields);
  };

  const saveField = (field: FormField) => {
    const existingIndex = fields.findIndex(f => f.id === field.id);
    let newFields;
    
    if (existingIndex >= 0) {
      newFields = [...fields];
      newFields[existingIndex] = field;
    } else {
      newFields = [...fields, field];
    }
    
    setFields(newFields);
    onFieldsChange?.(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Form Fields</h3>
          <p className="text-sm text-gray-500">
            Drag and drop to reorder fields
          </p>
        </div>
        <Button onClick={addNewField} data-testid="button-add-field">
          <Plus className="w-4 h-4 mr-2" /> Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No fields added yet</p>
            <Button onClick={addNewField} data-testid="button-add-first-field">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Field
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2" data-testid="form-fields-list">
              {fields.map(field => (
                <SortableField
                  key={field.id}
                  field={field}
                  onEdit={() => editField(field)}
                  onDuplicate={() => duplicateField(field)}
                  onDelete={() => deleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FieldEditor
        field={editingField}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={saveField}
      />
    </div>
  );
}
