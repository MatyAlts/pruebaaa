import "bootstrap/dist/css/bootstrap.min.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./buttons.css";
import "./../landing/landing-style.css";
import Provider from "@/user-dashboard/utils/Provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://misaluteca.com"),
  title: "Mi Saluteca - Tu historial médico, siempre contigo",
  description: "Gestiona tu salud y la de tu familia de forma segura y privada",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/saludchiquito_ojbsip.png",
  },
  openGraph: {
    title: "Mi Saluteca",
    description: "Gestiona tu salud y la de tu familia de forma segura y privada",
    url: "https://misaluteca.com/",
    siteName: "Mi Saluteca",
    type: "website",
    images: [
      {
        url: "https://misaluteca.com/preview.jpg",
        width: 1200,
        height: 630,
        alt: "Mi Saluteca Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mi Saluteca",
    description: "Gestiona tu salud y la de tu familia de forma segura y privada",
    images: ["https://misaluteca.com/preview.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className} suppressHydrationWarning>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
