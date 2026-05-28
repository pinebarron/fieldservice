import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserAndBusiness } from '@/lib/supabase/getUserAndBusiness';
import { geocodeAddress, batchGeocodeAddresses } from '@/lib/geocoding';

// Geocode a single work log or property
export async function POST(request: NextRequest) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, address } = body as {
      type: 'work_log' | 'property';
      id: string;
      address?: {
        locationName?: string;
        city: string;
        state: string;
        zipCode: string;
      };
    };

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // If address not provided, fetch from database
    let addressToGeocode = address;
    if (!addressToGeocode) {
      const table = type === 'work_log' ? 'work_logs' : 'properties';
      const { data, error } = await adminClient
        .from(table)
        .select('location_name, city, state, zip_code')
        .eq('id', id)
        .eq('business_id', business.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }

      addressToGeocode = {
        locationName: data.location_name,
        city: data.city,
        state: data.state,
        zipCode: data.zip_code,
      };
    }

    // Geocode the address
    const result = await geocodeAddress(addressToGeocode);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Could not geocode address',
        address: addressToGeocode,
      });
    }

    // Update the record with coordinates
    const table = type === 'work_log' ? 'work_logs' : 'properties';
    const updateData = type === 'work_log'
      ? {
          job_lat: result.lat,
          job_lng: result.lng,
          geocoded_at: new Date().toISOString(),
          geocode_source: result.source,
        }
      : {
          lat: result.lat,
          lng: result.lng,
          geocoded_at: new Date().toISOString(),
          geocode_source: result.source,
        };

    const { error: updateError } = await adminClient
      .from(table)
      .update(updateData)
      .eq('id', id)
      .eq('business_id', business.id);

    if (updateError) {
      console.error('Error updating coordinates:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      lat: result.lat,
      lng: result.lng,
      source: result.source,
      displayName: result.displayName,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch geocode all jobs needing coordinates
export async function PUT(request: NextRequest) {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'all', limit = 50 } = body as {
      type?: 'work_log' | 'property' | 'all';
      limit?: number;
    };

    const adminClient = createAdminClient();
    const jobsToGeocode: Array<{
      id: string;
      type: 'work_log' | 'property';
      address: { locationName?: string; city: string; state: string; zipCode: string };
    }> = [];

    // Fetch work logs needing geocoding
    if (type === 'all' || type === 'work_log') {
      const { data: workLogs } = await adminClient
        .from('work_logs')
        .select('id, location_name, city, state, zip_code')
        .eq('business_id', business.id)
        .is('job_lat', null)
        .not('city', 'is', null)
        .limit(limit);

      if (workLogs) {
        for (const wl of workLogs) {
          jobsToGeocode.push({
            id: wl.id,
            type: 'work_log',
            address: {
              locationName: wl.location_name,
              city: wl.city,
              state: wl.state,
              zipCode: wl.zip_code,
            },
          });
        }
      }
    }

    // Fetch properties needing geocoding
    if (type === 'all' || type === 'property') {
      const remainingLimit = limit - jobsToGeocode.length;
      if (remainingLimit > 0) {
        const { data: properties } = await adminClient
          .from('properties')
          .select('id, location_name, city, state, zip_code')
          .eq('business_id', business.id)
          .is('lat', null)
          .not('city', 'is', null)
          .limit(remainingLimit);

        if (properties) {
          for (const prop of properties) {
            jobsToGeocode.push({
              id: prop.id,
              type: 'property',
              address: {
                locationName: prop.location_name,
                city: prop.city,
                state: prop.state,
                zipCode: prop.zip_code,
              },
            });
          }
        }
      }
    }

    if (jobsToGeocode.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No jobs need geocoding',
        processed: 0,
      });
    }

    // Batch geocode with rate limiting
    const results = await batchGeocodeAddresses(
      jobsToGeocode.map(j => ({ id: j.id, address: j.address }))
    );

    // Update database with results
    let successCount = 0;
    let failCount = 0;

    for (const job of jobsToGeocode) {
      const result = results.get(job.id);
      if (!result) {
        failCount++;
        continue;
      }

      const table = job.type === 'work_log' ? 'work_logs' : 'properties';
      const updateData = job.type === 'work_log'
        ? {
            job_lat: result.lat,
            job_lng: result.lng,
            geocoded_at: new Date().toISOString(),
            geocode_source: result.source,
          }
        : {
            lat: result.lat,
            lng: result.lng,
            geocoded_at: new Date().toISOString(),
            geocode_source: result.source,
          };

      const { error } = await adminClient
        .from(table)
        .update(updateData)
        .eq('id', job.id);

      if (error) {
        console.error(`Failed to update ${job.type} ${job.id}:`, error);
        failCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: jobsToGeocode.length,
      successCount,
      failCount,
      remaining: await countRemainingJobs(adminClient, business.id),
    });
  } catch (error) {
    console.error('Batch geocoding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET count of jobs needing geocoding
export async function GET() {
  try {
    const { user, business } = await getUserAndBusiness();

    if (!user || !business) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const remaining = await countRemainingJobs(adminClient, business.id);

    return NextResponse.json(remaining);
  } catch (error) {
    console.error('Error counting jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function countRemainingJobs(
  adminClient: ReturnType<typeof createAdminClient>,
  businessId: string
) {
  const { count: workLogCount } = await adminClient
    .from('work_logs')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .is('job_lat', null)
    .not('city', 'is', null);

  const { count: propertyCount } = await adminClient
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .is('lat', null)
    .not('city', 'is', null);

  return {
    workLogs: workLogCount || 0,
    properties: propertyCount || 0,
    total: (workLogCount || 0) + (propertyCount || 0),
  };
}
