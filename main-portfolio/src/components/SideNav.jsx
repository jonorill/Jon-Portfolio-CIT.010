import React from "react";

const SideNav = ({ sections, activeId, onNavigate, open, onToggle }) => {
  return (
    <aside
      className={[
        "fixed right-0 top-1/2 -translate-y-1/2 z-20",
        "transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-[calc(100%-3rem)]",
      ].join(" ")}
    >
      <div className="relative w-56 px-6 py-6 bg-transparent">
        {/* Toggle arrow (bigger, no tab) */}
        <button
          type="button"
          onClick={onToggle}
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full",
            "h-12 w-12 grid place-items-center",
            "text-white/80 hover:text-white text-3xl",
            "transition-transform duration-200 hover:scale-110",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
          ].join(" ")}
          aria-label={open ? "Hide navigation" : "Show navigation"}
          aria-expanded={open}
          title={open ? "Hide" : "Show"}
        >
          <span
            className={[
              "inline-block select-none transition-transform duration-300",
              open ? "rotate-180" : "",
            ].join(" ")}
          >
            ▸
          </span>
        </button>

        {/* Links */}
        <nav className="flex flex-col gap-3 text-right">
          {sections.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className={[
                  "group relative inline-flex items-center justify-end",
                  "transition-transform duration-150 will-change-transform",
                  "hover:scale-110",
                  // underline only on hover, right-aligned
                  "after:absolute after:right-0 after:-bottom-1",
                  "after:h-[2px] after:bg-white/80 after:w-0 hover:after:w-full",
                  "after:transition-[width] after:duration-200 after:content-['']",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={[
                    "uppercase tracking-wide font-medium",
                    "text-sm md:text-base lg:text-lg",
                    // Smooth color/opacity transitions (separate from transform)
                    "transition-colors transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
                      ? "text-white opacity-100"
                      : "text-white/50 group-hover:text-white/90",
                  ].join(" ")}
                >
                  {s.label.toUpperCase()}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default SideNav;
