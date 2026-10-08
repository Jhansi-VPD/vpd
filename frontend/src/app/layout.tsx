import type { Metadata } from "next";
import "./globals.css";
import GlobalProviders from './GlobalProviders';

export const metadata: Metadata = {
  title: "VPD Technologies | Transforming Businesses Through Intelligent Digital Solutions",
  description: "VPD Technologies is a global engineering powerhouse driving digital transformation through AI, cloud, and secure-by-design enterprise software.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface dark:bg-dark-surface text-ink dark:text-dark-ink font-body antialiased overflow-x-hidden">
        <div id="root"><GlobalProviders>{children}</GlobalProviders></div>
      </body>
    </html>
  );
}

