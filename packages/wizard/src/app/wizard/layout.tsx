import WizardNav from "../../components/WizardNav";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wizard-layout">
      <WizardNav currentStage="intake" completedStages={[]} />
      <main className="wizard-main">{children}</main>
    </div>
  );
}
