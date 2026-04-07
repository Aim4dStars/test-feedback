import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Trophy, ArrowLeft, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import PdfPageViewer from '../components/PdfPageViewer';
import { getTestResults } from '../api';

const subjectLabels = {
  maths: 'Mathematics',
  reading: 'Reading',
  thinking: 'Thinking Skills',
  writing: 'Writing',
};

export default function Results() {
  const { sessionId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(location.state || null);
  const [loading, setLoading] = useState(!location.state);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    if (!data) {
      getTestResults(sessionId).then(d => {
        setData(d);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [sessionId, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Results not found.</p>
        <Link to="/" className="text-indigo-600 underline mt-2 inline-block">Go Home</Link>
      </div>
    );
  }

  const { score, totalQuestions, percentage, results, session } = data;
  const isGreat = percentage >= 80;
  const isGood = percentage >= 60;

  const toggleQuestion = (id) => {
    setExpandedQ(expandedQ === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Card */}
      <div className={`rounded-2xl p-8 text-center shadow-sm ${
        isGreat ? 'bg-green-50 border border-green-200' :
        isGood ? 'bg-amber-50 border border-amber-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <Trophy className={`w-16 h-16 mx-auto mb-4 ${
          isGreat ? 'text-green-500' : isGood ? 'text-amber-500' : 'text-red-500'
        }`} />
        <h2 className="text-4xl font-bold text-gray-900 mb-2">{percentage}%</h2>
        <p className="text-xl text-gray-700">{score} out of {totalQuestions} correct</p>
        <p className="text-sm text-gray-500 mt-2 capitalize">
          {subjectLabels[session.subject]} · {new Date(session.started_at).toLocaleDateString()}
        </p>
        <p className="mt-4 text-lg font-medium">
          {isGreat ? '🎉 Excellent work! Keep it up!' :
           isGood ? '👍 Good effort! Review the mistakes below.' :
           '💪 Keep practicing! Check the explanations below.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <Link
          to="/test/setup"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          New Test
        </Link>
      </div>

      {/* Question-by-question Review */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Question Review</h3>
          <p className="text-sm text-gray-500">Click any question to see the explanation</p>
        </div>

        <div className="divide-y divide-gray-100">
          {results.map((r, i) => {
            const isCorrect = r.is_correct === 1;
            const isExpanded = expandedQ === r.id;
            const optionMap = { A: r.option_a, B: r.option_b, C: r.option_c, D: r.option_d, ...(r.option_e ? { E: r.option_e } : {}) };

            return (
              <div key={r.id}>
                <button
                  onClick={() => toggleQuestion(r.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      <span className="text-gray-400 mr-2">Q{i + 1}.</span>
                      {r.question_text}
                    </p>
                    {!isCorrect && r.selected_answer && (
                      <p className="text-sm text-red-500 mt-0.5">
                        Your answer: {r.selected_answer}) {optionMap[r.selected_answer]}
                      </p>
                    )}
                    {!isCorrect && !r.selected_answer && (
                      <p className="text-sm text-gray-400 mt-0.5 italic">Not answered</p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 ml-9">
                    {r.source_pdf_stored && r.source_page > 0 && (
                      <PdfPageViewer
                        pdfUrl={`/uploads/${r.source_pdf_stored}`}
                        pageNumber={r.source_page}
                      />
                    )}
                    {/* All options */}
                    <div className="space-y-2 mb-4">
                      {(() => { const allOptions = ['A', 'B', 'C', 'D']; if (r.option_e) allOptions.push('E'); return allOptions; })().map(letter => {
                        const isCorrectOption = letter === r.correct_answer;
                        const isSelectedOption = letter === r.selected_answer;
                        const isWrong = isSelectedOption && !isCorrectOption;
                        return (
                          <div
                            key={letter}
                            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                              isCorrectOption
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : isWrong
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                              isCorrectOption ? 'bg-green-200 text-green-800' :
                              isWrong ? 'bg-red-200 text-red-800' :
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {letter}
                            </span>
                            <span>{optionMap[letter]}</span>
                            {isCorrectOption && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                            {isWrong && <XCircle className="w-4 h-4 text-red-600 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {r.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-800 mb-1">💡 Explanation</p>
                        <p className="text-sm text-blue-700">{r.explanation}</p>
                      </div>
                    )}
                    {!r.explanation && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-500 italic">
                          No explanation available for this question.
                          The correct answer is <strong>{r.correct_answer}) {optionMap[r.correct_answer]}</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
