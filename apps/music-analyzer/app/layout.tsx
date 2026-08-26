import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Music Analyzer | Bridge.audio",
  description:
    "Upload a track and let Bridge analyze its genre, mood, vocals, instruments, movement, lyrics and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
