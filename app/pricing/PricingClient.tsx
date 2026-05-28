'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPricingItem, updatePricingItem, deletePricingItem } from './actions';

interface PricingItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  unit: string;
  unit_price: string;
}

interface PricingClientProps {
  pricingItems: PricingItem[] | null;
}

export function PricingClient({ pricingItems }: PricingClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [unit, setUnit] = useState('each');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setCategory('General');
    setUnit('each');
    setUnitPrice('');
    setDescription('');
    setError('');
  };

  const openCreateForm = () => {
    resetForm();
    setEditingItem(null);
    setShowForm(true);
  };

  const openEditForm = (item: PricingItem) => {
    setName(item.name);
    setCategory(item.category);
    setUnit(item.unit);
    setUnitPrice(item.unit_price);
    setDescription(item.description || '');
    setEditingItem(item);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.set('name', name);
    formData.set('category', category);
    formData.set('unit', unit);
    formData.set('unitPrice', unitPrice);
    formData.set('description', description);

    let result;
    if (editingItem) {
      result = await updatePricingItem(editingItem.id, formData);
    } else {
      result = await createPricingItem(formData);
    }

    if (result?.error) {
      setError(result.error);
    } else {
      closeForm();
      router.refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this pricing item?')) return;
    setDeleting(id);
    await deletePricingItem(id);
    router.refresh();
    setDeleting(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pricing Catalog</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your service pricing</p>
        </div>
        <Button className="gap-2" onClick={openCreateForm}>
          <i className="fas fa-plus"></i>Add Item
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingItem ? 'Edit Pricing Item' : 'Add Pricing Item'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>}
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Solar Panel Installation"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Installation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="each">Each</option>
                      <option value="hour">Hour</option>
                      <option value="sqft">Sq Ft</option>
                      <option value="panel">Panel</option>
                      <option value="job">Per Job</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price *</label>
                  <input
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Description..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!pricingItems || pricingItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-tag text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">No pricing items yet</h3>
            <p className="text-muted-foreground mb-4">Add services and products to your pricing catalog.</p>
            <Button onClick={openCreateForm}><i className="fas fa-plus mr-2"></i>Add First Item</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pricingItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => openEditForm(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-tag text-primary"></i>
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category} - per {item.unit}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-semibold">${parseFloat(item.unit_price).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(item);
                        }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deleting === item.id}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
