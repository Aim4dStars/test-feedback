import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, BookText, Brain, PenTool, Play, AlertCircle } from 'lucide-react';
import { getQuestionCounts, startTest } from '../api';

const subjectConfig = [
  { value: 'maths', label: 'Mathematics', icon: Calculator, color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'reading', label: 'Reading', icon: BookText, color: 'bg-green-500', lightColor: 'bg-green-100 text-green-600 border-green-200' },
  { value: 'thinking', label: 'Thinking Skills', icon: Brain, color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-600 border-purple-200' },
  { value: 'writing', label: 'Writing', icon: PenTool, color: 'bg-orange-500', lightColor: 'bg-orange-100 text-orange-600 border-orange-200' },
];

const questionOptions = [5, 10, 15, 20, 25, 30];
const timeOptions = [10, 15, 20, 25, 30, 45, 60];

export default function TestSetup() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [subject, setSubject] = useState('maths');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    getQuestionCounts().then(setCounts).catch(console.error);
  }, []);

  const availableCount = counts[subject] || 0;

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const data = await startTest(subject, Math.min(questionCount, availableCount), timeLimit);
      navigate(`/test/${data.sessionId}`, { state: data });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start test');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Start a Practice Test</h2>
        <p className="text-gray-600 mt-1">Choose your subject, number of questions, and time limit</p>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Select Subject</h3>
        <div className="grid grid-cols-2 gap-3">
          {subjectConfig.map(s => {
            const Icon = s.icon;
            const isSelected = subject === s.value;
            const available = counts[s.value] || 0;
            return (
              <button
                key={s.value}
                onClick={() => setSubject(s.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? `${s.lightColor} border-current`
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{s.label}</p>
                    <p className="text-xs text-gray-500">{available} questions</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Count */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Number of Questions</h3>
        <div className="flex flex-wrap gap-2">
          {questionOptions.map(n => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              disabled={n > availableCount}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                questionCount === n
                  ? 'bg-indigo-600 text-white'
                  : n > availableCount
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {availableCount > 0 && availableCount < questionCount && (
          <p className="text-sm text-amber-600 mt-2">
            Only {availableCount} questions available — test will use all of them.
          </p>
        )}
      </div>

      {/* Time Limit */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Time Limit (minutes)</h3>
        <div className="flex flex-wrap gap-2">
          {timeOptions.map(t => (
            <button
              key={t}
              onClick={() => setTimeLimit(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                timeLimit === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t} min
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={starting || availableCount === 0}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-semibold hover:bg-indigo-700 
          disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
      >
        {starting ? (
          <>Starting...</>
        ) : availableCount === 0 ? (
          <>No questions available — upload a PDF first</>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Start Test ({Math.min(questionCount, availableCount)} questions, {timeLimit} min)
          </>
        )}
      </button>
    </div>
  );
}
