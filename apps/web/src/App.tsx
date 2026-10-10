import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GamePage } from './features/board/GamePage';
import { SetupPage } from './features/setup/SetupPage';
import { ReviewPage } from './features/review/ReviewPage';
import { GameProvider } from './state/GameProvider';

export function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </ErrorBoundary>
  );
}
