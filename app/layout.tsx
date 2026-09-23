import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";
export const metadata: Metadata = { title: { default: "SnowSeasonsTech | AI Infrastructure & Software Engineering", template: "%s | SnowSeasonsTech" }, description: "Secure AI infrastructure, software engineering, automation, and architecture by Eric Brooks.", metadataBase: new URL("https://snowseasonstech.com"), icons: { icon: "/favicon.svg" },
  openGraph: { title: "SnowSeasonsTech", description: "Build it right. Secure it right. Scale it right.", type: "website" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>; }
