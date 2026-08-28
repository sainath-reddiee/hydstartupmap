import type { Metadata } from "next";
import { Manrope, Space_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HydTechPulse 3D — Hyderabad Tech Ecosystem",
  description: "Discover Hyderabad startups, jobs, events and after-hours tech spaces in a living 3D city grid.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${manrope.variable} ${spaceMono.variable}`}>{children}</body></html>;
}
