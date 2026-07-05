const MSG91_BASE = 'https://api.msg91.com/api/v5';

export interface Msg91Config {
  authKey: string;
  senderId: string;
  templateId: string;
}

export interface Msg91Response {
  type: string;
  request_id?: string;
  message: string;
  code?: string;
  description?: string;
}

function getConfig(): Msg91Config {
  return {
    authKey: process.env.MSG91_AUTH_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || 'KSHSMS',
    templateId: process.env.MSG91_TEMPLATE_ENROLLMENT_CONFIRMED || '',
  };
}

export async function sendTransactionalSms(
  phone: string,
  templateId: string,
  variables: Record<string, string>,
  config?: Msg91Config
): Promise<Msg91Response> {
  const cfg = config || getConfig();

  if (!cfg.authKey) {
    console.warn('[MSG91] No auth key configured — SMS not sent');
    return { type: 'skipped', message: 'MSG91 not configured' };
  }

  const res = await fetch(`${MSG91_BASE}/flow/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': cfg.authKey,
    },
    body: JSON.stringify({
      sender: cfg.senderId,
      template_id: templateId,
      short_url: '0',
      recipients: [
        {
          mobiles: `91${phone.replace(/^\+?91/, '')}`,
          ...variables,
        },
      ],
    }),
  });

  const data = await res.json() as Msg91Response;

  if (!res.ok) {
    throw new Error(`MSG91 API error: ${data.message || res.statusText}`);
  }

  return data;
}

export async function sendOtpSms(phone: string, otp: string): Promise<Msg91Response> {
  const authKey = process.env.MSG91_AUTH_KEY || '';
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID || '';

  if (!authKey) {
    console.warn('[MSG91] No auth key — OTP not sent');
    return { type: 'skipped', message: 'MSG91 not configured' };
  }

  const res = await fetch(`${MSG91_BASE}/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: `91${phone.replace(/^\+?91/, '')}`,
      otp,
    }),
  });

  const data = await res.json() as Msg91Response;

  if (!res.ok) {
    throw new Error(`MSG91 OTP error: ${data.message || res.statusText}`);
  }

  return data;
}
