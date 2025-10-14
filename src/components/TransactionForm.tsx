import React from 'react';
import { PlusCircle, Zap } from 'lucide-react';

const TransactionForm = ({
  description,
  setDescription,
  amount,
  setAmount,
  category,
  setCategory,
  type,
  setType,
  editingId,
  addOrUpdateTransaction,
  suggestCategory,
  isSuggesting,
  suggestedCategory,
  setSuggestedCategory,
  categories,
  currency,
  currencies,
  darkMode,
  textClass,
  subtextClass,
}) => {
  return (
    <div className={`rounded-2xl shadow-xl p-6 mb-8 border ${darkMode ? 'bg-gray-800/70 backdrop-blur-lg border-gray-700' : 'bg-white/70 backdrop-blur-lg border-white/40'}`}>
      <h2 className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6`}>
        {editingId ? 'Edit Transaction' : 'Add New Transaction'}
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2 flex justify-between items-center`}>
              Description
              <button
                onClick={suggestCategory}
                disabled={!description.trim() || isSuggesting}
                className="text-xs bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 py-1 px-2 rounded-full font-medium flex items-center gap-1 disabled:opacity-50 transition-all"
              >
                {isSuggesting ? (
                  <svg className="animate-spin h-3 w-3 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  '✨ Suggest Category'
                )}
              </button>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSuggestedCategory(null); // Clear suggestion on change
              }}
              placeholder="Enter description (e.g., Starbucks coffee)"
              onKeyPress={(e) => e.key === 'Enter' && addOrUpdateTransaction()}
              className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Amount ({currencies[currency]?.symbol || '$'})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              onKeyPress={(e) => e.key === 'Enter' && addOrUpdateTransaction()}
              className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            />
          </div>
        </div>

        {/* AI Suggestion Display (Feature 2) */}
        {suggestedCategory && suggestedCategory.category_key !== 'error' && (
          <div className={`p-3 rounded-xl bg-purple-100 ${darkMode ? 'bg-purple-900/50' : ''} border border-purple-300 text-sm`}>
            <p className="font-semibold text-purple-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                AI Suggestion:
            </p>
            <p className="mt-1 flex items-center justify-between">
              <span>
                Best fit is **{categories[suggestedCategory.category_key].icon} {categories[suggestedCategory.category_key].label}**.
              </span>
              <button
                onClick={() => {
                  setCategory(suggestedCategory.category_key);
                  setSuggestedCategory(null);
                }}
                className="ml-2 text-purple-600 font-bold hover:underline py-1 px-3 rounded-lg bg-purple-200/50 hover:bg-purple-300/50 transition-colors"
              >
                Use this
              </button>
            </p>
            <p className={`text-xs ${subtextClass} italic mt-1`}>Reason: {suggestedCategory.confidence_reason}</p>
          </div>
        )}
        {suggestedCategory && suggestedCategory.category_key === 'error' && (
          <div className={`p-3 rounded-xl bg-red-100 ${darkMode ? 'bg-red-900/50' : ''} border border-red-300 text-sm text-red-700`}>
            <Zap className="w-4 h-4 inline mr-1" /> Error: {suggestedCategory.confidence_reason}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-4 py-3 border-2 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            >
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold ${textClass} mb-2`}>Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setType('expense')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  type === 'expense'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg scale-105'
                    : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${textClass} hover:bg-slate-200`
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setType('income')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  type === 'income'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg scale-105'
                    : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${textClass} hover:bg-slate-200`
                }`}
              >
                Income
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={addOrUpdateTransaction}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <PlusCircle className="w-5 h-5" />
            {editingId ? 'Update Transaction' : 'Add Transaction'}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setDescription('');
                setAmount('');
                setSuggestedCategory(null);
              }}
              className={`px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-200 hover:bg-slate-300'} ${textClass} font-bold py-4 rounded-xl transition-all`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
