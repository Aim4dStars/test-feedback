import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle } from 'lucide-react';
import { getTestConfig, updateTestConfig } from '../api';

const questionOptions = [5, 10, 15, 20, 25, 30];
const timeOptions = [10, 15, 20, 25, 30, 45, 60];

export default function Settings() {
  const [configs, setConfigs] = useState({ selective: null, oc: null });
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    Promise.all([
      getTestConfig('selective'),
      getTestConfig('oc'),
    ]).then(([sel, oc]) => {
      setConfigs({ selective: sel, oc });
    }).catch(console.error);
  }, []);

  const handleSave = async (examType) => {
    setSaving(examType);
    try {
      const config = configs[examType];
      await updateTestConfig(examType, config.default_questions, config.default_time_minutes);
      setSaved(examType);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      console.error(err);
    }
    setSaving(null);
  };

  const updateConfig = (examType, field, value) => {
    setConfigs(prev => ({
      ...prev,
      [examType]: { ...prev[examType], [field]: value },
    }));
  };

  if (!configs.selective || !configs.oc) {
    return <div className="text-center text-gray-500 py-12">Loading settings...</div>;
  }

  const examTypes = [
    { key: 'selective', label: 'Selective (Year 6)' },
    { key: 'oc', label: 'OC (Year 4)' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-indigo-600" />
          Test Settings
        </h2>
        <p className="text-gray-600 mt-1">Configure default question count and time limit for each exam type</p>
      </div>

      {examTypes.map(({ key, label }) => {
        const config = configs[key];
        return (
          <div key={key} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-5">
            <h3 className="font-semibold text-gray-900 text-lg">{label}</h3>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Default Questions</p>
              <div className="flex flex-wrap gap-2">
                {questionOptions.map(n => (
                  <button
                    key={n}
                    onClick={() => updateConfig(key, 'default_questions', n)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      config.default_questions === n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Default Time (minutes)</p>
              <div className="flex flex-wrap gap-2">
                {timeOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => updateConfig(key, 'default_time_minutes', t)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      config.default_time_minutes === t
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleSave(key)}
              disabled={saving === key}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium
                hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            >
              {saved === key ? (
                <><CheckCircle className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> {saving === key ? 'Saving...' : 'Save'}</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
