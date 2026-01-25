import { FC } from 'react';

import { Categories } from '../types';

interface BudgetModalProps {
  showBudgetModal: boolean;
  setShowBudgetModal: (value: boolean) => void;
  selectedBudgetCategory: string;
  setSelectedBudgetCategory: (value: string) => void;
  budgetAmount: string;
  setBudgetAmount: (value: string) => void;
  setBudgetForCategory: () => void;
  categories: Categories;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
}

const BudgetModal: FC<BudgetModalProps> = ({
  showBudgetModal,
  setShowBudgetModal,
  selectedBudgetCategory,
  setSelectedBudgetCategory,
  budgetAmount,
  setBudgetAmount,
  setBudgetForCategory,
  categories,
  darkMode,
  cardClass,
  textClass
}) => {
  if (!showBudgetModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${cardClass} rounded-2xl p-6 max-w-md w-full border shadow-2xl`}>
        <h3 className={`text-2xl font-bold ${textClass} mb-4`}>Set Category Budget</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Category</label>
            <select
              value={selectedBudgetCategory}
              onChange={(e) => setSelectedBudgetCategory(e.target.value)}
              className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Budget Amount</label>
            <input
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={setBudgetForCategory}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
            >
              Set Budget
            </button>
            <button
              onClick={() => {
                setShowBudgetModal(false);
                setBudgetAmount('');
              }}
              className={`flex-1 ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} ${textClass} font-bold py-3 rounded-xl transition-all`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetModal;
