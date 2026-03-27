"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import SkinSwitcher from "./SkinSwitcher";

const STAGES = [
  { id: "intake", label: "Intake", href: "/wizard/intake" },
  { id: "processes", label: "Processes", href: "/wizard/processes" },
  { id: "design", label: "Design", href: "/wizard/design" },
  { id: "configure", label: "Configure", href: "/wizard/configure" },
  { id: "export", label: "Export", href: "/wizard/export" },
];

const COMPLETED_KEY = "atlas-fractal-completed-stages";

export default function WizardNav() {
  const pathname = usePathname();
  const currentStage = STAGES.find(s => pathname.includes(s.id))?.id || "intake";
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(COMPLETED_KEY);
    if (saved) setCompletedStages(JSON.parse(saved));
  }, []);

  // Mark previous stages as completed when navigating forward
  useEffect(() => {
    const currentIdx = STAGES.findIndex(s => s.id === currentStage);
    const newCompleted = STAGES.slice(0, currentIdx).map(s => s.id);
    const merged = [...new Set([...completedStages, ...newCompleted])];
    if (merged.length !== completedStages.length) {
      setCompletedStages(merged);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(merged));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);

  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <nav className="t-shell__sidebar">
      <div className="o-nav__title">ATLAS-Fractal</div>
      <ul className="o-nav">
        {STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isCompleted = completedStages.includes(stage.id);
          const isDisabled = !isActive && !isCompleted && idx > currentIndex;

          const classes = [
            "o-nav__link",
            isActive && "o-nav__link--active",
            isCompleted && !isActive && "o-nav__link--done",
            isDisabled && "o-nav__link--disabled",
          ].filter(Boolean).join(" ");

          if (isDisabled) {
            return (
              <li key={stage.id} className="o-nav__item">
                <span className={classes}>
                  <span className="o-nav__step">{idx + 1}</span>
                  {stage.label}
                </span>
              </li>
            );
          }

          return (
            <li key={stage.id} className="o-nav__item">
              <Link href={stage.href} className={classes}>
                <span className="o-nav__step">
                  {isCompleted && !isActive ? "\u2713" : idx + 1}
                </span>
                {stage.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <SkinSwitcher />
    </nav>
  );
}
