import { google, calendar_v3 } from "googleapis";
import { db } from "./db";
import { users, workLogs } from "@shared/schema";
import { eq } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/google/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getAuthenticatedClient(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || !user.googleAccessToken) {
    throw new Error("User not connected to Google Calendar");
  }

  const oauth2Client = createOAuth2Client();

  // Check if token is expired
  if (user.googleTokenExpiresAt) {
    const expiresAt = new Date(user.googleTokenExpiresAt).getTime();
    const now = Date.now();

    if (expiresAt <= now && user.googleRefreshToken) {
      // Refresh the token
      const newTokens = await refreshAccessToken(user.googleRefreshToken);

      // Update tokens in database
      await db.update(users).set({
        googleAccessToken: newTokens.access_token,
        googleTokenExpiresAt: newTokens.expiry_date
          ? new Date(newTokens.expiry_date).toISOString()
          : null,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      oauth2Client.setCredentials({
        access_token: newTokens.access_token,
        refresh_token: user.googleRefreshToken,
      });
    } else {
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
    }
  } else {
    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function listCalendars(userId: string) {
  const calendar = await getAuthenticatedClient(userId);
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

export async function createCalendarEvent(
  userId: string,
  workLog: {
    id: string;
    customerName: string;
    workType: string;
    locationName: string;
    city: string;
    state: string;
    zipCode: string;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    workPerformed: string;
    additionalNotes: string | null;
    status: string;
  }
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for sync");
  }

  const calendar = await getAuthenticatedClient(userId);

  const event: calendar_v3.Schema$Event = {
    summary: `${workLog.workType} - ${workLog.customerName}`,
    description: `${workLog.workPerformed}\n\n${workLog.additionalNotes || ""}`.trim(),
    location: `${workLog.locationName}, ${workLog.city}, ${workLog.state} ${workLog.zipCode}`,
    start: {
      dateTime: workLog.scheduledStartTime || new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: workLog.scheduledEndTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: getColorIdForStatus(workLog.status),
    extendedProperties: {
      private: {
        fieldServiceWorkLogId: workLog.id,
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: user.googleCalendarId,
    requestBody: event,
  });

  // Update work log with Google Calendar event ID
  await db.update(workLogs).set({
    googleCalendarEventId: response.data.id,
    googleCalendarSyncedAt: new Date().toISOString(),
    updatedAt: new Date(),
  }).where(eq(workLogs.id, workLog.id));

  return response.data;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  workLog: {
    id: string;
    customerName: string;
    workType: string;
    locationName: string;
    city: string;
    state: string;
    zipCode: string;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    workPerformed: string;
    additionalNotes: string | null;
    status: string;
  }
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for sync");
  }

  const calendar = await getAuthenticatedClient(userId);

  const event: calendar_v3.Schema$Event = {
    summary: `${workLog.workType} - ${workLog.customerName}`,
    description: `${workLog.workPerformed}\n\n${workLog.additionalNotes || ""}`.trim(),
    location: `${workLog.locationName}, ${workLog.city}, ${workLog.state} ${workLog.zipCode}`,
    start: {
      dateTime: workLog.scheduledStartTime || new Date().toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: workLog.scheduledEndTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: getColorIdForStatus(workLog.status),
  };

  const response = await calendar.events.update({
    calendarId: user.googleCalendarId,
    eventId,
    requestBody: event,
  });

  // Update sync timestamp
  await db.update(workLogs).set({
    googleCalendarSyncedAt: new Date().toISOString(),
    updatedAt: new Date(),
  }).where(eq(workLogs.id, workLog.id));

  return response.data;
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string,
  workLogId: string
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.googleCalendarId) {
    return;
  }

  try {
    const calendar = await getAuthenticatedClient(userId);
    await calendar.events.delete({
      calendarId: user.googleCalendarId,
      eventId,
    });
  } catch (error: any) {
    // Ignore 404 errors (event already deleted)
    if (error.code !== 404) {
      throw error;
    }
  }

  // Clear Google Calendar ID from work log
  await db.update(workLogs).set({
    googleCalendarEventId: null,
    googleCalendarSyncedAt: null,
    updatedAt: new Date(),
  }).where(eq(workLogs.id, workLogId));
}

export async function syncJobToCalendar(
  userId: string,
  workLog: {
    id: string;
    customerName: string;
    workType: string;
    locationName: string;
    city: string;
    state: string;
    zipCode: string;
    scheduledStartTime: string | null;
    scheduledEndTime: string | null;
    workPerformed: string;
    additionalNotes: string | null;
    status: string;
    googleCalendarEventId: string | null;
  }
) {
  // Only sync scheduled jobs
  if (!workLog.scheduledStartTime) {
    return null;
  }

  if (workLog.googleCalendarEventId) {
    // Update existing event
    return updateCalendarEvent(userId, workLog.googleCalendarEventId, workLog);
  } else {
    // Create new event
    return createCalendarEvent(userId, workLog);
  }
}

export async function importCalendarEvents(
  userId: string,
  businessId: string,
  technicianUserId: string,
  timeMin: string,
  timeMax: string
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.googleCalendarId) {
    throw new Error("No calendar selected for import");
  }

  const calendar = await getAuthenticatedClient(userId);

  const response = await calendar.events.list({
    calendarId: user.googleCalendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];
  const importedJobs: any[] = [];

  for (const event of events) {
    // Skip events that are already linked to a work log
    const existingWorkLogId = event.extendedProperties?.private?.fieldServiceWorkLogId;
    if (existingWorkLogId) {
      continue;
    }

    // Create work log from calendar event
    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;

    if (!startTime) continue;

    const startDate = new Date(startTime);
    const serviceDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

    const [workLog] = await db.insert(workLogs).values({
      businessId,
      technicianUserId,
      customerName: event.summary || "Imported Event",
      workType: "Imported from Calendar",
      locationName: event.location?.split(",")[0] || "No location",
      city: event.location?.split(",")[1]?.trim() || "Unknown",
      state: event.location?.split(",")[2]?.trim()?.split(" ")[0] || "Unknown",
      zipCode: event.location?.split(",")[2]?.trim()?.split(" ")[1] || "00000",
      serviceDate,
      startTime: startDate.toTimeString().slice(0, 5),
      workPerformed: event.description || "Imported from Google Calendar",
      status: "scheduled",
      scheduledStartTime: startTime,
      scheduledEndTime: endTime || null,
      googleCalendarEventId: event.id,
      googleCalendarSyncedAt: new Date().toISOString(),
      technicianUserIds: [technicianUserId],
    } as any).returning();

    importedJobs.push(workLog);
  }

  return importedJobs;
}

function getColorIdForStatus(status: string): string {
  // Google Calendar color IDs
  switch (status) {
    case "scheduled":
      return "6"; // Orange
    case "in-progress":
      return "7"; // Turquoise/Blue
    case "completed":
      return "10"; // Green
    case "cancelled":
      return "8"; // Gray
    default:
      return "6";
  }
}

export async function disconnectGoogleCalendar(userId: string) {
  await db.update(users).set({
    googleAccessToken: null,
    googleRefreshToken: null,
    googleTokenExpiresAt: null,
    googleCalendarId: null,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}
