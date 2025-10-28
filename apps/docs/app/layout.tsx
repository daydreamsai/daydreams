import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import { Metadata } from "next";
import { Inter, Open_Sans, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const jetbrainsMono = Open_Sans({
  subsets: ["latin"],
  variable: "--font-mono",
});

const space_grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  description:
    "Daydreams is a powerful framework for building generative agents that can execute tasks across any blockchain or API.",
  metadataBase: new URL("https://daydreams.systems"),
  keywords: ["Daydreams", "agents"],
  generator: "Next.js",
  applicationName: "Daydreams",
  appleWebApp: {
    title: "Daydreams",
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "16x16" }],
  },
  title: {
    default: "Daydreams | Generative Agents",
    template: "%s | Daydreams",
  },
  openGraph: {
    url: "./",
    siteName: "Daydreams",
    locale: "en_US",
    type: "website",
  },
  other: {
    "msapplication-TileColor": "#fff",
  },
  twitter: {
    site: "https://daydreams.systems",
  },
  alternates: {
    canonical: "./",
  },
};

export default function Layout({ children }: { children: any }) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${jetbrainsMono.variable} ${space_grotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
