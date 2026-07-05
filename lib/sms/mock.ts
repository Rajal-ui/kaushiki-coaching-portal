export async function enqueueMockSms(phone: string, message: string): Promise<void> {
  console.log(`[Mock SMS] To: ${phone}, Body: ${message}`);
}
