export const metadata = {
  title: "ATLAS-Fractal Wizard",
  description: "AI-native fractal agent configuration engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
