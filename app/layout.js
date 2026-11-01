export const metadata = {
  title: 'Login & Session Token App',
  description: 'Next.js app demonstrating session token generation',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}