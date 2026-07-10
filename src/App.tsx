import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { MainLayout } from '@/components/layouts/MainLayout';
import IntersectObserver from '@/components/common/IntersectObserver';
import { OfflineBanner } from '@/components/common/OfflineBanner';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import NotFound from '@/pages/NotFound';
import Advertise from '@/pages/Advertise';

// App pages
import Dashboard from '@/pages/Dashboard';
import POS from '@/pages/POS';
import Inventory from '@/pages/Inventory';
import Customers from '@/pages/Customers';
import Expenses from '@/pages/Expenses';
import Reports from '@/pages/Reports';
import Returns from '@/pages/Returns';
import StoreCredits from '@/pages/StoreCredits';
import StockHistory from '@/pages/StockHistory';
import Staff from '@/pages/Staff';
import MyStores from '@/pages/MyStores';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPanel from '@/pages/AdminPanel';
import AdminRegister from '@/pages/admin/AdminRegister';
import AdminSetupPin from '@/pages/admin/AdminSetupPin';
import HowItWorks from '@/pages/HowItWorks';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <OfflineBanner />
          <IntersectObserver />
          <Routes>
            {/* Public auth routes */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/register"  element={<AdminRegister />} />
            <Route path="/404"             element={<NotFound />} />
            <Route path="/advertise"       element={<Advertise />} />
            <Route path="/how-it-works"    element={<HowItWorks />} />

            {/* Protected routes — all share MainLayout via Outlet */}
            <Route element={<MainLayout />}>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/pos"          element={<POS />} />
              <Route path="/inventory"    element={<Inventory />} />
              <Route path="/customers"    element={<Customers />} />
              <Route path="/expenses"     element={<Expenses />} />
              <Route path="/reports"      element={<Reports />} />
              <Route path="/returns"      element={<Returns />} />
              <Route path="/credits"      element={<StoreCredits />} />
              <Route path="/stock-history" element={<StockHistory />} />
              <Route path="/staff"        element={<Staff />} />
              <Route path="/my-stores"    element={<MyStores />} />
              <Route path="/admin/panel"  element={<AdminPanel />} />
            </Route>

            {/* Admin standalone routes — NO MainLayout (own full-page layout) */}
            <Route path="/admin"           element={<AdminDashboard />} />
            <Route path="/admin/setup-pin" element={<AdminSetupPin />} />

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
