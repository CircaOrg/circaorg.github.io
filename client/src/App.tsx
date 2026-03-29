import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSimulatedData } from './hooks/useSimulatedData'; // Simulated mode for deployment
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ConfigurePage from './pages/ConfigurePage';
import ControlPage from './pages/ControlPage';
import PredictionPage from './pages/PredictionPage';
import IrrigationControlPage from './pages/IrrigationControlPage';
import SchedulerPage from './pages/SchedulerPage';
import './App.css';

export default function App() {
  useSimulatedData();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/irrigate"  element={<IrrigationControlPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/configure" element={<ConfigurePage />} />
          <Route path="/pair"      element={<Navigate to="/configure" replace />} />
          <Route path="/control"   element={<ControlPage />} />
          <Route path="/prediction" element={<PredictionPage />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
