export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

export function isNonEmpty(val: string | null | undefined): boolean {
  return typeof val === 'string' && val.trim().length > 0;
}

