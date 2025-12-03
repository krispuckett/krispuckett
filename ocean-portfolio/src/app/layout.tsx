import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kris Puckett — Design Leader",
  description: "World's most optimistic design leader. I grow thriving design teams through craft and coaching.",
  openGraph: {
    title: "Kris Puckett — Design Leader",
    description: "World's most optimistic design leader. I grow thriving design teams through craft and coaching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased bg-abyss text-white overflow-x-hidden">
        {/* Built with Claude Code. Design + development by Kris Puckett. */}
        <div
          data-credit="Built with Claude Code. Design + development by Kris Puckett."
          hidden
          aria-hidden="true"
        />
        {children}
      </body>
    </html>
  );
}
