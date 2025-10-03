import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkLogSchema, type InsertWorkLog } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
}

export function NewEntryModal({ isOpen, onClose, onSuccess }: NewEntryModalProps) {
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedPdfs, setUploadedPdfs] = useState<string[]>([]);

  const form = useForm<InsertWorkLog>({
    resolver: zodResolver(insertWorkLogSchema),
    defaultValues: {
      customerName: "",
      workType: "",
      locationName: "",
      city: "",
      state: "",
      zipCode: "",
      technicianName: "Mike Johnson", // Default to current user
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

  const createWorkLogMutation = useMutation({
    mutationFn: async (data: InsertWorkLog) => {
      const response = await apiRequest("POST", "/api/work-logs", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Work log entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onSuccess();
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work log entry",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setUploadedImages([]);
    setUploadedPdfs([]);
    onClose();
  };

  const onSubmit = (data: InsertWorkLog) => {
    createWorkLogMutation.mutate({
      ...data,
      imageUrls: uploadedImages,
      pdfUrls: uploadedPdfs,
    });
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
    
    for (const file of result.successful) {
      try {
        const response = await apiRequest("PUT", "/api/objects/finalize", {
          objectUrl: file.uploadURL,
        });
        const { objectPath } = await response.json();
        newImages.push(objectPath);
      } catch (error) {
        console.error("Error finalizing image upload:", error);
      }
    }
    
    setUploadedImages(prev => [...prev, ...newImages]);
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
  };

  const removePdf = (index: number) => {
    setUploadedPdfs(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Work Log Entry</DialogTitle>
        </DialogHeader>

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
                  name="technicianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technician Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter technician name" data-testid="input-technician-name" />
                      </FormControl>
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
                        <Input {...field} type="time" data-testid="input-start-time" />
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
                        <Input {...field} type="time" data-testid="input-end-time" />
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
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-24 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                          data-testid={`remove-image-${index}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
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
                disabled={createWorkLogMutation.isPending}
                data-testid="button-save-entry"
              >
                {createWorkLogMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Work Log Entry
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
