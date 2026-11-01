import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ErrorBoundary } from '../common/ErrorBoundary';

export function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-psyco-deepNavy text-psyco-softGrey">
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
