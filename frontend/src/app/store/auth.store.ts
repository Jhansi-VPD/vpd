import { User } from '../../types/common.types';

class AuthStore {
  private user: User | null = null;
  private token: string | null = null;

  constructor() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) this.user = JSON.parse(stored);
      this.token = localStorage.getItem('token');
    } catch {
      // safe fallback
    }
  }

  getUser(): User | null {
    return this.user;
  }

  setUser(user: User | null) {
    this.user = user;
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }

  clear() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

export const authStore = new AuthStore();
export default authStore;

