'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateEstimate, deleteEstimate } from '../actions';

interface LineItem {
  id?: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  sort_order: string;
}

interface Estimate {
  id: string;
  title: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  status: string;
  valid_until: string | null;
  notes: string | null;
  tax_rate: string;
  discount_amount: string;
}

interface PricingItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  unit_price: string;
}

interface Props {
  estimate: Estimate;
  lineItems: LineItem[];
  pricingItems: PricingItem[];
}

function n(v: string | number | undefined | null) {
  const x = parseFloat(String(v ?? '0'));
  return isNaN(x) ? 0 : x;
}

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

export function EstimateDetailClient({ estimate, lineItems: initialLineItems, pricingItems }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Form state
  const [title, setTitle] = useState(estimate.title);
  const [customerName, setCustomerName] = useState(estimate.customer_name);
  const [customerEmail, setCustomerEmail] = useState(estimate.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState(estimate.customer_phone || '');
  const [status, setStatus] = useState(estimate.status);
  const [validUntil, setValidUntil] = useState(estimate.valid_until || '');
  const [notes, setNotes] = useState(estimate.notes || '');
  const [taxRate, setTaxRate] = useState(estimate.tax_rate || '0');
  const [discountAmount, setDiscountAmount] = useState(estimate.discount_amount || '0');
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
  }>>(initialLineItems.map(li => ({
    description: li.description,
    quantity: li.quantity,
    unit: li.unit,
    unitPrice: li.unit_price,
  })));

  // Calculations
  const subtotal = items.reduce((sum, li) => sum + n(li.quantity) * n(li.unitPrice), 0);
  const tax = subtotal * (n(taxRate) / 100);
  const discount = n(discountAmount);
  const total = subtotal + tax - discount;

  const addRow = () => {
    setItems([...items, { description: '', quantity: '1', unit: 'each', unitPrice: '0' }]);
  };

  const updateRow = (idx: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const addFromCatalog = (item: PricingItem) => {
    setItems([...items, {
      description: item.name + (item.description ? ` - ${item.description}` : ''),
      quantity: '1',
      unit: item.unit,
      unitPrice: item.unit_price,
    }]);
    setShowCatalog(false);
    setCatalogSearch('');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateEstimate(estimate.id, {
      title,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      status,
      validUntil: validUntil || null,
      notes: notes || null,
      taxRate,
      discountAmount,
      lineItems: items.map((item, i) => ({
        ...item,
        sortOrder: String(i),
      })),
    });
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this estimate? This cannot be undone.')) return;
    setDeleting(true);
    await deleteEstimate(estimate.id);
    router.push('/estimates');
  };

  const filteredCatalog = pricingItems.filter(
    p => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
         p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/estimates">
            <Button variant="ghost" size="sm">
              <i className="fas fa-arrow-left mr-2"></i>
              Back
            </Button>
          </Link>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium border-0 cursor-pointer ${
              status === 'accepted' || status === 'approved'
                ? 'bg-green-100 text-green-700'
                : status === 'sent'
                ? 'bg-blue-100 text-blue-700'
                : status === 'declined' || status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete} disabled={deleting}>
            <i className="fas fa-trash mr-2"></i>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <i className="fas fa-save mr-2"></i>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Estimate Title"
        className="w-full text-2xl font-bold bg-transparent border-0 border-b border-transparent hover:border-input focus:border-input focus:outline-none py-2"
      />

      {/* Customer Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <i className="fas fa-user text-primary mr-2"></i>
            Customer Info
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name *</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Valid Until</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              <i className="fas fa-list text-primary mr-2"></i>
              Line Items
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCatalog(true)}>
                <i className="fas fa-tags mr-2"></i>
                Catalog
              </Button>
              <Button variant="outline" size="sm" onClick={addRow}>
                <i className="fas fa-plus mr-2"></i>
                Add Row
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-receipt text-2xl mb-2"></i>
              <p>No line items yet</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowCatalog(true)}>
                  From Catalog
                </Button>
                <Button variant="outline" size="sm" onClick={addRow}>
                  Add Blank Row
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateRow(idx, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none"
                    />
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Unit</label>
                      <input
                        value={item.unit}
                        onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Price</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateRow(idx, 'unitPrice', e.target.value)}
                          className="w-full rounded border border-input bg-background pl-5 pr-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    Total: {fmt(n(item.quantity) * n(item.unitPrice))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <i className="fas fa-calculator text-primary mr-2"></i>
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Tax (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm"
            />
            <span className="text-sm w-20 text-right">{fmt(tax)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Discount</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full rounded border border-input bg-background pl-5 pr-2 py-1 text-sm"
              />
            </div>
            <span className="text-sm w-20 text-right text-destructive">
              {discount > 0 ? `-${fmt(discount)}` : '$0.00'}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-primary">{fmt(total)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            <i className="fas fa-sticky-note text-primary mr-2"></i>
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes, terms & conditions..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Catalog Modal */}
      {showCatalog && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-background w-full sm:max-w-lg sm:rounded-lg max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Add from Catalog</h3>
              <button onClick={() => setShowCatalog(false)} className="p-1">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                <input
                  placeholder="Search catalog..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
              {filteredCatalog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items found.{' '}
                  <Link href="/pricing" className="text-primary underline">
                    Add to catalog
                  </Link>
                </p>
              ) : (
                filteredCatalog.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addFromCatalog(item)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category} · per {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ${parseFloat(item.unit_price).toFixed(2)}
                      </p>
                      <p className="text-xs text-primary">+ Add</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
