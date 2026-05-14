import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Estimate, Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-gray-100 text-gray-700 border-gray-200" },
  sent:     { label: "Sent",     className: "bg-blue-100 text-blue-700 border-blue-200" },
  approved: { label: "Approved", className: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
  expired:  { label: "Expired",  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

function calcTotal(estimate: Estimate) {
  return 0; // totals are computed in detail view from line items
}

function formatCurrency(val: string | number) {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? "$0.00" : `$${n.toFixed(2)}`;
}

export default function Estimates() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: estimateList = [], isLoading } = useQuery<Estimate[]>({
    queryKey: ["/api/estimates"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/estimates", {
        title: "New Estimate",
        customerName: "",
        status: "draft",
        taxRate: "0",
        discountAmount: "0",
        businessId: "",
      }).then((r) => r.json()),
    onSuccess: (estimate: Estimate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      navigate(`/estimates/${estimate.id}`);
    },
    onError: () => toast({ title: "Error", description: "Could not create estimate", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/estimates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      toast({ title: "Estimate deleted" });
    },
  });

  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  const filtered = estimateList.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total", value: estimateList.length, icon: "fas fa-file-invoice-dollar", color: "text-blue-600" },
    { label: "Draft", value: estimateList.filter((e) => e.status === "draft").length, icon: "fas fa-pen", color: "text-gray-500" },
    { label: "Sent", value: estimateList.filter((e) => e.status === "sent").length, icon: "fas fa-paper-plane", color: "text-blue-500" },
    { label: "Approved", value: estimateList.filter((e) => e.status === "approved").length, icon: "fas fa-check-circle", color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">Estimates & Scopes</h2>
            <p className="text-muted-foreground mt-1">Create project estimates with real-time cost calculations</p>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing">
              <Button variant="outline" data-testid="button-pricing-catalog">
                <i className="fas fa-tags mr-2"></i>
                Pricing Catalog
              </Button>
            </Link>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} data-testid="button-new-estimate">
              <i className="fas fa-plus mr-2"></i>
              {createMutation.isPending ? "Creating..." : "New Estimate"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <i className={`${s.icon} ${s.color} text-xl`}></i>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-sm">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
          <Input
            placeholder="Search estimates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-estimate-search"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
            <p>Loading estimates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-invoice-dollar text-muted-foreground text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">{search ? "No estimates match" : "No estimates yet"}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {search ? "Try a different search." : "Create your first estimate to start quoting customers."}
            </p>
            {!search && (
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                <i className="fas fa-plus mr-2"></i> New Estimate
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((estimate) => {
              const sc = STATUS_CONFIG[estimate.status] ?? STATUS_CONFIG.draft;
              const property = estimate.propertyId ? propertyMap.get(estimate.propertyId) : null;
              return (
                <Card key={estimate.id} className="hover:shadow-md transition-shadow" data-testid={`card-estimate-${estimate.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate" data-testid={`estimate-title-${estimate.id}`}>{estimate.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{estimate.customerName || "—"}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>

                    {property && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <i className="fas fa-building"></i>
                        <span className="truncate">{property.propertyName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      {estimate.validUntil && (
                        <span><i className="fas fa-calendar mr-1"></i>Valid until {estimate.validUntil}</span>
                      )}
                      <span><i className="fas fa-clock mr-1"></i>{new Date(estimate.createdAt!).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/estimates/${estimate.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full" data-testid={`button-open-estimate-${estimate.id}`}>
                          <i className="fas fa-edit mr-1"></i> Open
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(estimate.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-estimate-${estimate.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
