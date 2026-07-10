import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
      <Logo size={56} withText={false} />
      <h1 className="mt-8 text-7xl font-extrabold text-primary">404</h1>
      <p className="mt-3 text-lg font-semibold text-foreground">Page Not Found</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Back to Dashboard
      </Link>
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} AtuStoka POS
      </p>
    </div>
  );
}
