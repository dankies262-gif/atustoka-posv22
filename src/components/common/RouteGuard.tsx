import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import { STAFF_SESSION_KEY } from '@/pages/auth/Login';

interface RouteGuardProps {
  children: React.ReactNode;
}

const SYSTEM_PUBLIC_ROUTES = ['/login', '/register', '/403', '/404', '/advertise', '/how-it-works', '/forgot-password', '/admin/register'];
const routePublicPaths = routes.filter(r => r.public).map(r => r.path);
const PUBLIC_ROUTES = [...SYSTEM_PUBLIC_ROUTES, ...routePublicPaths];
const STAFF_SESSION_ROUTES = ['/pos', '/inventory', '/customers'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

function hasValidStaffSession(): boolean {
  try {
    const raw = localStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed?.staff?.id && parsed?.store?.id);
  } catch {
    return false;
  }
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);
    const isStaffRoute = STAFF_SESSION_ROUTES.includes(location.pathname);

    if (!user && !isPublic) {
      if (isStaffRoute && hasValidStaffSession()) return;
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // Superadmins landing on the owner dashboard get redirected to admin panel
    if (user && isSuperAdmin && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [user, isSuperAdmin, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
