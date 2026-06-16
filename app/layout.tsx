import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { OfflineProvider } from '@/components/OfflineProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Crewatt',
  description: 'Professional work log management for solar field service teams',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Crewatt',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#2d5a3d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />
        <link rel="apple-touch-icon" href="/icons/crewatt-mark.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/crewatt-logo-primary.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ErrorBoundary>
          <OfflineProvider>
            <OfflineIndicator />
            <UpdatePrompt />
            {children}
          </OfflineProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
