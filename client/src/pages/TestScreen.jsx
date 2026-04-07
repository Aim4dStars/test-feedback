import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';
import Timer from '../components/Timer';
import PdfPageViewer from '../components/PdfPageViewer';
import { submitAnswer, completeTest } from '../api';

export default function TestScreen() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const testData = location.state;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // If no test data, redirect to setup
  useEffect(() => {
    if (!testData) {
      navigate('/test/setup');
    }
  }, [testData, navigate]);

  if (!testData) return null;

  const { questions, timeLimitSeconds, totalQuestions } = testData;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (letter) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: letter }));
  };

  const saveCurrentAnswer = useCallback(async () => {
    const selected = answers[currentQuestion.id];
    if (selected) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      try {
        await submitAnswer(sessionId, currentQuestion.id, selected, timeSpent);
      } catch (e) {
        console.error('Failed to save answer:', e);
      }
    }
  }, [answers, currentQuestion?.id, questionStartTime, sessionId]);

  const goToQuestion = async (index) => {
    await saveCurrentAnswer();
    setCurrentIndex(index);
    setQuestionStartTime(Date.now());
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) goToQuestion(currentIndex + 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    await saveCurrentAnswer();

    // Submit any remaining unanswered questions
    for (const q of questions) {
      if (answers[q.id]) {
        await submitAnswer(sessionId, q.id, answers[q.id], 0);
      }
    }

    const results = await completeTest(sessionId);
    navigate(`/results/${sessionId}`, { state: results });
  };

  const handleTimeUp = async () => {
    await handleFinish();
  };

  const options = [
    { letter: 'A', text: currentQuestion.option_a },
    { letter: 'B', text: currentQuestion.option_b },
    { letter: 'C', text: currentQuestion.option_c },
    { letter: 'D', text: currentQuestion.option_d },
  ];
  if (currentQuestion.option_e) {
    options.push({ letter: 'E', text: currentQuestion.option_e });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Progress */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Progress</p>
          <p className="text-2xl font-bold text-gray-900">
            {answeredCount}<span className="text-gray-400">/{totalQuestions}</span>
          </p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Timer */}
        <Timer totalSeconds={timeLimitSeconds} onTimeUp={handleTimeUp} />

        {/* Question Number */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Question</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentIndex + 1}<span className="text-gray-400">/{totalQuestions}</span>
          </p>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-6">
        <div className="mb-6">
          <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Question {currentIndex + 1}
          </span>
        </div>
        {currentQuestion.source_pdf_stored && currentQuestion.source_page > 0 && (
          <PdfPageViewer
            pdfUrl={`/uploads/${currentQuestion.source_pdf_stored}`}
            pageNumber={currentQuestion.source_page}
          />
        )}
        <h3 className="text-xl font-medium text-gray-900 leading-relaxed mb-8">
          {currentQuestion.question_text}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {options.map(({ letter, text }) => {
            const isSelected = answers[currentQuestion.id] === letter;
            return (
              <button
                key={letter}
                onClick={() => selectAnswer(letter)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  isSelected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {letter}
                </span>
                <span className={`text-base ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-gray-200 text-gray-600 
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <Flag className="w-4 h-4" />
          Finish Test
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === totalQuestions - 1}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl 
            hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Question Navigator */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <p className="text-sm font-medium text-gray-500 mb-3">Question Navigator</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(i)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Finish Test?</h3>
            </div>
            <p className="text-gray-600 mb-2">
              You have answered <strong>{answeredCount}</strong> out of <strong>{totalQuestions}</strong> questions.
            </p>
            {answeredCount < totalQuestions && (
              <p className="text-amber-600 text-sm mb-4">
                ⚠️ {totalQuestions - answeredCount} question(s) are unanswered and will be marked incorrect.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleFinish(); }}
                disabled={submitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 
                  disabled:bg-gray-300 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
