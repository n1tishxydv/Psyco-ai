import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-midnightNavy text-primaryText transition-colors duration-200">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
