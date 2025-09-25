import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const TITLE = "JON ORILLINEDA";
const SUBTITLE = "FULLSTACK DEVELOPER • LIFELONG LEARNER";

const HomeSection = () => {
  const scope = useRef(null);
  const titleRef = useRef(null);
  const lineRef = useRef(null);
  const subtitleRef = useRef(null);
  const hoverAreaRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduce) {
        gsap.set([titleRef.current, subtitleRef.current, lineRef.current], {
          clearProps: "all",
        });
        return;
      }

      // Intro setup
      gsap.set(lineRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(subtitleRef.current, { y: -16, opacity: 0 });

      const chars = Array.from(titleRef.current.querySelectorAll(".char"));
      gsap.set(chars, { y: 26, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(lineRef.current, { scaleX: 1, duration: 0.8 })
        .to(chars, { y: 0, opacity: 1, duration: 0.6, stagger: 0.02 }, "-=0.4")
        .to(subtitleRef.current, { y: 0, opacity: 1, duration: 0.6 }, "-=0.3");

      // Per-letter mouse-follow base offsets
      const qCharX = chars.map((el) =>
        gsap.quickTo(el, "x", { duration: 0.2, ease: "power2.out" })
      );
      const qCharY = chars.map((el) =>
        gsap.quickTo(el, "y", { duration: 0.2, ease: "power2.out" })
      );
      const qLineX = gsap.quickTo(lineRef.current, "x", {
        duration: 0.25,
        ease: "power2.out",
      });

      const baseX = new Array(chars.length).fill(0);
      const baseY = new Array(chars.length).fill(0);
      const liftY = Object.fromEntries(chars.map((_, i) => [i, 0])); // per-letter lift amount

      const area = hoverAreaRef.current;
      const radius = 180;
      const ampX = 16;
      const ampY = 10;
      const ampLine = 6;

      const onMove = (e) => {
        if (!area) return;

        let maxW = 0;
        let lineShift = 0;

        chars.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          const w = Math.max(0, 1 - dist / radius);

          if (w > 0) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            baseX[i] = nx * ampX * w;
            baseY[i] = ny * ampY * w;
          } else {
            baseX[i] = 0;
            baseY[i] = 0;
          }

          qCharX[i](baseX[i]);
          qCharY[i](baseY[i] + liftY[i]); // add lift offset

          if (w > maxW) {
            maxW = w;
            lineShift = (dx / (dist || 1)) * ampLine * w;
          }
        });

        qLineX(lineShift);
      };

      const onLeave = () => {
        for (let i = 0; i < chars.length; i++) {
          baseX[i] = 0;
          baseY[i] = 0;
          qCharX[i](0);
          qCharY[i](liftY[i]); // keep lift while leaving area; arrow leave on letters will reset to 0
        }
        qLineX(0);
      };

      area?.addEventListener("mousemove", onMove);
      area?.addEventListener("mouseleave", onLeave);

      // Letter-specific lift on hover (slight rise)
      const enterHandlers = [];
      const leaveHandlers = [];

      chars.forEach((el, i) => {
        const onEnter = () => {
          const to = {};
          to[i] = -8; // lift amount (px)
          gsap.to(liftY, {
            ...to,
            duration: 0.2,
            ease: "power2.out",
            onUpdate: () => qCharY[i](baseY[i] + liftY[i]),
          });
        };
        const onLeaveChar = () => {
          const to = {};
          to[i] = 0;
          gsap.to(liftY, {
            ...to,
            duration: 0.25,
            ease: "power2.out",
            onUpdate: () => qCharY[i](baseY[i] + liftY[i]),
          });
        };
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeaveChar);
        enterHandlers[i] = onEnter;
        leaveHandlers[i] = onLeaveChar;
      });

      return () => {
        area?.removeEventListener("mousemove", onMove);
        area?.removeEventListener("mouseleave", onLeave);
        chars.forEach((el, i) => {
          el.removeEventListener("mouseenter", enterHandlers[i]);
          el.removeEventListener("mouseleave", leaveHandlers[i]);
        });
      };
    }, scope);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={scope} className="relative min-h-screen flex items-center">
      <div className="pl-2 text-left select-none">
        <div
          ref={hoverAreaRef}
          className="inline-block select-none pointer-events-auto"
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
              text-[clamp(48px,10vw,100px)]
              text-white
              font-poiret
              tracking-wide
              whitespace-nowrap
              select-none
            "
            aria-label={TITLE}
            draggable={false}
          >
            {TITLE.split("").map((ch, i) => (
              <span
                key={i}
                className="char inline-block" // pointer events enabled for per-letter hover
                draggable={false}
                style={{ userSelect: "none" }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h1>
          <div
            ref={lineRef}
            className="mt-2 h-[4px] bg-white rounded-full -ml-2 w-[calc(100%+0.5rem+24px)] pointer-events-none"
          />
        </div>

        <div
          ref={subtitleRef}
          className="
            mt-3
            text-[clamp(18px,3vw,30px)]
            text-white/70
            font-inter
            font-bold
            tracking-wide
            select-none pointer-events-none
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
