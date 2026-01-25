import { FC } from 'react';

import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  formatCurrency: (num: number) => string;
  cardClass: string;
  subtextClass: string;
}

const SummaryCards: FC<SummaryCardsProps> = ({
  balance,
  totalIncome,
  totalExpense,
  formatCurrency,
  cardClass,
  subtextClass
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance */}
      <div className={`${cardClass} rounded-2xl shadow-xl p-6 border hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${subtextClass} mb-1 font-medium`}>Period Balance</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${balance >= 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'} shadow-lg`}>
            <DollarSign className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Income */}
      <div className={`${cardClass} rounded-2xl shadow-xl p-6 border hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${subtextClass} mb-1 font-medium`}>Period Income</p>
            <p className="text-3xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className={`${cardClass} rounded-2xl shadow-xl p-6 border hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${subtextClass} mb-1 font-medium`}>Period Expenses</p>
            <p className="text-3xl font-bold text-rose-500">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-lg">
            <TrendingDown className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
