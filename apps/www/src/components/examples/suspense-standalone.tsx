import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuspenseMonthExample } from './suspense-month';

export function StandaloneSuspenseMonth() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SuspenseMonthExample />
    </QueryClientProvider>
  );
}
