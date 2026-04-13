import type { Metadata } from "next";
import { Oxanium, Fira_Code, Merriweather } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const oxanium = Oxanium({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const merriweather = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Club — Student Org Management",
    template: "%s | Club",
  },
  description:
    "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    siteName: "Club",
    title: "Club — Student Org Management",
    description:
      "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Club — Student Org Management",
    description:
      "Modular platform for student-led organisations to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${oxanium.variable} ${firaCode.variable} ${merriweather.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
