import {
  standardYMInitParameters,
  YandexMetricaProvider,
} from '@artginzburg/next-ym';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import type {ReactNode} from 'react';
import {ThemeProvider} from '@/components/providers/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Spine Studio — Viewer & Debugger',
  description:
    'A local-first Spine animation viewer and debugger for Spine 3.8 and 4.2/4.3 exports.',
};

const yandexMetricaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRICA_ID);

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full overflow-hidden antialiased">
        <YandexMetricaProvider
          tagID={Number.isFinite(yandexMetricaId) ? yandexMetricaId : undefined}
          initParameters={standardYMInitParameters}>
          <ThemeProvider>{children}</ThemeProvider>
        </YandexMetricaProvider>
      </body>
    </html>
  );
}
