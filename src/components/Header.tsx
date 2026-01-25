import { FC } from 'react';

import { Sun, Moon } from 'lucide-react';
import { Currencies } from '../types';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  currency: string;
  setCurrency: (value: string) => void;
  currencies: Currencies;
  cardClass: string;
  textClass: string;
  subtextClass: string;
}

const Header: FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  currency,
  setCurrency,
  currencies,
  cardClass,
  textClass,
  subtextClass
}) => {
  return (
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
  );
};

export default Header;
