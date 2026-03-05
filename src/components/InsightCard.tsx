import { FC } from 'react';

import { Lightbulb } from 'lucide-react';

interface InsightCardProps {
  llmInsight: string;
  llmLoading: boolean;
  generateInsight: () => void;
  expensesCount: number;
  cardClass: string;
  textClass: string;
  subtextClass: string;
  buttonBase: string;
}

const InsightCard: FC<InsightCardProps> = ({
  llmInsight,
  llmLoading,
  generateInsight,
  expensesCount,
  cardClass,
  textClass,
  subtextClass,
  buttonBase
}) => {
  return (
    <div className={`${cardClass} rounded-2xl shadow-xl p-6 mb-8 border`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          AI Financial Insight (Gemini)
        </h3>
        <button
          onClick={generateInsight}
          disabled={llmLoading || expensesCount === 0}
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
  );
};

export default InsightCard;
