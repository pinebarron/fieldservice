import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Estimate, EstimateLineItem, PricingItem, Property } from "@shared/schema";
import { pdf } from "@react-pdf/renderer";
import { EstimatePDF } from "@/components/EstimatePDF";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type LineItem = {
  id?: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
};

type EstimateWithItems = Estimate & { lineItems: EstimateLineItem[] };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-gray-100 text-gray-700 border-gray-200" },
  sent:     { label: "Sent",     className: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
  expired:  { label: "Expired",  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

function n(v: string | number | undefined | null) {
  const x = parseFloat(String(v ?? "0"));
  return isNaN(x) ? 0 : x;
}

function fmt(v: number) {
  return `$${v.toFixed(2)}`;
}

export default function EstimateDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { data: estimate, isLoading } = useQuery<EstimateWithItems>({
    queryKey: ["/api/estimates", params.id],
    queryFn: () => fetch(`/api/estimates/${params.id}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: pricingItems = [] } = useQuery<PricingItem[]>({
    queryKey: ["/api/pricing-items"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: business } = useQuery<{ name: string }>({
    queryKey: ["/api/business"],
  });

  // Init form from loaded estimate
  useEffect(() => {
    if (!estimate) return;
    setTitle(estimate.title || "");
    setCustomerName(estimate.customerName || "");
    setCustomerEmail(estimate.customerEmail || "");
    setCustomerPhone(estimate.customerPhone || "");
    setPropertyId(estimate.propertyId || null);
    setStatus(estimate.status || "draft");
    setValidUntil(estimate.validUntil || "");
    setNotes(estimate.notes || "");
    setTaxRate(estimate.taxRate || "0");
    setDiscountAmount(estimate.discountAmount || "0");
    setLineItems(
      (estimate.lineItems || []).map((li) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unit: li.unit,
        unitPrice: li.unitPrice,
      }))
    );
  }, [estimate]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/estimates/${params.id}`, {
        title,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        propertyId: propertyId || null,
        status,
        validUntil: validUntil || null,
        notes: notes || null,
        taxRate,
        discountAmount,
        lineItems: lineItems.map((li, i) => ({
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.unitPrice,
          sortOrder: String(i),
        })),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/estimates", params.id] });
      setIsDirty(false);
      toast({ title: "Estimate saved" });
    },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/estimates/${params.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      navigate("/estimates");
    },
  });

  const handleDownloadPdf = async () => {
    if (!estimate) return;
    setGeneratingPdf(true);
    try {
      const blob = await pdf(
        <EstimatePDF
          estimate={{ ...estimate, lineItems }}
          businessName={business?.name}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = customerName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      link.download = `estimate_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", description: "Estimate saved to your device." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Live calculations
  const subtotal = lineItems.reduce((sum, li) => sum + n(li.quantity) * n(li.unitPrice), 0);
  const tax = subtotal * (n(taxRate) / 100);
  const discount = n(discountAmount);
  const total = subtotal + tax - discount;

  const addRow = () => {
    setLineItems(prev => [...prev, { description: "", quantity: "1", unit: "each", unitPrice: "0" }]);
    setIsDirty(true);
  };

  const updateRow = (idx: number, field: keyof LineItem, value: string) => {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, [field]: value } : li));
    setIsDirty(true);
  };

  const removeRow = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  };

  const addFromCatalog = (item: PricingItem) => {
    setLineItems(prev => [...prev, {
      description: item.name + (item.description ? ` — ${item.description}` : ""),
      quantity: "1",
      unit: item.unit,
      unitPrice: item.unitPrice,
    }]);
    setIsDirty(true);
  };

  const filteredCatalog = pricingItems.filter(
    (p) => p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Service Work Logger</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/estimates"><Button variant="ghost" size="sm"><i className="fas fa-arrow-left mr-2"></i>Estimates</Button></Link>
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={generatingPdf || !estimate}
                data-testid="button-download-pdf-estimate"
              >
                {generatingPdf ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generating…</> : <><i className="fas fa-file-pdf mr-2"></i>PDF</>}
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-estimate">
                {saveMutation.isPending ? <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</> : <><i className="fas fa-save mr-2"></i>Save</>}
              </Button>
              {isDirty && <span className="text-xs text-amber-600 font-medium hidden sm:inline">Unsaved changes</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title + Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            placeholder="Estimate Title"
            className="text-xl font-bold h-12 text-lg flex-1"
            data-testid="input-estimate-title"
          />
          <div className="flex items-center gap-2">
            <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${sc.className}`}>{sc.label}</span>
            <Select value={status} onValueChange={(v) => { setStatus(v); setIsDirty(true); }}>
              <SelectTrigger className="w-36" data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer + Line Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <i className="fas fa-user text-primary"></i> Customer & Property
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Customer Name *</label>
                  <Input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setIsDirty(true); }} placeholder="Customer name" data-testid="input-customer-name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" value={customerEmail} onChange={(e) => { setCustomerEmail(e.target.value); setIsDirty(true); }} placeholder="customer@email.com" data-testid="input-customer-email" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setIsDirty(true); }} placeholder="(555) 000-0000" data-testid="input-customer-phone" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Property</label>
                  <Select value={propertyId ?? "none"} onValueChange={(v) => { setPropertyId(v === "none" ? null : v); setIsDirty(true); }}>
                    <SelectTrigger data-testid="select-property"><SelectValue placeholder="Link to property..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Valid Until</label>
                  <Input type="date" value={validUntil} onChange={(e) => { setValidUntil(e.target.value); setIsDirty(true); }} data-testid="input-valid-until" />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <i className="fas fa-list-ul text-primary"></i> Line Items
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCatalogOpen(true)} data-testid="button-add-from-catalog">
                      <i className="fas fa-tags mr-2"></i> Catalog
                    </Button>
                    <Button variant="outline" size="sm" onClick={addRow} data-testid="button-add-row">
                      <i className="fas fa-plus mr-2"></i> Add Row
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {lineItems.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <i className="fas fa-table text-muted-foreground text-2xl mb-2"></i>
                    <p className="text-muted-foreground text-sm">No line items yet. Add rows or pull from your pricing catalog.</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button variant="outline" size="sm" onClick={() => setIsCatalogOpen(true)}>
                        <i className="fas fa-tags mr-2"></i> From Catalog
                      </Button>
                      <Button variant="outline" size="sm" onClick={addRow}>
                        <i className="fas fa-plus mr-2"></i> Blank Row
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Description</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground w-20">Qty</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground w-24">Unit</th>
                          <th className="text-right px-2 py-2 font-medium text-muted-foreground w-28">Unit Price</th>
                          <th className="text-right px-4 py-2 font-medium text-muted-foreground w-28">Total</th>
                          <th className="w-8 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((li, idx) => {
                          const rowTotal = n(li.quantity) * n(li.unitPrice);
                          return (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20" data-testid={`line-item-row-${idx}`}>
                              <td className="px-4 py-2">
                                <Input
                                  value={li.description}
                                  onChange={(e) => updateRow(idx, "description", e.target.value)}
                                  placeholder="Description"
                                  className="border-0 shadow-none h-8 p-0 focus-visible:ring-0"
                                  data-testid={`input-description-${idx}`}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={li.quantity}
                                  onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                                  className="border-0 shadow-none h-8 p-0 text-center focus-visible:ring-0 w-16"
                                  data-testid={`input-quantity-${idx}`}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <Input
                                  value={li.unit}
                                  onChange={(e) => updateRow(idx, "unit", e.target.value)}
                                  className="border-0 shadow-none h-8 p-0 text-center focus-visible:ring-0 w-20"
                                  data-testid={`input-unit-${idx}`}
                                />
                              </td>
                              <td className="px-2 py-2">
                                <div className="relative">
                                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={li.unitPrice}
                                    onChange={(e) => updateRow(idx, "unitPrice", e.target.value)}
                                    className="border-0 shadow-none h-8 pl-4 pr-0 text-right focus-visible:ring-0 w-24"
                                    data-testid={`input-unit-price-${idx}`}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-medium" data-testid={`row-total-${idx}`}>
                                {fmt(rowTotal)}
                              </td>
                              <td className="px-2 py-2">
                                <button
                                  onClick={() => removeRow(idx)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  data-testid={`button-remove-row-${idx}`}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <i className="fas fa-sticky-note text-primary"></i> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
                  rows={3}
                  placeholder="Any additional notes, scope exclusions, terms & conditions..."
                  data-testid="textarea-notes"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <i className="fas fa-calculator text-primary"></i> Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium" data-testid="text-subtotal">{fmt(subtotal)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24">Tax (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => { setTaxRate(e.target.value); setIsDirty(true); }}
                    className="h-7 text-sm"
                    data-testid="input-tax-rate"
                  />
                  <span className="text-sm text-muted-foreground ml-auto">{fmt(tax)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-24">Discount ($)</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => { setDiscountAmount(e.target.value); setIsDirty(true); }}
                    className="h-7 text-sm"
                    data-testid="input-discount"
                  />
                  <span className="text-sm text-muted-foreground ml-auto text-destructive">{discount > 0 ? `-${fmt(discount)}` : "$0.00"}</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg text-primary" data-testid="text-total">{fmt(total)}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {lineItems.length} line item{lineItems.length !== 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-estimate-right">
                  <i className="fas fa-save mr-2"></i> Save Estimate
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf || !estimate}
                  data-testid="button-download-pdf-estimate-right"
                >
                  {generatingPdf
                    ? <><i className="fas fa-spinner fa-spin mr-2"></i>Generating…</>
                    : <><i className="fas fa-file-pdf mr-2"></i>Download PDF</>}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Delete this estimate? This cannot be undone.")) deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-estimate"
                >
                  <i className="fas fa-trash mr-2"></i> Delete
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Catalog Dialog */}
      <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add from Pricing Catalog</DialogTitle>
          </DialogHeader>
          <div className="relative mb-3">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
            <Input placeholder="Search catalog..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="pl-9" data-testid="input-catalog-search-dialog" />
          </div>
          <div className="overflow-y-auto flex-1 space-y-1">
            {filteredCatalog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No items found. <Link href="/pricing" className="text-primary underline">Add to catalog →</Link></p>
            ) : (
              filteredCatalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { addFromCatalog(item); setIsCatalogOpen(false); setCatalogSearch(""); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted text-left transition-colors"
                  data-testid={`catalog-item-${item.id}`}
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category} · per {item.unit}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-semibold text-sm">${parseFloat(item.unitPrice).toFixed(2)}</p>
                    <p className="text-xs text-primary">+ Add</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
