import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HRLayout from './pages/hr/HRLayout.jsx'
import JobPostings from './pages/hr/JobPostings.jsx'
import GlobalAnalytics from './pages/hr/GlobalAnalytics.jsx'
import JobAnalytics from './pages/hr/JobAnalytics.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
