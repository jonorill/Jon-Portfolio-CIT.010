import React, { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import TopographyBackground from "./components/TopographyBackground.jsx";
import SideNav from "./components/SideNav.jsx";
import HomeSection from "./sections/HomeSection.jsx";

const sections = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Me" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

const App = () => {
  const [activeId, setActiveId] = useState("home");
  const [navOpen, setNavOpen] = useState(true);
  const lenisRef = useRef(null);

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

  return (
    <main className="relative">
      <TopographyBackground />

      {/* Right-side collapsible nav */}
      <SideNav
        sections={sections}
        activeId={activeId}
        open={navOpen}
        onToggle={() => setNavOpen((v) => !v)}
        onNavigate={handleNavigate}
      />

      {/* Bottom-center arrow (matches SideNav style). Hidden on last section */}
      {nextId && (
        <button
          type="button"
          onClick={() => handleNavigate(nextId)}
          className="
            fixed bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-20
            h-16 w-16 md:h-20 md:w-20
            grid place-items-center
            text-white/80 hover:text-white
            text-4xl md:text-5xl
            transition-transform duration-200 hover:scale-110
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
            select-none
          "
          aria-label="Scroll to next section"
          title="Next"
        >
          <span className="leading-none">▾</span>
        </button>
      )}

      {/* Page sections (full-height stack) */}
      <section id="home" className="min-h-screen">
        {/* Removed arrow from HomeSection; no props needed */}
        <HomeSection />
      </section>

      {/* Stubs for future sections */}
      <section
        id="about"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-white/70">About Me (placeholder)</div>
      </section>
      <section
        id="projects"
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-white/70">Projects (placeholder)</div>
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
