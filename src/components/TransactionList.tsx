import React from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';

const TransactionList = ({
  finalFilteredExpenses,
  categories,
  formatDate,
  formatCurrency,
  editTransaction,
  deleteTransaction,
  darkMode,
  textClass,
  subtextClass,
  cardClass,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  filter,
  setFilter,
  buttonBase
}) => {
  return (
    <div className={`${cardClass} rounded-2xl shadow-xl p-6 border`}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className={`text-2xl font-bold ${textClass}`}>Transactions</h2>
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description/category..."
            className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'} border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm`}
          />

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-slate-200'} border font-medium focus:outline-none text-sm`}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Type Filters */}
          <button
            onClick={() => setFilter('all')}
            className={`${buttonBase} ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${textClass} hover:bg-slate-200`
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`${buttonBase} ${
              filter === 'income'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${textClass} hover:bg-slate-200`
            }`}
          >
            Income
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`${buttonBase} ${
              filter === 'expense'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${textClass} hover:bg-slate-200`
            }`}
          >
            Expenses
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {finalFilteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-purple-600" />
            </div>
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">Adjust your filters or add a transaction above.</p>
          </div>
        ) : (
          finalFilteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-slate-50 to-slate-100'} rounded-xl hover:shadow-md transition-all hover:scale-[1.01] border ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-3 h-16 rounded-full shadow-md flex-shrink-0"
                  style={{ backgroundColor: categories[exp.category]?.color || '#6b7280' }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${textClass} truncate text-lg`}>{exp.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium ${darkMode ? 'bg-gray-600' : 'bg-white'} px-3 py-1 rounded-full ${textClass}`}>
                      {categories[exp.category]?.icon} {categories[exp.category]?.label}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className={`text-xs ${subtextClass}`}>{formatDate(exp.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className={`text-xl font-bold whitespace-nowrap ${
                  exp.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {exp.type === 'income' ? '+' : '-'}{formatCurrency(exp.amount)}
                </p>
                <button
                  onClick={() => editTransaction(exp)}
                  className="p-2 text-blue-500 hover:bg-blue-100 rounded-xl transition-all hover:scale-110"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteTransaction(exp.id)}
                  className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all hover:scale-110"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
