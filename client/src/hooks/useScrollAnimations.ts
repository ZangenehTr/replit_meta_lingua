import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SectionStylesAnim {
  transition?: string;
  transitionDuration?: number;
  isSticky?: boolean;
  stickyHeight?: string;
  parallax?: string;
  textReveal?: string;
  scrollSnap?: boolean;
  blurOnEnter?: boolean;
  blurAmount?: number;
}

interface Section {
  id: number;
  styles?: SectionStylesAnim | null;
}

interface Options {
  smoothScroll?: boolean;
  progressBar?: boolean;
}

export function useScrollAnimations(
  containerRef: React.RefObject<HTMLElement>,
  sections: Section[],
  options: Options = {}
) {
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const smoothRef = useRef<{ ticker: gsap.TickerCallback | null; proxy: HTMLElement | null; onWheel: ((e: WheelEvent) => void) | null }>({ ticker: null, proxy: null, onWheel: null });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const allTriggers: ScrollTrigger[] = [];
    const useSmoothScroll = !!options.smoothScroll && !("ontouchstart" in window);

    let currentY = 0;
    let targetY = 0;
    let proxyEl: HTMLElement | null = null;

    if (useSmoothScroll) {
      container.style.position = "fixed";
      container.style.overflow = "hidden";
      container.style.width = "100%";
      container.style.top = "0";
      container.style.left = "0";

      proxyEl = document.createElement("div");
      proxyEl.style.height = `${container.scrollHeight}px`;
      document.body.appendChild(proxyEl);
      smoothRef.current.proxy = proxyEl;

      ScrollTrigger.scrollerProxy(container, {
        scrollTop(value?: number) {
          if (arguments.length && value !== undefined) {
            currentY = value;
          }
          return currentY;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
      });

      ScrollTrigger.defaults({ scroller: container });

      const onWheel = (e: WheelEvent) => {
        const maxScroll = proxyEl ? proxyEl.clientHeight - window.innerHeight : 0;
        targetY = Math.max(0, Math.min(targetY + e.deltaY, maxScroll));
      };
      window.addEventListener("wheel", onWheel, { passive: true });
      smoothRef.current.onWheel = onWheel;

      const ticker = () => {
        currentY = gsap.utils.interpolate(currentY, targetY, 0.1);
        container.scrollTop = currentY;
        ScrollTrigger.update();
      };
      gsap.ticker.add(ticker);
      smoothRef.current.ticker = ticker;
    }

    sections.forEach((section) => {
      const el = container.querySelector<HTMLElement>(`[data-section-id="${section.id}"]`);
      if (!el) return;

      const s = section.styles || {};

      if (s.scrollSnap) {
        el.style.scrollSnapAlign = "start";
      }

      if (s.transition && s.transition !== "none") {
        const duration = Math.min(1.5, Math.max(0.3, s.transitionDuration || 0.7));
        const fromVars: gsap.TweenVars = { duration, ease: "power2.out" };

        if (s.transition === "fade") {
          fromVars.opacity = 0;
        } else if (s.transition === "slide-up") {
          fromVars.opacity = 0;
          fromVars.y = 60;
        } else if (s.transition === "slide-left") {
          fromVars.opacity = 0;
          fromVars.x = -60;
        } else if (s.transition === "slide-right") {
          fromVars.opacity = 0;
          fromVars.x = 60;
        } else if (s.transition === "scale-in") {
          fromVars.opacity = 0;
          fromVars.scale = 0.85;
        }

        const tween = gsap.from(el, {
          ...fromVars,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
      }

      if (s.isSticky && s.stickyHeight) {
        const endVal = s.stickyHeight || "100vh";
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${endVal}`,
          pin: true,
          pinSpacing: true,
        });
        allTriggers.push(st);
      }

      if (s.parallax && s.parallax !== "none") {
        const ratios: Record<string, number> = { slow: 0.3, medium: 0.6, fast: 0.9 };
        const ratio = ratios[s.parallax] || 0.3;
        const inner = el.querySelector<HTMLElement>("[data-parallax-inner]") || el;
        const tween = gsap.to(inner, {
          y: () => el.offsetHeight * ratio,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
        if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
      }

      if (s.textReveal && s.textReveal !== "none") {
        const headline = el.querySelector<HTMLElement>("h1, h2, h3");
        if (headline) {
          if (s.textReveal === "word-by-word") {
            const text = headline.textContent || "";
            const words = text.split(/\s+/).filter(Boolean);
            headline.innerHTML = words
              .map((w) => `<span class="cms-word" style="display:inline-block;overflow:hidden;padding-right:0.25em"><span style="display:inline-block">${w}</span></span>`)
              .join(" ");
            const spans = Array.from(headline.querySelectorAll<HTMLElement>(".cms-word > span"));
            const tween = gsap.from(spans, {
              y: 40,
              opacity: 0,
              stagger: 0.05,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            });
            if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
          } else if (s.textReveal === "blur-to-sharp") {
            const tween = gsap.from(headline, {
              filter: "blur(20px)",
              opacity: 0,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            });
            if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
          } else if (s.textReveal === "fade-up") {
            const tween = gsap.from(headline, {
              y: 30,
              opacity: 0,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            });
            if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
          }
        }
      }

      if (s.blurOnEnter) {
        const blurPx = Math.min(20, Math.max(4, s.blurAmount || 8));
        const tween = gsap.from(el, {
          filter: `blur(${blurPx}px)`,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        if (tween.scrollTrigger) allTriggers.push(tween.scrollTrigger);
      }
    });

    if (options.progressBar) {
      const bar = document.getElementById("cms-progress-bar");
      if (bar) {
        const st = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            gsap.set(bar, { scaleX: self.progress, transformOrigin: "left center" });
          },
        });
        allTriggers.push(st);
      }
    }

    ScrollTrigger.refresh();
    triggersRef.current = allTriggers;

    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];

      if (useSmoothScroll) {
        if (smoothRef.current.ticker) {
          gsap.ticker.remove(smoothRef.current.ticker);
          smoothRef.current.ticker = null;
        }
        if (smoothRef.current.onWheel) {
          window.removeEventListener("wheel", smoothRef.current.onWheel);
          smoothRef.current.onWheel = null;
        }
        if (smoothRef.current.proxy && document.body.contains(smoothRef.current.proxy)) {
          document.body.removeChild(smoothRef.current.proxy);
          smoothRef.current.proxy = null;
        }
        container.style.position = "";
        container.style.overflow = "";
        container.style.width = "";
        container.style.top = "";
        container.style.left = "";
        ScrollTrigger.defaults({ scroller: undefined });
        ScrollTrigger.clearScrollMemory();
      }
    };
  }, [sections, options.smoothScroll, options.progressBar]);
}
