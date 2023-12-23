import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

export function Root() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>
  );
}
