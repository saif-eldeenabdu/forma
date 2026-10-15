import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

const Floor = lazy(() => import('./pages/Floor'));
const Trade = lazy(() => import('./pages/Trade'));
const Dossiers = lazy(() => import('./pages/Dossiers'));
const Briefing = lazy(() => import('./pages/Briefing'));
const Admin = lazy(() => import('./pages/Admin'));

const Fallback = () => <p className="label p-6">Loading module…</p>;

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="floor" element={<Floor />} />
              <Route path="trade" element={<Trade />} />
              <Route path="dossiers" element={<Dossiers />} />
              <Route path="briefing" element={<Briefing />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StoreProvider>
  );
}
