import { FC } from 'react';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';

import { Transaction } from '../types';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface DailyData {
  date: string;
  expenses: number;
  income: number;
}

interface ChartsProps {
  expenses: Transaction[];
  categoryData: CategoryData[];
  dailyData: DailyData[];
  chartView: string;
  setChartView: (view: 'pie' | 'bar') => void;
  formatCurrency: (num: number) => string;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
}

const Charts: FC<ChartsProps> = ({
  expenses,
  categoryData,
  dailyData,
  chartView,
  setChartView,
  formatCurrency,
  darkMode,
  cardClass,
  textClass
}) => {
  if (expenses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className={`${cardClass} rounded-2xl shadow-xl p-6 border`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
            <PieIcon className="w-6 h-6 text-purple-500" />
            Category Breakdown
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setChartView('pie')}
              className={`p-2 rounded-lg transition-all ${chartView === 'pie' ? 'bg-purple-600 text-white shadow-md' : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} text-slate-400`}`}
            >
              <PieIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartView('bar')}
              className={`p-2 rounded-lg transition-all ${chartView === 'bar' ? 'bg-purple-600 text-white shadow-md' : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} text-slate-400`}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {chartView === 'pie' ? (
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
                <Legend iconType="circle" wrapperStyle={{ padding: 10 }} payload={categoryData.map((entry) => ({ value: entry.name, type: 'circle', color: entry.color }))} />
              </PieChart>
            ) : (
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="name" tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
                <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <p>No expense data yet</p>
          </div>
        )}
      </div>

      <div className={`${cardClass} rounded-2xl shadow-xl p-6 border`}>
        <h3 className={`text-xl font-bold ${textClass} mb-6 flex items-center gap-2`}>
          <BarChart3 className="w-6 h-6 text-purple-500" />
          7-Day Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
            <XAxis dataKey="date" tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
