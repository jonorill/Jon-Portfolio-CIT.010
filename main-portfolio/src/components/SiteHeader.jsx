import React, { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";

/* ---------- Text Content ---------- */
const TITLE = "JON ORILLINEDA";
const HOME_SUBTITLE = "FULLSTACK DEVELOPER • LIFELONG LEARNER";

/* ---------- Sizing & Layout Config ---------- */
const HERO_EXTRA = 90; // Extra px added to hero line (extends past last letter)
const COMPACT_RATIO = 1.05; // Compact line = rawTitleWidth * ratio + COMPACT_EXTRA
const COMPACT_EXTRA = 12; // Small additive bump in compact
const COMPACT_SCALE = 0.38; // Scale factor in compact mode

/* ---------- Animation Timings / Eases ---------- */
const MOVE_DUR = 0.85;
const WIDTH_DUR = 0.55;
const POS_EASE = "power3.inOut";
const WIDTH_EASE = "power2.out";

/* Component */
const SiteHeader = ({ activeSection, sectionLabels, activeSubLabel }) => {
  /* Refs */
  const wrapRef = useRef(null);
  const titleRef = useRef(null);
  const lineRef = useRef(null);
  const subtitleRef = useRef(null);

  const modeRef = useRef(null); // "hero" | "compact"
  const initedRef = useRef(false);
  const resizeObsRef = useRef(null); // ResizeObserver for hero width tracking
  const morphTlRef = useRef(null); // Active morph timeline (to kill before new one)

  /* ---------- Subtitle Helpers ---------- */
  const buildSubtitle = () => {
    if (activeSection === "home") return HOME_SUBTITLE.toUpperCase();
    const sec = (sectionLabels[activeSection] || "").toUpperCase();
    if (
      activeSubLabel &&
      activeSubLabel.trim() &&
      activeSubLabel.toUpperCase() !== sec
    ) {
      return `${sec} • ${activeSubLabel.toUpperCase()}`;
    }
    return sec;
  };

  // Single-node subtitle swap animation
  const animateSubtitleChange = (text) => {
    const el = subtitleRef.current;
    if (!el || el.textContent === text) return;
    gsap
      .timeline()
      .to(el, { y: 14, opacity: 0, duration: 0.3, ease: "power2.in" })
      .set(el, { textContent: text, y: -14 })
      .to(el, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
  };

  /* ---------- Width Calculations ---------- */
  const rawTitleWidth = () => {
    if (!titleRef.current) return 0;
    const visible = titleRef.current.getBoundingClientRect().width;
    // If compact, remove scale to get the original (hero) width
    return modeRef.current === "compact" ? visible / COMPACT_SCALE : visible;
  };

  const computeWidths = () => {
    const raw = rawTitleWidth();
    return {
      raw,
      hero: raw + HERO_EXTRA,
      compact: raw * COMPACT_RATIO + COMPACT_EXTRA,
    };
  };

  // Retry measuring until font fully loaded (width > 0)
  const measureWithRetry = (cb, tries = 0) => {
    if (rawTitleWidth() > 0 || tries >= 10) cb();
    else requestAnimationFrame(() => measureWithRetry(cb, tries + 1));
  };

  /* ---------- Initial Mount / Entrance Animation ---------- */
  useLayoutEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const startMode = activeSection === "home" ? "hero" : "compact";
    modeRef.current = startMode;

    // Place header immediately (avoid jump)
    gsap.set(wrapRef.current, {
      x: startMode === "hero" ? 32 : 20,
      y: startMode === "hero" ? window.innerHeight * 0.42 : 20,
      scale: startMode === "hero" ? 1 : COMPACT_SCALE,
      transformOrigin: "top left",
    });

    // Initial subtitle
    if (subtitleRef.current) subtitleRef.current.textContent = buildSubtitle();

    const initAnimation = () => {
      const { hero, compact } = computeWidths();

      if (startMode === "hero") {
        // Hero entrance
        gsap.set(lineRef.current, { width: 0 });
        gsap
          .timeline()
          .from(titleRef.current, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          })
          .to(
            lineRef.current,
            { width: hero, duration: 0.9, ease: "power3.out", delay: 0.05 },
            0
          )
          .from(
            subtitleRef.current,
            {
              y: -14,
              opacity: 0,
              duration: 0.55,
              ease: "power3.out",
              delay: 0.25,
            },
            0
          );

        // Observe width changes in hero mode
        if (resizeObsRef.current) resizeObsRef.current.disconnect();
        resizeObsRef.current = new ResizeObserver(() => {
          if (modeRef.current === "hero") {
            const { hero: h2 } = computeWidths();
            gsap.set(lineRef.current, { width: h2 });
          }
        });
        resizeObsRef.current.observe(titleRef.current);
      } else {
        // Compact entrance (page refreshed mid-scroll)
        gsap.set(lineRef.current, { width: 0 });
        gsap
          .timeline()
          .from(titleRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          })
          .to(
            lineRef.current,
            { width: compact, duration: 0.7, ease: "power3.out" },
            0
          )
          .from(
            subtitleRef.current,
            {
              y: -14,
              opacity: 0,
              duration: 0.5,
              ease: "power3.out",
              delay: 0.15,
            },
            0
          );
      }
    };

    // Wait for fonts (if available) then ensure measured width > 0
    if (document.fonts?.ready)
      document.fonts.ready.then(() => measureWithRetry(initAnimation));
    else measureWithRetry(initAnimation);

    // Handle window resize (re-center hero / maintain lines)
    const onResize = () => {
      if (modeRef.current === "hero") {
        gsap.set(wrapRef.current, { y: window.innerHeight * 0.42 });
        const { hero } = computeWidths();
        gsap.set(lineRef.current, { width: hero });
      } else {
        const { compact } = computeWidths();
        gsap.set(lineRef.current, { width: compact });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeObsRef.current) resizeObsRef.current.disconnect();
      if (morphTlRef.current) morphTlRef.current.kill();
    };
  }, [activeSection]); // activeSection only influences initial mode on first render

  /* ---------- Morph: Hero <-> Compact ---------- */
  useEffect(() => {
    if (!initedRef.current) return;

    const targetMode = activeSection === "home" ? "hero" : "compact";
    if (targetMode === modeRef.current) return;

    // Kill existing morph to avoid overlap
    if (morphTlRef.current) morphTlRef.current.kill();

    const { hero, compact } = computeWidths();

    if (targetMode === "compact") {
      // HERO -> COMPACT
      if (resizeObsRef.current) resizeObsRef.current.disconnect();
      modeRef.current = "compact";
      morphTlRef.current = gsap
        .timeline({ defaults: { ease: POS_EASE } })
        .to(wrapRef.current, {
          x: 20,
          y: 20,
          scale: COMPACT_SCALE,
          duration: MOVE_DUR,
        })
        .to(
          lineRef.current,
          { width: compact, duration: WIDTH_DUR, ease: WIDTH_EASE },
          "<"
        );
    } else {
      // COMPACT -> HERO
      modeRef.current = "hero";
      morphTlRef.current = gsap
        .timeline({ defaults: { ease: POS_EASE } })
        .to(wrapRef.current, {
          x: 32,
          y: window.innerHeight * 0.42,
          scale: 1,
          duration: MOVE_DUR,
        })
        .to(
          lineRef.current,
          { width: hero, duration: WIDTH_DUR, ease: WIDTH_EASE },
          "<"
        )
        .add(() => {
          // Reattach observer for hero width tracking
          if (resizeObsRef.current) resizeObsRef.current.disconnect();
          resizeObsRef.current = new ResizeObserver(() => {
            if (modeRef.current === "hero") {
              const { hero: h2 } = computeWidths();
              gsap.set(lineRef.current, { width: h2 });
            }
          });
          resizeObsRef.current.observe(titleRef.current);
        });
    }
  }, [activeSection]);

  /* ---------- Subtitle Changes ---------- */
  useEffect(() => {
    if (!initedRef.current) return;
    animateSubtitleChange(buildSubtitle());
  }, [activeSection, activeSubLabel, sectionLabels]);

  /* ---------- Render ---------- */
  return (
    <div
      className="fixed left-0 top-0 z-30 pointer-events-none select-none"
      aria-hidden="true"
    >
      <div
        ref={wrapRef}
        className="absolute text-white font-poiret tracking-wide"
      >
        <h1
          ref={titleRef}
          className="whitespace-nowrap leading-none text-[clamp(32px,7.2vw,72px)]"
        >
          {TITLE}
        </h1>
        <div
          ref={lineRef}
          className="h-[3px] bg-white/80 rounded-full -ml-2 mt-[6px]"
        />
        <div
          ref={subtitleRef}
          className="mt-2 font-inter font-bold tracking-widest text-[clamp(14px,1.9vw,24px)] text-white/75 uppercase will-change-transform"
        />
      </div>
    </div>
  );
};

export default SiteHeader;
