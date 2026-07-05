export class OAuth2Client {
  constructor(_clientId?: string) {}

  async verifyIdToken(_options: { idToken: string; audience?: string }) {
    return {
      getPayload: () => ({
        sub: 'mock-google-sub',
        email: 'google@example.com',
        name: 'Google User',
      }),
    };
  }
}
