import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotesProvider } from './contexts/NotesContext';

import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import EditorPage      from './pages/EditorPage';
import ProfilePage     from './pages/ProfilePage';
import NotFoundPage    from './pages/NotFoundPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-ink-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-ink-300 border-t-ink-700 rounded-full animate-spin" />
      <p className="text-sm text-ink-500 font-body">Loading CollabNotes…</p>
    </div>
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/"          element={<Navigate to="/dashboard" replace />} />
    <Route path="/login"     element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register"  element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
    <Route path="/notes/:id" element={<PrivateRoute><EditorPage /></PrivateRoute>} />
    <Route path="/profile"   element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
    <Route path="*"          element={<NotFoundPage />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <AppRoutes />
      </NotesProvider>
    </AuthProvider>
  );
}
