import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'BangMe – Creator Content Platform',
  description: 'A modern content platform to connect, create, and share with your audience.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="bg-brand-dark text-brand-text font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
