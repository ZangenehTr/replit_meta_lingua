import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Phone,
  Mail,
  PhoneCall,
  MessageSquare,
  Edit,
  History,
  Globe,
  GraduationCap,
  FileText,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { type LeadSummary, getStatusColor } from "./types";

export interface LeadCardAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  disabled?: boolean;
  testId?: string;
}

export interface LeadCardProps {
  lead: LeadSummary;
  title?: string;
  showStatus?: boolean;
  showActions?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  primaryAction?: LeadCardAction;
  secondaryActions?: LeadCardAction[];
  footer?: ReactNode;
  onCall?: () => void;
  onSms?: () => void;
  onEmail?: () => void;
  onEdit?: () => void;
  onViewHistory?: () => void;
  onClick?: () => void;
  className?: string;
  animate?: boolean;
}

export function LeadCard({
  lead,
  title,
  showStatus = true,
  showActions = true,
  showDetails = true,
  compact = false,
  primaryAction,
  secondaryActions = [],
  footer,
  onCall,
  onSms,
  onEmail,
  onEdit,
  onViewHistory,
  onClick,
  className = "",
  animate = true,
}: LeadCardProps) {
  const { t } = useTranslation(["callcenter", "common"]);

  const CardWrapper = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {};

  const defaultActions: LeadCardAction[] = [];

  if (onCall) {
    defaultActions.push({
      label: t("callcenter:call", "تماس تلفنی"),
      icon: <PhoneCall className="h-4 w-4" />,
      onClick: onCall,
      variant: "outline",
      testId: "button-call-contact",
    });
  }

  if (onSms) {
    defaultActions.push({
      label: t("callcenter:sms", "ارسال پیامک"),
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: onSms,
      variant: "outline",
      testId: "button-sms-contact",
    });
  }

  if (onEmail && lead.email) {
    defaultActions.push({
      label: t("callcenter:email", "ارسال ایمیل"),
      icon: <Mail className="h-4 w-4" />,
      onClick: onEmail,
      variant: "outline",
      testId: "button-email-contact",
    });
  }

  if (onEdit) {
    defaultActions.push({
      label: t("callcenter:edit", "ویرایش اطلاعات"),
      icon: <Edit className="h-4 w-4" />,
      onClick: onEdit,
      variant: "outline",
      testId: "button-edit-contact",
    });
  }

  if (onViewHistory) {
    defaultActions.push({
      label: t("callcenter:history", "تاریخچه تماس‌ها"),
      icon: <History className="h-4 w-4" />,
      onClick: onViewHistory,
      variant: "outline",
      testId: "button-history-contact",
    });
  }

  const allActions = [...defaultActions, ...secondaryActions];

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
          onClick ? "cursor-pointer" : ""
        } ${className}`}
        onClick={onClick}
        data-testid={`lead-card-compact-${lead.id}`}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{lead.name}</p>
          <p className="text-sm text-muted-foreground font-mono" dir="ltr">
            {lead.phoneNumber}
          </p>
        </div>
        {showStatus && (
          <Badge className={getStatusColor(lead.status)} data-testid="badge-lead-status">
            {lead.status}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <CardWrapper {...animationProps}>
      <Card className={className} data-testid={`lead-card-${lead.id}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              {title || t("callcenter:contactInfo", "اطلاعات متقاضی")}
            </div>
            {showStatus && (
              <Badge className={getStatusColor(lead.status)} data-testid="badge-lead-status">
                {lead.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  {t("callcenter:fullName", "نام و نام خانوادگی")}
                </Label>
                <p className="text-lg font-medium" data-testid="text-lead-name">
                  {lead.name}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {t("callcenter:phoneNumber", "شماره تلفن")}
                </Label>
                <p className="text-lg font-medium font-mono" dir="ltr" data-testid="text-lead-phone">
                  {lead.phoneNumber}
                </p>
              </div>

              {lead.email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {t("callcenter:email", "ایمیل")}
                  </Label>
                  <p className="text-lg font-medium" dir="ltr" data-testid="text-lead-email">
                    {lead.email}
                  </p>
                </div>
              )}

              {lead.interestedLanguage && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {t("callcenter:interestedLanguage", "زبان مورد علاقه")}
                  </Label>
                  <p className="text-lg font-medium">{lead.interestedLanguage}</p>
                </div>
              )}

              {lead.interestedLevel && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {t("callcenter:interestedLevel", "سطح مورد علاقه")}
                  </Label>
                  <p className="text-lg font-medium">{lead.interestedLevel}</p>
                </div>
              )}

              {lead.source && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {t("callcenter:source", "منبع")}
                  </Label>
                  <p className="text-lg font-medium">{lead.source}</p>
                </div>
              )}
            </div>
          )}

          {lead.notes && showDetails && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {t("callcenter:notes", "یادداشت‌ها")}
              </Label>
              <p className="text-sm bg-muted/50 p-3 rounded-lg mt-1">{lead.notes}</p>
            </div>
          )}

          {showActions && allActions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {primaryAction && (
                <Button
                  variant={primaryAction.variant || "default"}
                  size="sm"
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                  data-testid={primaryAction.testId}
                >
                  {primaryAction.icon}
                  <span className="ltr:ml-2 rtl:mr-2">{primaryAction.label}</span>
                </Button>
              )}
              {allActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-testid={action.testId}
                >
                  {action.icon}
                  <span className="ltr:ml-2 rtl:mr-2">{action.label}</span>
                </Button>
              ))}
            </div>
          )}

          {footer && <div className="pt-4 border-t">{footer}</div>}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}

export default LeadCard;
