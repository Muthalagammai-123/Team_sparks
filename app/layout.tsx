import type { Metadata } from 'next'
import './globals.css'
import { WorkflowProvider } from '../components/WorkflowContext'

export const metadata: Metadata = {
  title: 'NegotiateX - AI-Powered Smart Contract Negotiation',
  description: 'Dynamic, fair, and transparent delivery agreements powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <WorkflowProvider>
          {children}
        </WorkflowProvider>
      </body>
    </html>
  )
}