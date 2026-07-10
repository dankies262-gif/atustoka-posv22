import { useEffect, useState } from 'react';
import { Plus, Store, Trash2, Pencil, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { createStore, updateStore, deleteStore } from '@/services/database';
import { BUSINESS_TYPES, REGIONS } from '@/lib/constants';
import type { Store as StoreType } from '@/types/database';

const EMPTY_FORM = { business_name: '', business_type: '', region: '', town: '' };

export default function MyStores() {
  const { user, store: activeStore, stores, switchStore, refreshStores } = useAuth();

  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState<StoreType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoreType | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);

  // keep stores fresh on mount
  useEffect(() => { refreshStores(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (s: StoreType) => {
    setEditTarget(s);
    setForm({
      business_name: s.business_name,
      business_type: s.business_type,
      region: s.region,
      town: s.town ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.business_name.trim()) { toast.error('Business name is required'); return; }
    if (!form.business_type)        { toast.error('Business type is required'); return; }
    if (!form.region)               { toast.error('Region is required'); return; }
    setSaving(true);

    if (editTarget) {
      const result = await updateStore(editTarget.id, {
        business_name: form.business_name.trim(),
        business_type: form.business_type,
        region: form.region,
        town: form.town.trim() || undefined,
      });
      if (result.ok) {
        toast.success('Store updated');
        await refreshStores();
        setShowForm(false);
      } else {
        toast.error(`Failed to update store: ${result.error ?? 'Unknown error'}`);
      }
    } else {
      const result = await createStore({
        owner_id: user!.id,
        business_name: form.business_name.trim(),
        business_type: form.business_type,
        region: form.region,
        town: form.town.trim() || undefined,
      });
      if (result.ok) {
        toast.success('New store created!');
        await refreshStores();
        // Auto-switch to the newly created store
        if (result.id) switchStore(result.id);
        setShowForm(false);
      } else {
        toast.error(`Failed to create store: ${result.error ?? 'Unknown error'}`);
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteStore(deleteTarget.id);
    if (result.ok) {
      toast.success('Store deleted');
      await refreshStores();
    } else {
      toast.error(`Failed to delete store: ${result.error ?? 'Unknown error'}`);
    }
    setDeleteTarget(null);
  };

  const f = (k: keyof typeof EMPTY_FORM, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Stores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stores.length} {stores.length === 1 ? 'store' : 'stores'} — switch between businesses anytime
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Store
        </Button>
      </div>

      {/* Store grid */}
      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Store className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No stores yet. Create your first store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(s => {
            const isActive = s.id === activeStore?.id;
            return (
              <Card key={s.id} className={`h-full transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-foreground truncate">{s.business_name}</h2>
                        {isActive && (
                          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] shrink-0">
                            <Check className="h-2.5 w-2.5 mr-1" /> Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {s.business_type} · {s.region}{s.town ? ` · ${s.town}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground/60">
                    Created {new Date(s.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
                    {!isActive && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => switchStore(s.id)}
                      >
                        Switch to This Store
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isActive || stores.length === 1}
                      className="text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => setDeleteTarget(s)}
                      title={isActive ? 'Cannot delete active store' : 'Delete store'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Store' : 'Create New Store'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="bname">Business Name *</Label>
              <Input
                id="bname"
                value={form.business_name}
                onChange={e => f('business_name', e.target.value)}
                placeholder="e.g. Nakangala Bottle Store"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Business Type *</Label>
              <Select value={form.business_type} onValueChange={v => f('business_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Region *</Label>
              <Select value={form.region} onValueChange={v => f('region', v)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="town">Town / City</Label>
              <Input
                id="town"
                value={form.town}
                onChange={e => f('town', e.target.value)}
                placeholder="e.g. Windhoek"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editTarget ? 'Save Changes' : 'Create Store'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.business_name}</strong> and all its data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
