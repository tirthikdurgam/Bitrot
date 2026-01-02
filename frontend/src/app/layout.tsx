import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

// 1. Load Google Fonts (Montserrat for headings, Inter for UI)
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
  title: "BitRot", 
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Inject variables into the HTML tag
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="font-montserrat antialiased bg-[#050505] text-white overflow-x-hidden selection:bg-white selection:text-black">
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}