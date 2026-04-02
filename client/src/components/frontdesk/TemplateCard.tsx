import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Send, Trash2, Calendar, Users, CheckCircle2, MessageCircle, Target, MessageSquare } from "lucide-react";

interface SmsTemplate {
  id: number; name: string; content: string; categoryId: number; categoryName?: string; status: "active"|"inactive"|"archived";
  tags: string[]; usageCount: number; successfulSends: number;
}

function getCategoryIcon(categoryName?: string) {
  switch (categoryName?.toLowerCase()) {
    case "trial_reminders": return Calendar;
    case "follow_ups": return Users;
    case "confirmations": return CheckCircle2;
    case "notifications": return MessageCircle;
    case "promotional": return Target;
    default: return MessageSquare;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "inactive": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

interface TemplateCardProps {
  template: SmsTemplate;
  isRTL: boolean;
  onPreview: (t: SmsTemplate) => void;
  onEdit: (t: SmsTemplate) => void;
  onSend: (t: SmsTemplate) => void;
  onDelete: (t: SmsTemplate) => void;
}

export function TemplateCard({ template, isRTL, onPreview, onEdit, onSend, onDelete }: TemplateCardProps) {
  const CategoryIcon = getCategoryIcon(template.categoryName);
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <CategoryIcon className="h-5 w-5 text-gray-500" />
            <div><CardTitle className="text-lg">{template.name}</CardTitle><CardDescription className="text-sm">{template.categoryName}</CardDescription></div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(template)}><Eye className="h-4 w-4 me-2" />{isRTL ? "پیش‌نمایش" : "Preview"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(template)}><Edit className="h-4 w-4 me-2" />{isRTL ? "ویرایش" : "Edit"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSend(template)}><Send className="h-4 w-4 me-2" />{isRTL ? "ارسال" : "Send"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-red-600 dark:text-red-400"><Trash2 className="h-4 w-4 me-2" />{isRTL ? "حذف" : "Delete"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{template.content}</p>
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary" className={getStatusColor(template.status)}>
              {isRTL ? (template.status === "active" ? "فعال" : template.status === "inactive" ? "غیرفعال" : "آرشیو شده") : template.status.charAt(0).toUpperCase() + template.status.slice(1)}
            </Badge>
            <div className="text-gray-500">{template.content.length}/1000</div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{isRTL ? "تعداد استفاده:" : "Used:"} {template.usageCount}</span>
            <span>{isRTL ? "موفق:" : "Success:"} {template.successfulSends}</span>
          </div>
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, i) => <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>)}
              {template.tags.length > 3 && <Badge variant="outline" className="text-xs">+{template.tags.length - 3}</Badge>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
