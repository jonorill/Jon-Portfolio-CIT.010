import { useRef, useEffect, useMemo } from "react";
import { createNoise2D } from "simplex-noise";

export default function TopographyBackground() {
  const canvasRef = useRef(null);

  // SETTINGS: controls for appearance, motion, and hover behavior
  const SETTINGS = useMemo(
    () => ({
      // --- Line / geometry layout ---
      lineCount: 80, // Total number of horizontal lines drawn.
      spacing: 22, // Vertical distance (px) between lines (affects total vertical coverage).
      step: 5, // Horizontal sampling interval (px). Lower = smoother curves, higher CPU.

      // --- Stroke / appearance ---
      strokeRGBA: "255,255,255", // Base RGB (no alpha) for the line color.
      strokeOpacity: 0.05, // Alpha multiplier per line. Lower = more subtle, higher = brighter.

      // --- Base noise wave (ambient undulation) ---
      noiseAmp: 16, // Amplitude (height) of the noise waves before hover influence.
      noiseXFreq: 0.0025, // Frequency along X (how stretched/compressed the noise is horizontally).
      noiseLineOffsetFreq: 0.045, // Frequency along the line index over time (adds variety between lines).

      // --- Animation timing ---
      timeIncrement: 0.001, // How much "time" advances each frame (lower = slower animation flow).

      // --- Hover distortion core parameters ---
      hoverRadius: 200, // Radius of influence around the cursor in pixels.
      hoverPower: 1, // Falloff exponent for influence. 1=linear, >1 tighter near center, <1 broader.
      hoverLift: 40, // Maximum vertical displacement contributed by hover at the center.

      // --- Additional hover shaping ---
      extraCurveMultiplier: 1.6, // Multiplies the curved influence to punch up the center effect.
      hoverNoiseBoost: 1, // Boost the noise amplitude near cursor (0 = no extra turbulence).

      // --- Direction control ---
      invert: false, // false = push lines downward near cursor; true = pull upward.
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 2D drawing context and simplex noise generator
    const ctx = canvas.getContext("2d");
    const noise2D = createNoise2D();

    // Resize with high-DPI handling:
    // - Size the canvas in device pixels
    // - Scale the drawing context so we can draw using CSS pixels
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking (start off-screen so nothing reacts until the user moves)
    let mouse = { x: -9999, y: -9999 };
    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    // Animation time accumulator and rAF handle
    let t = 0;
    let frame;

    const draw = () => {
      // Clear the frame. Because the context is scaled to DPR, we can clear in CSS pixels:
      // ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      // Using canvas.width/height also works due to transform reset + scale above.
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stroke styling (applies to all lines for this frame)
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${SETTINGS.strokeRGBA},${SETTINGS.strokeOpacity})`;

      // Draw each horizontal "contour" line
      for (let i = 0; i < SETTINGS.lineCount; i++) {
        ctx.beginPath();
        const baseY = i * SETTINGS.spacing; // baseline Y for this line before noise/hover

        // Sample the wave along X from left to right at the chosen "step" interval.
        for (let x = 0; x < window.innerWidth; x += SETTINGS.step) {
          // Distance from cursor to this sample point
          const dist = Math.hypot(mouse.x - x, mouse.y - baseY);

          // Influence normalized to 0..1 inside hoverRadius (0 outside)
          const influenceNorm = Math.max(0, 1 - dist / SETTINGS.hoverRadius);

          // Shape falloff with exponent (hoverPower)
          let curved = Math.pow(influenceNorm, SETTINGS.hoverPower);

          // Amplify the center for extra punch (nonlinear)
          curved = curved * (1 + curved * SETTINGS.extraCurveMultiplier);

          // Local noise amplitude gets boosted near the cursor
          const localNoiseAmp =
            SETTINGS.noiseAmp * (1 + curved * SETTINGS.hoverNoiseBoost);

          // Base noise value (ambient wave) for this sample
          const noise =
            noise2D(
              x * SETTINGS.noiseXFreq, // horizontal coordinate in noise space
              i * SETTINGS.noiseLineOffsetFreq + t // vary by line index and time
            ) * localNoiseAmp;

          // Hover displacement (direction flipped by invert)
          const hoverOffset =
            curved * SETTINGS.hoverLift * (SETTINGS.invert ? -1 : 1);

          // Final sampled Y position
          const y = baseY + noise + hoverOffset;

          // By default lineTo from (0,0) on first point can draw a diagonal.
          // If you notice a diagonal from the top-left, swap to:
          // if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          ctx.lineTo(x, y);
        }

        // Render the current line
        ctx.stroke();
      }

      // Advance "time" to animate the noise
      t += SETTINGS.timeIncrement;

      // Schedule next frame
      frame = requestAnimationFrame(draw);
    };

    // Start the loop
    frame = requestAnimationFrame(draw);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [SETTINGS]);

  // Full-screen, pointer-events disabled so it never blocks clicks
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
