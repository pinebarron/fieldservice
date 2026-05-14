import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkLogSchema, type InsertWorkLog, type WorkLog, type Property, type User, type BusinessMember, type PhotoMeta } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editWorkLog?: WorkLog;
  prefillProperty?: Property;
}

export function NewEntryModal({ isOpen, onClose, onSuccess, editWorkLog, prefillProperty }: NewEntryModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!editWorkLog;
  const [photos, setPhotos] = useState<PhotoMeta[]>(editWorkLog?.photoMetadata || []);
  const [uploadedPdfs, setUploadedPdfs] = useState<string[]>(editWorkLog?.pdfUrls || []);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "denied">("idle");
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyPickerOpen, setPropertyPickerOpen] = useState(false);
  const [linkedProperty, setLinkedProperty] = useState<Property | null>(prefillProperty ?? null);
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<string[]>([]);
  const cameraZoneRef = useRef<PhotoMeta["type"]>("general");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [cameraUploading, setCameraUploading] = useState(false);

  const { data: members = [] } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
    enabled: isOpen,
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: isOpen,
  });

  const form = useForm<InsertWorkLog>({
    resolver: zodResolver(insertWorkLogSchema),
    defaultValues: {
      customerName: "",
      workType: "",
      locationName: "",
      city: "",
      state: "",
      zipCode: "",
      businessId: "",
      technicianUserId: user?.id || "",
      serviceDate: new Date().toISOString().split('T')[0],
      startTime: null,
      endTime: null,
      workPerformed: "",
      additionalNotes: null,
      status: "completed",
      imageUrls: [],
      pdfUrls: [],
    },
  });

  useEffect(() => {
    if (editWorkLog) {
      const ids = (editWorkLog as any).technicianUserIds?.length
        ? (editWorkLog as any).technicianUserIds
        : [editWorkLog.technicianUserId];
      setSelectedTechnicianIds(ids);
      form.reset({
        customerName: editWorkLog.customerName,
        workType: editWorkLog.workType,
        locationName: editWorkLog.locationName,
        city: editWorkLog.city,
        state: editWorkLog.state,
        zipCode: editWorkLog.zipCode,
        businessId: editWorkLog.businessId,
        propertyId: editWorkLog.propertyId || null,
        technicianUserId: ids[0],
        serviceDate: editWorkLog.serviceDate,
        startTime: editWorkLog.startTime || null,
        endTime: editWorkLog.endTime || null,
        workPerformed: editWorkLog.workPerformed,
        additionalNotes: editWorkLog.additionalNotes || null,
        status: editWorkLog.status,
        imageUrls: editWorkLog.imageUrls || [],
        pdfUrls: editWorkLog.pdfUrls || [],
      });
      setPhotos(editWorkLog.photoMetadata || []);
      setUploadedPdfs(editWorkLog.pdfUrls || []);
    } else if (isOpen) {
      const defaultId = user?.id || "";
      setSelectedTechnicianIds(defaultId ? [defaultId] : []);
      form.reset({
        customerName: prefillProperty?.customerName || "",
        workType: "",
        locationName: prefillProperty?.locationName || "",
        city: prefillProperty?.city || "",
        state: prefillProperty?.state || "",
        zipCode: prefillProperty?.zipCode || "",
        businessId: "",
        propertyId: prefillProperty?.id || null,
        technicianUserId: defaultId,
        serviceDate: new Date().toISOString().split('T')[0],
        startTime: null,
        endTime: null,
        workPerformed: "",
        additionalNotes: null,
        status: "completed",
        imageUrls: [],
        pdfUrls: [],
        photoMetadata: [],
      });
      setPhotos([]);
      setUploadedPdfs([]);
      setGpsCoords(null);
      setGpsStatus("idle");
      setGpsAddress(null);
    }
  }, [editWorkLog, isOpen, prefillProperty, form, user]);

  useEffect(() => {
    if (isOpen && !isEditMode && gpsStatus === "idle") {
      captureGps(true);
    }
  }, [isOpen]);

  const saveWorkLogMutation = useMutation({
    mutationFn: async (data: InsertWorkLog) => {
      if (isEditMode && editWorkLog) {
        const response = await apiRequest("PATCH", `/api/work-logs/${editWorkLog.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/work-logs", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Work log updated successfully" : "Work log entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onSuccess();
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update work log" : "Failed to create work log entry",
        variant: "destructive",
      });
    },
  });

  const applyProperty = (p: Property) => {
    setLinkedProperty(p);
    setPropertyPickerOpen(false);
    setPropertySearch("");
    form.setValue("customerName", p.customerName);
    form.setValue("locationName", p.locationName);
    form.setValue("city", p.city);
    form.setValue("state", p.state);
    form.setValue("zipCode", p.zipCode);
    form.setValue("propertyId", p.id);
  };

  const clearProperty = () => {
    setLinkedProperty(null);
    form.setValue("propertyId", null);
  };

  const toggleTechnician = (userId: string) => {
    setSelectedTechnicianIds(prev => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev;
        const next = prev.filter(id => id !== userId);
        form.setValue("technicianUserId", next[0]);
        return next;
      } else {
        const next = [...prev, userId];
        if (prev.length === 0) form.setValue("technicianUserId", userId);
        return next;
      }
    });
  };

  const handleClose = () => {
    form.reset();
    setPhotos([]);
    setUploadedPdfs([]);
    setGpsCoords(null);
    setGpsStatus("idle");
    setGpsAddress(null);
    setLinkedProperty(prefillProperty ?? null);
    setPropertyPickerOpen(false);
    setPropertySearch("");
    setSelectedTechnicianIds(user?.id ? [user.id] : []);
    onClose();
  };

  const onSubmit = (data: InsertWorkLog) => {
    const leadId = selectedTechnicianIds[0] || data.technicianUserId;
    saveWorkLogMutation.mutate({
      ...data,
      technicianUserId: leadId,
      technicianUserIds: selectedTechnicianIds.length ? selectedTechnicianIds : [leadId],
      imageUrls: photos.map(p => p.url),
      pdfUrls: uploadedPdfs,
      photoMetadata: photos,
    } as any);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
      const stateAbbr = addr.state
        ? US_STATES.find((s) =>
            addr["ISO3166-2-lvl4"]?.endsWith(s) || addr.state_code === s
          ) || US_STATES.find((s) => addr.state?.toUpperCase().startsWith(s)) || ""
        : "";
      const zip = addr.postcode || "";
      const label = [city, addr.state].filter(Boolean).join(", ");
      setGpsAddress(label || null);
      if (city && !form.getValues("city")) form.setValue("city", city);
      if (stateAbbr && !form.getValues("state")) form.setValue("state", stateAbbr);
      if (zip && !form.getValues("zipCode")) form.setValue("zipCode", zip);
      return label;
    } catch {
      return null;
    }
  };

  const captureGps = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast({ title: "GPS not available", description: "Your browser does not support geolocation", variant: "destructive" });
      return;
    }
    setGpsStatus("capturing");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsCoords({ lat, lng });
        setGpsStatus("captured");
        const label = await reverseGeocode(lat, lng);
        if (!silent) toast({ title: "Location captured", description: label || `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      },
      () => {
        setGpsStatus("denied");
        if (!silent) toast({ title: "Location denied", description: "Permission was denied or location unavailable", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const { uploadURL } = await response.json();
    return { method: "PUT" as const, url: uploadURL };
  };

  const makeZoneHandler = (type: PhotoMeta["type"]) =>
    async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
      for (const file of result.successful) {
        try {
          const response = await apiRequest("PUT", "/api/objects/finalize", { objectUrl: file.uploadURL });
          const { objectPath } = await response.json();
          setPhotos(prev => [...prev, {
            url: objectPath,
            type,
            ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng, address: gpsAddress || undefined } : {}),
            capturedAt: new Date().toISOString(),
            technicianName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined : undefined,
          }]);
        } catch (error) {
          console.error("Error finalizing upload:", error);
        }
      }
    };

  const openCamera = (type: PhotoMeta["type"]) => {
    cameraZoneRef.current = type;
    cameraInputRef.current?.click();
  };

  const handleCameraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setCameraUploading(true);
    try {
      const uploadRes = await apiRequest("POST", "/api/objects/upload", {});
      const { uploadURL } = await uploadRes.json();
      await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const finalizeRes = await apiRequest("PUT", "/api/objects/finalize", { objectUrl: uploadURL });
      const { objectPath } = await finalizeRes.json();
      setPhotos(prev => [...prev, {
        url: objectPath,
        type: cameraZoneRef.current,
        ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng, address: gpsAddress || undefined } : {}),
        capturedAt: new Date().toISOString(),
        technicianName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined : undefined,
      }]);
      toast({ title: "Photo added" });
    } catch (error) {
      console.error("Camera upload error:", error);
      toast({ title: "Upload failed", description: "Could not upload photo", variant: "destructive" });
    } finally {
      setCameraUploading(false);
    }
  };

  const handlePdfUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    for (const file of result.successful) {
      try {
        const response = await apiRequest("PUT", "/api/objects/finalize", { objectUrl: file.uploadURL });
        const { objectPath } = await response.json();
        setUploadedPdfs(prev => [...prev, objectPath]);
      } catch (error) {
        console.error("Error finalizing PDF upload:", error);
      }
    }
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));
  const updatePhotoType = (index: number, type: PhotoMeta["type"]) =>
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, type } : p));
  const removePdf = (index: number) => setUploadedPdfs(prev => prev.filter((_, i) => i !== index));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Work Log Entry" : "Create New Work Log Entry"}</DialogTitle>
        </DialogHeader>

        {/* Property selector — new jobs only */}
        {!isEditMode && (
          <div className="relative">
            {linkedProperty ? (
              /* Linked state */
              <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-2 border-primary/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-building text-primary text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{linkedProperty.propertyName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {linkedProperty.customerName} · {linkedProperty.city}, {linkedProperty.state}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPropertyPickerOpen(true)}
                    className="text-xs text-primary hover:underline px-2 py-1"
                  >Change</button>
                  <button
                    type="button"
                    onClick={clearProperty}
                    className="w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                  ><i className="fas fa-times text-xs"></i></button>
                </div>
              </div>
            ) : (
              /* Unlinked state */
              <button
                type="button"
                onClick={() => setPropertyPickerOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                data-testid="button-select-property"
              >
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-building text-muted-foreground text-sm"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Link to a saved property</p>
                  <p className="text-xs text-muted-foreground">Auto-fill customer, address & location from your properties list</p>
                </div>
                <i className={`fas fa-chevron-${propertyPickerOpen ? "up" : "down"} text-muted-foreground ml-auto text-xs`}></i>
              </button>
            )}

            {/* Dropdown picker */}
            {propertyPickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search properties…"
                      value={propertySearch}
                      onChange={e => setPropertySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-1 focus:ring-primary"
                      data-testid="input-property-search"
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No saved properties yet</p>
                  ) : (() => {
                    const filtered = properties.filter(p =>
                      p.propertyName.toLowerCase().includes(propertySearch.toLowerCase()) ||
                      p.customerName.toLowerCase().includes(propertySearch.toLowerCase()) ||
                      p.city.toLowerCase().includes(propertySearch.toLowerCase())
                    );
                    return filtered.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No matches</p>
                    ) : filtered.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyProperty(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                        data-testid={`property-option-${p.id}`}
                      >
                        <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-map-marker-alt text-primary text-xs"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.propertyName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.customerName} · {p.city}, {p.state} {p.zipCode}</p>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
                <div className="p-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPropertyPickerOpen(false)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <i className="fas fa-user-circle text-primary"></i>
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter customer name" data-testid="input-customer-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-work-type">
                            <SelectValue placeholder="Select work type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Solar Installation">Solar Installation</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Inspection">Inspection</SelectItem>
                          <SelectItem value="Repair">Repair</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Customer Site, Building Name" data-testid="input-location-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter zip code" data-testid="input-zip-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Service Details Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <i className="fas fa-clipboard-list text-primary"></i>
                Service Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Technicians * <span className="text-muted-foreground font-normal">(select all who worked on this job)</span>
                  </label>
                  <div className="border border-border rounded-md divide-y divide-border overflow-hidden max-h-48 overflow-y-auto" data-testid="technician-multiselect">
                    {members.map((member) => {
                      const isSelected = selectedTechnicianIds.includes(member.userId);
                      const isLead = selectedTechnicianIds[0] === member.userId;
                      return (
                        <button
                          key={member.userId}
                          type="button"
                          onClick={() => toggleTechnician(member.userId)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted"}`}
                          data-testid={`technician-option-${member.userId}`}
                        >
                          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                            {isSelected && <i className="fas fa-check text-primary-foreground" style={{ fontSize: "8px" }}></i>}
                          </div>
                          <div className="w-7 h-7 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-primary">
                            {member.user.firstName?.[0]}{member.user.lastName?.[0]}
                          </div>
                          <span className="flex-1 font-medium">{member.user.firstName} {member.user.lastName}</span>
                          {isLead && isSelected && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">Lead</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTechnicianIds.length === 0 && (
                    <p className="text-xs text-destructive mt-1">Select at least one technician</p>
                  )}
                  {selectedTechnicianIds.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <i className="fas fa-info-circle mr-1"></i>
                      The first selected technician is marked as Lead
                    </p>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="serviceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-service-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="time" data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="time" data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workPerformed"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Work Performed *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Describe the work performed, materials used, and any observations..."
                          className="resize-none"
                          data-testid="textarea-work-performed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <i className="fas fa-cloud-upload-alt text-primary"></i>
                Photos &amp; Files
              </h4>

              {/* GPS Location Card */}
              <div className={`mb-5 rounded-xl border-2 p-4 transition-colors ${
                gpsStatus === "captured" ? "border-green-300 bg-green-50 dark:bg-green-950/30" :
                gpsStatus === "denied" ? "border-red-200 bg-red-50 dark:bg-red-950/30" :
                "border-border bg-muted/30"
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                    gpsStatus === "captured" ? "bg-green-500" :
                    gpsStatus === "denied" ? "bg-red-400" :
                    "bg-muted-foreground/40"
                  }`}>
                    <i className={`fas ${gpsStatus === "capturing" ? "fa-spinner fa-spin" : "fa-map-marker-alt"}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {gpsStatus === "captured" ? "Location detected" :
                       gpsStatus === "denied" ? "Location access denied" :
                       gpsStatus === "capturing" ? "Detecting location…" :
                       "Location not detected"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {gpsStatus === "captured"
                        ? `${gpsAddress ? gpsAddress + " · " : ""}${gpsCoords?.lat?.toFixed(5)}, ${gpsCoords?.lng?.toFixed(5)}`
                        : gpsStatus === "denied"
                        ? "Photos will be saved without a GPS tag"
                        : "Your location will be stamped on each photo as proof of work"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => captureGps(false)}
                    disabled={gpsStatus === "capturing"}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors flex-shrink-0 ${
                      gpsStatus === "captured" ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200" :
                      gpsStatus === "denied" ? "bg-red-100 text-red-700 border-red-300 hover:bg-red-200" :
                      "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                    data-testid="button-capture-gps"
                  >
                    <i className={`fas ${gpsStatus === "capturing" ? "fa-spinner fa-spin" : gpsStatus === "captured" ? "fa-sync-alt" : "fa-location-arrow"}`}></i>
                    {gpsStatus === "capturing" ? "Locating…" : gpsStatus === "captured" ? "Refresh" : "Detect"}
                  </button>
                </div>
              </div>

              {/* 3-Zone Photo Upload */}
              {(() => {
                const zones = [
                  { type: "before" as const, label: "Before Work", icon: "fa-hourglass-start", border: "border-amber-300", bg: "bg-amber-50 dark:bg-amber-950/20", header: "bg-amber-500", pill: "bg-amber-500", desc: "Site condition on arrival" },
                  { type: "general" as const, label: "During Work", icon: "fa-camera", border: "border-blue-300", bg: "bg-blue-50 dark:bg-blue-950/20", header: "bg-blue-500", pill: "bg-blue-500", desc: "Work in progress" },
                  { type: "after" as const, label: "After Complete", icon: "fa-check-circle", border: "border-green-300", bg: "bg-green-50 dark:bg-green-950/20", header: "bg-green-500", pill: "bg-green-500", desc: "Finished result" },
                ];
                return (
                  <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-3 sm:gap-3">
                    {zones.map(({ type, label, icon, border, bg, header, pill, desc }) => {
                      const zonePhotos = photos
                        .map((p, i) => ({ ...p, globalIndex: i }))
                        .filter(p => p.type === type);
                      return (
                        <div key={type} className={`rounded-xl border-2 ${border} ${bg} overflow-hidden`}>
                          {/* Zone header */}
                          <div className={`${header} px-3 py-2 flex items-center gap-2`}>
                            <i className={`fas ${icon} text-white text-sm`}></i>
                            <span className="text-white text-sm font-semibold">{label}</span>
                            {zonePhotos.length > 0 && (
                              <span className="ml-auto bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{zonePhotos.length}</span>
                            )}
                          </div>
                          {/* Photos grid */}
                          <div className="p-2 space-y-2">
                            {zonePhotos.length > 0 && (
                              <div className="grid grid-cols-2 gap-1.5">
                                {zonePhotos.map(({ url, lat, globalIndex }) => (
                                  <div key={globalIndex} className="relative group aspect-square">
                                    <img src={url} alt="" className="w-full h-full rounded-lg object-cover" />
                                    {lat !== undefined && (
                                      <span className="absolute top-0.5 left-0.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-full">
                                        <i className="fas fa-map-marker-alt"></i>
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removePhoto(globalIndex)}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      data-testid={`remove-photo-${globalIndex}`}
                                    >×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Move between zones */}
                            {zonePhotos.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {zonePhotos.map(({ globalIndex }) => (
                                  <div key={globalIndex} className="flex gap-0.5">
                                    {(["before", "general", "after"] as const)
                                      .filter(t => t !== type)
                                      .map(t => {
                                        const tLabels = { before: "→Before", general: "→Site", after: "→After" };
                                        return (
                                          <button key={t} type="button"
                                            onClick={() => updatePhotoType(globalIndex, t)}
                                            className="text-[9px] px-1 py-0.5 rounded bg-white/70 text-foreground/70 hover:bg-white border border-border/50"
                                          >{tLabels[t]}</button>
                                        );
                                      })}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Upload button for this zone */}
                            {/* Camera capture — mobile-first */}
                            <button
                              type="button"
                              onClick={() => openCamera(type)}
                              disabled={cameraUploading}
                              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed border-current/40 text-xs font-semibold transition-colors bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 active:scale-95"
                              style={{ color: header.replace("bg-", "").includes("amber") ? "#d97706" : header.replace("bg-", "").includes("blue") ? "#2563eb" : "#16a34a" }}
                              data-testid={`button-camera-${type}`}
                            >
                              <i className={`fas ${cameraUploading && cameraZoneRef.current === type ? "fa-spinner fa-spin" : "fa-camera"}`}></i>
                              <span className="sm:hidden">Take Photo</span>
                              <span className="hidden sm:inline">{zonePhotos.length === 0 ? "Camera" : "+"}</span>
                            </button>
                            <ObjectUploader
                              maxNumberOfFiles={10}
                              maxFileSize={10485760}
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={makeZoneHandler(type)}
                              buttonClassName="w-full"
                            >
                              <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium">
                                <i className="fas fa-upload text-[10px]"></i>
                                <span className="sm:hidden">Upload from Gallery</span>
                                <span className="hidden sm:inline">{zonePhotos.length === 0 ? `Add ${label}` : "Add more"}</span>
                              </div>
                            </ObjectUploader>
                            {zonePhotos.length === 0 && (
                              <p className="text-[10px] text-center text-muted-foreground/70 pb-1">{desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Hidden camera input for native mobile camera */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraFile}
                data-testid="input-camera-capture"
              />

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <i className="fas fa-file-pdf text-destructive mr-1.5"></i>
                  PDF Reports
                </label>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={26214400}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handlePdfUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fas fa-file-pdf text-3xl text-muted-foreground"></i>
                    <p className="text-foreground font-medium text-sm">Upload PDF Reports</p>
                    <p className="text-xs text-muted-foreground">PDF only · Max 25MB each</p>
                  </div>
                </ObjectUploader>
                {uploadedPdfs.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {uploadedPdfs.map((_, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-pdf text-destructive text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">Report_{index + 1}.pdf</p>
                        </div>
                        <button type="button" onClick={() => removePdf(index)} className="text-destructive hover:text-destructive/80" data-testid={`remove-pdf-${index}`}>
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <i className="fas fa-sticky-note text-primary"></i>
                Additional Notes
              </h4>
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        rows={3}
                        placeholder="Any additional comments, follow-up required, or special observations..."
                        className="resize-none"
                        data-testid="textarea-additional-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={saveWorkLogMutation.isPending}
                data-testid="button-save-entry"
              >
                {saveWorkLogMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {isEditMode ? "Update Work Log" : "Save Work Log Entry"}
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
