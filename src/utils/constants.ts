import { Categories, Currencies } from '../types';

export const CATEGORIES: Categories = {
  food: { label: 'Food', color: '#f97316', icon: '🍔' },
  transport: { label: 'Transport', color: '#3b82f6', icon: '🚗' },
  entertainment: { label: 'Entertainment', color: '#a855f7', icon: '🎮' },
  bills: { label: 'Bills', color: '#ef4444', icon: '💡' },
  shopping: { label: 'Shopping', color: '#ec4899', icon: '🛍️' },
  health: { label: 'Health', color: '#10b981', icon: '⚕️' },
  salary: { label: 'Salary', color: '#059669', icon: '💰' },
  other: { label: 'Other', color: '#6b7280', icon: '📦' }
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const CURRENCIES: Currencies = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 83.12 },
};
