'use client';

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SystemSettingValue } from '@/types/settings';
import { cn } from '@/lib/utils';

interface FieldInputProps {
  field: SystemSettingValue;
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/** Renders the correct input control for a setting definition. */
export function FieldInput({ field, value, onChange, id }: FieldInputProps) {
  if (field.type === 'password') {
    return <SecretInput field={field} value={value} onChange={onChange} id={id} />;
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={field.placeholder ?? 'Not set'}
        className="w-full rounded-md border-[1.5px] border-border bg-white px-4 py-3 text-base font-sans text-dark placeholder:text-muted transition-all focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/25"
      />
    );
  }
  if (field.type === 'select') {
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-md border-[1.5px] border-border bg-white px-3 py-2 text-base font-sans text-dark focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary/25"
      >
        <option value="">Not set</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      id={id}
      type={field.type === 'number' ? 'text' : field.type}
      inputMode={field.type === 'number' ? 'numeric' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? 'Not set'}
    />
  );
}

function SecretInput({ field, value, onChange, id }: FieldInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={revealed ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.isConfigured ? 'Leave blank to keep current value' : field.placeholder ?? 'Enter secret'}
        className={cn('pr-24')}
      />
      {field.isConfigured && value === '' && (
        <span className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-success">
          <ShieldCheck className="w-3.5 h-3.5" />
          Saved
        </span>
      )}
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-dark transition-colors"
        aria-label={revealed ? 'Hide value' : 'Show value'}
      >
        {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
