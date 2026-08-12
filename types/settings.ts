export type SettingCategory = 'contact' | 'email' | 'sms' | 'payment';

export type SettingValueType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'password'
  | 'select'
  | 'textarea';

/** How the raw value is persisted. Secrets are encrypted at rest. */
export type SettingStorage = 'public' | 'secret';

export interface SystemSettingDefinition {
  key: string;
  label: string;
  description?: string;
  category: SettingCategory;
  type: SettingValueType;
  storage: SettingStorage;
  /** For `select` fields. */
  options?: string[];
  placeholder?: string;
  /** If true, an empty submitted value leaves the stored value untouched. */
  sensitive?: boolean;
}

/** Value exposed to the admin UI (secrets are never returned in plaintext). */
export interface SystemSettingValue {
  key: string;
  label: string;
  description?: string;
  type: SettingValueType;
  options?: string[];
  placeholder?: string;
  value: string;
  isSecret: boolean;
  /** True when a secret value is stored (used to show "already configured"). */
  isConfigured: boolean;
  /** ISO date of the last write for this setting, if any. */
  updatedAt?: string | null;
}

export interface SystemSettingsSection {
  id: SettingCategory;
  title: string;
  description: string;
  fields: SystemSettingValue[];
}

export interface SystemSettingsResponse {
  sections: SystemSettingsSection[];
  /** ISO timestamps grouped per category. */
  updatedAt: Partial<Record<SettingCategory, string>>;
}

export interface AdminSettingsApiResponse {
  data: SystemSettingsResponse;
}

export interface UpdateSettingsPayload {
  values: Record<string, string>;
}
