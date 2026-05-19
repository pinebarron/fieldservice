import type { Metadata, Viewport } from 'next';
import './globals.css';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { OfflineProvider } from '@/components/OfflineProvider';

export const metadata: Metadata = {
  title: 'Field Capture',
  description: 'Professional work log management for field service teams',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Field Capture',
  },
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <OfflineProvider>
          <OfflineIndicator />
          <UpdatePrompt />
          {children}
        </OfflineProvider>
      </body>
    </html>
  );
}
