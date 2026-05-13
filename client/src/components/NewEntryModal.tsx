import { useState, useEffect } from "react";
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
  const [uploadedImages, setUploadedImages] = useState<string[]>(editWorkLog?.imageUrls || []);
  const [uploadedPdfs, setUploadedPdfs] = useState<string[]>(editWorkLog?.pdfUrls || []);
  const [photoType, setPhotoType] = useState<"before" | "after" | "general">("general");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "denied">("idle");
  const [photoMetadata, setPhotoMetadata] = useState<PhotoMeta[]>(editWorkLog?.photoMetadata || []);

  const { data: members = [] } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
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
      form.reset({
        customerName: editWorkLog.customerName,
        workType: editWorkLog.workType,
        locationName: editWorkLog.locationName,
        city: editWorkLog.city,
        state: editWorkLog.state,
        zipCode: editWorkLog.zipCode,
        businessId: editWorkLog.businessId,
        propertyId: editWorkLog.propertyId || null,
        technicianUserId: editWorkLog.technicianUserId,
        serviceDate: editWorkLog.serviceDate,
        startTime: editWorkLog.startTime || null,
        endTime: editWorkLog.endTime || null,
        workPerformed: editWorkLog.workPerformed,
        additionalNotes: editWorkLog.additionalNotes || null,
        status: editWorkLog.status,
        imageUrls: editWorkLog.imageUrls || [],
        pdfUrls: editWorkLog.pdfUrls || [],
      });
      setUploadedImages(editWorkLog.imageUrls || []);
      setUploadedPdfs(editWorkLog.pdfUrls || []);
      setPhotoMetadata(editWorkLog.photoMetadata || []);
    } else if (isOpen) {
      form.reset({
        customerName: prefillProperty?.customerName || "",
        workType: "",
        locationName: prefillProperty?.locationName || "",
        city: prefillProperty?.city || "",
        state: prefillProperty?.state || "",
        zipCode: prefillProperty?.zipCode || "",
        businessId: "",
        propertyId: prefillProperty?.id || null,
        technicianUserId: user?.id || "",
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
      setUploadedImages([]);
      setUploadedPdfs([]);
      setPhotoMetadata([]);
      setGpsCoords(null);
      setGpsStatus("idle");
      setPhotoType("general");
    }
  }, [editWorkLog, isOpen, prefillProperty, form, user]);

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

  const handleClose = () => {
    form.reset();
    setUploadedImages([]);
    setUploadedPdfs([]);
    setPhotoMetadata([]);
    setGpsCoords(null);
    setGpsStatus("idle");
    setPhotoType("general");
    onClose();
  };

  const onSubmit = (data: InsertWorkLog) => {
    saveWorkLogMutation.mutate({
      ...data,
      imageUrls: uploadedImages,
      pdfUrls: uploadedPdfs,
      photoMetadata,
    });
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not available", description: "Your browser does not support geolocation", variant: "destructive" });
      return;
    }
    setGpsStatus("capturing");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("captured");
        toast({ title: "Location captured", description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
      },
      () => {
        setGpsStatus("denied");
        toast({ title: "Location denied", description: "Permission was denied or location unavailable", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const { uploadURL } = await response.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const newImages: string[] = [];
    const newMeta: PhotoMeta[] = [];
    
    for (const file of result.successful) {
      try {
        const response = await apiRequest("PUT", "/api/objects/finalize", {
          objectUrl: file.uploadURL,
        });
        const { objectPath } = await response.json();
        newImages.push(objectPath);
        newMeta.push({
          url: objectPath,
          type: photoType,
          ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : {}),
          capturedAt: new Date().toISOString(),
          technicianName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined : undefined,
        });
      } catch (error) {
        console.error("Error finalizing image upload:", error);
      }
    }
    
    setUploadedImages(prev => [...prev, ...newImages]);
    setPhotoMetadata(prev => [...prev, ...newMeta]);
  };

  const handlePdfUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    const newPdfs: string[] = [];
    
    for (const file of result.successful) {
      try {
        const response = await apiRequest("PUT", "/api/objects/finalize", {
          objectUrl: file.uploadURL,
        });
        const { objectPath } = await response.json();
        newPdfs.push(objectPath);
      } catch (error) {
        console.error("Error finalizing PDF upload:", error);
      }
    }
    
    setUploadedPdfs(prev => [...prev, ...newPdfs]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setPhotoMetadata(prev => prev.filter((_, i) => i !== index));
  };

  const removePdf = (index: number) => {
    setUploadedPdfs(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Work Log Entry" : "Create New Work Log Entry"}</DialogTitle>
        </DialogHeader>

        {prefillProperty && !isEditMode && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
            <i className="fas fa-building text-primary"></i>
            <div>
              <p className="text-sm font-medium text-foreground">Linked to: {prefillProperty.propertyName}</p>
              <p className="text-xs text-muted-foreground">Property info has been auto-filled below</p>
            </div>
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
                <FormField
                  control={form.control}
                  name="technicianUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || user?.id}>
                        <FormControl>
                          <SelectTrigger data-testid="select-technician">
                            <SelectValue placeholder="Select technician" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              {member.user.firstName} {member.user.lastName}
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
                Upload Files
              </h4>

              {/* Photo Type + GPS Controls */}
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Tag as:</span>
                  {(["before", "general", "after"] as const).map((t) => {
                    const labels = { before: "Before", general: "General", after: "After" };
                    const icons = { before: "fas fa-hourglass-start", general: "fas fa-camera", after: "fas fa-check-circle" };
                    const colors = { before: "bg-amber-100 text-amber-700 border-amber-300", general: "bg-blue-100 text-blue-700 border-blue-300", after: "bg-green-100 text-green-700 border-green-300" };
                    const activeColors = { before: "bg-amber-500 text-white border-amber-500", general: "bg-blue-500 text-white border-blue-500", after: "bg-green-500 text-white border-green-500" };
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPhotoType(t)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${photoType === t ? activeColors[t] : colors[t]}`}
                        data-testid={`photo-type-${t}`}
                      >
                        <i className={`${icons[t]} mr-1`}></i>{labels[t]}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {gpsStatus === "captured" && gpsCoords && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <i className="fas fa-map-marker-alt"></i>
                      {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={captureGps}
                    disabled={gpsStatus === "capturing"}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5 transition-colors ${
                      gpsStatus === "captured"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : gpsStatus === "denied"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                    data-testid="button-capture-gps"
                  >
                    <i className={`fas ${gpsStatus === "capturing" ? "fa-spinner fa-spin" : gpsStatus === "captured" ? "fa-map-marker-alt" : "fa-location-arrow"}`}></i>
                    {gpsStatus === "capturing" ? "Locating..." : gpsStatus === "captured" ? "GPS Ready" : gpsStatus === "denied" ? "GPS Denied" : "Capture GPS"}
                  </button>
                </div>
              </div>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Images</label>
                <ObjectUploader
                  maxNumberOfFiles={10}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleImageUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex flex-col items-center gap-2 py-8">
                    <i className="fas fa-image text-4xl text-muted-foreground"></i>
                    <p className="text-foreground font-medium">Upload Images</p>
                    <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports: JPG, PNG, HEIC (Max 10MB each)</p>
                  </div>
                </ObjectUploader>
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {uploadedImages.map((imageUrl, index) => {
                      const meta = photoMetadata[index];
                      const typeColors = { before: "bg-amber-500", after: "bg-green-500", general: "bg-blue-500" };
                      return (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 rounded-lg object-cover"
                          />
                          {meta && (
                            <span className={`absolute bottom-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${typeColors[meta.type] ?? "bg-gray-500"}`}>
                              {meta.type}
                            </span>
                          )}
                          {meta?.lat !== undefined && (
                            <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                              <i className="fas fa-map-marker-alt"></i>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                            data-testid={`remove-image-${index}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Reports (PDF)</label>
                <ObjectUploader
                  maxNumberOfFiles={5}
                  maxFileSize={26214400} // 25MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handlePdfUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex flex-col items-center gap-2 py-8">
                    <i className="fas fa-file-pdf text-4xl text-muted-foreground"></i>
                    <p className="text-foreground font-medium">Upload PDF Reports</p>
                    <p className="text-sm text-muted-foreground">Drag and drop or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports: PDF files only (Max 25MB each)</p>
                  </div>
                </ObjectUploader>
                
                {uploadedPdfs.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {uploadedPdfs.map((pdfUrl, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file-pdf text-destructive"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">Report_{index + 1}.pdf</p>
                          <p className="text-xs text-muted-foreground">PDF Document</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePdf(index)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          data-testid={`remove-pdf-${index}`}
                        >
                          <i className="fas fa-trash"></i>
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
