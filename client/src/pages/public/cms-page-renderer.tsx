import React, { useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SectionRenderer } from "@/components/cms/SectionRenderer";
import { useScrollAnimations } from "@/hooks/useScrollAnimations";
import type { CmsPageSection } from "@shared/schema";

interface CmsPageData {
  id: number;
  title: string;
  slug: string;
  status: string;
  direction?: string;
  template?: string;
  sections: CmsPageSection[];
}

interface GlobalSettings {
  smoothScroll?: boolean;
  progressBar?: boolean;
}

function parseGlobalSettings(template?: string): GlobalSettings {
  if (!template) return {};
  try {
    return JSON.parse(template) as GlobalSettings;
  } catch {
    return {};
  }
}

export default function CmsPageRenderer() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug || "";
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<CmsPageData>({
    queryKey: [`/api/cms/pages/slug/${slug}`],
    enabled: !!slug,
  });

  const globalSettings = parseGlobalSettings(data?.template);
  const sections = data?.sections || [];

  const hasScrollSnap = sections.some((s) => {
    const styles = (s.styles || {}) as Record<string, any>;
    return styles.scrollSnap === true;
  });

  useScrollAnimations(containerRef, sections, {
    smoothScroll: globalSettings.smoothScroll,
    progressBar: globalSettings.progressBar,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</p>
          <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (data.status !== "published") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Page Not Found</p>
          <p className="text-muted-foreground">This page is not published yet.</p>
        </div>
      </div>
    );
  }

  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {globalSettings.progressBar && (
        <div
          id="cms-progress-bar"
          className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
          style={{ transform: "scaleX(0)" }}
        />
      )}
      <div
        ref={containerRef}
        dir={data.direction || "ltr"}
        style={hasScrollSnap ? { scrollSnapType: "y mandatory", overflowY: "scroll", height: "100vh" } : {}}
        className="w-full"
      >
        {sorted.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </>
  );
}
