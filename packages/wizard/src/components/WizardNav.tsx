"use client";

import Link from "next/link";

interface WizardNavProps {
  currentStage: string;
  completedStages: string[];
}

const STAGES = [
  { id: "intake", label: "Intake", href: "/wizard/intake" },
  { id: "processes", label: "Processes", href: "/wizard/processes" },
  { id: "design", label: "Design", href: "/wizard/design" },
  { id: "configure", label: "Configure", href: "/wizard/configure" },
  { id: "export", label: "Export", href: "/wizard/export" },
];

export default function WizardNav({ currentStage, completedStages }: WizardNavProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <nav className="wizard-sidebar">
      <div className="wizard-sidebar__title">ATLAS-Fractal</div>
      <ul className="wizard-nav">
        {STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isCompleted = completedStages.includes(stage.id);
          const isDisabled = !isActive && !isCompleted && idx > currentIndex;

          const classes = [
            "wizard-nav__link",
            isActive && "wizard-nav__link--active",
            isCompleted && !isActive && "wizard-nav__link--completed",
            isDisabled && "wizard-nav__link--disabled",
          ]
            .filter(Boolean)
            .join(" ");

          if (isDisabled) {
            return (
              <li key={stage.id} className="wizard-nav__item">
                <span className={classes}>
                  <span className="wizard-nav__number">{idx + 1}</span>
                  {stage.label}
                </span>
              </li>
            );
          }

          return (
            <li key={stage.id} className="wizard-nav__item">
              <Link href={stage.href} className={classes}>
                <span className="wizard-nav__number">
                  {isCompleted && !isActive ? "\u2713" : idx + 1}
                </span>
                {stage.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
