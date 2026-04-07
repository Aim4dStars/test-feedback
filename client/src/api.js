import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Questions
export const getQuestionCounts = () => api.get('/questions/counts').then(r => r.data);
export const getQuestions = (subject) => api.get('/questions', { params: { subject } }).then(r => r.data);

// Upload
export const uploadPDF = (file, subject, type = 'questions') => {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('subject', subject);
  formData.append('type', type);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
export const getUploadedFiles = () => api.get('/upload/files').then(r => r.data);

// Tests
export const startTest = (subject, questionCount, timeLimitMinutes) =>
  api.post('/tests/start', { subject, questionCount, timeLimitMinutes }).then(r => r.data);
export const submitAnswer = (sessionId, questionId, selectedAnswer, timeSpent) =>
  api.post(`/tests/${sessionId}/answer`, { questionId, selectedAnswer, timeSpent }).then(r => r.data);
export const completeTest = (sessionId) =>
  api.post(`/tests/${sessionId}/complete`).then(r => r.data);
export const getTestResults = (sessionId) =>
  api.get(`/tests/${sessionId}/results`).then(r => r.data);

// Progress
export const getProgress = () => api.get('/progress').then(r => r.data);
export const getSubjectProgress = (subject) => api.get(`/progress/${subject}`).then(r => r.data);
