import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FactoryProvider } from '@/context/FactoryContext'

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Industry Management System",
  description: "Centralized operations dashboard for managing employees, payroll, expenses, and more.",
  keywords: ["industry management", "employee management", "payroll", "expense tracking"],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <FactoryProvider>
          {children}
        </FactoryProvider>
      </body>
    </html>
  );
}
