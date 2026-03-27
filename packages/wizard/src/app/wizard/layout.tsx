import WizardNav from "../../components/WizardNav";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="t-shell">
      <WizardNav />
      <main className="t-shell__main">{children}</main>
    </div>
  );
}
