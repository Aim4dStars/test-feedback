import { useState, useEffect, useRef } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, Loader2, BookOpen, Key, GraduationCap } from 'lucide-react';
import { uploadPDF, getUploadedFiles, getQuestionCounts } from '../api';

const subjects = [
  { value: 'maths', label: 'Mathematics' },
  { value: 'reading', label: 'Reading' },
  { value: 'thinking', label: 'Thinking Skills' },
  { value: 'writing', label: 'Writing' },
];

const uploadSteps = [
  {
    type: 'questions',
    step: 1,
    title: 'Upload Questions PDF',
    description: 'Numbered MCQs with options A-D or A-E',
    icon: BookOpen,
    color: 'indigo',
  },
  {
    type: 'answers',
    step: 2,
    title: 'Upload Answer Key PDF',
    description: 'Simple answer key: 1 E, 2 A, 3 C...',
    icon: Key,
    color: 'amber',
  },
  {
    type: 'answers_explained',
    step: 3,
    title: 'Upload Explained Answers PDF',
    description: 'Detailed explanations with correct answers',
    icon: GraduationCap,
    color: 'green',
  },
];

const colorMap = {
  indigo: {
    border: 'border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50',
    icon: 'text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  amber: {
    border: 'border-amber-300 hover:border-amber-400 hover:bg-amber-50',
    icon: 'text-amber-400',
    badge: 'bg-amber-100 text-amber-700',
  },
  green: {
    border: 'border-green-300 hover:border-green-400 hover:bg-green-50',
    icon: 'text-green-400',
    badge: 'bg-green-100 text-green-700',
  },
};

export default function Upload() {
  const [subject, setSubject] = useState('maths');
  const [uploading, setUploading] = useState({});
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [counts, setCounts] = useState({});
  const fileRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    getUploadedFiles().then(setFiles).catch(console.error);
    getQuestionCounts().then(setCounts).catch(console.error);
  };

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: null }));
    setResults(prev => ({ ...prev, [type]: null }));

    try {
      const data = await uploadPDF(file, subject, type);
      setResults(prev => ({ ...prev, [type]: data }));
      loadData();
    } catch (err) {
      setErrors(prev => ({ ...prev, [type]: err.response?.data || { error: err.message } }));
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
      if (fileRefs.current[type]) fileRefs.current[type].value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Questions</h2>
        <p className="text-gray-600 mt-1">Import questions, answer keys, and explanations from PDF files</p>
      </div>

      {/* Subject Selection */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
        <div className="flex gap-2 flex-wrap">
          {subjects.map(s => (
            <button
              key={s.value}
              onClick={() => setSubject(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                subject === s.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Steps */}
      {uploadSteps.map((step) => {
        const Icon = step.icon;
        const colors = colorMap[step.color];
        const isUploading = uploading[step.type];
        const result = results[step.type];
        const error = errors[step.type];

        return (
          <div key={step.type} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                Step {step.step}
              </span>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <span className="text-sm text-gray-400">— {step.description}</span>
            </div>

            <label
              className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${isUploading ? 'border-gray-200 bg-gray-50' : colors.border}`}
            >
              <input
                ref={el => fileRefs.current[step.type] = el}
                type="file"
                accept=".pdf"
                onChange={(e) => handleUpload(e, step.type)}
                disabled={isUploading}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="w-10 h-10 text-gray-400 mx-auto animate-spin" />
              ) : (
                <Icon className={`w-10 h-10 ${colors.icon} mx-auto`} />
              )}
              <p className="mt-3 text-sm font-medium text-gray-700">
                {isUploading ? 'Processing...' : 'Click to upload PDF'}
              </p>
            </label>

            {result && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  {result.type === 'questions' ? (
                    <p className="text-green-800 font-medium">
                      Imported {result.questionsImported} questions from {result.filename}
                    </p>
                  ) : (
                    <p className="text-green-800 font-medium">
                      Parsed {result.answersParsed} answers, updated {result.questionsUpdated}/{result.totalQuestionsInSubject} questions from {result.filename}
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 text-sm font-medium">{error.error}</p>
                  {error.rawTextPreview && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">View extracted text</summary>
                      <pre className="mt-1 text-xs text-red-600 bg-red-100 p-2 rounded whitespace-pre-wrap max-h-32 overflow-auto">
                        {error.rawTextPreview}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Question counts */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Question Bank</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {subjects.map(s => (
            <div key={s.value} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{counts[s.value] || 0}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Uploaded Files</h3>
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{f.source_pdf}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{f.subject}</span>
                  <span>{f.question_count} questions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
