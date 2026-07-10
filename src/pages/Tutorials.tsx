import { useState } from 'react';
import { Play, BookOpen, ShoppingCart, Package, Users, CreditCard, UserCog, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  placeholder: string;
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'welcome',
    title: 'Welcome to AtuStoka',
    description: 'A quick overview of the POS and what you can do.',
    icon: <BookOpen className="h-5 w-5" />,
    duration: '0:30',
    placeholder: '/videos/tutorial-welcome.mp4',
  },
  {
    id: 'first-sale',
    title: 'Making Your First Sale',
    description: 'Step-by-step guide to ringing up a customer.',
    icon: <ShoppingCart className="h-5 w-5" />,
    duration: '1:15',
    placeholder: '/videos/tutorial-first-sale.mp4',
  },
  {
    id: 'inventory',
    title: 'Managing Inventory',
    description: 'Add products, update stock, and set low-stock alerts.',
    icon: <Package className="h-5 w-5" />,
    duration: '1:05',
    placeholder: '/videos/tutorial-inventory.mp4',
  },
  {
    id: 'credit',
    title: 'Store Credit & Customers',
    description: 'Set customer credit limits and process credit sales.',
    icon: <CreditCard className="h-5 w-5" />,
    duration: '1:20',
    placeholder: '/videos/tutorial-credit.mp4',
  },
  {
    id: 'staff',
    title: 'Staff & PIN Login',
    description: 'Add staff members and let them sell with a secure PIN.',
    icon: <UserCog className="h-5 w-5" />,
    duration: '1:00',
    placeholder: '/videos/tutorial-staff.mp4',
  },
  {
    id: 'reports',
    title: 'Reports & Insights',
    description: 'Read sales reports and understand your numbers.',
    icon: <BarChart3 className="h-5 w-5" />,
    duration: '0:55',
    placeholder: '/videos/tutorial-reports.mp4',
  },
];

export default function Tutorials() {
  const [active, setActive] = useState<Tutorial | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-balance">Video Tutorials</h1>
          <p className="text-sm text-muted-foreground">Learn how to use AtuStoka POS with step-by-step videos.</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="selling">Selling</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.map((t) => (
              <TutorialCard key={t.id} tutorial={t} onPlay={() => setActive(t)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="getting-started" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.filter((t) => ['welcome', 'first-sale'].includes(t.id)).map((t) => (
              <TutorialCard key={t.id} tutorial={t} onPlay={() => setActive(t)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="selling" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.filter((t) => ['first-sale', 'credit'].includes(t.id)).map((t) => (
              <TutorialCard key={t.id} tutorial={t} onPlay={() => setActive(t)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="management" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TUTORIALS.filter((t) => ['inventory', 'staff', 'reports'].includes(t.id)).map((t) => (
              <TutorialCard key={t.id} tutorial={t} onPlay={() => setActive(t)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {active && (
        <Dialog open={!!active} onOpenChange={() => setActive(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{active.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <video
                src={active.placeholder}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster="/favicon.png"
              >
                <p className="text-sm text-muted-foreground p-4">
                  Your browser does not support the video tag. Please upload the video file to{' '}
                  <code className="bg-muted px-1 rounded">{active.placeholder}</code>.
                </p>
              </video>
            </div>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TutorialCard({ tutorial, onPlay }: { tutorial: Tutorial; onPlay: () => void }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{tutorial.icon}</div>
            <CardTitle className="text-base">{tutorial.title}</CardTitle>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
            {tutorial.duration}
          </span>
        </div>
        <CardDescription className="pt-1">{tutorial.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-0">
        <Button onClick={onPlay} className="w-full gap-2">
          <Play className="h-4 w-4" /> Watch Now
        </Button>
      </CardContent>
    </Card>
  );
}
