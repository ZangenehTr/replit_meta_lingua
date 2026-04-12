import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface SectionStyles {
  transition: "none" | "fade" | "slide-up" | "slide-left" | "slide-right" | "scale-in";
  transitionDuration: number;
  isSticky: boolean;
  stickyHeight: "100vh" | "150vh" | "200vh" | "300vh";
  parallax: "none" | "slow" | "medium" | "fast";
  textReveal: "none" | "word-by-word" | "blur-to-sharp" | "fade-up";
  scrollSnap: boolean;
  blurOnEnter: boolean;
  blurAmount: number;
  theme: "none" | "light" | "dark" | "indigo" | "violet" | "custom";
  customBg: string;
  customText: string;
}

export const DEFAULT_STYLES: SectionStyles = {
  transition: "none",
  transitionDuration: 0.7,
  isSticky: false,
  stickyHeight: "100vh",
  parallax: "none",
  textReveal: "none",
  scrollSnap: false,
  blurOnEnter: false,
  blurAmount: 8,
  theme: "none",
  customBg: "#ffffff",
  customText: "#0f172a",
};

interface Props {
  styles: SectionStyles;
  onChange: (styles: SectionStyles) => void;
}

export function AnimationPanel({ styles, onChange }: Props) {
  const update = (partial: Partial<SectionStyles>) => onChange({ ...styles, ...partial });

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="transition">
      <AccordionItem value="transition">
        <AccordionTrigger className="text-sm font-medium">Entrance Transition</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">Animation Type</Label>
            <Select value={styles.transition} onValueChange={(v) => update({ transition: v as SectionStyles["transition"] })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade In</SelectItem>
                <SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="slide-left">Slide From Left</SelectItem>
                <SelectItem value="slide-right">Slide From Right</SelectItem>
                <SelectItem value="scale-in">Scale In</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration (seconds, 0.3–1.5)</Label>
            <Input
              type="number"
              min={0.3}
              max={1.5}
              step={0.1}
              value={styles.transitionDuration}
              onChange={(e) => update({ transitionDuration: parseFloat(e.target.value) || 0.7 })}
              className="h-8 text-sm"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="sticky">
        <AccordionTrigger className="text-sm font-medium">Sticky Story</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Pin section while scrolling</Label>
            <Switch checked={styles.isSticky} onCheckedChange={(v) => update({ isSticky: v })} />
          </div>
          {styles.isSticky && (
            <div className="space-y-1">
              <Label className="text-xs">Sticky Duration</Label>
              <Select value={styles.stickyHeight} onValueChange={(v) => update({ stickyHeight: v as SectionStyles["stickyHeight"] })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100vh">Short (100vh)</SelectItem>
                  <SelectItem value="150vh">Medium (150vh)</SelectItem>
                  <SelectItem value="200vh">Long (200vh)</SelectItem>
                  <SelectItem value="300vh">Very Long (300vh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="parallax">
        <AccordionTrigger className="text-sm font-medium">Parallax Effect</AccordionTrigger>
        <AccordionContent className="pt-1">
          <Select value={styles.parallax} onValueChange={(v) => update({ parallax: v as SectionStyles["parallax"] })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="slow">Slow (0.3x)</SelectItem>
              <SelectItem value="medium">Medium (0.6x)</SelectItem>
              <SelectItem value="fast">Fast (0.9x)</SelectItem>
            </SelectContent>
          </Select>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="textReveal">
        <AccordionTrigger className="text-sm font-medium">Text Reveal</AccordionTrigger>
        <AccordionContent className="pt-1">
          <Select value={styles.textReveal} onValueChange={(v) => update({ textReveal: v as SectionStyles["textReveal"] })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="word-by-word">Word by Word</SelectItem>
              <SelectItem value="blur-to-sharp">Blur to Sharp</SelectItem>
              <SelectItem value="fade-up">Fade Up</SelectItem>
            </SelectContent>
          </Select>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="scrollSnap">
        <AccordionTrigger className="text-sm font-medium">Scroll Snap</AccordionTrigger>
        <AccordionContent className="pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Snap scroll to this section</Label>
            <Switch checked={styles.scrollSnap} onCheckedChange={(v) => update({ scrollSnap: v })} />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="blurOnEnter">
        <AccordionTrigger className="text-sm font-medium">Blur on Enter</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Blur then sharpen on scroll</Label>
            <Switch checked={styles.blurOnEnter} onCheckedChange={(v) => update({ blurOnEnter: v })} />
          </div>
          {styles.blurOnEnter && (
            <div className="space-y-1">
              <Label className="text-xs">Blur Amount (4–20px)</Label>
              <Input
                type="number"
                min={4}
                max={20}
                step={1}
                value={styles.blurAmount}
                onChange={(e) => update({ blurAmount: parseInt(e.target.value) || 8 })}
                className="h-8 text-sm"
              />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="theme">
        <AccordionTrigger className="text-sm font-medium">Section Theme</AccordionTrigger>
        <AccordionContent className="space-y-3 pt-1">
          <Select value={styles.theme} onValueChange={(v) => update({ theme: v as SectionStyles["theme"] })}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (inherit)</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="indigo">Indigo</SelectItem>
              <SelectItem value="violet">Violet</SelectItem>
              <SelectItem value="custom">Custom Colors</SelectItem>
            </SelectContent>
          </Select>
          {styles.theme === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={styles.customBg}
                    onChange={(e) => update({ customBg: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={styles.customBg}
                    onChange={(e) => update({ customBg: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={styles.customText}
                    onChange={(e) => update({ customText: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <Input
                    value={styles.customText}
                    onChange={(e) => update({ customText: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
