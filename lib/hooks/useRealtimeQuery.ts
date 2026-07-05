'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export function useRealtimeQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> & { pollInterval?: number }
) {
  const interval = options?.pollInterval ?? 30_000;
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: interval,
    refetchIntervalInBackground: false,
    staleTime: Math.max(interval - 5_000, 5_000),
    ...options,
  });
}
