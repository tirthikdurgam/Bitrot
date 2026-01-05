import type { Metadata } from "next";
// 1. Import all fonts (Classic + New Industrial ones)
import { Montserrat, Inter, Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

// --- EXISTING FONTS (For Landing Page/UI) ---
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// --- NEW FONTS (For Industrial Feed Cards) ---
const rajdhani = Rajdhani({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const shareTech = Share_Tech_Mono({ 
  subsets: ["latin"], 
  weight: ["400"],
  variable: "--font-share-tech",
  display: "swap",
});

// 2. Site Metadata
export const metadata: Metadata = {
  title: "BitRot", 
  description: "Digital Decay Experiment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Inject ALL font variables into the HTML tag
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${rajdhani.variable} ${shareTech.variable}`}>
      <body className="font-montserrat antialiased bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black">
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}