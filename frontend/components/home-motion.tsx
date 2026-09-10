"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HomeMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from("[data-hero-copy]", { autoAlpha: 0, y: 18, duration: 0.55 })
        .from(
          "[data-hero-model]",
          { autoAlpha: 0, y: 14, rotate: 1, duration: 0.6 },
          "-=0.34",
        );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((section) => {
        gsap.from(section, {
          y: 12,
          duration: 0.4,
          ease: "power1.out",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            once: true,
          },
        });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} className="contents">
      {children}
    </div>
  );
}
