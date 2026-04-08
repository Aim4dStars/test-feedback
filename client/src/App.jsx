import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import TestSetup from './pages/TestSetup';
import TestScreen from './pages/TestScreen';
import Results from './pages/Results';
import Progress from './pages/Progress';
import Login from './pages/Login';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      {!token ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/test/setup" element={<TestSetup />} />
            <Route path="/test/:sessionId" element={<TestScreen />} />
            <Route path="/results/:sessionId" element={<Results />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
