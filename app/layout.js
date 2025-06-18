import { Geist, Geist_Mono } from "next/font/google";
import ThemeProviderWrapper from "./ThemeProvider";
import "./globals.css";
import { icons } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'DrawSync | Create Together, Draw in Real-Time',
  description: 'Create, share and collaborate on digital drawings in real-time. Intuitive tools for sketching, designing, and visual communication.',
  keywords: ['drawing app', 'collaborative drawing', 'digital sketching', 'real-time illustration'],
  openGraph: {
    title: 'DrawSync | Create Together, Draw in Real-Time',
    description: 'Create, share and collaborate on digital drawings in real-time',
    type: 'website',
    url: 'https://drawsync.app',
    siteName: 'DrawSync',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DrawSync | Create Together, Draw in Real-Time',
    description: 'Create, share and collaborate on digital drawings in real-time',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
  icon: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/drawsync-icon.png', type: 'image/png' }
  ]
}
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
         <ThemeProviderWrapper>
        {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
