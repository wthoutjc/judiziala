import type { Metadata } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Judiziala — Monitor inteligente de procesos judiciales",
    template: "%s — Judiziala",
  },
  description:
    "Monitorea automáticamente tus procesos judiciales colombianos. Alertas en tiempo real y resúmenes con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
