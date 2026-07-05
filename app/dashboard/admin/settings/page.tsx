'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Save, Loader2, Check, AlertCircle } from 'lucide-react';

const SETTING_LABELS: Record<string, string> = {
  admissions_label: 'Admissions Cycle Label',
  institution_phone: 'Institution Phone',
  institution_email: 'Institution Email',
  institution_address: 'Institution Address',
  msg91_template_otp: 'MSG91 OTP Template ID',
  msg91_template_transactional: 'MSG91 Transactional Template ID',
};

const SETTING_DESCRIPTIONS: Record<string, string> = {
  admissions_label: 'Displayed on landing page banner (e.g. "Admissions Open — 2026-27")',
  institution_phone: 'Phone number shown on landing page & contact sections',
  institution_email: 'Email address for inquiries',
  institution_address: 'Physical address displayed on landing page',
  msg91_template_otp: 'DLT template ID for OTP SMS (via MSG91)',
  msg91_template_transactional: 'DLT template ID for transactional SMS (via MSG91)',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setSettings(data.data ?? {});
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(key: string) {
    setSaving(key);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, value: dirty[key] ?? settings[key] }),
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: dirty[key] ?? settings[key] }));
        setDirty(prev => { const n = { ...prev }; delete n[key]; return n; });
        setSuccess(`${SETTING_LABELS[key] || key} saved`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    }
    setSaving(null);
  }

  const keys = Object.keys(SETTING_LABELS);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="space-y-4">
            {keys.map(key => (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1">{SETTING_LABELS[key]}</label>
                <p className="text-xs text-gray-400 mb-3">{SETTING_DESCRIPTIONS[key]}</p>
                <div className="flex gap-3">
                  <input
                    value={dirty[key] !== undefined ? dirty[key] : (settings[key] || '')}
                    onChange={e => setDirty(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Not set"
                    className="flex-1 h-12 px-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-base"
                  />
                  <button
                    onClick={() => handleSave(key)}
                    disabled={saving === key || (dirty[key] === undefined)}
                    className="px-4 h-12 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saving === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
