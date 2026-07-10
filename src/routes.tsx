import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Returns from './pages/Returns';
import StoreCredits from './pages/StoreCredits';
import StockHistory from './pages/StockHistory';
import Staff from './pages/Staff';
import MyStores from './pages/MyStores';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Tutorials from './pages/Tutorials';
import NotFound from './pages/NotFound';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  // Auth (public)
  { name: 'Login',    path: '/login',    element: <Login />,    public: true, visible: false },
  { name: 'Register', path: '/register', element: <Register />, public: true, visible: false },

  // Protected app pages
  { name: 'Dashboard',    path: '/',             element: <Dashboard />    },
  { name: 'POS',          path: '/pos',          element: <POS />          },
  { name: 'Inventory',    path: '/inventory',    element: <Inventory />    },
  { name: 'Customers',    path: '/customers',    element: <Customers />    },
  { name: 'Expenses',     path: '/expenses',     element: <Expenses />     },
  { name: 'Reports',      path: '/reports',      element: <Reports />      },
  { name: 'Returns',      path: '/returns',      element: <Returns />      },
  { name: 'Store Credits',path: '/credits',      element: <StoreCredits /> },
  { name: 'Stock History',path: '/stock-history',element: <StockHistory /> },
  { name: 'Staff',        path: '/staff',        element: <Staff />        },
  { name: 'My Stores',   path: '/my-stores',    element: <MyStores />     },
  { name: 'Tutorials',   path: '/tutorials',    element: <Tutorials />    },
  { name: 'Admin Panel', path: '/admin',         element: <AdminPanel />,  visible: false },

  // Fallback
  { name: 'Not Found', path: '/404', element: <NotFound />, public: true, visible: false },
];
