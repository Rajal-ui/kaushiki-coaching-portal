'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  FileText, Download, Search, Loader2, BookOpen, Filter,
  ExternalLink, GraduationCap, Calendar
} from 'lucide-react';
import type { Resource, ResourceType } from '@/types';

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: 'NOTES', label: 'Notes' },
  { value: 'PRACTICE_PAPERS', label: 'Practice Papers' },
  { value: 'REFERENCE_BOOKS', label: 'Reference Books' },
  { value: 'VIDEOS', label: 'Videos' },
];

const TYPE_BADGES: Record<ResourceType, string> = {
  NOTES: 'bg-blue-100 text-blue-700',
  PRACTICE_PAPERS: 'bg-purple-100 text-purple-700',
  REFERENCE_BOOKS: 'bg-green-100 text-green-700',
  VIDEOS: 'bg-amber-100 text-amber-700',
};

const TYPE_ICONS: Record<ResourceType, React.ReactNode> = {
  NOTES: <FileText className="w-8 h-8 text-blue-600" />,
  PRACTICE_PAPERS: <BookOpen className="w-8 h-8 text-purple-600" />,
  REFERENCE_BOOKS: <BookOpen className="w-8 h-8 text-green-600" />,
  VIDEOS: <BookOpen className="w-8 h-8 text-amber-600" />,
};

export default function StudentResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | ''>('');

  function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (searchTerm) params.set('search', searchTerm);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/resources?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setResources(json.data ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [searchTerm, filterType]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Resource Library</h1>
          <p className="text-sm text-gray-500 mt-1">Access study materials for your enrolled batches and tracks</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search resources..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={e => setFilterType(e.target.value as ResourceType | '')}
              className="h-10 pl-3 pr-8 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm appearance-none bg-white">
              <option value="">All Types</option>
              {RESOURCE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : resources.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No resources available</p>
            <p className="text-sm text-gray-400 mt-1">Study materials for your enrolled batches will appear here.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{resources.length} resource{resources.length !== 1 ? 's' : ''} available</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow hover:border-blue-200 group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="shrink-0 mt-1">{TYPE_ICONS[r.type]}</div>
                    <div className="min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${TYPE_BADGES[r.type]}`}>
                        {r.type.replace(/_/g, ' ')}
                      </span>
                      <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2">{r.title}</h3>
                    </div>
                  </div>
                  {r.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{r.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {r.tracks?.map(t => (
                      <span key={t.track.id} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {t.track.name.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {r.batches?.map(b => (
                      <span key={b.batch.id} className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700">
                        {b.batch.subject.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" download
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
