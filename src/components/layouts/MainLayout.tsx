import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-hidden border-r border-sidebar-border">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
