import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: '数独（ナンプレ）自動解答ツール - 手動入力で即解決',
  description: '数独（ナンプレ）の問題を手動で入力して、自動で解答を表示する無料Webアプリ。スマホ・PC対応、インストール不要ですぐ使えます。',
  keywords: ['数独', 'ナンプレ', '自動解答', 'Webアプリ', '無料', 'スマホ対応'],
  openGraph: {
    title: '数独（ナンプレ）自動解答ツール',
    description: '数独（ナンプレ）を手動入力して即解答！スマホでも使える無料Webアプリ。',
    url: 'https://sudoku-solver.xyz',
    siteName: '数独 自動解答ツール',
    locale: 'ja_JP',
    type: 'website',
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_AD_CLIENT || ''}
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
