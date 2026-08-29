import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat – AI Chat",
  description: "A polished AI chat interface built with Next.js and shadcn/ui.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        geistSans.variable,
        geistMono.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground ring-3 ring-ring/50 hover:bg-accent hover:text-accent-foreground focus-visible:not-sr-only focus-visible:fixed focus-visible:top-[calc(0.75rem+env(safe-area-inset-top))] focus-visible:left-[calc(0.75rem+env(safe-area-inset-left))] focus-visible:z-50"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
