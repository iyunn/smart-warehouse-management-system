import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionContext";
import { ThemeProvider } from "@/components/ThemeContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SmartWMS — Smart Asset Monitoring & Reconciliation",
  description: "Smart Asset Monitoring and Reconciliation System berbasis cloud",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-flash: apply tema dari localStorage cache sebelum React mount.
            DB tetap sumber kebenaran (di-sync oleh ThemeProvider setelah login). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('swms-theme');if(t!=='light')t='dark';document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)]">
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
