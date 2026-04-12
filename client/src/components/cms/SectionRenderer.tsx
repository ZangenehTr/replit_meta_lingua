import React from "react";
import DOMPurify from "dompurify";
import type { CmsPageSection } from "@shared/schema";

interface SectionStyles {
  theme?: string;
  customBg?: string;
  customText?: string;
}

const THEME_STYLES: Record<string, React.CSSProperties> = {
  light: { background: "#FFFFFF", color: "#0F172A" },
  dark: { background: "#0F172A", color: "#F8FAFC" },
  indigo: { background: "linear-gradient(135deg, #1e1b4b, #312e81)", color: "#FFFFFF" },
  violet: { background: "linear-gradient(135deg, #2e1065, #4c1d95)", color: "#FFFFFF" },
  none: {},
};

function getThemeStyle(styles: SectionStyles): React.CSSProperties {
  if (!styles.theme || styles.theme === "none") return {};
  if (styles.theme === "custom") {
    return {
      background: styles.customBg || "transparent",
      color: styles.customText || "inherit",
    };
  }
  return THEME_STYLES[styles.theme] || {};
}

interface Props {
  section: CmsPageSection;
}

function HeroSection({ content }: { content: Record<string, any> }) {
  const bgStyle: React.CSSProperties = {};
  if (content.backgroundType === "color") {
    bgStyle.backgroundColor = content.backgroundValue || "#1e1b4b";
  } else if (content.backgroundType === "gradient") {
    bgStyle.backgroundImage = content.backgroundValue || "linear-gradient(135deg, #1e1b4b, #312e81)";
  } else if (content.backgroundType === "image") {
    bgStyle.backgroundImage = `url(${content.backgroundValue})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  return (
    <div
      data-parallax-inner
      className="flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: content.minHeight || "80vh", ...bgStyle, color: "inherit" }}
    >
      {content.headline && (
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          {content.headline}
        </h1>
      )}
      {content.subheadline && (
        <p className="text-lg sm:text-xl mb-8 opacity-90 max-w-2xl">
          {content.subheadline}
        </p>
      )}
      <div className="flex flex-wrap gap-4 justify-center">
        {content.ctaPrimary?.text && (
          <a
            href={content.ctaPrimary.href || "#"}
            className="px-6 py-3 rounded-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {content.ctaPrimary.text}
          </a>
        )}
        {content.ctaSecondary?.text && (
          <a
            href={content.ctaSecondary.href || "#"}
            className="px-6 py-3 rounded-lg font-semibold border border-current opacity-80 hover:opacity-100 transition-opacity"
          >
            {content.ctaSecondary.text}
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturesSection({ content }: { content: Record<string, any> }) {
  const cols = content.columns || 3;
  const gridClass = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : cols === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="py-16 px-6 max-w-7xl mx-auto w-full">
      {content.title && <h2 className="text-3xl font-bold text-center mb-3">{content.title}</h2>}
      {content.subtitle && <p className="text-center opacity-70 mb-12">{content.subtitle}</p>}
      <div className={`grid ${gridClass} gap-6`}>
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} className="p-6 rounded-xl border border-current/10 bg-white/5">
            {item.icon && <div className="text-3xl mb-3">{item.icon}</div>}
            {item.title && <h3 className="text-lg font-semibold mb-2">{item.title}</h3>}
            {item.description && <p className="opacity-70 text-sm leading-relaxed">{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TextSection({ content }: { content: Record<string, any> }) {
  const alignClass = content.alignment === "center" ? "text-center mx-auto" : content.alignment === "right" ? "text-right ms-auto" : "";
  const maxWClass = content.maxWidth === "prose" ? "max-w-prose" : content.maxWidth === "wide" ? "max-w-4xl" : "max-w-none";
  const sanitized = DOMPurify.sanitize(content.html || "");
  return (
    <div className={`py-12 px-6 ${maxWClass} ${alignClass} w-full`}>
      <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitized }} />
    </div>
  );
}

function CtaSection({ content }: { content: Record<string, any> }) {
  return (
    <div className="py-16 px-6 text-center max-w-3xl mx-auto w-full">
      {content.headline && <h2 className="text-3xl sm:text-4xl font-bold mb-4">{content.headline}</h2>}
      {content.subtext && <p className="opacity-70 mb-8 text-lg">{content.subtext}</p>}
      <div className="flex flex-wrap gap-4 justify-center">
        {(content.buttons || []).map((btn: any, i: number) => {
          const cls = btn.variant === "outline"
            ? "px-6 py-3 rounded-lg font-semibold border border-current hover:bg-white/10 transition-colors"
            : btn.variant === "secondary"
            ? "px-6 py-3 rounded-lg font-semibold bg-white/20 hover:bg-white/30 transition-colors"
            : "px-6 py-3 rounded-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors";
          return (
            <a key={i} href={btn.href || "#"} className={cls}>
              {btn.text}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialsSection({ content }: { content: Record<string, any> }) {
  return (
    <div className="py-16 px-6 max-w-6xl mx-auto w-full">
      {content.title && <h2 className="text-3xl font-bold text-center mb-12">{content.title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(content.items || []).map((item: any, i: number) => (
          <div key={i} className="p-6 rounded-xl border border-current/10 bg-white/5">
            <div className="flex mb-3">
              {Array.from({ length: item.score || 5 }).map((_, j) => (
                <span key={j} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
            {item.quote && <p className="italic opacity-80 mb-4 text-sm leading-relaxed">"{item.quote}"</p>}
            {item.name && <p className="font-semibold text-sm">{item.name}</p>}
            {item.role && <p className="opacity-60 text-xs">{item.role}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsSection({ content }: { content: Record<string, any> }) {
  return (
    <div className="py-12 px-6 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {(content.items || []).map((item: any, i: number) => (
          <div key={i}>
            <div className="text-4xl font-bold mb-1">{item.value}</div>
            <div className="text-sm opacity-70">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacerSection({ content }: { content: Record<string, any> }) {
  const heights: Record<string, string> = { sm: "32px", md: "64px", lg: "128px", xl: "192px" };
  const h = heights[content.height || "md"] || "64px";
  return (
    <div style={{ height: h }} className="w-full relative flex items-center">
      {content.style === "line" && <hr className="w-full border-current/20" />}
      {content.style === "gradient" && (
        <div className="w-full h-full" style={{ background: "linear-gradient(to bottom, transparent, currentColor 50%, transparent)", opacity: 0.1 }} />
      )}
    </div>
  );
}

export function SectionRenderer({ section }: Props) {
  const content = (section.content || {}) as Record<string, any>;
  const styles = (section.styles || {}) as SectionStyles;
  const themeStyle = getThemeStyle(styles);

  const inner = (() => {
    switch (section.sectionType) {
      case "hero": return <HeroSection content={content} />;
      case "features": return <FeaturesSection content={content} />;
      case "text": return <TextSection content={content} />;
      case "cta": return <CtaSection content={content} />;
      case "testimonials": return <TestimonialsSection content={content} />;
      case "stats": return <StatsSection content={content} />;
      case "spacer": return <SpacerSection content={content} />;
      default: return null;
    }
  })();

  return (
    <section
      data-section-id={section.id}
      style={themeStyle}
      className="w-full overflow-hidden"
    >
      {inner}
    </section>
  );
}
