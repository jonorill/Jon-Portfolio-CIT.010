import React, { useRef, useEffect, useState, useCallback } from "react";

/* ---------- Section Data (EDIT CONTENT HERE) ---------- */
const SECTIONS = [
  {
    id: "who-i-am",
    title: "Who I Am",
    preview: "Brief snapshot about you and your focus as a developer.",
    content: [
      [
        "I’m a student full‑stack developer eager to keep learning and growing.",
        "I value clean, organized, and well‑planned development processes.",
      ],
      [
        "My approach centers on clarity, code quality, and maintainability.",
        "That means projects are not only built with solid code, but also structured for long‑term success.",
      ],
      [
        "Outside pure coding, I focus on architecture decisions and developer experience.",
        "I stay invested in continuously improving the overall workflow.",
      ],
    ],
  },
  {
    id: "my-stack",
    title: "My Stack",
    preview: "Core languages, frameworks, tools, and areas of focus.",
    content: [
      [
        "Core Languages: JavaScript / TypeScript, Python, C++, Java.",
        "Frameworks & Libraries: React, Node.js / Express, Tailwind CSS, GSAP, Jest / Vitest.",
      ],
      [
        "Databases & Infra: PostgreSQL, MongoDB, basic Docker usage, REST API design.",
        "Practices: Modular architecture, accessibility considerations, performance awareness.",
      ],
      [
        "I emphasize readable commits, iterative refactor, and a collaborative development process.",
      ],
    ],
  },
];

/* ---------- Component ---------- */
const AboutSection = ({ onActiveSubChange }) => {
  const [activeId, setActiveId] = useState(null);
  const sectionRefs = useRef({});
  const observerRef = useRef(null);

  const setSectionRef = useCallback(
    (id) => (el) => {
      if (el) {
        sectionRefs.current[id] = el;
      } else {
        delete sectionRefs.current[id];
      }
    },
    []
  );

  const handleShortcutClick = useCallback((id) => {
    const target = sectionRefs.current[id];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!onActiveSubChange) return;
    if (!activeId) {
      onActiveSubChange(null);
      return;
    }
    const match = SECTIONS.find((s) => s.id === activeId);
    onActiveSubChange(match ? match.title : null);
  }, [activeId, onActiveSubChange]);

  useEffect(() => {
    const elements = Object.values(sectionRefs.current);
    if (!elements.length) return;

    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (topEntry) {
          const nextId = topEntry.target.dataset.sectionId;
          setActiveId((prev) => (prev === nextId ? prev : nextId));
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.25, 0.5, 0.75],
      }
    );

    elements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [SECTIONS.length]);

  useEffect(() => {
    return () => {
      if (onActiveSubChange) onActiveSubChange(null);
      observerRef.current?.disconnect();
    };
  }, [onActiveSubChange]);

  return (
    <section className="relative px-6 md:px-12 lg:px-24 py-24 text-white">
      <div className="mx-auto max-w-6xl md:flex md:gap-16 lg:gap-20">
        <aside className="hidden md:block w-56 lg:w-64">
          <div className="sticky top-32 space-y-5 text-left">
            <span className="block text-[11px] tracking-[0.4em] uppercase text-white/40 font-inter">
              Shortcuts
            </span>
            <div className="space-y-3">
              {SECTIONS.map((section) => {
                const isActive = section.id === activeId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleShortcutClick(section.id)}
                    className={[
                      "group w-full text-left",
                      "px-3 py-2 rounded-md transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/65 hover:text-white hover:bg-white/5",
                    ].join(" ")}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="block font-inter text-sm tracking-[0.25em] uppercase">
                      {section.title}
                    </span>
                    {section.preview && (
                      <span className="mt-1 block text-xs font-inter font-normal text-white/45 leading-snug">
                        {section.preview}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="max-w-3xl space-y-40 text-left">
            {SECTIONS.map((section) => (
              <article
                key={section.id}
                id={section.id}
                data-section-id={section.id}
                ref={setSectionRef(section.id)}
                className="scroll-mt-28"
                aria-labelledby={`${section.id}-title`}
              >
                <header className="mb-8">
                  <h3
                    id={`${section.id}-title`}
                    className="text-[40px] font-inter tracking-wide"
                  >
                    {section.title}
                  </h3>
                  <div className="mt-3 h-[2px] w-24 bg-white/40 rounded-full" />
                </header>

                <div className="space-y-8 leading-relaxed text-white/80 font-inter font-normal text-[30px]">
                  {section.content.map((paragraph, index) => (
                    <div key={index} className="flex flex-col gap-4">
                      {paragraph.map((chunk, spanIndex) => (
                        <AnimatedSpan key={spanIndex} delayIndex={spanIndex}>
                          {chunk}
                        </AnimatedSpan>
                      ))}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const AnimatedSpan = ({ children, delayIndex = 0 }) => {
  const spanRef = useRef(null);
  const scrollMetaRef = useRef({
    lastY: typeof window !== "undefined" ? window.scrollY : 0,
    direction: "down",
  });

  const HIDE_THRESHOLD = 80;
  const ENTER_DELAY = Math.min(delayIndex * 0.08, 0.4);

  useEffect(() => {
    const node = spanRef.current;
    if (!node || typeof window === "undefined") return;

    let rafId = null;

    const update = () => {
      rafId = null;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 0;
      const { direction } = scrollMetaRef.current;

      const isAboveViewport = rect.bottom <= 0;
      const isBelowViewport = rect.top >= viewportHeight;

      if (isAboveViewport || isBelowViewport) {
        node.style.transitionDelay = "0s";
        node.classList.remove("about-span--in", "about-span--leaving-top");
        return;
      }

      if (rect.top <= HIDE_THRESHOLD && direction === "up") {
        node.style.transitionDelay = "0s";
        node.classList.remove("about-span--in");
        node.classList.add("about-span--leaving-top");
        return;
      }

      node.style.transitionDelay = `${ENTER_DELAY}s`;
      node.classList.add("about-span--in");
      node.classList.remove("about-span--leaving-top");
    };

    const schedule = () => {
      const currentY = window.scrollY;
      const delta = currentY - scrollMetaRef.current.lastY;

      if (Math.abs(delta) > 1) {
        scrollMetaRef.current.direction = delta > 0 ? "down" : "up";
        scrollMetaRef.current.lastY = currentY;
      }

      if (rafId === null) {
        rafId = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ENTER_DELAY, HIDE_THRESHOLD]);

  return (
    <span ref={spanRef} className="about-span">
      {children}
    </span>
  );
};

export default AboutSection;
