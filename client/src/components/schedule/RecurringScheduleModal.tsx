import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { RecurringSchedule, BusinessMember, User, Property } from "@shared/schema";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY"
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const recurringScheduleSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  workType: z.string().min(1, "Work type is required"),
  locationName: z.string().min(1, "Location is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  workDescription: z.string().min(1, "Work description is required"),
  notes: z.string().optional(),
  technicianUserIds: z.array(z.string()).min(1, "At least one technician is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  estimatedDurationMinutes: z.string().default("60"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.string().default("1"),
  daysOfWeek: z.array(z.number()).optional(),
  dayOfMonth: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  maxOccurrences: z.string().optional(),
  propertyId: z.string().optional(),
});

type RecurringScheduleFormData = z.infer<typeof recurringScheduleSchema>;

interface RecurringScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSchedule?: RecurringSchedule | null;
}

export function RecurringScheduleModal({ isOpen, onClose, editSchedule }: RecurringScheduleModalProps) {
  const { toast } = useToast();
  const isEdit = !!editSchedule;

  const { data: members = [] } = useQuery<(BusinessMember & { user: User })[]>({
    queryKey: ["/api/business/members"],
    enabled: isOpen,
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: isOpen,
  });

  const formatDateForInput = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const form = useForm<RecurringScheduleFormData>({
    resolver: zodResolver(recurringScheduleSchema),
    defaultValues: {
      customerName: "",
      workType: "",
      locationName: "",
      city: "",
      state: "",
      zipCode: "",
      workDescription: "",
      notes: "",
      technicianUserIds: [],
      scheduledTime: "09:00",
      estimatedDurationMinutes: "60",
      frequency: "weekly",
      interval: "1",
      daysOfWeek: [],
      dayOfMonth: "1",
      startDate: formatDateForInput(new Date()),
      endDate: "",
      maxOccurrences: "",
      propertyId: "",
    },
  });

  const frequency = form.watch("frequency");

  useEffect(() => {
    if (editSchedule) {
      form.reset({
        customerName: editSchedule.customerName,
        workType: editSchedule.workType,
        locationName: editSchedule.locationName,
        city: editSchedule.city,
        state: editSchedule.state,
        zipCode: editSchedule.zipCode,
        workDescription: editSchedule.workDescription,
        notes: editSchedule.notes || "",
        technicianUserIds: editSchedule.technicianUserIds || [],
        scheduledTime: editSchedule.scheduledTime,
        estimatedDurationMinutes: editSchedule.estimatedDurationMinutes || "60",
        frequency: editSchedule.frequency as "daily" | "weekly" | "monthly",
        interval: editSchedule.interval,
        daysOfWeek: editSchedule.daysOfWeek || [],
        dayOfMonth: editSchedule.dayOfMonth || "1",
        startDate: editSchedule.startDate,
        endDate: editSchedule.endDate || "",
        maxOccurrences: editSchedule.maxOccurrences || "",
        propertyId: editSchedule.propertyId || "",
      });
    }
  }, [editSchedule, form]);

  const createMutation = useMutation({
    mutationFn: async (data: RecurringScheduleFormData) => {
      const payload = {
        ...data,
        daysOfWeek: data.frequency === "weekly" ? data.daysOfWeek : [],
        dayOfMonth: data.frequency === "monthly" ? data.dayOfMonth : null,
        endDate: data.endDate || null,
        maxOccurrences: data.maxOccurrences || null,
        propertyId: data.propertyId || null,
        notes: data.notes || null,
      };
      const res = await apiRequest("POST", "/api/recurring-schedules", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Recurring schedule created." });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-schedules"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create recurring schedule.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RecurringScheduleFormData) => {
      const payload = {
        ...data,
        daysOfWeek: data.frequency === "weekly" ? data.daysOfWeek : [],
        dayOfMonth: data.frequency === "monthly" ? data.dayOfMonth : null,
        endDate: data.endDate || null,
        maxOccurrences: data.maxOccurrences || null,
        propertyId: data.propertyId || null,
        notes: data.notes || null,
      };
      const res = await apiRequest("PATCH", `/api/recurring-schedules/${editSchedule!.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Recurring schedule updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/recurring-schedules"] });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update recurring schedule.", variant: "destructive" });
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

  const onSubmit = (data: RecurringScheduleFormData) => {
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
          <DialogTitle>{isEdit ? "Edit Recurring Schedule" : "Create Recurring Schedule"}</DialogTitle>
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
                      <Input {...field} placeholder="e.g., Maintenance, Inspection" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Technician */}
              <FormField
                control={form.control}
                name="technicianUserIds"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Assign Technicians *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const current = field.value || [];
                        if (current.includes(value)) {
                          field.onChange(current.filter(id => id !== value));
                        } else {
                          field.onChange([...current, value]);
                        }
                      }}
                      value=""
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician(s)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map(member => (
                          <SelectItem key={member.userId} value={member.userId}>
                            {field.value?.includes(member.userId) ? "✓ " : ""}
                            {member.user.firstName} {member.user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map(id => {
                          const member = members.find(m => m.userId === id);
                          return member ? (
                            <span key={id} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                              {member.user.firstName} {member.user.lastName}
                              <button
                                type="button"
                                className="ml-1"
                                onClick={() => field.onChange(field.value.filter(v => v !== id))}
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
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

              {/* Schedule Time */}
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

              <FormField
                control={form.control}
                name="estimatedDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="15" step="15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurrence Settings */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h4 className="font-medium text-foreground">Recurrence Pattern</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Every</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input type="number" min="1" max="12" className="w-20" {...field} />
                        </FormControl>
                        <span className="text-sm text-muted-foreground">
                          {frequency === "daily" ? "day(s)" : frequency === "weekly" ? "week(s)" : "month(s)"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Weekly - Days of Week */}
                {frequency === "weekly" && (
                  <FormField
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Days of Week *</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map(day => (
                            <label
                              key={day.value}
                              className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                                field.value?.includes(day.value)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted"
                              }`}
                            >
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.value].sort());
                                  } else {
                                    field.onChange(current.filter(d => d !== day.value));
                                  }
                                }}
                                className="sr-only"
                              />
                              {day.label}
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Monthly - Day of Month */}
                {frequency === "monthly" && (
                  <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Day of Month</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={String(day)}>
                                {day}
                              </SelectItem>
                            ))}
                            <SelectItem value="last">Last day of month</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Date Range */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Leave empty for no end date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Work Description */}
            <FormField
              control={form.control}
              name="workDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Describe the recurring work..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Update Schedule" : "Create Schedule"}
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
