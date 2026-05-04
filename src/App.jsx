
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApplicationForm from './pages/ApplicationForm';
import JobPostings from './pages/hr/JobPostings';
import JobAnalytics from './pages/hr/JobAnalytics';
import GlobalAnalytics from './pages/hr/GlobalAnalytics';
import HRLayout from './pages/hr/HRLayout';

import JobBoard from './pages/JobBoard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<JobBoard />} />

        {/* Dynamic Application Form */}
        <Route path="/apply/:jobId" element={<ApplicationForm />} />

        {/* HR Portal Protected Routes (Shell) */}
        <Route path="/hr" element={<HRLayout />}>
          <Route index element={<JobPostings />} />
          <Route path="analytics" element={<GlobalAnalytics />} />
          <Route path="jobs/:id/analytics" element={<JobAnalytics />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
