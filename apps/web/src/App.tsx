import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GamePage } from './features/board/GamePage';
import { SetupPage } from './features/setup/SetupPage';
import { ReviewPage } from './features/review/ReviewPage';
import { GameProvider } from './state/GameProvider';
import { de } from './i18n/de';

// Eigenes Bündel: Spieler laden den Admin-Code nicht mit.
const AdminApp = lazy(() =>
  import('./features/admin/AdminApp').then((module) => ({ default: module.AdminApp })),
);

export function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<p className="p-6 text-text-muted">{de.admin.loading}</p>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </ErrorBoundary>
  );
}
