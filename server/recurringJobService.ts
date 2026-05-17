import { storage } from "./storage";
import type { RecurringSchedule, InsertWorkLog } from "@shared/schema";

/**
 * Calculate the next occurrence dates for a recurring schedule
 */
function calculateOccurrences(
  schedule: RecurringSchedule,
  fromDate: Date,
  toDate: Date
): Date[] {
  const occurrences: Date[] = [];
  const startDate = new Date(schedule.startDate);
  const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
  const interval = parseInt(schedule.interval) || 1;
  const maxOccurrences = schedule.maxOccurrences ? parseInt(schedule.maxOccurrences) : null;

  // Start from the schedule's start date or the fromDate, whichever is later
  let currentDate = new Date(Math.max(startDate.getTime(), fromDate.getTime()));

  // If we have a lastGeneratedDate, start from the day after
  if (schedule.lastGeneratedDate) {
    const lastGenerated = new Date(schedule.lastGeneratedDate);
    lastGenerated.setDate(lastGenerated.getDate() + 1);
    if (lastGenerated > currentDate) {
      currentDate = lastGenerated;
    }
  }

  // Align currentDate to the proper interval start based on frequency
  if (schedule.frequency === "weekly") {
    // For weekly, align to the start of the week
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);
  } else if (schedule.frequency === "monthly") {
    // For monthly, align to the first of the month
    currentDate.setDate(1);
  }

  let occurrenceCount = 0;
  const maxIterations = 400; // Safety limit
  let iterations = 0;

  while (currentDate <= toDate && iterations < maxIterations) {
    iterations++;

    // Check if we've exceeded end date
    if (endDate && currentDate > endDate) break;

    // Check if we've exceeded max occurrences
    if (maxOccurrences && occurrenceCount >= maxOccurrences) break;

    // Check if this date should be included based on frequency
    let shouldInclude = false;

    switch (schedule.frequency) {
      case "daily":
        shouldInclude = currentDate >= startDate && currentDate >= fromDate;
        break;

      case "weekly":
        const daysOfWeek = schedule.daysOfWeek || [];
        if (daysOfWeek.length > 0) {
          shouldInclude = daysOfWeek.includes(currentDate.getDay()) &&
            currentDate >= startDate && currentDate >= fromDate;
        }
        break;

      case "monthly":
        const dayOfMonth = schedule.dayOfMonth;
        if (dayOfMonth === "last") {
          // Last day of the month
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          shouldInclude = currentDate.getDate() === lastDay &&
            currentDate >= startDate && currentDate >= fromDate;
        } else if (dayOfMonth) {
          const targetDay = parseInt(dayOfMonth);
          const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          // If target day is greater than days in month, use last day
          const effectiveDay = Math.min(targetDay, lastDay);
          shouldInclude = currentDate.getDate() === effectiveDay &&
            currentDate >= startDate && currentDate >= fromDate;
        }
        break;
    }

    if (shouldInclude && currentDate <= toDate) {
      occurrences.push(new Date(currentDate));
      occurrenceCount++;
    }

    // Move to next potential occurrence
    switch (schedule.frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 1);
        // Skip to next week if we've checked all days this week
        if (currentDate.getDay() === 0 && iterations > 1) {
          currentDate.setDate(currentDate.getDate() + (interval - 1) * 7);
        }
        break;
      case "monthly":
        currentDate.setDate(currentDate.getDate() + 1);
        // If we're at a new month and interval > 1, skip months
        if (currentDate.getDate() === 1) {
          currentDate.setMonth(currentDate.getMonth() + (interval - 1));
        }
        break;
    }
  }

  return occurrences;
}

/**
 * Generate work logs for all active recurring schedules
 * Generates jobs for the next 30 days
 */
export async function generateRecurringJobs(businessId: string): Promise<any[]> {
  const schedules = await storage.getActiveRecurringSchedules(businessId);
  const generatedJobs: any[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate jobs for the next 30 days
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  for (const schedule of schedules) {
    const occurrences = calculateOccurrences(schedule, today, endDate);

    for (const occurrenceDate of occurrences) {
      // Format the date as YYYY-MM-DD
      const serviceDate = occurrenceDate.toISOString().split("T")[0];

      // Parse scheduled time (HH:mm) and create ISO datetime
      const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
      const scheduledStart = new Date(occurrenceDate);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const durationMinutes = parseInt(schedule.estimatedDurationMinutes || "60");
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);

      // Determine the primary technician (first in the array)
      const technicianUserIds = schedule.technicianUserIds || [];
      const primaryTechnicianId = technicianUserIds[0];

      if (!primaryTechnicianId) {
        console.warn(`Skipping schedule ${schedule.id}: no technician assigned`);
        continue;
      }

      const workLogData: InsertWorkLog = {
        businessId: schedule.businessId,
        propertyId: schedule.propertyId || null,
        technicianUserId: primaryTechnicianId,
        customerName: schedule.customerName,
        workType: schedule.workType,
        locationName: schedule.locationName,
        city: schedule.city,
        state: schedule.state,
        zipCode: schedule.zipCode,
        serviceDate,
        startTime: schedule.scheduledTime,
        endTime: null,
        workPerformed: schedule.workDescription,
        additionalNotes: schedule.notes || null,
        status: "scheduled",
        technicianUserIds,
        imageUrls: [],
        pdfUrls: [],
        photoMetadata: [],
        scheduledStartTime: scheduledStart.toISOString(),
        scheduledEndTime: scheduledEnd.toISOString(),
        recurringScheduleId: schedule.id,
        isRecurrenceInstance: "true",
      };

      try {
        const workLog = await storage.createWorkLog(workLogData);
        generatedJobs.push(workLog);
      } catch (error) {
        console.error(`Error creating work log for schedule ${schedule.id}:`, error);
      }
    }

    // Update lastGeneratedDate on the schedule
    if (occurrences.length > 0) {
      const lastOccurrence = occurrences[occurrences.length - 1];
      await storage.updateRecurringSchedule(schedule.id, schedule.businessId, {
        lastGeneratedDate: lastOccurrence.toISOString().split("T")[0],
      });
    }
  }

  return generatedJobs;
}

/**
 * Generate recurring jobs for a single schedule
 */
export async function generateJobsForSchedule(
  scheduleId: string,
  businessId: string,
  daysAhead: number = 30
): Promise<any[]> {
  const schedule = await storage.getRecurringSchedule(scheduleId, businessId);
  if (!schedule || schedule.isActive !== "true") {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  const occurrences = calculateOccurrences(schedule, today, endDate);
  const generatedJobs: any[] = [];

  const technicianUserIds = schedule.technicianUserIds || [];
  const primaryTechnicianId = technicianUserIds[0];

  if (!primaryTechnicianId) {
    console.warn(`Schedule ${schedule.id} has no technician assigned`);
    return [];
  }

  for (const occurrenceDate of occurrences) {
    const serviceDate = occurrenceDate.toISOString().split("T")[0];

    const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
    const scheduledStart = new Date(occurrenceDate);
    scheduledStart.setHours(hours, minutes, 0, 0);

    const durationMinutes = parseInt(schedule.estimatedDurationMinutes || "60");
    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(scheduledEnd.getMinutes() + durationMinutes);

    const workLogData: InsertWorkLog = {
      businessId: schedule.businessId,
      propertyId: schedule.propertyId || null,
      technicianUserId: primaryTechnicianId,
      customerName: schedule.customerName,
      workType: schedule.workType,
      locationName: schedule.locationName,
      city: schedule.city,
      state: schedule.state,
      zipCode: schedule.zipCode,
      serviceDate,
      startTime: schedule.scheduledTime,
      endTime: null,
      workPerformed: schedule.workDescription,
      additionalNotes: schedule.notes || null,
      status: "scheduled",
      technicianUserIds,
      imageUrls: [],
      pdfUrls: [],
      photoMetadata: [],
      scheduledStartTime: scheduledStart.toISOString(),
      scheduledEndTime: scheduledEnd.toISOString(),
      recurringScheduleId: schedule.id,
      isRecurrenceInstance: "true",
    };

    try {
      const workLog = await storage.createWorkLog(workLogData);
      generatedJobs.push(workLog);
    } catch (error) {
      console.error(`Error creating work log for schedule ${schedule.id}:`, error);
    }
  }

  // Update lastGeneratedDate
  if (occurrences.length > 0) {
    const lastOccurrence = occurrences[occurrences.length - 1];
    await storage.updateRecurringSchedule(schedule.id, schedule.businessId, {
      lastGeneratedDate: lastOccurrence.toISOString().split("T")[0],
    });
  }

  return generatedJobs;
}
