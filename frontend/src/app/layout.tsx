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
// 2. Site Metadata
export const metadata: Metadata = {
  title: "BitLoss", 
  description: "Digital Decay Experiment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Inject ALL font variables into the HTML tag
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="font-montserrat antialiased bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black">
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}