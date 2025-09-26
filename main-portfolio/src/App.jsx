import React, { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import TopographyBackground from "./components/TopographyBackground.jsx";
import SideNav from "./components/SideNav.jsx";
import HomeSection from "./sections/HomeSection.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import AboutSection from "./sections/AboutSection.jsx";

const sections = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" }, // moved up
  { id: "about", label: "About Me" }, // now after projects
  { id: "contact", label: "Contact" },
];

const App = () => {
  const [activeId, setActiveId] = useState("home");
  const [navOpen, setNavOpen] = useState(true);
  const [activeSubLabel, setActiveSubLabel] = useState(null);
  const lenisRef = useRef(null);

  // Map section id -> label (for header)
  const sectionLabelMap = sections.reduce((acc, s) => {
    acc[s.id] = s.label;
    return acc;
  }, {});

  // Init Lenis once
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      smoothTouch: false,
    });
    lenisRef.current = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Track active section using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px", // a bit larger than 50% band
        threshold: 0.1,
      }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavigate = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Optimistically set active so the arrow points to the next target right away
    setActiveId(id);

    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, {
        offset: 0,
        duration: 1.1,
        // Ensure state is correct after the smooth scroll finishes
        onComplete: () => setActiveId(id),
      });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
      // Fallback: update state (no onComplete in native smooth scroll)
      setActiveId(id);
    }
  };

  // Compute the next section id from the current activeId
  const getNextId = (current) => {
    const idx = sections.findIndex((s) => s.id === current);
    return idx >= 0 && idx < sections.length - 1 ? sections[idx + 1].id : null;
  };
  const nextId = getNextId(activeId);

  // NEW: compute previous section id
  const getPrevId = (current) => {
    const idx = sections.findIndex((s) => s.id === current);
    return idx > 0 ? sections[idx - 1].id : null;
  };
  const prevId = getPrevId(activeId);

  return (
    <main className="relative">
      <TopographyBackground />

      {/* Morphing global header only off home */}
      {activeId !== "home" && (
        <SiteHeader
          activeSection={activeId}
          sectionLabels={sectionLabelMap}
          activeSubLabel={activeSubLabel}
        />
      )}

      {/* Right-side collapsible nav */}
      <SideNav
        sections={sections} // side nav now reflects new order
        activeId={activeId}
        open={navOpen}
        onToggle={() => setNavOpen((v) => !v)}
        onNavigate={handleNavigate}
      />

      {/* Bottom navigation arrows (side by side, each centers when alone) */}
      {(prevId || nextId) && (
        <div
          className="
            fixed bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-20
            flex items-center justify-center gap-8
          "
        >
          {/* Prev (Up) Arrow */}
          <button
            type="button"
            onClick={() => prevId && handleNavigate(prevId)}
            className={`
              h-16 w-16 md:h-20 md:w-20 grid place-items-center
              text-4xl md:text-5xl leading-none select-none
              transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                prevId
                  ? "opacity-80 scale-100 translate-y-0 text-white/80 hover:text-white pointer-events-auto"
                  : "opacity-0 scale-75 translate-y-2 pointer-events-none"
              }
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              hover:scale-110
            `}
            aria-label="Previous section"
            title="Previous"
          >
            <span>▴</span>
          </button>

          {/* Next (Down) Arrow */}
          <button
            type="button"
            onClick={() => nextId && handleNavigate(nextId)}
            className={`
              h-16 w-16 md:h-20 md:w-20 grid place-items-center
              text-4xl md:text-5xl leading-none select-none
              transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                nextId
                  ? "opacity-80 scale-100 translate-y-0 text-white/80 hover:text-white pointer-events-auto"
                  : "opacity-0 scale-75 -translate-y-2 pointer-events-none"
              }
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
              hover:scale-110
            `}
            aria-label="Next section"
            title="Next"
          >
            <span>▾</span>
          </button>
        </div>
      )}

      {/* Page sections (full-height stack) */}
      <section id="home" className="min-h-screen">
        {/* Removed arrow from HomeSection; no props needed */}
        <HomeSection />
      </section>

      <section
        id="projects"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-white/70">Projects (placeholder)</div>
      </section>

      <section
        id="about"
        className="min-h-screen flex items-start justify-center"
      >
        <AboutSection onActiveSubChange={setActiveSubLabel} />
      </section>
      <section
        id="contact"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-white/70">Contact (placeholder)</div>
      </section>
    </main>
  );
};

export default App;
