'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Upload, FileText, Loader2, Trash2, ExternalLink, BookOpen,
  Search, Filter, ChevronDown, X, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface Batch {
  id: string;
  subject: { name: string; track: { name: string } };
}

interface Track {
  id: string;
  name: string;
}

export default function FacultyResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('NOTES');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ResourceType | ''>('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  function authHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const fetchResources = useCallback(async () => {
    const headers = authHeaders();
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`/api/resources?${params}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setResources(json.data ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [searchTerm, filterType]);

  useEffect(() => {
    const headers = authHeaders();
    async function load() {
      const [batchesRes, tracksRes] = await Promise.all([
        fetch('/api/batches/my', { headers }),
        fetch('/api/tracks', { headers }),
      ]);
      if (batchesRes.ok) { const d = await batchesRes.json(); setBatches(Array.isArray(d) ? d : d.data ?? []); }
      if (tracksRes.ok) { const d = await tracksRes.json(); setTracks(Array.isArray(d) ? d : d.data ?? []); }
    }
    load();
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  function toggleBatch(id: string) {
    setSelectedBatchIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  }

  function toggleTrack(id: string) {
    setSelectedTrackIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload'); return; }
    setUploading(true);
    setError('');

    const headers = authHeaders();

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: uploadForm,
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error?.message || 'Upload failed');
      }
      const { data: uploadData } = await uploadRes.json();

      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          title,
          description: description || undefined,
          fileUrl: uploadData.url,
          type,
          trackIds: selectedTrackIds.length > 0 ? selectedTrackIds : undefined,
          batchIds: selectedBatchIds.length > 0 ? selectedBatchIds : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to create resource');
      }

      setTitle('');
      setDescription('');
      setType('NOTES');
      setFile(null);
      setSelectedBatchIds([]);
      setSelectedTrackIds([]);
      setShowForm(false);
      setLoading(true);
      fetchResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resource permanently?')) return;
    try {
      const res = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        setResources(prev => prev.filter(r => r.id !== id));
      }
    } catch { /* ignore */ }
  }

  return (
    <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Study Resources</h1>
            <p className="text-sm text-gray-500 mt-1">Upload and manage study materials for your batches</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Upload className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Upload Resource'}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Resource</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={200}
                  className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1000}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={type} onChange={e => setType(e.target.value as ResourceType)}
                  className="w-full h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base">
                  {RESOURCE_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} required
                  accept=".pdf,.doc,.docx,.mp4,.avi,.mov,.jpg,.jpeg,.png"
                  className="w-full h-12 px-3 py-2 rounded-lg border border-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Tracks</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg min-h-[48px]">
                  {tracks.length === 0 && <span className="text-xs text-gray-400 p-1">No tracks available</span>}
                  {tracks.map(t => (
                    <button key={t.id} type="button" onClick={() => toggleTrack(t.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedTrackIds.includes(t.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}>
                      {t.name.replace(/_/g, ' ')}
                      {selectedTrackIds.includes(t.id) && <X className="w-3 h-3 inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batches</label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg min-h-[48px]">
                  {batches.length === 0 && <span className="text-xs text-gray-400 p-1">No batches assigned</span>}
                  {batches.map(b => (
                    <button key={b.id} type="button" onClick={() => toggleBatch(b.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selectedBatchIds.includes(b.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}>
                      {b.subject.name}
                      {selectedBatchIds.includes(b.id) && <X className="w-3 h-3 inline ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="submit" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload Resource'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

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
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No resources found</p>
            <p className="text-sm mt-1">Upload your first study resource using the button above.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGES[r.type]}`}>
                    {r.type.replace(/_/g, ' ')}
                  </span>
                  <button onClick={() => handleDelete(r.id)}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{r.title}</h3>
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
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>by {r.uploadedBy?.name || 'Unknown'}</span>
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                    <Download className="w-3 h-3" /> View File
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
