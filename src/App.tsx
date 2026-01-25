import { useState, useEffect, useCallback, useMemo } from 'react';
import { CATEGORIES, CATEGORY_KEYS, CURRENCIES } from './utils/constants';
import { retryFetch, formatCurrency as formatCurrencyHelper, formatDate, getFilteredByDateRange } from './utils/helpers';
import { Transaction, Budget, SuggestedCategory } from './types';

// Components
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import InsightCard from './components/InsightCard';
import BudgetOverview from './components/BudgetOverview';
import Charts from './components/Charts';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import BudgetModal from './components/BudgetModal';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export default function App() {
  // --- State Initialization with LocalStorage ---
  const [expenses, setExpenses] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance-flow-expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget>(() => {
    const saved = localStorage.getItem('finance-flow-budgets');
    return saved ? JSON.parse(saved) : {};
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [filter, setFilter] = useState('all');
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('finance-flow-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState('food');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [currency, setCurrency] = useState('USD');

  // --- Gemini States ---
  const [llmInsight, setLlmInsight] = useState('Generate an insight below to see smart analysis of your spending.');
  const [llmLoading, setLlmLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<SuggestedCategory | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('finance-flow-expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('finance-flow-budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance-flow-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // --- Transaction Management ---
  const addOrUpdateTransaction = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) return;

    const newTransaction: Transaction = {
      id: editingId || Date.now(),
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      type,
      date: editingId ? (expenses.find(e => e.id === editingId)?.date || new Date().toISOString()) : new Date().toISOString()
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
    setSuggestedCategory(null);
  };

  const editTransaction = (exp: Transaction) => {
    setDescription(exp.description);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setType(exp.type);
    setEditingId(exp.id);
    setSuggestedCategory(null);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  const deleteTransaction = (id: number) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  // --- Calculations ---
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(exp => filter === 'all' ? true : exp.type === filter);

    if (searchQuery) {
      result = result.filter(exp =>
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        CATEGORIES[exp.category]?.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return getFilteredByDateRange(result, dateRange);
  }, [expenses, filter, searchQuery, dateRange]);

  const totalIncome = useMemo(() =>
    filteredExpenses.filter(exp => exp.type === 'income').reduce((sum, exp) => sum + exp.amount, 0),
  [filteredExpenses]);

  const totalExpense = useMemo(() =>
    filteredExpenses.filter(exp => exp.type === 'expense').reduce((sum, exp) => sum + exp.amount, 0),
  [filteredExpenses]);

  const balance = totalIncome - totalExpense;

  const formatCurrency = useCallback((num: number) => {
    return formatCurrencyHelper(num, currency, CURRENCIES);
  }, [currency]);

  // --- Chart Data ---
  const categorySpending = useMemo(() => {
    return Object.keys(CATEGORIES).map(cat => {
      const spent = filteredExpenses
        .filter(exp => exp.category === cat && exp.type === 'expense')
        .reduce((sum, exp) => sum + exp.amount, 0);
      const budget = budgets[cat] || 0;
      return {
        category: cat,
        name: CATEGORIES[cat].label,
        spent,
        budget,
        percentage: budget > 0 ? (spent / budget) * 100 : 0,
        color: CATEGORIES[cat].color,
        icon: CATEGORIES[cat].icon
      };
    }).filter(item => item.spent > 0 || item.budget > 0);
  }, [filteredExpenses, budgets]);

  const categoryData = useMemo(() =>
    categorySpending.filter(item => item.spent > 0).map(item => ({
      name: item.name,
      value: item.spent,
      color: item.color
    })),
  [categorySpending]);

  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }

    return days.map(date => {
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
  }, [expenses]);

  // --- Budget Management ---
  const setBudgetForCategory = () => {
    if (budgetAmount && parseFloat(budgetAmount) > 0) {
      setBudgets(prev => ({ ...prev, [selectedBudgetCategory]: parseFloat(budgetAmount) }));
      setBudgetAmount('');
      setShowBudgetModal(false);
    }
  };

  // --- Gemini API ---
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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

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

  const suggestCategory = async () => {
    if (!description.trim()) {
        setSuggestedCategory({ category_key: 'error', confidence_reason: 'Please enter a description first.' });
        return;
    }

    setIsSuggesting(true);
    setSuggestedCategory(null);

    const prompt = `Analyze the transaction description: "${description}". Choose the single best category key from the list: [${CATEGORY_KEYS.join(', ')}].
    The categories are mapped as follows: ${JSON.stringify(CATEGORIES)}.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

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

  // --- UI Styling ---
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
          currencies={CURRENCIES}
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

        <InsightCard
          llmInsight={llmInsight}
          llmLoading={llmLoading}
          generateInsight={generateInsight}
          expensesCount={expenses.length}
          cardClass={cardClass}
          textClass={textClass}
          subtextClass={subtextClass}
          buttonBase={buttonBase}
        />

        <BudgetOverview
          categorySpending={categorySpending}
          setShowBudgetModal={setShowBudgetModal}
          formatCurrency={formatCurrency}
          cardClass={cardClass}
          textClass={textClass}
          subtextClass={subtextClass}
          darkMode={darkMode}
          buttonBase={buttonBase}
        />

        <Charts
          expenses={expenses}
          categoryData={categoryData}
          dailyData={dailyData}
          chartView={chartView}
          setChartView={setChartView}
          formatCurrency={formatCurrency}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
        />

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
          setEditingId={setEditingId}
          addOrUpdateTransaction={addOrUpdateTransaction}
          suggestCategory={suggestCategory}
          isSuggesting={isSuggesting}
          suggestedCategory={suggestedCategory}
          setSuggestedCategory={setSuggestedCategory}
          categories={CATEGORIES}
          currencySymbol={CURRENCIES[currency]?.symbol || '$'}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          subtextClass={subtextClass}
        />

        <TransactionList
          transactions={filteredExpenses}
          categories={CATEGORIES}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          editTransaction={editTransaction}
          deleteTransaction={deleteTransaction}
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
          subtextClass={subtextClass}
          buttonBase={buttonBase}
        />

        <BudgetModal
          showBudgetModal={showBudgetModal}
          setShowBudgetModal={setShowBudgetModal}
          selectedBudgetCategory={selectedBudgetCategory}
          setSelectedBudgetCategory={setSelectedBudgetCategory}
          budgetAmount={budgetAmount}
          setBudgetAmount={setBudgetAmount}
          setBudgetForCategory={setBudgetForCategory}
          categories={CATEGORIES}
          darkMode={darkMode}
          cardClass={cardClass}
          textClass={textClass}
        />
      </div>
    </div>
  );
}
