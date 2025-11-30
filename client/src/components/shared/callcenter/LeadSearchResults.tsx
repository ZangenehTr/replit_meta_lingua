import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { type LeadSummary, getStatusColor } from "./types";

export interface LeadSearchResultsProps {
  leads: LeadSummary[];
  onSelect: (lead: LeadSummary) => void;
  maxResults?: number;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function LeadSearchResults({
  leads,
  onSelect,
  maxResults = 5,
  title,
  emptyMessage,
  className = "",
}: LeadSearchResultsProps) {
  const { t } = useTranslation(["callcenter", "common"]);

  if (leads.length === 0) {
    if (!emptyMessage) return null;
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  const displayedLeads = leads.slice(0, maxResults);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-muted-foreground" />
          {title || t("callcenter:searchResults", "نتایج جستجو")} ({leads.length}{" "}
          {t("callcenter:items", "مورد")})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayedLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelect(lead)}
              data-testid={`search-result-${lead.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(lead);
                }
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{lead.name}</p>
                <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                  {lead.phoneNumber}
                </p>
              </div>
              <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
            </div>
          ))}
          {leads.length > maxResults && (
            <p className="text-sm text-center text-muted-foreground pt-2">
              {t("callcenter:andMore", "و")} {leads.length - maxResults}{" "}
              {t("callcenter:moreResults", "نتیجه دیگر")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LeadSearchResults;
