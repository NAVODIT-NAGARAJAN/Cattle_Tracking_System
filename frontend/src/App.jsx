import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnimalsPage from './pages/AnimalsPage';
import AddAnimalPage from './pages/AddAnimalPage';
import AnimalDetailPage from './pages/AnimalDetailPage';
import TrackingPage from './pages/TrackingPage';
import DetectionsPage from './pages/DetectionsPage';
import HistoryPage from './pages/HistoryPage';
import DevicesPage from './pages/DevicesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected — all under DashboardLayout */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/animals" element={<AnimalsPage />} />
              <Route path="/animals/add" element={<AddAnimalPage />} />
              <Route path="/animals/:animalId" element={<AnimalDetailPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/detections" element={<DetectionsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
