import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, BarChart3, Calculator, BookText, Brain, PenTool } from 'lucide-react';
import { getQuestionCounts, getProgress } from '../api';

const subjectIcons = {
  maths: Calculator,
  reading: BookText,
  thinking: Brain,
  writing: PenTool,
};

const subjectColors = {
  maths: 'bg-blue-500',
  reading: 'bg-green-500',
  thinking: 'bg-purple-500',
  writing: 'bg-orange-500',
};

const subjectLabels = {
  maths: 'Mathematics',
  reading: 'Reading',
  thinking: 'Thinking Skills',
  writing: 'Writing',
};

export default function Dashboard() {
  const [counts, setCounts] = useState({ maths: 0, reading: 0, thinking: 0, writing: 0 });
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    getQuestionCounts().then(setCounts).catch(console.error);
    getProgress().then(setProgress).catch(console.error);
  }, []);

  const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h2>
        <p className="text-gray-600 text-lg">
          Ready to practice for the NSW Selective School Exam? Choose a subject to get started.
        </p>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(subjectLabels).map(([key, label]) => {
          const Icon = subjectIcons[key];
          const stat = progress?.subjectStats?.find(s => s.subject === key);
          return (
            <div key={key} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${subjectColors[key]} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{label}</h3>
              <p className="text-sm text-gray-500 mt-1">{counts[key]} questions available</p>
              {stat && (
                <div className="mt-3 text-sm">
                  <span className="text-indigo-600 font-medium">{stat.avg_score}% avg</span>
                  <span className="text-gray-400 mx-1">·</span>
                  <span className="text-gray-500">{stat.tests_taken} tests</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/test/setup"
          className="flex items-center gap-4 bg-indigo-600 text-white rounded-2xl p-6 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <BookOpen className="w-8 h-8" />
          <div>
            <h3 className="font-semibold text-lg">Start a Test</h3>
            <p className="text-indigo-200 text-sm">Practice with timed questions</p>
          </div>
        </Link>

        <Link
          to="/upload"
          className="flex items-center gap-4 bg-white rounded-2xl p-6 hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Upload Questions</h3>
            <p className="text-gray-500 text-sm">Import from PDF</p>
          </div>
        </Link>

        <Link
          to="/progress"
          className="flex items-center gap-4 bg-white rounded-2xl p-6 hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">View Progress</h3>
            <p className="text-gray-500 text-sm">Track your improvement</p>
          </div>
        </Link>
      </div>

      {/* Recent Tests */}
      {progress?.recentTests?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 text-lg mb-4">Recent Tests</h3>
          <div className="space-y-3">
            {progress.recentTests.map(test => (
              <Link
                key={test.id}
                to={`/results/${test.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${subjectColors[test.subject]}`} />
                  <span className="font-medium text-gray-700 capitalize">{subjectLabels[test.subject]}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(test.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${test.percentage >= 70 ? 'text-green-600' : test.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {test.percentage}%
                  </span>
                  <span className="text-gray-400 text-sm">({test.score}/{test.total_questions})</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {totalQuestions === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-medium">No questions loaded yet!</p>
          <p className="text-amber-600 text-sm mt-1">
            <Link to="/upload" className="underline">Upload a PDF</Link> to get started with practice tests.
          </p>
        </div>
      )}
    </div>
  );
}
