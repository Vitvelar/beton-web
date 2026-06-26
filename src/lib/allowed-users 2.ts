export const ALLOWED_EMAILS = ['beton@beton.is', 'hjalti@vitvelar.is', 'alex@vitvelar.is'];

export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}
