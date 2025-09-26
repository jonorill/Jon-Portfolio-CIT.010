import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/* ---------- Static Text ---------- */
const TITLE = "JON ORILLINEDA";
const SUBTITLE = "FULLSTACK DEVELOPER • LIFELONG LEARNER";

/* ---------- Interaction / Motion Config ---------- */
const RADIUS = 180; // Cursor influence radius (px)
const AMP_X = 16; // Max lateral drift per letter
const AMP_Y = 10; // Max vertical drift per letter
const HOVER_LIFT = -4; // Per-letter lift on direct hover
const INTRO_LETTER_STAGGER = 0.02;

/* Component */
const HomeSection = ({ isActive = true }) => {
  /* ---------- Refs ---------- */
  const scopeRef = useRef(null); // Scoped GSAP context root
  const titleRef = useRef(null); // H1 element
  const lineRef = useRef(null); // Underline bar
  const subtitleRef = useRef(null); // Subtitle element
  const hoverAreaRef = useRef(null); // Wrapper that captures mouse movement

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      /* ---------- Reduced Motion: skip animations ---------- */
      if (reduce) {
        gsap.set([titleRef.current, subtitleRef.current, lineRef.current], {
          clearProps: "all",
        });
        return;
      }

      /* ---------- Intro Setup ---------- */
      gsap.set(lineRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(subtitleRef.current, { y: -16, opacity: 0 });

      const chars = Array.from(titleRef.current.querySelectorAll(".char"));
      gsap.set(chars, { y: 26, opacity: 0 });

      const introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      introTl
        .to(lineRef.current, { scaleX: 1, duration: 0.8 })
        .to(
          chars,
          { y: 0, opacity: 1, duration: 0.6, stagger: INTRO_LETTER_STAGGER },
          "-=0.4"
        )
        .to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3");

      /* ---------- Per-Letter Reactive Drift (cursor proximity) ---------- */
      const quickX = chars.map((el) =>
        gsap.quickTo(el, "x", { duration: 0.2, ease: "power2.out" })
      );
      const quickY = chars.map((el) =>
        gsap.quickTo(el, "y", { duration: 0.2, ease: "power2.out" })
      );

      const baseX = new Array(chars.length).fill(0); // live drift offsets
      const baseY = new Array(chars.length).fill(0);
      const liftY = Object.fromEntries(chars.map((_, i) => [i, 0])); // hover lift (persisted)

      const area = hoverAreaRef.current;

      const onMove = (e) => {
        if (!area) return;
        chars.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const weight = Math.max(0, 1 - dist / RADIUS);

          if (weight > 0) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            baseX[i] = nx * AMP_X * weight;
            baseY[i] = ny * AMP_Y * weight;
          } else {
            baseX[i] = 0;
            baseY[i] = 0;
          }
          quickX[i](baseX[i]);
          quickY[i](baseY[i] + liftY[i]);
        });
      };

      const onLeaveArea = () => {
        for (let i = 0; i < chars.length; i++) {
          baseX[i] = 0;
          baseY[i] = 0;
          quickX[i](0);
          quickY[i](liftY[i]);
        }
      };

      area?.addEventListener("mousemove", onMove);
      area?.addEventListener("mouseleave", onLeaveArea);

      /* ---------- Direct Letter Hover Lift ---------- */
      const enterHandlers = [];
      const leaveHandlers = [];

      chars.forEach((el, i) => {
        const onEnter = () => {
          gsap.to(liftY, {
            [i]: HOVER_LIFT,
            duration: 0.18,
            ease: "power2.out",
            onUpdate: () => quickY[i](baseY[i] + liftY[i]),
          });
        };
        const onLeaveChar = () => {
          gsap.to(liftY, {
            [i]: 0,
            duration: 0.22,
            ease: "power2.out",
            onUpdate: () => quickY[i](baseY[i] + liftY[i]),
          });
        };
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeaveChar);
        enterHandlers[i] = onEnter;
        leaveHandlers[i] = onLeaveChar;
      });

      /* ---------- Cleanup ---------- */
      return () => {
        area?.removeEventListener("mousemove", onMove);
        area?.removeEventListener("mouseleave", onLeaveArea);
        chars.forEach((el, i) => {
          el.removeEventListener("mouseenter", enterHandlers[i]);
          el.removeEventListener("mouseleave", leaveHandlers[i]);
        });
      };
    }, scopeRef);

    return () => ctx.revert();
  }, []);

  /* ---------- Render ---------- */
  return (
    <div
      ref={scopeRef}
      className={`
        relative min-h-screen flex items-center transition-opacity duration-500
        ${isActive ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      <div className="pl-2 text-left select-none">
        <div
          ref={hoverAreaRef}
          className="inline-block pointer-events-auto select-none"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            msUserSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <h1
            ref={titleRef}
            className="
              text-[clamp(48px,10vw,110px)]
              text-white font-poiret tracking-wide
              whitespace-nowrap select-none
            "
            aria-label={TITLE}
            draggable={false}
          >
            {TITLE.split("").map((ch, i) => (
              <span
                key={i}
                className="char inline-block"
                draggable={false}
                style={{ userSelect: "none" }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h1>

          {/* Underline (negative margins tighten vertical spacing) */}
          <div
            ref={lineRef}
            className="
              mt-[-20px] mb-[-5px]
              h-[3px] bg-white/70 rounded-full -ml-2
              w-[calc(100%+0.5rem+56px)]
              pointer-events-none
            "
          />
        </div>

        <div
          ref={subtitleRef}
          className="
            mt-3 text-[clamp(18px,3vw,30px)]
            text-white/70 font-inter font-bold
            tracking-wide select-none pointer-events-none
          "
          draggable={false}
        >
          {SUBTITLE}
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
