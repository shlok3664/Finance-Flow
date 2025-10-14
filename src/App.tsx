import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, BarChart3, Moon, Sun, Download, Upload, Edit2, Target, Lightbulb, Zap } from 'lucide-react';
import { PieChart as RechartsP, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

// Global variables (mocked/safe for compilation/public repo)
const __app_id = 'expense-tracker-v1';
const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "";

// Utility function for exponential backoff retry logic
const retryFetch = async (url, options, retries = 3) => {
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
};

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [type, setType] = useState('expense');
  const [filter, setFilter] = useState('all');
  const [chartView, setChartView] = useState('pie');
  const [darkMode, setDarkMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [budgets, setBudgets] = useState({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [currency, setCurrency] = useState('USD');

  // --- Gemini States ---
  const [llmInsight, setLlmInsight] = useState('Generate an insight below to see smart analysis of your spending.');
  const [llmLoading, setLlmLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const userId = 'placeholder-user-id'; 

  const categories = {
    food: { label: 'Food', color: '#f97316', icon: '🍔' },
    transport: { label: 'Transport', color: '#3b82f6', icon: '🚗' },
    entertainment: { label: 'Entertainment', color: '#a855f7', icon: '🎮' },
    bills: { label: 'Bills', color: '#ef4444', icon: '💡' },
    shopping: { label: 'Shopping', color: '#ec4899', icon: '🛍️' },
    health: { label: 'Health', color: '#10b981', icon: '⚕️' },
    salary: { label: 'Salary', color: '#059669', icon: '💰' },
    other: { label: 'Other', color: '#6b7280', icon: '📦' }
  };
  const CATEGORY_KEYS = Object.keys(categories);

  const currencies = {
    USD: { symbol: '$', name: 'US Dollar', rate: 1 },
    EUR: { symbol: '€', name: 'Euro', rate: 0.92 },
    GBP: { symbol: '£', name: 'British Pound', rate: 0.79 },
    INR: { symbol: '₹', name: 'Indian Rupee', rate: 83.12 },
    // Simplified list for brevity
  };

  // --- Transaction Management ---
  const addOrUpdateTransaction = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    const newTransaction = {
      id: editingId || Date.now(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      type,
      date: new Date().toISOString()
    };

    setExpenses(prev => {
      if (editingId) {
        return prev.map(exp => exp.id === editingId ? newTransaction : exp);
      } else {
        return [newTransaction, ...prev];
      }
    });

    setDescription('');
    setAmount('');
    setEditingId(null);
    setSuggestedCategory(null); // Clear suggestion after submission
  };

  const editTransaction = (exp) => {
    setDescription(exp.description);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setType(exp.type);
    setEditingId(exp.id);
    setSuggestedCategory(null); // Clear suggestion when editing starts
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  const deleteTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  // --- Filtering & Calculations ---

  const getFilteredByDateRange = useCallback((exps) => {
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
  }, [dateRange]);

  const filteredExpenses = expenses.filter(exp => 
    filter === 'all' ? true : exp.type === filter
  );

  const searchFilteredExpenses = searchQuery 
    ? filteredExpenses.filter(exp =>
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        categories[exp.category]?.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredExpenses;

  const finalFilteredExpenses = getFilteredByDateRange(searchFilteredExpenses);

  const totalIncome = finalFilteredExpenses
    .filter(exp => exp.type === 'income')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const totalExpense = finalFilteredExpenses
    .filter(exp => exp.type === 'expense')
    .reduce((sum, exp) => sum + exp.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatCurrency = (num) => {
    // Note: Currency conversion is simplified/omitted for this file structure
    const symbol = currencies[currency]?.symbol || '$';
    const amount = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol}${amount}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- Chart Data ---
  const categorySpending = Object.keys(categories).map(cat => {
    const spent = finalFilteredExpenses
      .filter(exp => exp.category === cat && exp.type === 'expense')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const budget = budgets[cat] || 0;
    return {
      category: cat,
      name: categories[cat].label,
      spent,
      budget,
      percentage: budget > 0 ? (spent / budget) * 100 : 0,
      color: categories[cat].color,
      icon: categories[cat].icon
    };
  }).filter(item => item.spent > 0 || item.budget > 0);

  const categoryData = categorySpending.filter(item => item.spent > 0).map(item => ({
    name: item.name,
    value: item.spent,
    color: item.color
  }));

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const dailyData = getLast7Days().map(date => {
    const dayExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date).toISOString().split('T')[0];
      return expDate === date && exp.type === 'expense';
    }).reduce((sum, exp) => sum + exp.amount, 0);

    const dayIncome = expenses.filter(exp => {
      const expDate = new Date(exp.date).toISOString().split('T')[0];
      return expDate === date && exp.type === 'income';
    }).reduce((sum, exp) => sum + exp.amount, 0);

    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      expenses: dayExpenses,
      income: dayIncome
    };
  });
  
  // --- Budget Management ---
  const setBudgetForCategory = () => {
    if (budgetAmount && parseFloat(budgetAmount) > 0) {
      setBudgets({ ...budgets, [selectedBudgetCategory]: parseFloat(budgetAmount) });
      setBudgetAmount('');
      setShowBudgetModal(false);
    }
  };

  // --- Gemini API Feature 1: Financial Insight ---
  const generateInsight = async () => {
    if (expenses.length === 0) {
      setLlmInsight("You need to enter some transactions first before I can generate a useful insight!");
      return;
    }

    setLlmLoading(true);
    setLlmInsight('Analyzing your financial data...');

    const expenseSummary = JSON.stringify(categorySpending.map(c => ({
      category: c.name,
      spent: c.spent,
      budget: c.budget
    })), null, 2);

    const prompt = `Act as a personal financial advisor. Analyze the user's spending habits for the current period based on the following data:
Total Income: ${formatCurrency(totalIncome)}
Total Expenses: ${formatCurrency(totalExpense)}
Current Balance: ${formatCurrency(balance)}
Spending Breakdown: ${expenseSummary}

Provide a concise, single-paragraph analysis (maximum 100 words). Highlight the user's biggest spending area, compare it to the budget if set, and give one actionable tip for saving money.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: "You are a friendly, expert financial analyst. Your response must be concise and actionable, focusing only on the provided data." }] },
    };

    try {
      const response = await retryFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate insight. Please check the API key and try again.";
      setLlmInsight(text);

    } catch (error) {
      console.error("Gemini API Error:", error);
      setLlmInsight("An error occurred while connecting to the AI service. Check the console for details.");
    } finally {
      setLlmLoading(false);
    }
  };

  // --- Gemini API Feature 2: Category Suggestion (Structured Output) ---
  const suggestCategory = async () => {
    if (!description.trim()) {
        setSuggestedCategory({ category_key: 'error', confidence_reason: 'Please enter a description first.' });
        return;
    }

    setIsSuggesting(true);
    setSuggestedCategory(null);

    const prompt = `Analyze the transaction description: "${description}". Choose the single best category key from the list: [${CATEGORY_KEYS.join(', ')}].
    The categories are mapped as follows: ${JSON.stringify(categories)}.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "category_key": { "type": "STRING", "description": "The best matching category key from the available list." },
                    "confidence_reason": { "type": "STRING", "description": "A brief explanation for the category choice." }
                },
                "propertyOrdering": ["category_key", "confidence_reason"]
            }
        },
        systemInstruction: { parts: [{ text: "You are an expert transaction categorization assistant. You MUST respond only with a single JSON object that conforms to the provided schema. The 'category_key' must be one of the exact keys provided in the prompt." }] },
    };

    try {
        const response = await retryFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            const parsedJson = JSON.parse(jsonText);
            
            if (CATEGORY_KEYS.includes(parsedJson.category_key)) {
                setSuggestedCategory(parsedJson);
            } else {
                 setSuggestedCategory({ category_key: 'error', confidence_reason: `AI returned an invalid key: ${parsedJson.category_key}` });
            }
        } else {
            setSuggestedCategory({ category_key: 'error', confidence_reason: 'AI response was empty or malformed.' });
        }
    } catch (error) {
        console.error("Gemini Categorization API Error:", error);
        setSuggestedCategory({ category_key: 'error', confidence_reason: 'An error occurred during AI categorization.' });
    } finally {
        setIsSuggesting(false);
    }
  };


  // --- UI Styling & Classes ---
  const bgClass = darkMode 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
    : 'min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50';
  
  const cardClass = darkMode
    ? 'bg-gray-800/70 backdrop-blur-lg border-gray-700'
    : 'bg-white/70 backdrop-blur-lg border-white/40';
  
  const textClass = darkMode ? 'text-gray-100' : 'text-slate-800';
  const subtextClass = darkMode ? 'text-gray-400' : 'text-slate-600';
  const buttonBase = 'px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md';


  return (
    <div className={bgClass}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-inter">
        
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currency={currency}
          setCurrency={setCurrency}
          currencies={currencies}
          cardClass={cardClass}
          textClass={textClass}
          subtextClass={subtextClass}
        />

        <SummaryCards
          balance={balance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          formatCurrency={formatCurrency}
          cardClass={cardClass}
          subtextClass={subtextClass}
        />

        {/* Gemini AI Insight Card (Feature 1) */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-8 border`}>
          <div className="flex justify-between items-start mb-4">
            <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              AI Financial Insight (Gemini)
            </h3>
            <button
              onClick={generateInsight}
              disabled={llmLoading || expenses.length === 0}
              className={`flex items-center gap-2 ${buttonBase} bg-yellow-500 text-gray-900 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {llmLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                '✨ Generate Insight'
              )}
            </button>
          </div>
          <p className={`${subtextClass} italic ${llmLoading ? 'animate-pulse' : ''}`}>{llmInsight}</p>
        </div>
        
        {/* Budget Overview */}
        {categorySpending.length > 0 && (
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
        )}

        {/* Charts Section */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`${cardClass} rounded-2xl shadow-xl p-6 border`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
                  <PieChart className="w-6 h-6 text-purple-500" />
                  Category Breakdown
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('pie')}
                    className={`p-2 rounded-lg transition-all ${chartView === 'pie' ? 'bg-purple-600 text-white shadow-md' : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${subtextClass}`}`}
                  >
                    <PieChart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartView('bar')}
                    className={`p-2 rounded-lg transition-all ${chartView === 'bar' ? 'bg-purple-600 text-white shadow-md' : `${darkMode ? 'bg-gray-700' : 'bg-slate-100'} ${subtextClass}`}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  {chartView === 'pie' ? (
                    <RechartsP>
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
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
                      <Legend iconType="circle" wrapperStyle={{ padding: 10 }} payload={categoryData.map((entry) => ({ value: entry.name, type: 'circle', color: entry.color }))} />
                    </RechartsP>
                  ) : (
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#f0f0f0'} />
                      <XAxis dataKey="name" tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
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
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#ccc' }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <TransactionForm
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          category={category}
          setCategory={setCategory}
          type={type}
          setType={setType}
          editingId={editingId}
          addOrUpdateTransaction={addOrUpdateTransaction}
          suggestCategory={suggestCategory}
          isSuggesting={isSuggesting}
          suggestedCategory={suggestedCategory}
          setSuggestedCategory={setSuggestedCategory}
          categories={categories}
          currency={currency}
          currencies={currencies}
          darkMode={darkMode}
          textClass={textClass}
          subtextClass={subtextClass}
        />

        <TransactionList
          finalFilteredExpenses={finalFilteredExpenses}
          categories={categories}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          editTransaction={editTransaction}
          deleteTransaction={deleteTransaction}
          darkMode={darkMode}
          textClass={textClass}
          subtextClass={subtextClass}
          cardClass={cardClass}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filter={filter}
          setFilter={setFilter}
          buttonBase={buttonBase}
        />

        {/* Budget Modal */}
        {showBudgetModal && (
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
        )}
      </div>
    </div>
  );
}
