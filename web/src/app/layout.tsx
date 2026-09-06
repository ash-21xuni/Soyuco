import type { Metadata } from "next";
import { AuthProvider } from "@/lib/supabase/auth-context";
import "./themes.css";

export const metadata: Metadata = {
  title: "Soyuco — The Private Sanctuary",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Mono:wght@300;400;500&family=Caveat:wght@400;600&family=Space+Grotesk:wght@300;400;600&family=Syne:wght@400;700;800&family=EB+Garamond:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@300;400&family=Bangers&family=Pacifico&family=Press+Start+2P&family=Satisfy&family=Fredoka+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
