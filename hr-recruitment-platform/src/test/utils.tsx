/**
 * Test Utilities
 * 
 * Common utilities for testing React components with React Query
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a fresh QueryClient for each test
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component with providers
interface WrapperProps {
  children: React.ReactNode;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
