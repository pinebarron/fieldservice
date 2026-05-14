import { useState } from "react";
import { Link } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertVendorSchema, type InsertVendor, type Vendor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY"
];

const COMMON_SERVICES = [
  "Solar Installation", "Solar Maintenance", "Electrical", "Roofing",
  "HVAC", "Plumbing", "Structural Inspection", "Surveying", "Engineering",
  "Permitting", "Battery Storage", "EV Charging", "Landscaping", "General Contracting"
];

const vendorFormSchema = insertVendorSchema.extend({
  servicesInput: z.string().optional(),
  regionsInput: z.string().optional(),
});
type VendorFormValues = z.infer<typeof vendorFormSchema>;

function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  testId,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  testId?: string;
}) {
  const [input, setInput] = useState("");

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-8">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            }
          }}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => add(input)}>
          Add
        </Button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !value.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange([...value, s])}
                className="text-xs px-2 py-0.5 rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function VendorFormModal({
  isOpen,
  onClose,
  editVendor,
}: {
  isOpen: boolean;
  onClose: () => void;
  editVendor?: Vendor;
}) {
  const { toast } = useToast();
  const isEdit = !!editVendor;

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: editVendor?.name || "",
      contactName: editVendor?.contactName || "",
      contactEmail: editVendor?.contactEmail || "",
      contactPhone: editVendor?.contactPhone || "",
      servicesProvided: (editVendor?.servicesProvided as string[]) || [],
      regionsServed: (editVendor?.regionsServed as string[]) || [],
      insuranceProvider: editVendor?.insuranceProvider || "",
      insurancePolicyNumber: editVendor?.insurancePolicyNumber || "",
      insuranceExpiry: editVendor?.insuranceExpiry || "",
      licenseNumber: editVendor?.licenseNumber || "",
      licenseExpiry: editVendor?.licenseExpiry || "",
      notes: editVendor?.notes || "",
      status: editVendor?.status || "active",
      businessId: editVendor?.businessId || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVendor) => apiRequest("POST", "/api/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor created" });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to save vendor", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InsertVendor>) =>
      apiRequest("PATCH", `/api/vendors/${editVendor!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor updated" });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" }),
  });

  const onSubmit = (data: VendorFormValues) => {
    const { servicesInput, regionsInput, ...rest } = data;
    if (isEdit) updateMutation.mutate(rest);
    else createMutation.mutate(rest as InsertVendor);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
              <Separator />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Company / Vendor Name *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-vendor-name" placeholder="ABC Solar Services" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contactName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} data-testid="input-vendor-contact-name" placeholder="Jane Smith" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="email" data-testid="input-vendor-email" placeholder="jane@abcsolar.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contactPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} data-testid="input-vendor-phone" placeholder="(555) 000-0000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-vendor-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Services & Regions */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services & Coverage</p>
              <Separator />
            </div>
            <FormField control={form.control} name="servicesProvided" render={({ field }) => (
              <FormItem>
                <FormLabel>Services Provided</FormLabel>
                <FormControl>
                  <TagInput
                    value={(field.value as string[]) || []}
                    onChange={field.onChange}
                    suggestions={COMMON_SERVICES}
                    placeholder="Type a service and press Enter"
                    testId="input-vendor-services"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="regionsServed" render={({ field }) => (
              <FormItem>
                <FormLabel>Regions / States Covered</FormLabel>
                <FormControl>
                  <TagInput
                    value={(field.value as string[]) || []}
                    onChange={field.onChange}
                    suggestions={US_STATES}
                    placeholder="Type a state or region and press Enter"
                    testId="input-vendor-regions"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Insurance & Compliance */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Insurance & Compliance</p>
              <Separator />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="insuranceProvider" render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} data-testid="input-vendor-insurance-provider" placeholder="State Farm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="insurancePolicyNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} data-testid="input-vendor-policy-number" placeholder="POL-123456" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="insuranceExpiry" render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Expiry</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="date" data-testid="input-vendor-insurance-expiry" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} data-testid="input-vendor-license" placeholder="LIC-789012" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="licenseExpiry" render={({ field }) => (
                <FormItem>
                  <FormLabel>License Expiry</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} type="date" data-testid="input-vendor-license-expiry" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Notes */}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ""} data-testid="input-vendor-notes" placeholder="Additional information..." rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-vendor">
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Vendor"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function statusConfig(status: string) {
  if (status === "active") return { label: "Active", className: "bg-green-100 text-green-800 border-green-200" };
  if (status === "inactive") return { label: "Inactive", className: "bg-gray-100 text-gray-600 border-gray-200" };
  return { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" };
}

export default function Vendors() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | undefined>();
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: vendorList = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Vendor removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove vendor", variant: "destructive" }),
  });

  const filtered = vendorList.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.contactName || "").toLowerCase().includes(search.toLowerCase()) ||
      (v.contactEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (vendor: Vendor) => {
    setEditVendor(vendor);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditVendor(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Vendor Management</h2>
            <p className="text-muted-foreground mt-1">
              Manage your subcontractors, suppliers, and service partners
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} data-testid="button-add-vendor">
            <i className="fas fa-plus mr-2"></i>
            Add Vendor
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
            <Input
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-vendor-search"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Vendors", value: vendorList.length, icon: "fas fa-handshake", color: "text-blue-600" },
            { label: "Active", value: vendorList.filter(v => v.status === "active").length, icon: "fas fa-check-circle", color: "text-green-600" },
            { label: "Pending", value: vendorList.filter(v => v.status === "pending").length, icon: "fas fa-clock", color: "text-yellow-600" },
            { label: "Inactive", value: vendorList.filter(v => v.status === "inactive").length, icon: "fas fa-pause-circle", color: "text-gray-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <i className={`${stat.icon} ${stat.color} text-xl`}></i>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Vendor List */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
            <p>Loading vendors...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-handshake text-muted-foreground text-3xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {search ? "No vendors match your search" : "No vendors yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {search
                ? "Try a different search term."
                : "Add your first vendor to start tracking subcontractors and suppliers."}
            </p>
            {!search && (
              <Button onClick={() => setIsFormOpen(true)} data-testid="button-add-vendor-empty">
                <i className="fas fa-plus mr-2"></i>
                Add Your First Vendor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((vendor) => {
              const sc = statusConfig(vendor.status);
              const services = (vendor.servicesProvided as string[]) || [];
              const regions = (vendor.regionsServed as string[]) || [];
              return (
                <Card
                  key={vendor.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`card-vendor-${vendor.id}`}
                >
                  <CardContent className="p-5">
                    {/* Vendor header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <i className="fas fa-building text-primary"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" data-testid={`vendor-name-${vendor.id}`}>
                            {vendor.name}
                          </p>
                          {vendor.contactName && (
                            <p className="text-sm text-muted-foreground truncate">{vendor.contactName}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>

                    {/* Contact */}
                    {(vendor.contactEmail || vendor.contactPhone) && (
                      <div className="space-y-1 mb-3 text-sm text-muted-foreground">
                        {vendor.contactEmail && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-envelope w-4 text-center"></i>
                            <span className="truncate">{vendor.contactEmail}</span>
                          </div>
                        )}
                        {vendor.contactPhone && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-phone w-4 text-center"></i>
                            <span>{vendor.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Services</p>
                        <div className="flex flex-wrap gap-1">
                          {services.slice(0, 3).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                          {services.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{services.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Regions */}
                    {regions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Regions</p>
                        <p className="text-sm">{regions.slice(0, 4).join(", ")}{regions.length > 4 ? ` +${regions.length - 4}` : ""}</p>
                      </div>
                    )}

                    {/* Compliance flags */}
                    <div className="flex gap-2 mb-4">
                      {vendor.insuranceProvider && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                          <i className="fas fa-shield-alt"></i> Insured
                        </span>
                      )}
                      {vendor.licenseNumber && (
                        <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <i className="fas fa-certificate"></i> Licensed
                        </span>
                      )}
                    </div>

                    <Separator className="mb-3" />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(vendor)}
                        data-testid={`button-edit-vendor-${vendor.id}`}
                      >
                        <i className="fas fa-edit mr-1"></i> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(vendor.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-vendor-${vendor.id}`}
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

      <VendorFormModal isOpen={isFormOpen} onClose={handleClose} editVendor={editVendor} />
    </div>
  );
}
