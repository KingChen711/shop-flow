import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShopFlow Admin',
  description: 'ShopFlow Admin Dashboard - Manage your e-commerce platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-64">{children}</main>
        </div>
      </body>
    </html>
  );
}
