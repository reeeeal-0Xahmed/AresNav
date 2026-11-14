import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BriefingPage } from './pages/BriefingPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ReportPage } from './pages/ReportPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BriefingPage />} />
          <Route path="explorer" element={<ExplorerPage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
