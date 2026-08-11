import type {
  SettingCategory,
  SystemSettingDefinition,
} from '@/types/settings';

// ---------------------------------------------------------------------------
// Master registry of every system setting editable from the admin panel.
// Keys mirror the environment variable names so DB-backed values can act as a
// runtime override of `process.env` with zero code changes to consumers.
// ---------------------------------------------------------------------------

export const SETTING_SECTIONS: Record<
  SettingCategory,
  { title: string; description: string }
> = {
  contact: {
    title: 'Contact Details',
    description: 'Institute information shown to visitors across the portal.',
  },
  email: {
    title: 'SMTP & Email Variables',
    description: 'Outbound email provider and SMTP credentials used for notifications.',
  },
  sms: {
    title: 'SMS Gateway',
    description: 'MSG91 gateway credentials and transactional template IDs.',
  },
  payment: {
    title: 'Payment Gateway',
    description: 'Razorpay API keys used for fee collection and webhook verification.',
  },
};

export const SYSTEM_SETTINGS: SystemSettingDefinition[] = [
  // ── Contact ──────────────────────────────────────────────────────────────
  {
    key: 'institution_name',
    label: 'Institute Name',
    description: 'Displayed in headers, invoices and public pages.',
    category: 'contact',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'institution_tagline',
    label: 'Tagline',
    description: 'Short marketing line shown on the landing page.',
    category: 'contact',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'institution_email',
    label: 'Institute Email',
    description: 'Public contact email for inquiries.',
    category: 'contact',
    type: 'email',
    storage: 'public',
  },
  {
    key: 'institution_phone',
    label: 'Institute Phone',
    description: 'Public contact phone number.',
    category: 'contact',
    type: 'tel',
    storage: 'public',
    placeholder: '+91 90000 00000',
  },
  {
    key: 'institution_address',
    label: 'Institute Address',
    description: 'Physical address shown on the landing page & invoices.',
    category: 'contact',
    type: 'textarea',
    storage: 'public',
  },
  {
    key: 'institution_website',
    label: 'Website',
    description: 'Official website URL.',
    category: 'contact',
    type: 'url',
    storage: 'public',
    placeholder: 'https://',
  },

  // ── Email / SMTP ─────────────────────────────────────────────────────────
  {
    key: 'EMAIL_PROVIDER',
    label: 'Email Provider',
    description: 'Transport used for transactional emails.',
    category: 'email',
    type: 'select',
    options: ['resend', 'smtp'],
    storage: 'public',
  },
  {
    key: 'EMAIL_FROM',
    label: 'Sender Email',
    description: 'From address used on outgoing emails.',
    category: 'email',
    type: 'email',
    storage: 'public',
  },
  {
    key: 'EMAIL_FROM_NAME',
    label: 'Sender Name',
    description: 'Display name shown next to the sender address.',
    category: 'email',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'SMTP_HOST',
    label: 'SMTP Host',
    description: 'e.g. smtp.gmail.com',
    category: 'email',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'SMTP_PORT',
    label: 'SMTP Port',
    description: 'e.g. 587 (STARTTLS) or 465 (SSL).',
    category: 'email',
    type: 'number',
    storage: 'public',
  },
  {
    key: 'SMTP_USER',
    label: 'SMTP Username',
    description: 'Account used to authenticate with the SMTP server.',
    category: 'email',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'SMTP_PASS',
    label: 'SMTP Password',
    description: 'App password / API token for the SMTP account.',
    category: 'email',
    type: 'password',
    storage: 'secret',
    sensitive: true,
  },
  {
    key: 'SMTP_SECURE',
    label: 'SMTP Secure',
    description: 'Use TLS (enable for port 465).',
    category: 'email',
    type: 'select',
    options: ['true', 'false'],
    storage: 'public',
  },
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: 'API key for the Resend email provider.',
    category: 'email',
    type: 'password',
    storage: 'secret',
    sensitive: true,
  },

  // ── SMS / MSG91 ──────────────────────────────────────────────────────────
  {
    key: 'MSG91_AUTH_KEY',
    label: 'MSG91 Auth Key',
    description: 'Primary authentication key for the MSG91 API.',
    category: 'sms',
    type: 'password',
    storage: 'secret',
    sensitive: true,
  },
  {
    key: 'MSG91_SENDER_ID',
    label: 'MSG91 Sender ID',
    description: 'Approved DLT sender header (e.g. KSHSMS).',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_OTP_TEMPLATE_ID',
    label: 'OTP Template ID',
    description: 'DLT template used for login/verification OTPs.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_ENROLLMENT_CONFIRMED',
    label: 'Enrollment Confirmed Template',
    description: 'Sent when a student enrollment becomes active.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_PAYMENT_FAILED',
    label: 'Payment Failed Template',
    description: 'Sent when a fee payment attempt fails.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_FEE_REMINDER',
    label: 'Fee Reminder Template',
    description: 'Sent as a periodic fee due reminder.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_INQUIRY_ACK',
    label: 'Inquiry Acknowledged Template',
    description: 'Acknowledgement sent after a new inquiry is received.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_DOUBT_ANSWERED',
    label: 'Doubt Answered Template',
    description: 'Notification sent to a student once a doubt is answered.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },
  {
    key: 'MSG91_TEMPLATE_RESULT_PUBLISHED',
    label: 'Result Published Template',
    description: 'Sent when a test scorecard is published.',
    category: 'sms',
    type: 'text',
    storage: 'public',
  },

  // ── Payment / Razorpay ───────────────────────────────────────────────────
  {
    key: 'RAZORPAY_KEY_ID',
    label: 'Razorpay Key ID',
    description: 'Public key used to initialise the checkout.',
    category: 'payment',
    type: 'text',
    storage: 'public',
    placeholder: 'rzp_live_…',
  },
  {
    key: 'RAZORPAY_KEY_SECRET',
    label: 'Razorpay Key Secret',
    description: 'Secret used to sign orders and API calls.',
    category: 'payment',
    type: 'password',
    storage: 'secret',
    sensitive: true,
  },
  {
    key: 'RAZORPAY_WEBHOOK_SECRET',
    label: 'Razorpay Webhook Secret',
    description: 'Used to verify webhook payload signatures.',
    category: 'payment',
    type: 'password',
    storage: 'secret',
    sensitive: true,
  },
];

export const SYSTEM_SETTING_KEYS = new Set(SYSTEM_SETTINGS.map((s) => s.key));

export const SECRET_SETTING_KEYS = new Set(
  SYSTEM_SETTINGS.filter((s) => s.storage === 'secret').map((s) => s.key)
);

export function getSettingDefinition(key: string): SystemSettingDefinition | undefined {
  return SYSTEM_SETTINGS.find((s) => s.key === key);
}

export function getSettingsForCategory(category: SettingCategory): SystemSettingDefinition[] {
  return SYSTEM_SETTINGS.filter((s) => s.category === category);
}
