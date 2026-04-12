import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, BarChart3, Home, LogOut, Settings } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/test/setup', label: 'Start Test', icon: BookOpen },
  { path: '/upload', label: 'Upload PDFs', icon: Upload, adminOnly: true },
  { path: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { path: '/progress', label: 'My Progress', icon: BarChart3 },
];

const examTypeConfig = {
  selective: { title: 'NSW Selective Exam', subtitle: 'Year 6 • Practice & Progress' },
  oc: { title: 'NSW OC Test', subtitle: 'Year 4 • Practice & Progress' },
};

const subscriptionBadge = {
  free: { className: 'bg-gray-100 text-gray-600', label: 'Free' },
  basic: { className: 'bg-blue-100 text-blue-700', label: 'Basic' },
  premium: { className: 'bg-amber-100 text-amber-700', label: 'Premium ⭐' },
};

export default function Layout({ children }) {
  const location = useLocation();
  const [examType, setExamType] = useState(() => localStorage.getItem('examType') || 'selective');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const handleExamTypeChange = (type) => {
    if (type === examType) return;
    localStorage.setItem('examType', type);
    setExamType(type);
    window.location.reload();
  };

  const config = examTypeConfig[examType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
                <p className="text-xs text-gray-500">{config.subtitle}</p>
              </div>
            </Link>
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => handleExamTypeChange('selective')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  examType === 'selective'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Selective (Yr 6)
              </button>
              <button
                onClick={() => handleExamTypeChange('oc')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  examType === 'oc'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                OC (Yr 4)
              </button>
            </div>
          </div>
          <nav className="flex gap-1">
            {navItems.filter(item => !item.adminOnly || user?.isAdmin).map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          {user && (
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user.display_name || user.username}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subscriptionBadge[user.subscription_type || 'free']?.className}`}>
                  {subscriptionBadge[user.subscription_type || 'free']?.label}
                </span>
              </div>
              <button onClick={handleLogout} title="Logout">
                <LogOut className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
