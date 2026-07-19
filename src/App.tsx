/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './hooks/useStore';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import DailyEntry from './pages/DailyEntry';
import BulkEntry from './pages/BulkEntry';
import Statements from './pages/Statements';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="daily-entry" element={<DailyEntry />} />
            <Route path="bulk-entry" element={<BulkEntry />} />
            <Route path="statements" element={<Statements />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}

