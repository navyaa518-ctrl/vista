import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { RoleProvider } from '@/context/RoleContext';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RoleProvider>
        <Component {...pageProps} />
      </RoleProvider>
    </AuthProvider>
  );
}
