import { useRef, useEffect, useMemo } from "react";
import { createNoise2D } from "simplex-noise";

/* ---------- Config (tweak for look & performance) ---------- */
const useTopoConfig = () =>
  useMemo(
    () => ({
      /* Layout / Geometry */
      lineCount: 80, // Total horizontal lines
      spacing: 22, // Vertical gap (px) between lines
      step: 5, // Horizontal sample step (lower = smoother, more CPU)

      /* Stroke Appearance */
      strokeRGBA: "255,255,255", // Base RGB
      strokeOpacity: 0.05, // Line alpha (all lines share)

      /* Base Ambient Noise */
      noiseAmp: 16, // Wave amplitude
      noiseXFreq: 0.0025, // Horizontal noise frequency
      noiseLineOffsetFreq: 0.045, // Per-line time offset frequency

      /* Animation */
      timeIncrement: 0.001, // Time delta per frame

      /* Hover Distortion Core */
      hoverRadius: 200, // Influence radius (px)
      hoverPower: 1, // Falloff exponent (1 linear, >1 sharper)
      hoverLift: 40, // Max vertical displacement at center

      /* Hover Shaping */
      extraCurveMultiplier: 1.6, // Boost center weight
      hoverNoiseBoost: 1, // Extra noise near cursor (0 = off)

      /* Direction */
      invert: false, // true pulls up, false pushes down
    }),
    []
  );

/* ---------- Component ---------- */
export default function TopographyBackground() {
  const canvasRef = useRef(null);
  const config = useTopoConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const noise2D = createNoise2D();

    /* ---------- Resize (HiDPI) ---------- */
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    /* ---------- Cursor Tracking ---------- */
    const mouse = { x: -9999, y: -9999 };
    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    /* ---------- Animation Loop ---------- */
    let t = 0;
    let rafId;

    const draw = () => {
      const {
        lineCount,
        spacing,
        step,
        strokeRGBA,
        strokeOpacity,
        noiseAmp,
        noiseXFreq,
        noiseLineOffsetFreq,
        timeIncrement,
        hoverRadius,
        hoverPower,
        hoverLift,
        extraCurveMultiplier,
        hoverNoiseBoost,
        invert,
      } = config;

      const width = window.innerWidth;
      const height = window.innerHeight; // (height not strictly needed but kept for clarity)

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${strokeRGBA},${strokeOpacity})`;

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();
        const baseY = i * spacing;

        // First sample uses moveTo to avoid initial diagonal artifact
        let firstPoint = true;

        for (let x = 0; x < width; x += step) {
          // Distance from cursor
          const dx = mouse.x - x;
          const dy = mouse.y - baseY;
          const dist = Math.hypot(dx, dy);

          // Normalized influence (0 outside radius)
          const norm = Math.max(0, 1 - dist / hoverRadius);

          // Curved & boosted center
          let curved = Math.pow(norm, hoverPower);
          curved *= 1 + curved * extraCurveMultiplier;

          // Local noise amplitude near cursor
          const localAmp = noiseAmp * (1 + curved * hoverNoiseBoost);

          // Ambient noise sample
          const n =
            noise2D(x * noiseXFreq, i * noiseLineOffsetFreq + t) * localAmp;

          // Hover direction
          const hoverOffset = curved * hoverLift * (invert ? -1 : 1);

          const y = baseY + n + hoverOffset;

          if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      t += timeIncrement;
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    /* ---------- Cleanup ---------- */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [config]);

  /* ---------- Render ---------- */
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
