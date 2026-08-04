import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import { PlayerProvider } from "./components/PlayerContext";
import PlayerBar from "./components/PlayerBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Anime Ranking",
  description: "Rank anime and anime opening themes, pooled from every vote.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PlayerProvider>
          <NavBar />
          {children}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
