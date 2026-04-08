import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Award, Clock, BookOpen } from 'lucide-react';
import { getProgress } from '../api';

const subjectLabels = {
  maths: 'Mathematics',
  reading: 'Reading',
  thinking: 'Thinking Skills',
  writing: 'Writing',
};

const subjectColors = {
  maths: { bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-700' },
  reading: { bg: 'bg-green-500', light: 'bg-green-100 text-green-700' },
  thinking: { bg: 'bg-purple-500', light: 'bg-purple-100 text-purple-700' },
  writing: { bg: 'bg-orange-500', light: 'bg-orange-100 text-orange-700' },
};

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const examType = localStorage.getItem('examType') || 'selective';

  useEffect(() => {
    getProgress(examType).then(d => {
      setProgress(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  if (!progress || progress.totalTestsCompleted === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No progress yet</h2>
        <p className="text-gray-500 mb-6">Complete a practice test to start tracking your progress.</p>
        <Link
          to="/test/setup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Start a Test
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Progress</h2>
        <p className="text-gray-600 mt-1">Track your improvement across all subjects</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Tests Completed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{progress.totalTestsCompleted}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Best Score</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.max(...progress.subjectStats.map(s => s.best_score || 0)).toFixed(0)}%
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Overall Average</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(progress.subjectStats.reduce((sum, s) => sum + (s.avg_score || 0), 0) / progress.subjectStats.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
        <div className="space-y-4">
          {progress.subjectStats.map(stat => {
            const colors = subjectColors[stat.subject] || subjectColors.maths;
            return (
              <div key={stat.subject} className="flex items-center gap-4">
                <div className="w-32 sm:w-40">
                  <p className="font-medium text-gray-900">{subjectLabels[stat.subject]}</p>
                  <p className="text-xs text-gray-500">{stat.tests_taken} tests</p>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full ${colors.bg} rounded-lg transition-all flex items-center justify-end pr-3`}
                      style={{ width: `${Math.max(stat.avg_score, 5)}%` }}
                    >
                      {stat.avg_score >= 15 && (
                        <span className="text-white text-xs font-bold">{stat.avg_score}%</span>
                      )}
                    </div>
                    {stat.avg_score < 15 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600">
                        {stat.avg_score}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right w-20">
                  <span className={`text-sm font-medium px-2 py-1 rounded-lg ${colors.light}`}>
                    Best: {(stat.best_score || 0).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tests */}
      {progress.recentTests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tests</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500">Subject</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Score</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500">Percentage</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500">Review</th>
                </tr>
              </thead>
              <tbody>
                {progress.recentTests.map(test => (
                  <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2 text-gray-600">
                      {new Date(test.completed_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-gray-900 font-medium">
                      {subjectLabels[test.subject]}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {test.score}/{test.total_questions}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`font-bold ${
                        test.percentage >= 80 ? 'text-green-600' :
                        test.percentage >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {test.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        to={`/results/${test.id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
