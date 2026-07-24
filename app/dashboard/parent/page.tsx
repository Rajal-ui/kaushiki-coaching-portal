'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ParentDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/parent/overview');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
