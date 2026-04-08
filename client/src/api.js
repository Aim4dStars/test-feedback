import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Questions
export const getQuestionCounts = (examType = 'selective') =>
  api.get('/questions/counts', { params: { exam_type: examType } }).then(r => r.data);
export const getQuestions = (subject, examType = 'selective') =>
  api.get('/questions', { params: { subject, exam_type: examType } }).then(r => r.data);

// Upload
export const uploadPDF = (file, subject, type = 'questions', examType = 'selective') => {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('subject', subject);
  formData.append('type', type);
  formData.append('exam_type', examType);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};
export const getUploadedFiles = (examType = 'selective') =>
  api.get('/upload/files', { params: { exam_type: examType } }).then(r => r.data);

// Tests
export const startTest = (subject, questionCount, timeLimitMinutes, examType = 'selective') =>
  api.post('/tests/start', { subject, questionCount, timeLimitMinutes, exam_type: examType }).then(r => r.data);
export const submitAnswer = (sessionId, questionId, selectedAnswer, timeSpent) =>
  api.post(`/tests/${sessionId}/answer`, { questionId, selectedAnswer, timeSpent }).then(r => r.data);
export const completeTest = (sessionId) =>
  api.post(`/tests/${sessionId}/complete`).then(r => r.data);
export const getTestResults = (sessionId) =>
  api.get(`/tests/${sessionId}/results`).then(r => r.data);

// Progress
export const getProgress = (examType = 'selective') =>
  api.get('/progress', { params: { exam_type: examType } }).then(r => r.data);
export const getSubjectProgress = (subject, examType = 'selective') =>
  api.get(`/progress/${subject}`, { params: { exam_type: examType } }).then(r => r.data);
