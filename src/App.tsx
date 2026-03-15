/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import POS from './pages/POS';
import Services from './pages/Services';
import Users from './pages/Users';
import Sales from './pages/Sales';
import Returns from './pages/Returns';
import PurchaseOrders from './pages/PurchaseOrders';
import StockOpname from './pages/StockOpname';
import Discounts from './pages/Discounts';
import Shifts from './pages/Shifts';
import { ShiftBanner } from './components/ShiftBanner';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <ToastProvider>
          <AuthProvider>
            <ShiftBanner />
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes with Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pos" element={<ProtectedRoute allowedRoles={['admin', 'owner', 'karyawan']}><POS /></ProtectedRoute>} />
                  <Route path="/services" element={<ProtectedRoute allowedRoles={['admin', 'owner', 'karyawan']}><Services /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Products /></ProtectedRoute>} />
                  <Route path="/sales" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Sales /></ProtectedRoute>} />
                  <Route path="/returns" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Returns /></ProtectedRoute>} />
                  <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><PurchaseOrders /></ProtectedRoute>} />
                  <Route path="/stock-opname" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><StockOpname /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Reports /></ProtectedRoute>} />
                  <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Suppliers /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Users /></ProtectedRoute>} />
                  <Route path="/discounts" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Discounts /></ProtectedRoute>} />
                  <Route path="/shifts" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Shifts /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'owner']}><Settings /></ProtectedRoute>} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </div>
    </BrowserRouter>
  );
}
