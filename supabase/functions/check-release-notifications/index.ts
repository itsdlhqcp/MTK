// Supabase Edge Function to check and send release notifications
// This function checks for releases that will become "Now Showing/Streaming" in 6 hours
// and releases that just became "Now Showing/Streaming"
//
// To deploy this function:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link your project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy check-release-notifications
//
// To schedule this function (using pg_cron in Supabase):
// SELECT cron.schedule(
//   'check-release-notifications',
//   '0 * * * *', -- Run every hour
//   $$
//   SELECT net.http_post(
//     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-release-notifications',
//     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
//   ) AS request_id;
//   $$
// );

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper to extract release name from HTML body
function extractReleaseName(body: string | null): string {
  if (!body || typeof body !== 'string') {
    return 'New Release';
  }
  
  // Decode HTML entities
  let text = body
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Get first line or first 50 characters
  const firstLine = text.split('\n')[0] || text.split('.')[0] || text;
  const name = firstLine.substring(0, 50).trim();
  
  return name || 'New Release';
}

// Helper to format time until release
function formatTimeUntilRelease(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  
  if (h > 0) {
    return `${h} hour${h > 1 ? 's' : ''}${m > 0 ? ` and ${m} minute${m > 1 ? 's' : ''}` : ''}`;
  }
  return `${m} minute${m > 1 ? 's' : ''}`;
}

// Get subscribed users for a release
async function getSubscribedUsers(
  supabaseClient: any,
  releaseId: number,
  releaseType: string
): Promise<string[]> {
  try {
    const { data, error } = await supabaseClient
      .from('release_notifications')
      .select('user_id')
      .eq('release_id', releaseId)
      .eq('release_type', releaseType)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching subscribed users:', error);
      return [];
    }

    return (data || []).map((sub: any) => sub.user_id);
  } catch (error: any) {
    console.error('Error in getSubscribedUsers:', error);
    return [];
  }
}

// Send notification via send-push-notification function
async function sendNotification(
  supabaseUrl: string,
  supabaseKey: string,
  notificationPayload: any,
  userIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const target = userIds && userIds.length > 0 ? 'specific_users' : 'all_users';
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          notification: notificationPayload,
          target: target,
          userIds: userIds || [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error sending notification:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return { success: true };
  } catch (error: any) {
    console.error('Error in sendNotification:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🔔 Checking for release notifications...");
    
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const results = {
      success: true,
      sent: 0,
      errors: [] as any[],
    };

    // 1. Check for theatre releases becoming "Now Showing" in 6 hours
    const { data: theatre6Hours, error: theatre6Error } = await supabaseClient
      .from('releases')
      .select('*')
      .gte('rDate', now.toISOString())
      .lte('rDate', sixHoursFromNow.toISOString())
      .order('rDate', { ascending: true });

    if (!theatre6Error && theatre6Hours) {
      for (const release of theatre6Hours) {
        if (!release.rDate) continue;
        
        const releaseDate = new Date(release.rDate);
        const timeUntilRelease = (releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Check if release will start in approximately 6 hours (within 5.5-6.5 hours range)
        if (timeUntilRelease >= 5.5 && timeUntilRelease <= 6.5) {
          const releaseName = extractReleaseName(release.body);
          const timeText = formatTimeUntilRelease(timeUntilRelease);
          
          // Get image URL
          const imageUrl = release.filel 
            ? `${supabaseUrl}/storage/v1/object/public/profileImage/${release.filel}`
            : (release.file ? `${supabaseUrl}/storage/v1/object/public/profileImage/${release.file}` : null);

          // Get subscribed users for this release
          const subscribedUserIds = await getSubscribedUsers(supabaseClient, release.id, 'theatre');
          
          if (subscribedUserIds.length === 0) {
            console.log(`⏭️ Skipping notification for theatre release ${release.id} - no subscribers`);
            continue;
          }

          const notificationPayload = {
            type: 'theatre_release_6hours',
            releaseId: release.id,
            title: `${releaseName} - Coming Soon!`,
            body: `${releaseName} will be Now Showing in ${timeText}. Get ready! Read more`,
            image: imageUrl,
            sound: 'notification',
            data: {
              screen: 'upcoming',
              releaseId: release.id.toString(),
              type: 'theatre_release',
            },
          };

          const result = await sendNotification(supabaseUrl, supabaseKey, notificationPayload, subscribedUserIds);
          if (result.success) {
            results.sent++;
            console.log(`✅ Sent 6-hour notification for theatre release: ${releaseName}`);
          } else {
            results.errors.push({ type: 'theatre_6hours', releaseId: release.id, error: result.error });
          }
        }
      }
    }

    // 2. Check for digital releases becoming "Now Streaming" in 6 hours
    const { data: digital6Hours, error: digital6Error } = await supabaseClient
      .from('streams')
      .select('*')
      .gte('rDate', now.toISOString())
      .lte('rDate', sixHoursFromNow.toISOString())
      .order('rDate', { ascending: true });

    if (!digital6Error && digital6Hours) {
      for (const stream of digital6Hours) {
        if (!stream.rDate) continue;
        
        const releaseDate = new Date(stream.rDate);
        const timeUntilRelease = (releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Check if release will start in approximately 6 hours (within 5.5-6.5 hours range)
        if (timeUntilRelease >= 5.5 && timeUntilRelease <= 6.5) {
          const releaseName = extractReleaseName(stream.body);
          const timeText = formatTimeUntilRelease(timeUntilRelease);
          
          // Get image URL
          const imageUrl = stream.filel 
            ? `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.filel}`
            : (stream.file ? `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.file}` : null);

          // Get subscribed users for this release
          const subscribedUserIds = await getSubscribedUsers(supabaseClient, stream.id, 'digital');
          
          if (subscribedUserIds.length === 0) {
            console.log(`⏭️ Skipping notification for digital release ${stream.id} - no subscribers`);
            continue;
          }

          const notificationPayload = {
            type: 'digital_release_6hours',
            streamId: stream.id,
            title: `${releaseName} - Coming Soon!`,
            body: `${releaseName} will be Now Streaming in ${timeText}. Get ready! Read more`,
            image: imageUrl,
            sound: 'notification',
            data: {
              screen: 'upcoming',
              streamId: stream.id.toString(),
              type: 'digital_release',
            },
          };

          const result = await sendNotification(supabaseUrl, supabaseKey, notificationPayload, subscribedUserIds);
          if (result.success) {
            results.sent++;
            console.log(`✅ Sent 6-hour notification for digital release: ${releaseName}`);
          } else {
            results.errors.push({ type: 'digital_6hours', streamId: stream.id, error: result.error });
          }
        }
      }
    }

    // 3. Check for theatre releases that just became "Now Showing"
    const { data: theatreNowShowing, error: theatreNowError } = await supabaseClient
      .from('releases')
      .select('*')
      .gte('rDate', oneHourAgo.toISOString())
      .lte('rDate', now.toISOString())
      .order('rDate', { ascending: false });

    if (!theatreNowError && theatreNowShowing) {
      for (const release of theatreNowShowing) {
        if (!release.rDate) continue;
        
        const releaseDate = new Date(release.rDate);
        const isNowShowing = release.endDate
          ? (now >= releaseDate && now <= new Date(release.endDate))
          : (now >= releaseDate);
        
        if (isNowShowing) {
          const releaseName = extractReleaseName(release.body);
          
          // Get image URL
          const imageUrl = release.filel 
            ? `${supabaseUrl}/storage/v1/object/public/profileImage/${release.filel}`
            : (release.file ? `${supabaseUrl}/storage/v1/object/public/profileImage/${release.file}` : null);

          // Get subscribed users for this release
          const subscribedUserIds = await getSubscribedUsers(supabaseClient, release.id, 'theatre');
          
          if (subscribedUserIds.length === 0) {
            console.log(`⏭️ Skipping notification for theatre release ${release.id} - no subscribers`);
            continue;
          }

          const notificationPayload = {
            type: 'theatre_release_now_showing',
            releaseId: release.id,
            title: `${releaseName} is Now Showing!`,
            body: `${releaseName} is now showing in theatres. Don't miss it! Read more`,
            image: imageUrl,
            sound: 'notification',
            data: {
              screen: 'upcoming',
              releaseId: release.id.toString(),
              type: 'theatre_release',
            },
          };

          const result = await sendNotification(supabaseUrl, supabaseKey, notificationPayload, subscribedUserIds);
          if (result.success) {
            results.sent++;
            console.log(`✅ Sent now showing notification for theatre release: ${releaseName}`);
          } else {
            results.errors.push({ type: 'theatre_now_showing', releaseId: release.id, error: result.error });
          }
        }
      }
    }

    // 4. Check for digital releases that just became "Now Streaming"
    const { data: digitalNowStreaming, error: digitalNowError } = await supabaseClient
      .from('streams')
      .select('*')
      .gte('rDate', oneHourAgo.toISOString())
      .lte('rDate', now.toISOString())
      .order('rDate', { ascending: false });

    if (!digitalNowError && digitalNowStreaming) {
      for (const stream of digitalNowStreaming) {
        if (!stream.rDate) continue;
        
        const releaseDate = new Date(stream.rDate);
        const isNowStreaming = stream.endDate
          ? (now >= releaseDate && now <= new Date(stream.endDate))
          : (now >= releaseDate);
        
        if (isNowStreaming) {
          const releaseName = extractReleaseName(stream.body);
          
          // Get image URL
          const imageUrl = stream.filel 
            ? `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.filel}`
            : (stream.file ? `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.file}` : null);

          // Get subscribed users for this release
          const subscribedUserIds = await getSubscribedUsers(supabaseClient, stream.id, 'digital');
          
          if (subscribedUserIds.length === 0) {
            console.log(`⏭️ Skipping notification for digital release ${stream.id} - no subscribers`);
            continue;
          }

          const notificationPayload = {
            type: 'digital_release_now_streaming',
            streamId: stream.id,
            title: `${releaseName} is Now Streaming!`,
            body: `${releaseName} is now streaming. Watch it now! Read more`,
            image: imageUrl,
            sound: 'notification',
            data: {
              screen: 'upcoming',
              streamId: stream.id.toString(),
              type: 'digital_release',
            },
          };

          const result = await sendNotification(supabaseUrl, supabaseKey, notificationPayload, subscribedUserIds);
          if (result.success) {
            results.sent++;
            console.log(`✅ Sent now streaming notification for digital release: ${releaseName}`);
          } else {
            results.errors.push({ type: 'digital_now_streaming', streamId: stream.id, error: result.error });
          }
        }
      }
    }

    console.log(`✅ Notification check complete: ${results.sent} notifications sent`);
    if (results.errors.length > 0) {
      console.error(`❌ ${results.errors.length} errors occurred:`, results.errors);
    }

    return new Response(
      JSON.stringify({
        success: results.success,
        sent: results.sent,
        errors: results.errors,
        message: `Processed notifications: ${results.sent} sent, ${results.errors.length} errors`,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-release-notifications function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});

