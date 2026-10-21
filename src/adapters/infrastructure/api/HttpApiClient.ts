export class HttpApiClient {
  private static token: string | null = (typeof localStorage !== 'undefined') ? localStorage.getItem('DND_AUTH_TOKEN') : null;

  static setToken(token: string | null) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('DND_AUTH_TOKEN', token);
      else localStorage.removeItem('DND_AUTH_TOKEN');
    }
  }

  static getToken(): string | null {
    return this.token;
  }

  static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    // Return empty object for 204 No Content
    if (response.status === 204) return {} as T;

    return await response.json();
  }
}
