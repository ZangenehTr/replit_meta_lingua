import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  sectionType: string;
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SectionContentEditor({ sectionType, content, onChange }: Props) {
  const update = (key: string, value: any) => onChange({ ...content, [key]: value });

  const updateItem = (arrayKey: string, index: number, field: string, value: any) => {
    const arr = [...(content[arrayKey] || [])];
    arr[index] = { ...arr[index], [field]: value };
    update(arrayKey, arr);
  };

  const addItem = (arrayKey: string, template: Record<string, any>) => {
    update(arrayKey, [...(content[arrayKey] || []), { ...template }]);
  };

  const removeItem = (arrayKey: string, index: number) => {
    const arr = [...(content[arrayKey] || [])];
    arr.splice(index, 1);
    update(arrayKey, arr);
  };

  if (sectionType === "hero") {
    return (
      <div className="space-y-4">
        <Field label="Headline">
          <Input value={content.headline || ""} onChange={(e) => update("headline", e.target.value)} placeholder="Your main headline" />
        </Field>
        <Field label="Subheadline">
          <Input value={content.subheadline || ""} onChange={(e) => update("subheadline", e.target.value)} placeholder="Supporting text" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Primary CTA Text">
            <Input value={content.ctaPrimary?.text || ""} onChange={(e) => update("ctaPrimary", { ...content.ctaPrimary, text: e.target.value })} placeholder="Get Started" />
          </Field>
          <Field label="Primary CTA URL">
            <Input value={content.ctaPrimary?.href || ""} onChange={(e) => update("ctaPrimary", { ...content.ctaPrimary, href: e.target.value })} placeholder="/signup" />
          </Field>
          <Field label="Secondary CTA Text">
            <Input value={content.ctaSecondary?.text || ""} onChange={(e) => update("ctaSecondary", { ...content.ctaSecondary, text: e.target.value })} placeholder="Learn More" />
          </Field>
          <Field label="Secondary CTA URL">
            <Input value={content.ctaSecondary?.href || ""} onChange={(e) => update("ctaSecondary", { ...content.ctaSecondary, href: e.target.value })} placeholder="/about" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Background Type">
            <Select value={content.backgroundType || "color"} onValueChange={(v) => update("backgroundType", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image URL</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Background Value">
            <Input value={content.backgroundValue || ""} onChange={(e) => update("backgroundValue", e.target.value)} placeholder="#1e1b4b or url(...)" />
          </Field>
        </div>
        <Field label="Min Height">
          <Select value={content.minHeight || "80vh"} onValueChange={(v) => update("minHeight", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="60vh">Short (60vh)</SelectItem>
              <SelectItem value="80vh">Medium (80vh)</SelectItem>
              <SelectItem value="100vh">Full Screen (100vh)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  if (sectionType === "features") {
    const items = content.items || [];
    return (
      <div className="space-y-4">
        <Field label="Title">
          <Input value={content.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="Why choose us" />
        </Field>
        <Field label="Subtitle">
          <Input value={content.subtitle || ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Everything you need" />
        </Field>
        <Field label="Columns">
          <Select value={String(content.columns || 3)} onValueChange={(v) => update("columns", parseInt(v))}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Feature Items</Label>
          {items.map((item: any, i: number) => (
            <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Item {i + 1}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeItem("items", i)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
              <Input value={item.icon || ""} onChange={(e) => updateItem("items", i, "icon", e.target.value)} placeholder="Icon (emoji or text)" className="h-8 text-sm" />
              <Input value={item.title || ""} onChange={(e) => updateItem("items", i, "title", e.target.value)} placeholder="Feature title" className="h-8 text-sm" />
              <Textarea value={item.description || ""} onChange={(e) => updateItem("items", i, "description", e.target.value)} placeholder="Feature description" className="text-sm min-h-[60px]" />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addItem("items", { icon: "⭐", title: "", description: "" })} className="w-full h-8 text-xs">
            <Plus className="w-3 h-3 me-1" /> Add Feature
          </Button>
        </div>
      </div>
    );
  }

  if (sectionType === "text") {
    return (
      <div className="space-y-4">
        <Field label="HTML Content (will be sanitized)">
          <Textarea
            value={content.html || ""}
            onChange={(e) => update("html", e.target.value)}
            placeholder="<h2>Title</h2><p>Your content here...</p>"
            className="min-h-[200px] font-mono text-sm"
          />
        </Field>
        <Field label="Text Alignment">
          <Select value={content.alignment || "left"} onValueChange={(v) => update("alignment", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Max Width">
          <Select value={content.maxWidth || "prose"} onValueChange={(v) => update("maxWidth", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="prose">Prose (65ch)</SelectItem>
              <SelectItem value="wide">Wide (80ch)</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  if (sectionType === "cta") {
    const buttons = content.buttons || [];
    return (
      <div className="space-y-4">
        <Field label="Headline">
          <Input value={content.headline || ""} onChange={(e) => update("headline", e.target.value)} placeholder="Ready to get started?" />
        </Field>
        <Field label="Subtext">
          <Textarea value={content.subtext || ""} onChange={(e) => update("subtext", e.target.value)} placeholder="Join thousands of happy users" className="min-h-[80px] text-sm" />
        </Field>
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Buttons</Label>
          {buttons.map((btn: any, i: number) => (
            <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Button {i + 1}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeItem("buttons", i)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={btn.text || ""} onChange={(e) => updateItem("buttons", i, "text", e.target.value)} placeholder="Button text" className="h-8 text-sm" />
                <Input value={btn.href || ""} onChange={(e) => updateItem("buttons", i, "href", e.target.value)} placeholder="/link" className="h-8 text-sm" />
              </div>
              <Select value={btn.variant || "default"} onValueChange={(v) => updateItem("buttons", i, "variant", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Primary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addItem("buttons", { text: "", href: "", variant: "default" })} className="w-full h-8 text-xs">
            <Plus className="w-3 h-3 me-1" /> Add Button
          </Button>
        </div>
      </div>
    );
  }

  if (sectionType === "testimonials") {
    const items = content.items || [];
    return (
      <div className="space-y-4">
        <Field label="Section Title">
          <Input value={content.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="What our users say" />
        </Field>
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Testimonials</Label>
          {items.map((item: any, i: number) => (
            <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Testimonial {i + 1}</span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeItem("items", i)}>
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
              <Textarea value={item.quote || ""} onChange={(e) => updateItem("items", i, "quote", e.target.value)} placeholder="Their quote..." className="text-sm min-h-[80px]" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={item.name || ""} onChange={(e) => updateItem("items", i, "name", e.target.value)} placeholder="Full Name" className="h-8 text-sm" />
                <Input value={item.role || ""} onChange={(e) => updateItem("items", i, "role", e.target.value)} placeholder="Role / Company" className="h-8 text-sm" />
              </div>
              <Input
                type="number"
                min={1}
                max={5}
                value={item.score || 5}
                onChange={(e) => updateItem("items", i, "score", parseInt(e.target.value) || 5)}
                placeholder="Score (1-5)"
                className="h-8 text-sm"
              />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addItem("items", { quote: "", name: "", role: "", score: 5 })} className="w-full h-8 text-xs">
            <Plus className="w-3 h-3 me-1" /> Add Testimonial
          </Button>
        </div>
      </div>
    );
  }

  if (sectionType === "stats") {
    const items = content.items || [];
    return (
      <div className="space-y-4">
        <Label className="text-xs font-medium text-muted-foreground">Stats</Label>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex gap-2 items-center">
            <Input value={item.value || ""} onChange={(e) => updateItem("items", i, "value", e.target.value)} placeholder="10,000+" className="h-8 text-sm flex-1" />
            <Input value={item.label || ""} onChange={(e) => updateItem("items", i, "label", e.target.value)} placeholder="Happy Users" className="h-8 text-sm flex-1" />
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => removeItem("items", i)}>
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => addItem("items", { value: "", label: "" })} className="w-full h-8 text-xs">
          <Plus className="w-3 h-3 me-1" /> Add Stat
        </Button>
      </div>
    );
  }

  if (sectionType === "spacer") {
    return (
      <div className="space-y-4">
        <Field label="Height">
          <Select value={content.height || "md"} onValueChange={(v) => update("height", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small (32px)</SelectItem>
              <SelectItem value="md">Medium (64px)</SelectItem>
              <SelectItem value="lg">Large (128px)</SelectItem>
              <SelectItem value="xl">Extra Large (192px)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Style">
          <Select value={content.style || "none"} onValueChange={(v) => update("style", v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Plain</SelectItem>
              <SelectItem value="line">Divider Line</SelectItem>
              <SelectItem value="gradient">Gradient Fade</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground py-4 text-center">
      No content editor for section type: {sectionType}
    </div>
  );
}
