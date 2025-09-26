import React from "react";

/* ---------- Component Props ----------
sections : [{ id, label }]
activeId : id of current section
onNavigate(id) : callback to scroll / switch
open : boolean (panel expanded)
onToggle() : open/close trigger
--------------------------------------- */

const SideNav = ({ sections, activeId, onNavigate, open, onToggle }) => {
  /* ---------- Derived Classes / Helpers ---------- */
  const containerTranslate = open
    ? "translate-x-0"
    : "translate-x-[calc(100%-4.25rem)] md:translate-x-[calc(100%-2rem)]";

  return (
    <aside
      aria-label="Section Navigation"
      className={[
        "fixed right-0 top-1/2 -translate-y-1/2 z-20",
        "transition-transform duration-300",
        containerTranslate,
      ].join(" ")}
    >
      <div className="relative w-fit min-w-[9rem] pl-0 pt-6 pr-3 pb-6 bg-transparent">
        {/* ---------- Toggle Button ---------- */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Hide navigation" : "Show navigation"}
          aria-expanded={open}
          title={open ? "Hide" : "Show"}
          className={[
            "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full",
            "h-16 w-16 md:h-20 md:w-20 grid place-items-center",
            "text-white/80 hover:text-white",
            "text-4xl md:text-5xl leading-none",
            "transition-transform duration-200 hover:scale-110",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
            "select-none",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block select-none transition-transform duration-300",
              open ? "" : "rotate-180",
            ].join(" ")}
          >
            ▸
          </span>
        </button>

        {/* ---------- Navigation Links ---------- */}
        <nav className="flex flex-col gap-3 text-right" role="navigation">
          {sections.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className={[
                  "group relative inline-flex items-center justify-end",
                  "transition-transform duration-150 will-change-transform",
                  "hover:scale-110 focus:outline-none",
                  "after:absolute after:right-0 after:-bottom-1",
                  "after:h-[2px] after:bg-white/80 after:w-0 group-hover:after:w-full",
                  "after:transition-[width] after:duration-200 after:content-['']",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={[
                    "uppercase tracking-wide font-medium",
                    "text-sm md:text-base lg:text-lg",
                    "transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
                      ? "text-white opacity-100"
                      : "text-white/70 group-hover:text-white",
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
