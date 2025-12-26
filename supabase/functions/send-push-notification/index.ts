// Supabase Edge Function to send push notifications
// This function sends push notifications to all users or specific users
// 
// To deploy this function:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link your project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy send-push-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: string;
  postId: string;
  title: string;
  body: string;
  image?: string;
  video?: string;
  mediaType?: string;
  sound?: string; // Custom sound name (without extension)
  data?: {
    screen?: string;
    postId?: string;
    type?: string;
  };
}

serve(async (req) => {
  console.log("🔔 Edge Function called - send-push-notification");
  console.log("Request method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight request handled");
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

    // Parse request body
    const requestBody = await req.json();
    const { notification, target, userIds } = requestBody;
    
    console.log("📥 Request payload:", {
      hasNotification: !!notification,
      target: target,
      hasUserIds: !!userIds,
      userIdsCount: userIds?.length || 0
    });

    if (!notification) {
      return new Response(
        JSON.stringify({ error: "Notification payload is required" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // Get FCM tokens based on target
    let tokens: Array<{ fcm_token: string; user_id: string }> = [];

    if (target === "all_users") {
      console.log("🔍 Fetching all active FCM tokens...");
      // Get all active FCM tokens
      const { data, error } = await supabaseClient
        .from("user_fcm_tokens")
        .select("fcm_token, user_id")
        .eq("is_active", true);

      if (error) {
        console.error("❌ Error fetching FCM tokens:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch FCM tokens", details: error.message }),
          {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      tokens = data || [];
      console.log(`✅ Found ${tokens.length} active FCM tokens`);
    } else if (target === "specific_users" && userIds && Array.isArray(userIds)) {
      // Get FCM tokens for specific users
      const { data, error } = await supabaseClient
        .from("user_fcm_tokens")
        .select("fcm_token, user_id")
        .eq("is_active", true)
        .in("user_id", userIds);

      if (error) {
        console.error("Error fetching FCM tokens:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch FCM tokens" }),
          {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          }
        );
      }

      tokens = data || [];
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid target or userIds" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    if (tokens.length === 0) {
      console.warn("⚠️ No active FCM tokens found in database");
      return new Response(
        JSON.stringify({ message: "No active FCM tokens found", sent: 0 }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📝 ===== RECEIVED NOTIFICATION PAYLOAD =====");
    console.log("📝 Title:", notification.title);
    console.log("📝 Body:", notification.body);
    console.log("📝 Body length:", notification.body?.length || 0);
    console.log("📝 Body ends with 'Read more'?", notification.body?.endsWith('Read more'));
    console.log("📝 Has image:", !!notification.image);
    console.log("📝 Image URL:", notification.image || "NONE");
    console.log("📝 Media type:", notification.mediaType);
    console.log("📝 Preparing notification messages for", tokens.length, "tokens");
    
    // Prepare Expo push notification messages with proper image support
    const messages = await Promise.all(tokens.map(async (token) => {
      // Standard Expo Push Notification format
      const message: any = {
        to: token.fcm_token,
        sound: notification.sound || "default", // Use custom sound if provided, otherwise default
        title: notification.title || "New Notification",
        body: notification.body || "", // This should already include "Read more"
        priority: "high",
        // Data payload for app handling
        data: {
          ...(notification.data || {}),
          mediaType: notification.mediaType || null,
          image: notification.image || null, // Also include in data for app access
          video: notification.video || null,
        },
      };

      // Add image if provided - CRITICAL: Must be at root level for Expo
      if (notification.image) {
        try {
          const imageUrl = notification.image.trim();
          
          // Validate URL format
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            console.error("❌ Invalid image URL format:", imageUrl);
          } else {
            // CRITICAL: Expo Push API requires image at root level for Android
            // This is the ONLY way images show in notifications on Android
            // Set image at root level - this is what Expo uses to display images
            message.image = imageUrl;
            
            // Also add to data for app access (backup)
            message.data.image = imageUrl;
            
            // Log to verify image is set
            console.log("✅ Image set at root level:", message.image);
            console.log("✅ Image also in data:", message.data.image);
            
            console.log("🖼️ ===== IMAGE ADDED TO NOTIFICATION =====");
            console.log("🖼️ Image URL:", imageUrl);
            console.log("🖼️ Full message structure:", JSON.stringify({
              to: message.to?.substring(0, 30) + "...",
              title: message.title,
              body: message.body?.substring(0, 80) + "...",
              hasImageField: !!message.image,
              imageFieldValue: message.image,
              dataHasImage: !!message.data?.image
            }, null, 2));
            
            // Validate image URL format
            const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(imageUrl);
            const isSupabaseStorage = imageUrl.includes('supabase.co/storage');
            
            if (hasImageExtension || isSupabaseStorage) {
              console.log("✅ Image URL validated - format looks correct");
            } else {
              console.warn("⚠️ Image URL format might not be recognized");
            }
          }
        } catch (error) {
          console.error("❌ Error processing image URL:", error);
        }
      } else {
        console.error("❌ ERROR: No image provided in notification payload!");
        console.error("❌ Notification object:", JSON.stringify(notification, null, 2));
      }

      // Add video info if available
      if (notification.video && notification.mediaType === 'video') {
        console.log("🎥 Video URL in data payload:", notification.video.substring(0, 100) + "...");
      }

      return message;
    }));

    // Send notifications in batches (Expo allows up to 100 per request)
    const BATCH_SIZE = 100;
    let totalSent = 0;
    let totalFailed = 0;

    console.log(`📤 Sending ${messages.length} notifications in batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      const batch = messages.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(messages.length / BATCH_SIZE);

      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} notifications)`);
      
      // Log first message details for debugging
      if (batch.length > 0) {
        console.log(`📤 Sending batch ${batchNumber} to Expo Push API`);
        console.log(`📤 First message in batch (FULL):`, JSON.stringify({
          to: batch[0]?.to,
          title: batch[0]?.title,
          body: batch[0]?.body,
          image: batch[0]?.image, // CRITICAL: This must be present for images to show
          data: batch[0]?.data,
        }, null, 2));
        console.log(`📤 Image field check:`, {
          hasImageField: !!batch[0]?.image,
          imageValue: batch[0]?.image,
          imageType: typeof batch[0]?.image,
        });
      }

      try {
        const response = await fetch(EXPO_PUSH_API_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          console.error(`❌ Expo API returned status: ${response.status}`);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          totalFailed += batch.length;
          continue;
        }

        const result = await response.json();
        console.log(`📊 Batch ${batchNumber} Expo API response:`, {
          hasData: !!result.data,
          dataLength: result.data?.length || 0,
          errors: result.errors || null
        });
        
        // Log full response for debugging
        if (result.data && result.data.length > 0) {
          console.log(`📊 First receipt sample:`, {
            status: result.data[0]?.status,
            id: result.data[0]?.id,
            message: result.data[0]?.message,
            details: result.data[0]?.details
          });
          
          // If there's an error, log it
          if (result.data[0]?.status !== 'ok') {
            console.error(`❌ Notification send failed:`, JSON.stringify(result.data[0], null, 2));
          }
        }
        
        // Log what was actually sent (for debugging)
        if (batch.length > 0) {
          console.log(`📤 What was sent to Expo (first message):`, JSON.stringify({
            to: batch[0].to?.substring(0, 30) + "...",
            title: batch[0].title,
            body: batch[0].body?.substring(0, 100),
            image: batch[0].image, // CRITICAL: Check if this is present
            hasImage: !!batch[0].image,
          }, null, 2));
        }

        // Count successful and failed notifications
        if (result.data) {
          result.data.forEach((receipt: any, index: number) => {
            if (receipt.status === "ok") {
              totalSent++;
            } else {
              totalFailed++;
              console.error(`❌ Failed notification ${index + 1}:`, {
                status: receipt.status,
                message: receipt.message,
                details: receipt.details,
                error: receipt.error
              });
            }
          });
        } else {
          console.error("❌ ERROR: No data in Expo API response!");
          console.error("❌ Full response:", JSON.stringify(result, null, 2));
          totalFailed += batch.length;
        }
        
        // Check for errors array
        if (result.errors && result.errors.length > 0) {
          console.error("❌ Expo API returned errors:", result.errors);
        }
      } catch (error) {
        console.error(`❌ Error sending notification batch ${batchNumber}:`, error);
        totalFailed += batch.length;
      }
    }

    console.log(`✅ Notification sending complete: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent",
        totalTokens: tokens.length,
        sent: totalSent,
        failed: totalFailed,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-push-notification function:", error);
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

