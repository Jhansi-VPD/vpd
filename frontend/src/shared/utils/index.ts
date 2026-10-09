export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount?: number | null, currency = 'USD'): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function truncate(text: string, maxLen: number = 50): string {
  if (!text || text.length <= maxLen) return text;
  return `${text.substring(0, maxLen)}...`;
}

export function parseBudgetValue(budgetStr?: string | null, fallback = 95000): number {
  if (!budgetStr) return fallback;
  const num = Number(budgetStr.replace(/[^0-9]/g, ''));
  return Number.isNaN(num) || num <= 0 ? fallback : num;
}

export function buildContactLeadPayload(submission: {
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  message?: string;
}) {
  return {
    company: submission.company || 'Enterprise Prospect',
    contact_name: submission.name || 'Inbound Contact',
    email: submission.email || '',
    phone: submission.phone || '',
    source: 'contact_form',
    estimated_value: parseBudgetValue(submission.budget),
    notes: `Converted from Website Contact Form. Inquiry: "${submission.message || ''}"`,
  };
}

