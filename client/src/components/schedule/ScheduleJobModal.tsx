import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DynamicForm } from "@/components/DynamicForm";
import type { WorkLog, BusinessMember, User, Property, FormTemplate, FormSchema, FormLogicRule } from "@shared/schema";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY"
];

const scheduleJobSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  workType: z.string().min(1, "Work type is required"),
  locationName: z.string().min(1, "Location is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  serviceDate: z.string().min(1, "Service date is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  estimatedDuration: z.string().default("60"),
  workPerformed: z.string().min(1, "Work description is required"),
  additionalNotes: z.string().optional(),
  technicianUserId: z.string().min(1, "Technician is required"),
  propertyId: z.string().optional(),
});

type ScheduleJobFormData = z.infer<typeof scheduleJobSchema>;

interface ScheduleJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  editJob?: WorkLog | null;
  selectedDate?: Date;
}

export function ScheduleJobModal({ isOpen, onClose, editJob, selectedDate }: ScheduleJobModalProps) {
  const { toast } = useToast();
  const isEdit = !!editJob;
  const [formResponses, setFormResponses] = useState<Record<string, Record<string, unknown>>>({});
  const [pendingTasks, setPendingTasks] = useState<Array<{ templateId: string; title: string; description?: string }>>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  const { data: members = [] } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
    enabled: isOpen,
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: isOpen,
  });

  const { data: formTemplates = [] } = useQuery<FormTemplate[]>({
    queryKey: ["/api/form-templates"],
    enabled: isOpen,
  });

  const formatDateForInput = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const parseScheduledTime = (isoTime: string | null) => {
    if (!isoTime) return "";
    try {
      const date = new Date(isoTime);
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const form = useForm<ScheduleJobFormData>({
    resolver: zodResolver(scheduleJobSchema),
    defaultValues: {
      customerName: "",
      workType: "",
      locationName: "",
      city: "",
      state: "",
      zipCode: "",
      serviceDate: selectedDate ? formatDateForInput(selectedDate) : formatDateForInput(new Date()),
      scheduledTime: "09:00",
      estimatedDuration: "60",
      workPerformed: "",
      additionalNotes: "",
      technicianUserId: "",
      propertyId: "",
    },
  });

  useEffect(() => {
    if (editJob) {
      form.reset({
        customerName: editJob.customerName,
        workType: editJob.workType,
        locationName: editJob.locationName,
        city: editJob.city,
        state: editJob.state,
        zipCode: editJob.zipCode,
        serviceDate: editJob.serviceDate,
        scheduledTime: parseScheduledTime(editJob.scheduledStartTime) || editJob.startTime || "09:00",
        estimatedDuration: "60",
        workPerformed: editJob.workPerformed,
        additionalNotes: editJob.additionalNotes || "",
        technicianUserId: editJob.technicianUserId,
        propertyId: editJob.propertyId || "",
      });
    } else if (selectedDate && isOpen) {
      form.setValue("serviceDate", formatDateForInput(selectedDate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editJob, selectedDate, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleJobFormData) => {
      const serviceDate = data.serviceDate;
      const [hours, minutes] = data.scheduledTime.split(":").map(Number);

      const scheduledStart = new Date(serviceDate);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const durationMinutes = parseInt(data.estimatedDuration) || 60;
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);

      const payload = {
        customerName: data.customerName,
        workType: data.workType,
        locationName: data.locationName,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        serviceDate,
        startTime: data.scheduledTime,
        workPerformed: data.workPerformed,
        additionalNotes: data.additionalNotes || null,
        technicianUserId: data.technicianUserId,
        propertyId: data.propertyId || null,
        scheduledStartTime: scheduledStart.toISOString(),
        scheduledEndTime: scheduledEnd.toISOString(),
        technicianUserIds: [data.technicianUserId],
        status: "scheduled",
      };

      const res = await fetch("/api/schedule/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", res.status, errorText);
        throw new Error(errorText || "Failed to create job");
      }

      const responseText = await res.text();
      console.log("Server response:", res.status, responseText);

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError, responseText);
        throw new Error("Invalid response from server");
      }
    },
    onSuccess: async (createdJob: { id: string }) => {
      // Save form submissions for attached checklists
      for (const templateId of selectedTemplateIds) {
        const responses = formResponses[templateId];
        if (responses && Object.keys(responses).length > 0) {
          try {
            await fetch(`/api/work-logs/${createdJob.id}/forms`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateId,
                responses,
                tasksToCreate: pendingTasks.filter(t => t.templateId === templateId),
              }),
              credentials: "include",
            });
          } catch (err) {
            console.error("Failed to save form submission:", err);
          }
        }
      }

      toast({ title: "Success", description: "Scheduled job created." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
      form.reset();
      setSelectedTemplateIds([]);
      setFormResponses({});
      setPendingTasks([]);
      onClose();
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({ title: "Error", description: error.message || "Failed to create scheduled job.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ScheduleJobFormData) => {
      const serviceDate = data.serviceDate;
      const [hours, minutes] = data.scheduledTime.split(":").map(Number);

      const scheduledStart = new Date(serviceDate);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const durationMinutes = parseInt(data.estimatedDuration) || 60;
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);

      const payload = {
        customerName: data.customerName,
        workType: data.workType,
        locationName: data.locationName,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        serviceDate,
        startTime: data.scheduledTime,
        workPerformed: data.workPerformed,
        additionalNotes: data.additionalNotes || null,
        technicianUserId: data.technicianUserId,
        propertyId: data.propertyId || null,
        scheduledStartTime: scheduledStart.toISOString(),
        scheduledEndTime: scheduledEnd.toISOString(),
        technicianUserIds: [data.technicianUserId],
      };

      const res = await apiRequest("PATCH", `/api/work-logs/${editJob!.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Job updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/jobs"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update job.", variant: "destructive" });
    },
  });

  const handlePropertySelect = (propertyId: string) => {
    form.setValue("propertyId", propertyId);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      form.setValue("customerName", property.customerName);
      form.setValue("locationName", property.locationName);
      form.setValue("city", property.city);
      form.setValue("state", property.state);
      form.setValue("zipCode", property.zipCode);
    }
  };

  const onSubmit = (data: ScheduleJobFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Scheduled Job" : "Schedule New Job"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Property selection */}
            {properties.length > 0 && (
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property (Optional)</FormLabel>
                    <Select onValueChange={handlePropertySelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property to auto-fill details" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {properties.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName} - {p.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer & Work Type */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Customer name" />
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
                    <FormControl>
                      <Input {...field} placeholder="e.g., HVAC Repair, Plumbing" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date & Time */}
              <FormField
                control={form.control}
                name="serviceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Technician */}
              <FormField
                control={form.control}
                name="technicianUserId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Assign Technician *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {member.user.firstName} {member.user.lastName} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="locationName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street address" />
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
                      <Input {...field} placeholder="City" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
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
                      <FormLabel>Zip *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Work Description */}
              <FormField
                control={form.control}
                name="workPerformed"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Work Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe the work to be performed..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={2}
                        placeholder="Any additional notes..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Templates / Checklists Section */}
            {formTemplates.filter(t => t.isActive === "true").length > 0 && (
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <i className="fas fa-clipboard-list text-primary"></i>
                    Checklists
                  </h4>
                  <Select
                    onValueChange={(templateId) => {
                      if (templateId && !selectedTemplateIds.includes(templateId)) {
                        setSelectedTemplateIds(prev => [...prev, templateId]);
                      }
                    }}
                    value=""
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="+ Add Checklist" />
                    </SelectTrigger>
                    <SelectContent>
                      {formTemplates
                        .filter(t => t.isActive === "true" && !selectedTemplateIds.includes(t.id))
                        .map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplateIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No checklists attached. Use "Add Checklist" to attach one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTemplateIds.map(templateId => {
                      const template = formTemplates.find(t => t.id === templateId);
                      if (!template) return null;
                      return (
                        <Card key={template.id}>
                          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setSelectedTemplateIds(prev => prev.filter(id => id !== templateId));
                                setFormResponses(prev => {
                                  const next = { ...prev };
                                  delete next[templateId];
                                  return next;
                                });
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          </CardHeader>
                          <CardContent className="px-3 pb-3">
                            <DynamicForm
                              schema={template.schema as FormSchema}
                              logicRules={(template.logicRules as FormLogicRule[]) || []}
                              initialValues={formResponses[template.id] || {}}
                              onSubmit={({ values, tasksToCreate }) => {
                                setFormResponses(prev => ({ ...prev, [template.id]: values }));
                                setPendingTasks(prev => [
                                  ...prev.filter(t => t.templateId !== template.id),
                                  ...tasksToCreate.map(task => ({ templateId: template.id, ...task }))
                                ]);
                                toast({ title: "Checklist saved", description: `${template.name} responses saved.` });
                              }}
                              submitLabel="Save Checklist"
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {pendingTasks.length > 0 && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      <i className="fas fa-tasks mr-1"></i> {pendingTasks.length} follow-up task(s) will be created
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Update Job" : "Schedule Job"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
