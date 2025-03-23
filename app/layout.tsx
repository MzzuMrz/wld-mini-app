import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import dynamic from "next/dynamic";
import NextAuthProvider from "@/components/next-auth-provider";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import { VotingProvider } from "@/context/VotingContext";
import { RealtimeProvider } from "@/context/RealtimeContext";

const sora = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "World ID Voting App",
  description: "Create and vote on polls securely with World ID verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ErudaProvider = dynamic(
    () => import("../components/Eruda").then((c) => c.ErudaProvider),
    {
      ssr: false,
    }
  );
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital@0;1&family=Rubik:ital,wght@0,300..900;1,300..900&family=Sora:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${sora.className} dark:bg-black dark:text-white`}>
        <NextAuthProvider>
          <ErudaProvider>
            <MiniKitProvider>
              <RealtimeProvider>
                <VotingProvider>
                  {children}
                </VotingProvider>
              </RealtimeProvider>
            </MiniKitProvider>
          </ErudaProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}