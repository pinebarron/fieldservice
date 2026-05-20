import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { calculateDistance } from '@/lib/exif';

interface PhotoData {
  url: string;
  storagePath?: string;
  photoType: 'before' | 'after' | 'general';
  lat?: number;
  lng?: number;
  accuracy?: number;
  altitude?: number;
  capturedAt: string;
  hasExif?: boolean;
  workLogId?: string;
  technicianName?: string;
}

interface JobLocation {
  lat: number;
  lng: number;
}

// Default radius for location verification (100 meters)
const DEFAULT_VERIFICATION_RADIUS_METERS = 100;

export async function POST(request: NextRequest) {
  try {
    const { user, business, userId } = await getUserAndBusiness();

    if (!user || !business || !userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as {
      photos: PhotoData[];
      jobLocation?: JobLocation;
      verificationRadius?: number;
    };

    const { photos, jobLocation, verificationRadius = DEFAULT_VERIFICATION_RADIUS_METERS } = body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get user's name for technician_name field
    const { data: userData } = await adminClient
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    const technicianName = userData
      ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
      : undefined;

    // Process each photo
    const insertedPhotos = [];

    for (const photo of photos) {
      // Calculate distance from job location if both GPS data and job location are available
      let distanceFromJob: number | undefined;
      let locationVerified = false;
      let verificationStatus = 'pending';

      if (photo.lat && photo.lng && jobLocation?.lat && jobLocation?.lng) {
        distanceFromJob = calculateDistance(
          photo.lat,
          photo.lng,
          jobLocation.lat,
          jobLocation.lng
        );

        // Auto-verify if within radius
        if (distanceFromJob <= verificationRadius) {
          locationVerified = true;
          verificationStatus = 'verified';
        } else {
          verificationStatus = 'mismatch';
        }
      }

      const { data: inserted, error } = await adminClient
        .from('job_photos')
        .insert({
          business_id: business.id,
          work_log_id: photo.workLogId || null,
          url: photo.url,
          storage_path: photo.storagePath || null,
          photo_type: photo.photoType,
          lat: photo.lat || null,
          lng: photo.lng || null,
          accuracy_meters: photo.accuracy || null,
          altitude_meters: photo.altitude || null,
          job_lat: jobLocation?.lat || null,
          job_lng: jobLocation?.lng || null,
          distance_from_job_meters: distanceFromJob || null,
          location_verified: locationVerified,
          verification_status: verificationStatus,
          captured_at: photo.capturedAt,
          captured_by: userId,
          technician_name: photo.technicianName || technicianName,
          exif_data: photo.hasExif ? { embedded: true } : null,
        })
        .select('id, verification_status, distance_from_job_meters')
        .single();

      if (error) {
        console.error('Error inserting photo:', error);
        continue;
      }

      insertedPhotos.push(inserted);
    }

    return NextResponse.json({
      success: true,
      photos: insertedPhotos,
      totalInserted: insertedPhotos.length,
    });
  } catch (error) {
    console.error('Error in photos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET photos for a work log
export async function GET(request: NextRequest) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workLogId = searchParams.get('workLogId');

    const adminClient = createAdminClient();

    let query = adminClient
      .from('job_photos')
      .select('*')
      .eq('business_id', business.id)
      .order('captured_at', { ascending: false });

    if (workLogId) {
      query = query.eq('work_log_id', workLogId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching photos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photos: data });
  } catch (error) {
    console.error('Error in photos API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
