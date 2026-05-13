import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertySchema, type InsertProperty, type Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

type PropertyWithCount = Property & { workLogCount: number };

function PropertyFormModal({
  isOpen,
  onClose,
  editProperty,
}: {
  isOpen: boolean;
  onClose: () => void;
  editProperty?: PropertyWithCount;
}) {
  const { toast } = useToast();
  const isEdit = !!editProperty;

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      propertyName: editProperty?.propertyName || "",
      customerName: editProperty?.customerName || "",
      locationName: editProperty?.locationName || "",
      city: editProperty?.city || "",
      state: editProperty?.state || "",
      zipCode: editProperty?.zipCode || "",
      status: editProperty?.status || "active",
      notes: editProperty?.notes || "",
      businessId: editProperty?.businessId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      if (isEdit && editProperty) {
        const res = await apiRequest("PATCH", `/api/properties/${editProperty.id}`, data);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/properties", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: isEdit ? "Property updated." : "Property created." });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertProperty) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Property" : "New Property Container"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="propertyName" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Property / Job Site Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Smith Residence, ABC Commercial Roof" data-testid="input-property-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Customer or owner name" data-testid="input-property-customer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="locationName" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Street address or location name" data-testid="input-property-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="City" data-testid="input-property-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-property-state">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zip Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Zip" data-testid="input-property-zip" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} rows={3} placeholder="Any additional details about this property or project..." className="resize-none" data-testid="textarea-property-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={mutation.isPending} data-testid="button-save-property">
                {mutation.isPending ? "Saving..." : isEdit ? "Update Property" : "Create Property"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function getStatusColor(status: string) {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "on-hold") return "bg-yellow-100 text-yellow-700";
  if (status === "completed") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function getStatusIcon(status: string) {
  if (status === "active") return "fa-circle-dot";
  if (status === "on-hold") return "fa-pause-circle";
  if (status === "completed") return "fa-check-circle";
  return "fa-circle";
}

export default function Properties() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<PropertyWithCount | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PropertyWithCount | null>(null);
  const { toast } = useToast();

  const { data: properties = [], isLoading } = useQuery<PropertyWithCount[]>({
    queryKey: ["/api/properties"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Property removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not delete property.", variant: "destructive" });
    },
  });

  const handleEdit = (p: PropertyWithCount, e: React.MouseEvent) => {
    e.preventDefault();
    setEditProperty(p);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditProperty(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
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
              <Link href="/">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer">
                  <i className="fas fa-clipboard-list text-primary-foreground text-xl"></i>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">FieldCapture</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Property Containers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="nav-dashboard">
                  <i className="fas fa-table-list mr-2"></i>
                  <span className="hidden sm:inline">Work Logs</span>
                </Button>
              </Link>
              <Link href="/estimates">
                <Button variant="ghost" size="sm" data-testid="estimates-link">
                  <i className="fas fa-file-invoice-dollar mr-2"></i>
                  <span className="hidden sm:inline">Estimates</span>
                </Button>
              </Link>
              <Link href="/team">
                <Button variant="ghost" size="sm" data-testid="team-link">
                  <i className="fas fa-users mr-2"></i>
                  <span className="hidden sm:inline">Team</span>
                </Button>
              </Link>
              <Link href="/vendors">
                <Button variant="ghost" size="sm" data-testid="vendors-link">
                  <i className="fas fa-handshake mr-2"></i>
                  <span className="hidden sm:inline">Vendors</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"} data-testid="logout-button">
                <i className="fas fa-sign-out-alt mr-2"></i>
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Property Containers</h2>
            <p className="text-muted-foreground mt-1">Group all work for a job site or customer in one place</p>
          </div>
          <Button onClick={() => { setEditProperty(undefined); setIsModalOpen(true); }} data-testid="button-new-property">
            <i className="fas fa-plus mr-2"></i>
            New Property
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-building text-3xl text-muted-foreground"></i>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No properties yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create a Property Container to group all surveys, inspections, estimates, and work orders for a job site together.
              </p>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-first-property">
                <i className="fas fa-plus mr-2"></i>
                Create First Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full" data-testid={`card-property-${property.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-building text-primary"></i>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                        <i className={`fas ${getStatusIcon(property.status)} mr-1`}></i>
                        {property.status === "on-hold" ? "On Hold" : property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground text-lg leading-tight mb-1" data-testid={`property-name-${property.id}`}>
                      {property.propertyName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      <i className="fas fa-user mr-1"></i>
                      {property.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {property.locationName}, {property.city}, {property.state} {property.zipCode}
                    </p>
                    {property.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 italic">{property.notes}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        <i className="fas fa-clipboard-list mr-1 text-primary"></i>
                        <span className="font-medium text-foreground">{property.workLogCount}</span> work log{property.workLogCount !== 1 ? "s" : ""}
                      </span>
                      <div className="flex gap-1" onClick={e => e.preventDefault()}>
                        <Button variant="ghost" size="sm" onClick={(e) => handleEdit(property, e)} data-testid={`button-edit-property-${property.id}`}>
                          <i className="fas fa-edit text-muted-foreground"></i>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setDeleteTarget(property); }} data-testid={`button-delete-property-${property.id}`}>
                          <i className="fas fa-trash text-destructive"></i>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <PropertyFormModal isOpen={isModalOpen} onClose={handleCloseModal} editProperty={editProperty} />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            This will remove <strong>{deleteTarget?.propertyName}</strong>. Existing work logs will not be deleted — they will just be unlinked from this property.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="destructive" className="flex-1" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-property">
              {deleteMutation.isPending ? "Deleting..." : "Delete Property"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
