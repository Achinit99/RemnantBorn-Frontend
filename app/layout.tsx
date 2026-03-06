import type { Metadata } from 'next'
import { Cinzel, Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({ 
  subsets: ["latin"],
  variable: '--font-cinzel',
  weight: ['400', '500', '600', '700']
});

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic']
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: 'Remnantborn: The Last Tear',
  description: 'Fight the remnants, awaken your true power',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
