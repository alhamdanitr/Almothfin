/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "./hooks/useStore";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Workers from "./pages/Workers";
import DailyEntry from "./pages/DailyEntry";
import BulkEntry from "./pages/BulkEntry";
import Statements from "./pages/Statements";
import SmartChat from "./pages/SmartChat";
import Settings from "./pages/Settings";

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
            <Route path="smart-chat" element={<SmartChat />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
