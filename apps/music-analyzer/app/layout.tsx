import type { Metadata } from "next";
import "@bridge-tools/bridge-ui/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Music Analyzer | Bridge.audio",
  description:
    "Upload a track and let Bridge.audio analyze its genre, mood, vocals, language, instruments, movement, sound, lyrics and more.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
