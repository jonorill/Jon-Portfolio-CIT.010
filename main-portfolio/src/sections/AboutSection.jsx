import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";

/* ---------- Section Data (EDIT CONTENT HERE) ---------- */
const SECTIONS = [
  {
    id: "who-i-am",
    title: "Who I Am",
    preview: "Brief snapshot about you and your focus as a developer.",
    content: [
      "I’m a student full‑stack developer eager to keep learning and growing. I value clean, organized, and well‑planned development processes.",
      "My approach centers on clarity, code quality, and maintainability—ensuring projects are not only built with solid code, but also structured for long‑term success.",
      "Outside pure coding, I focus on architecture decisions, developer experience, and continuous improvement of workflow.",
    ],
  },
  {
    id: "my-stack",
    title: "My Stack",
    preview: "Core languages, frameworks, tools, and areas of focus.",
    content: [
      "Core Languages: JavaScript / TypeScript, Python, C++, Java.",
      "Frameworks & Libraries: React, Node.js / Express, Tailwind CSS, GSAP (animation), Jest / Vitest (testing).",
      "Databases & Infra: PostgreSQL, MongoDB, basic Docker usage, REST API design.",
      "Practices: Modular architecture, accessibility considerations, performance awareness, readable commits, iterative refactor.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    preview: "How to reach you or view professional profiles.",
    content: [
      "I’m open to collaboration, internships, and early career opportunities.",
      "Feel free to reach out—happy to discuss projects or ideas.",
    ],
  },
];

/* ---------- Minimap Config ---------- */
const OBSERVER_ROOT_MARGIN = "-45% 0px -45% 0px";
const MINIMAP_HEIGHT = 360;
const MINIMAP_WIDTH = 120;
const MINIMAP_GAP = 4;
const MINIMAP_MIN_SECTION_H = 24;

/* Component */
const AboutSection = ({ onActiveSubChange }) => {
  /* ---------- State ---------- */
  const [activeSub, setActiveSub] = useState(null);
  const [miniLayout, setMiniLayout] = useState([]); // [{id, top, height}]
  const [viewportMini, setViewportMini] = useState({ top: 0, height: 0 });

  /* ---------- Refs ---------- */
  const sectionRefs = useRef({});
  const contentWrapRef = useRef(null);
  const observerRef = useRef(null);

  /* ---------- Assign Section Ref ---------- */
  const setSectionRef = useCallback(
    (id) => (el) => {
      if (el) sectionRefs.current[id] = el;
    },
    []
  );

  /* ---------- Smooth Scroll To Section ---------- */
  const scrollToSection = (id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Active Section Detection ---------- */
  useEffect(() => {
    const elems = Object.values(sectionRefs.current);
    if (!elems.length) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const sec = SECTIONS.find((s) => s.id === id);
            if (sec && sec.title !== activeSub) {
              setActiveSub(sec.title);
              onActiveSubChange && onActiveSubChange(sec.title);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: OBSERVER_ROOT_MARGIN,
        threshold: 0,
      }
    );
    elems.forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, [activeSub, onActiveSubChange]);

  /* ---------- Reset Header Subtitle On Unmount ---------- */
  useEffect(() => {
    return () => {
      onActiveSubChange && onActiveSubChange(null);
    };
  }, [onActiveSubChange]);

  /* ---------- Build Minimap Layout ---------- */
  const rebuildMinimap = useCallback(() => {
    const items = SECTIONS.map((s) => {
      const el = sectionRefs.current[s.id];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      return { id: s.id, top, height: rect.height };
    }).filter(Boolean);

    if (!items.length) return;

    const contentTop = items[0].top;
    const contentBottom = Math.max(...items.map((x) => x.top + x.height));
    const contentHeight = contentBottom - contentTop;

    const totalGap = (items.length - 1) * MINIMAP_GAP;
    const scale = (MINIMAP_HEIGHT - totalGap) / contentHeight;

    const layout = items.map((it, index) => {
      const h = Math.max(it.height * scale, MINIMAP_MIN_SECTION_H);
      const relativeTop = it.top - contentTop;
      const t = relativeTop * scale + index * MINIMAP_GAP;
      return { id: it.id, top: t, height: h };
    });

    setMiniLayout(layout);
    updateViewportRect(layout, contentTop, contentHeight);
  }, []);

  /* ---------- Update Viewport Rectangle ---------- */
  const updateViewportRect = (layout, contentTop, contentHeight) => {
    if (!layout.length) return;
    const scrollTop = window.scrollY;
    const winH = window.innerHeight;
    const scale =
      (MINIMAP_HEIGHT - (layout.length - 1) * MINIMAP_GAP) / contentHeight;

    const viewportTopClamped = Math.max(
      0,
      Math.min(scrollTop - contentTop, contentHeight)
    );
    const miniTop = viewportTopClamped * scale;
    const miniHeight = Math.max(12, Math.min(winH * scale, MINIMAP_HEIGHT));

    setViewportMini({ top: miniTop, height: miniHeight });
  };

  /* ---------- Scroll / Resize Listeners (Minimap Sync) ---------- */
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!miniLayout.length || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const first = sectionRefs.current[SECTIONS[0].id];
        const last = sectionRefs.current[SECTIONS[SECTIONS.length - 1].id];
        if (first && last) {
          const top = first.getBoundingClientRect().top + window.scrollY;
          const bottom =
            last.getBoundingClientRect().top +
            window.scrollY +
            last.getBoundingClientRect().height;
          const contentHeight = bottom - top;
          updateViewportRect(miniLayout, top, contentHeight);
        }
        ticking = false;
      });
    };
    const handleResize = () => rebuildMinimap();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [miniLayout, rebuildMinimap]);

  /* ---------- Initial Measurements ---------- */
  useLayoutEffect(() => {
    rebuildMinimap();
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => rebuildMinimap());
    }
  }, [rebuildMinimap]);

  /* ---------- Minimap Click / Pointer Navigation ---------- */
  const onMinimapPointer = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - box.top;

    const first = sectionRefs.current[SECTIONS[0].id];
    const last = sectionRefs.current[SECTIONS[SECTIONS.length - 1].id];
    if (!first || !last) return;
    const contentTop = first.getBoundingClientRect().top + window.scrollY;
    const contentBottom =
      last.getBoundingClientRect().top +
      window.scrollY +
      last.getBoundingClientRect().height;
    const contentHeight = contentBottom - contentTop;

    const scale =
      (MINIMAP_HEIGHT - (SECTIONS.length - 1) * MINIMAP_GAP) / contentHeight;

    const targetContentOffset = y / scale;
    const scrollTarget =
      contentTop + targetContentOffset - window.innerHeight / 2;

    window.scrollTo({
      top: Math.max(
        contentTop,
        Math.min(scrollTarget, contentBottom - window.innerHeight)
      ),
      behavior: "smooth",
    });
  };

  /* ---------- Render ---------- */
  return (
    <div className="relative px-6 md:px-10 lg:px-16 py-24 text-white">
      <div
        className="
          grid gap-16
          md:grid-cols-[160px_1fr]
          lg:grid-cols-[180px_1fr]
        "
      >
        {/* ---------- LEFT: Minimap ONLY ---------- */}
        <aside className="md:sticky md:top-28 self-start">
          <div>
            <h3 className="text-sm tracking-widest font-inter text-white/50 uppercase mb-3">
              Minimap
            </h3>
            <div
              role="presentation"
              onClick={onMinimapPointer}
              onPointerDown={onMinimapPointer}
              className={[
                "relative rounded-md border border-white/15",
                "bg-white/[0.02] overflow-hidden select-none",
                "cursor-pointer hidden lg:block",
              ].join(" ")}
              style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
            >
              {miniLayout.map((m) => {
                const active =
                  activeSub &&
                  SECTIONS.find((s) => s.id === m.id)?.title === activeSub;
                return (
                  <div
                    key={m.id}
                    onClick={() => scrollToSection(m.id)}
                    className={[
                      "absolute left-0 w-full rounded-sm px-1",
                      "overflow-hidden text-[9px] leading-[1.05rem] font-inter tracking-wide",
                      "transition-colors duration-200",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/15",
                    ].join(" ")}
                    style={{ top: m.top, height: m.height }}
                  >
                    <div className="truncate uppercase">
                      {m.id.replace(/-/g, " ")}
                    </div>
                  </div>
                );
              })}
              <div
                className="absolute left-0 right-0 pointer-events-none rounded-sm border border-white/80"
                style={{
                  top: viewportMini.top,
                  height: viewportMini.height,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.28)",
                }}
              />
            </div>
            <p className="mt-3 text-[11px] text-white/40 leading-snug hidden lg:block">
              Click map to jump. Box = current view.
            </p>
          </div>
        </aside>

        {/* ---------- RIGHT: Full Content Sections ---------- */}
        <main ref={contentWrapRef} className="space-y-40">
          {SECTIONS.map((s) => (
            <section
              key={s.id}
              id={s.id}
              ref={setSectionRef(s.id)}
              className="scroll-mt-28"
              aria-labelledby={`${s.id}-title`}
            >
              <header className="mb-6">
                <h3
                  id={`${s.id}-title`}
                  className="text-2xl md:text-3xl font-poiret tracking-wide"
                >
                  {s.title}
                </h3>
                <div className="mt-2 h-[2px] w-24 bg-white/30 rounded-full" />
              </header>
              <div className="space-y-5 max-w-prose leading-relaxed text-white/80 font-inter text-[15px] md:text-base">
                {s.content.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
};

export default AboutSection;
