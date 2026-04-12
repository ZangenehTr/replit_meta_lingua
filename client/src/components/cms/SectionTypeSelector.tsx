import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, Grid, FileText, MousePointer, MessageSquare, BarChart3, Minus
} from "lucide-react";

const SECTION_TYPES = [
  {
    type: "hero",
    icon: Zap,
    name: "Hero",
    description: "Full-width banner with headline, CTA buttons, and background",
  },
  {
    type: "features",
    icon: Grid,
    name: "Features",
    description: "Grid of feature cards with icons, titles, and descriptions",
  },
  {
    type: "text",
    icon: FileText,
    name: "Rich Text",
    description: "Free-form HTML content block with alignment options",
  },
  {
    type: "cta",
    icon: MousePointer,
    name: "Call to Action",
    description: "Centered headline with action buttons",
  },
  {
    type: "testimonials",
    icon: MessageSquare,
    name: "Testimonials",
    description: "Customer quotes with names, roles, and star ratings",
  },
  {
    type: "stats",
    icon: BarChart3,
    name: "Stats",
    description: "Row of impressive numbers and their labels",
  },
  {
    type: "spacer",
    icon: Minus,
    name: "Spacer",
    description: "Visual separator — blank space or a divider line",
  },
];

interface Props {
  onSelect: (type: string) => void;
}

export function SectionTypeSelector({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SECTION_TYPES.map(({ type, icon: Icon, name, description }) => (
        <Card
          key={type}
          className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
          onClick={() => onSelect(type)}
        >
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-semibold text-sm">{name}</div>
            <div className="text-xs text-muted-foreground leading-tight">{description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
