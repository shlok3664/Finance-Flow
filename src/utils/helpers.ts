import { Transaction, Currencies } from '../types';

export const retryFetch = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429 && i < retries - 1) { // Rate limit
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to fetch after retries');
};

export const formatCurrency = (num: number, currencyCode: string, currencies: Currencies) => {
  const symbol = currencies[currencyCode]?.symbol || '$';
  const amount = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${amount}`;
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getFilteredByDateRange = (exps: Transaction[], dateRange: string) => {
  const now = new Date();
  if (dateRange === 'all') return exps;

  return exps.filter(exp => {
    const expDate = new Date(exp.date);
    switch(dateRange) {
      case 'today':
        return expDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expDate >= weekAgo;
      case 'month':
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      case 'year':
        return expDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};
