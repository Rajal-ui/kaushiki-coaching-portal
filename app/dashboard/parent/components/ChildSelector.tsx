'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, GraduationCap } from 'lucide-react';

interface StudentInfo {
  id: string;
  name: string;
  phone: string;
}

interface Link {
  id: string;
  status: string;
  student: StudentInfo;
}

interface UseParentChildReturn {
  links: Link[];
  selectedChild: string;
  setSelectedChild: (id: string) => void;
  loading: boolean;
}

export function useParentChild(): UseParentChildReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedChild = searchParams.get('child') || '';

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/links', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const approved: Link[] = (data.data ?? []).filter((l: Link) => l.status === 'APPROVED');
          setLinks(approved);
          if (approved.length > 0 && !searchParams.get('child')) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('child', approved[0].student.id);
            router.replace(`?${params.toString()}`);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const setSelectedChild = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('child', id);
    router.push(`?${params.toString()}`);
  };

  return { links, selectedChild, setSelectedChild, loading };
}

export function ChildSelector({ links, selectedChild, onSelect }: { links: Link[]; selectedChild: string; onSelect: (id: string) => void }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {links.map(link => (
        <button
          key={link.student.id}
          onClick={() => onSelect(link.student.id)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedChild === link.student.id
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          {link.student.name}
        </button>
      ))}
    </div>
  );
}
