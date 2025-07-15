import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Profile Readme Generator',
  description: 'Profile Readme Generator is a tool that helps you create a professional and engaging GitHub profile readme.',

}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
return (
    <html lang="en">
      <head>
        {/* Favicon and icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#2b5797" />
        <meta name="theme-color" content="#22223b" />
        {/* Add more icons below if present in public folder */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-icon-512x512.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
