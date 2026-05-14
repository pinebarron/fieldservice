import { useState } from "react";
import { Link } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPricingItemSchema, type InsertPricingItem, type PricingItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const UNITS = ["each", "sq ft", "linear ft", "hour", "day", "panel", "kW", "kWh", "ton", "lb", "gallon", "roll", "bundle"];
const CATEGORIES = ["Labor", "Materials", "Equipment", "Electrical", "Roofing", "Solar", "HVAC", "Inspection", "Permits", "Other"];

function ItemFormModal({ isOpen, onClose, editItem }: { isOpen: boolean; onClose: () => void; editItem?: PricingItem }) {
  const { toast } = useToast();
  const isEdit = !!editItem;

  const form = useForm<InsertPricingItem>({
    resolver: zodResolver(insertPricingItemSchema),
    defaultValues: {
      name: editItem?.name || "",
      category: editItem?.category || "General",
      description: editItem?.description || "",
      unit: editItem?.unit || "each",
      unitPrice: editItem?.unitPrice || "0",
      isActive: editItem?.isActive || "true",
      businessId: editItem?.businessId || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPricingItem) => apiRequest("POST", "/api/pricing-items", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing-items"] }); toast({ title: "Item added" }); onClose(); },
    onError: () => toast({ title: "Error", description: "Failed to save", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertPricingItem>) => apiRequest("PATCH", `/api/pricing-items/${editItem!.id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing-items"] }); toast({ title: "Item updated" }); onClose(); },
    onError: () => toast({ title: "Error", description: "Failed to update", variant: "destructive" }),
  });

  const onSubmit = (data: InsertPricingItem) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add Pricing Item"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name *</FormLabel>
                <FormControl><Input {...field} data-testid="input-item-name" placeholder="e.g., Solar Panel Installation" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-item-category"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger data-testid="select-item-unit"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="unitPrice" render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price ($) *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input {...field} type="number" step="0.01" min="0" className="pl-7" data-testid="input-item-price" placeholder="0.00" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} data-testid="input-item-description" placeholder="Optional description..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-item">
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : isEdit ? "Update" : "Add Item"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingCatalog() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PricingItem | undefined>();
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<PricingItem[]>({ queryKey: ["/api/pricing-items"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/pricing-items/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pricing-items"] }); toast({ title: "Item removed" }); },
  });

  const filtered = items.filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, PricingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Pricing Catalog</h2>
            <p className="text-muted-foreground mt-1">Your customizable rate card — used in all estimates</p>
          </div>
          <Button onClick={() => { setEditItem(undefined); setIsFormOpen(true); }} data-testid="button-add-item">
            <i className="fas fa-plus mr-2"></i> Add Item
          </Button>
        </div>

        <div className="mb-6 relative max-w-sm">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
          <Input placeholder="Search catalog..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="input-catalog-search" />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground"><i className="fas fa-spinner fa-spin text-2xl mb-3"></i><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-tags text-muted-foreground text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">{search ? "No items match" : "Catalog is empty"}</h3>
            <p className="text-muted-foreground mb-4 text-sm">Add items to build your rate card</p>
            {!search && <Button onClick={() => setIsFormOpen(true)}>Add First Item</Button>}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, categoryItems]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category}</span>
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">{categoryItems.length} items</span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    {categoryItems.map((item, idx) => (
                      <div key={item.id}>
                        {idx > 0 && <Separator />}
                        <div className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors" data-testid={`item-row-${item.id}`}>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium" data-testid={`item-name-${item.id}`}>{item.name}</p>
                              {item.isActive === "false" && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactive</span>
                              )}
                            </div>
                            {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
                          </div>
                          <div className="flex items-center gap-4 ml-4 shrink-0">
                            <div className="text-right">
                              <p className="font-semibold">${parseFloat(item.unitPrice).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">per {item.unit}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setEditItem(item); setIsFormOpen(true); }} data-testid={`button-edit-item-${item.id}`}>
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)} data-testid={`button-delete-item-${item.id}`}>
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      <ItemFormModal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditItem(undefined); }} editItem={editItem} />
    </div>
  );
}
