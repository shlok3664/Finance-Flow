import { FC } from 'react';

import { Target } from 'lucide-react';

interface CategorySpending {
  category: string;
  name: string;
  spent: number;
  budget: number;
  percentage: number;
  color: string;
  icon: string;
}

interface BudgetOverviewProps {
  categorySpending: CategorySpending[];
  setShowBudgetModal: (value: boolean) => void;
  formatCurrency: (num: number) => string;
  cardClass: string;
  textClass: string;
  subtextClass: string;
  darkMode: boolean;
  buttonBase: string;
}

const BudgetOverview: FC<BudgetOverviewProps> = ({
  categorySpending,
  setShowBudgetModal,
  formatCurrency,
  cardClass,
  textClass,
  subtextClass,
  darkMode,
  buttonBase
}) => {
  if (categorySpending.length === 0) return null;

  return (
    <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-8 border`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
          <Target className="w-6 h-6 text-purple-500" />
          Budget Overview
        </h3>
        <button
          onClick={() => setShowBudgetModal(true)}
          className={`${buttonBase} bg-purple-600 text-white hover:bg-purple-700`}
        >
          Set Budget
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorySpending.map(cat => (
          <div key={cat.category} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span>
                <span className={`font-semibold ${textClass}`}>{cat.name}</span>
              </div>
              {cat.budget > 0 && (
                <span className={`text-sm font-bold ${
                  cat.percentage > 100 ? 'text-red-500' :
                  cat.percentage > 80 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {cat.percentage.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className={subtextClass}>Spent: {formatCurrency(cat.spent)}</span>
                {cat.budget > 0 && (
                  <span className={subtextClass}>Budget: {formatCurrency(cat.budget)}</span>
                )}
              </div>
              {cat.budget > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.percentage > 100 ? 'bg-red-500' :
                      cat.percentage > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BudgetOverview;
