import { useState } from 'react';
import { Menu, Wifi, WifiOff, CloudUpload, Loader2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Sidebar } from './Sidebar';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function TopBar() {
  const [open, setOpen] = useState(false);
  const { isOnline, pendingChanges, isSyncing } = useSyncStatus();

  return (
    <>
      <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border sticky top-0 z-40 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-sidebar-accent shrink-0"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Logo size={30} withText={false} bgColor="#166534" />
          <span className="text-white font-extrabold text-base tracking-tight">AtuStoka</span>
          <span className="text-green-400 text-[10px] font-medium tracking-widest uppercase hidden sm:inline">POS</span>
        </div>
        
        {/* Sync / Live Status */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {!isOnline && pendingChanges > 0 && (
            <div className="flex items-center gap-1 bg-amber-400/20 px-2 py-0.5 rounded-full" title={`${pendingChanges} pending changes`}>
              <CloudUpload className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500">{pendingChanges}</span>
            </div>
          )}
          {isOnline ? (
            isSyncing ? (
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-green-400 text-xs font-medium hidden sm:inline">Live</span>
              </div>
            )
          ) : (
            <WifiOff className="h-4 w-4 text-amber-400" />
          )}
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
