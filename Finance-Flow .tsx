import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, BarChart3, Moon, Sun, Download, Upload, Edit2, Target, Lightbulb, Zap } from 'lucide-react';
import { PieChart as RechartsP, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';

// Global variables (mocked/safe for compilation/public repo)
const __app_id = 'expense-tracker-v1';
const apiKey = ""; 

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
    setExpenses(expenses.filter(exp => exp.id !== id));
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
        
        {/* Header & Controls */}
        <header className="mb-8 text-center relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl ${cardClass} shadow-lg hover:scale-110 transition-all border`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
            </button>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`px-4 py-2 rounded-xl ${cardClass} ${textClass} font-semibold shadow-lg focus:outline-none border`}
            >
              {Object.entries(currencies).map(([code, curr]) => (
                <option key={code} value={code}>{curr.symbol} {code}</option>
              ))}
            </select>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Finance Flow
          </h1>
          <p className={`${subtextClass} text-lg`}>Smart Financial Management with AI Insights</p>
        </header>

        {/* Summary Cards */}
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

        {/* Transaction Form */}
        <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-8 border`}>
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

        {/* Transactions List */}
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
