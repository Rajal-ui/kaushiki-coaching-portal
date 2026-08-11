'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Mail,
  MessageSquareText,
  CreditCard,
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SettingCategory,
  SystemSettingsResponse,
  SystemSettingsSection,
} from '@/types/settings';
import { FieldInput } from './FieldInput';
import { Toaster, type ToastItem } from './Toaster';

const SECTION_ICONS: Record<SettingCategory, React.ReactNode> = {
  contact: <Building2 className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  sms: <MessageSquareText className="w-4 h-4" />,
  payment: <CreditCard className="w-4 h-4" />,
};

type SectionDrafts = Record<SettingCategory, Record<string, string>>;

function buildSectionDraft(section: SystemSettingsSection): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of section.fields) {
    // Secrets are never echoed back to the client — start empty so an empty
    // submit leaves the stored value untouched.
    map[field.key] = field.isSecret ? '' : field.value;
  }
  return map;
}

function buildDrafts(sections: SystemSettingsSection[]): SectionDrafts {
  const drafts = {} as SectionDrafts;
  for (const section of sections) {
    drafts[section.id] = buildSectionDraft(section);
  }
  return drafts;
}

export function AdminSettingsForm() {
  const [sections, setSections] = useState<SystemSettingsSection[]>([]);
  const [drafts, setDrafts] = useState<SectionDrafts | null>(null);
  const [updatedAt, setUpdatedAt] = useState<SystemSettingsResponse['updatedAt']>({});
  const [activeTab, setActiveTab] = useState<SettingCategory>('contact');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SettingCategory | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((kind: ToastItem['kind'], title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, kind, title, message }]);
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const applyResponse = useCallback(
    (data: SystemSettingsResponse, refreshSection?: SettingCategory) => {
      setSections(data.sections);
      setUpdatedAt(data.updatedAt);
      setDrafts((prev) => {
        // When saving one section, preserve unsaved edits in the other tabs.
        if (refreshSection && prev) {
          const refreshed = data.sections.find((s) => s.id === refreshSection);
          return refreshed
            ? { ...prev, [refreshSection]: buildSectionDraft(refreshed) }
            : prev;
        }
        return buildDrafts(data.sections);
      });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { headers: authHeaders() });
        if (!res.ok) throw new Error('Failed to load settings');
        const body: { data: SystemSettingsResponse } = await res.json();
        if (!cancelled) applyResponse(body.data);
      } catch {
        if (!cancelled) setLoadError('Could not load settings. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, applyResponse]);

  function isDirty(sectionId: SettingCategory): boolean {
    const section = sections.find((s) => s.id === sectionId);
    const draft = drafts?.[sectionId];
    if (!section || !draft) return false;
    for (const field of section.fields) {
      const current = draft[field.key] ?? '';
      if (field.isSecret) {
        if (current !== '') return true;
      } else if (current !== field.value) {
        return true;
      }
    }
    return false;
  }

  function resetSection(sectionId: SettingCategory) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    setDrafts((prev) =>
      prev ? { ...prev, [sectionId]: buildSectionDraft(section) } : prev
    );
  }

  async function saveSection(sectionId: SettingCategory) {
    if (!drafts || !isDirty(sectionId)) return;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const changed: Record<string, string> = {};
    for (const field of section.fields) {
      const current = drafts[sectionId][field.key] ?? '';
      if (field.isSecret) {
        if (current !== '') changed[field.key] = current;
      } else if (current !== field.value) {
        changed[field.key] = current;
      }
    }
    if (Object.keys(changed).length === 0) return;
    setSaving(sectionId);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ values: changed }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const details = body?.error?.details as Record<string, string> | undefined;
        const first = details ? Object.entries(details)[0] : null;
        pushToast(
          'error',
          'Failed to save settings',
          first ? `${first[0]}: ${first[1]}` : body?.error?.message ?? 'Unexpected server error'
        );
        return;
      }
      applyResponse(body.data, sectionId);
      pushToast('success', 'Settings saved', 'Your changes have been applied.');
    } catch {
      pushToast('error', 'Network error', 'Could not reach the server. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  const activeSection = sections.find((s) => s.id === activeTab);

  return (
    <div>
      <Toaster toasts={toasts} onDismiss={dismissToast} />

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 mb-6 border-b border-border pb-0">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeTab === section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === section.id
                  ? 'border-primary text-primary bg-primary-subtle'
                  : 'border-transparent text-muted hover:text-dark hover:bg-border/50'
              )}
            >
              {SECTION_ICONS[section.id]}
              {section.title}
              {isDirty(section.id) && (
                <>
                  <span className="ml-1 h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                  <span className="sr-only">Unsaved changes</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : activeSection ? (
        <SectionPanel
          key={activeSection.id}
          section={activeSection}
          updatedAt={updatedAt[activeSection.id]}
          draft={drafts?.[activeSection.id] ?? {}}
          dirty={isDirty(activeSection.id)}
          saving={saving === activeSection.id}
          onFieldChange={(key, value) =>
            setDrafts((prev) =>
              prev ? { ...prev, [activeSection.id]: { ...prev[activeSection.id], [key]: value } } : prev
            )
          }
          onSave={() => saveSection(activeSection.id)}
          onReset={() => resetSection(activeSection.id)}
        />
      ) : (
        <div className="py-24 text-center text-muted">No settings configured.</div>
      )}
    </div>
  );
}

interface SectionPanelProps {
  section: SystemSettingsSection;
  updatedAt?: string | null;
  draft: Record<string, string>;
  dirty: boolean;
  saving: boolean;
  onFieldChange: (key: string, value: string) => void;
  onSave: () => void;
  onReset: () => void;
}

function SectionPanel({
  section,
  updatedAt,
  draft,
  dirty,
  saving,
  onFieldChange,
  onSave,
  onReset,
}: SectionPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-dark">{section.title}</h2>
          <p className="mt-1 text-sm text-muted">{section.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className="inline-flex h-11 items-center gap-2 rounded-md border-[1.5px] border-border px-4 text-sm font-medium text-body transition-all hover:bg-border/50 disabled:opacity-45 disabled:pointer-events-none"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-all hover:bg-primary-light hover:-translate-y-px shadow-sm hover:shadow-xl disabled:opacity-45 disabled:pointer-events-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {section.fields.map((field) => (
          <div key={field.key} className="grid gap-2 sm:grid-cols-[240px_1fr] sm:items-start">
            <div>
              <label htmlFor={`setting-${field.key}`} className="block text-sm font-medium text-dark">
                {field.label}
                {field.isSecret && <span className="ml-1.5 text-xs text-muted font-normal">(secret)</span>}
              </label>
              {field.description && (
                <p className="mt-0.5 text-xs text-muted leading-relaxed">{field.description}</p>
              )}
              {field.updatedAt && (
                <p className="mt-1 text-[11px] text-muted/70">
                  Updated {formatDate(field.updatedAt)}
                </p>
              )}
            </div>
            <FieldInput
              id={`setting-${field.key}`}
              field={field}
              value={draft[field.key] ?? ''}
              onChange={(value) => onFieldChange(field.key, value)}
            />
          </div>
        ))}
      </div>

      {updatedAt && (
        <p className="mt-6 text-xs text-muted">
          Last saved {formatDate(updatedAt)}.
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
