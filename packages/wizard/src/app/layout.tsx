import "../styles/tokens.css";
import "../styles/wizard.css";

export const metadata = {
  title: "ATLAS-Fractal",
  description: "AI-Native Agent Configuration Engine with Structural NPV",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-skin="luminous">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
