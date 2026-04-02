import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import type { TemplateFormValues } from "@/hooks/useSmsTemplates";

interface SmsTemplateCategory { id: number; displayName: string; }

interface TemplateFormFieldsProps {
  form: UseFormReturn<TemplateFormValues>;
  categories: SmsTemplateCategory[];
  isRTL: boolean;
  isLoading: boolean;
  mode: "create" | "edit";
  onCancel: () => void;
  onSubmit: (data: TemplateFormValues) => void;
}

export function TemplateFormFields({ form, categories, isRTL, isLoading, mode, onCancel, onSubmit }: TemplateFormFieldsProps) {
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = (varName: string) => {
    if (!contentTextareaRef.current) return;
    const textarea = contentTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.getValues("content");
    const varText = `{{${varName}}}`;
    const newValue = current.substring(0, start) + varText + current.substring(end);
    form.setValue("content", newValue);
    setTimeout(() => { textarea.focus(); const pos = start + varText.length; textarea.setSelectionRange(pos, pos); }, 0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>{isRTL ? "نام قالب" : "Template Name"}</FormLabel>
            <FormControl><Input placeholder={isRTL ? "نام قالب را وارد کنید" : "Enter template name"} {...field} data-testid={`input-${mode}-template-name`} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem><FormLabel>{isRTL ? "دسته‌بندی" : "Category"}</FormLabel>
            <Select value={field.value.toString()} onValueChange={(v) => field.onChange(parseInt(v))}>
              <FormControl><SelectTrigger data-testid={`select-${mode}-category`}><SelectValue placeholder={isRTL ? "یک دسته‌بندی انتخاب کنید" : "Select a category"} /></SelectTrigger></FormControl>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.displayName}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="content" render={({ field }) => (
          <FormItem><FormLabel>{isRTL ? "محتوای پیامک" : "Message Content"}</FormLabel>
            <FormControl><Textarea ref={contentTextareaRef} placeholder={isRTL ? "محتوای پیامک را وارد کنید" : "Enter message content"} className="min-h-[120px]" {...field} data-testid={`textarea-${mode}-content`} /></FormControl>
            <FormDescription>{isRTL ? "از {{متغیر}} برای قرار دادن متغیرها استفاده کنید" : "Use {{variable}} to insert variables"}</FormDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {["firstName", "lastName", "courseName", "date", "time"].map((v) => (
                <Button key={v} type="button" variant="outline" size="sm" onClick={() => handleInsertVariable(v)} data-testid={`button-${mode}-insert-${v}`}>
                  {isRTL ? `درج {{${v}}}` : `Insert {{${v}}}`}
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem><FormLabel>{isRTL ? "برچسب‌ها" : "Tags"}</FormLabel>
            <FormControl>
              <Input placeholder={isRTL ? "برچسب‌ها (با کاما جدا شوند)" : "Tags (comma-separated)"} value={field.value.join(", ")} onChange={(e) => field.onChange(e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean))} data-testid={`input-${mode}-tags`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem><FormLabel>{isRTL ? "وضعیت" : "Status"}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger data-testid={`select-${mode}-status`}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="draft">{isRTL ? "پیش‌نویس" : "Draft"}</SelectItem>
                <SelectItem value="active">{isRTL ? "فعال" : "Active"}</SelectItem>
                <SelectItem value="inactive">{isRTL ? "غیرفعال" : "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} data-testid={`button-cancel-${mode}`}>{isRTL ? "انصراف" : "Cancel"}</Button>
          <Button type="submit" disabled={isLoading} data-testid={`button-submit-${mode}`}>
            {isLoading ? (isRTL ? "در حال ذخیره..." : "Saving...") : (mode === "create" ? (isRTL ? "ایجاد" : "Create") : (isRTL ? "به‌روزرسانی" : "Update"))}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
