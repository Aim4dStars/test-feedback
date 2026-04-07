import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import TestSetup from './pages/TestSetup';
import TestScreen from './pages/TestScreen';
import Results from './pages/Results';
import Progress from './pages/Progress';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/test/setup" element={<TestSetup />} />
          <Route path="/test/:sessionId" element={<TestScreen />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
