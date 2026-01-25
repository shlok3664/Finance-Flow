export interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  date: string;
}

export interface Category {
  label: string;
  color: string;
  icon: string;
}

export interface Categories {
  [key: string]: Category;
}

export interface Budget {
  [category: string]: number;
}

export interface Currency {
  symbol: string;
  name: string;
  rate: number;
}

export interface Currencies {
  [code: string]: Currency;
}

export interface SuggestedCategory {
  category_key: string;
  confidence_reason: string;
}
