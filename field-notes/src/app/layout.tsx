import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Field Notes from the In-Between — Kris Puckett",
  description:
    "What happens when a designer stops waiting for permission and starts building. A 3,000-word essay on craft, AI, and the space between knowing and doing.",
  openGraph: {
    title: "Field Notes from the In-Between",
    description:
      "What happens when a designer stops waiting for permission and starts building.",
    type: "article",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || theme === 'light') {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
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
