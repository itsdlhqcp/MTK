import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';
import moment from 'moment';
import { stripHtmlTags } from '../helpers/common';

/**
 * Extract release name from HTML body
 * @param {string} body - HTML body text
 * @returns {string} - Extracted release name or default text
 */
const extractReleaseName = (body) => {
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
};

/**
 * Check for theatre releases that will become "Now Showing" in 6 hours
 * @returns {Promise<Array>} - Array of releases becoming "Now Showing"
 */
export const checkTheatreReleasesIn6Hours = async () => {
  try {
    const now = moment();
    const sixHoursFromNow = moment().add(6, 'hours');
    
    // Fetch releases where rDate is between now and 6 hours from now
    // and they're not already "Now Showing"
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .gte('rDate', now.toISOString())
      .lte('rDate', sixHoursFromNow.toISOString())
      .order('rDate', { ascending: true });

    if (error) {
      console.error('Error fetching theatre releases:', error);
      return [];
    }

    // Filter releases that will become "Now Showing" (rDate <= 6 hours from now)
    // and are not already showing
    const upcomingReleases = (releases || []).filter(release => {
      if (!release.rDate) return false;
      
      const releaseDate = moment(release.rDate);
      const timeUntilRelease = releaseDate.diff(now, 'hours', true);
      
      // Check if release will start in approximately 6 hours (within 5.5-6.5 hours range)
      const isIn6HourWindow = timeUntilRelease >= 5.5 && timeUntilRelease <= 6.5;
      
      // Check if it's not already "Now Showing"
      const isAlreadyShowing = release.endDate 
        ? moment().isBetween(releaseDate, moment(release.endDate), null, '[]')
        : false;
      
      return isIn6HourWindow && !isAlreadyShowing;
    });

    return upcomingReleases;
  } catch (error) {
    console.error('Error in checkTheatreReleasesIn6Hours:', error);
    return [];
  }
};

/**
 * Check for digital releases that will become "Now Streaming" in 6 hours
 * @returns {Promise<Array>} - Array of releases becoming "Now Streaming"
 */
export const checkDigitalReleasesIn6Hours = async () => {
  try {
    const now = moment();
    const sixHoursFromNow = moment().add(6, 'hours');
    
    // Fetch streams where rDate is between now and 6 hours from now
    const { data: streams, error } = await supabase
      .from('streams')
      .select('*')
      .gte('rDate', now.toISOString())
      .lte('rDate', sixHoursFromNow.toISOString())
      .order('rDate', { ascending: true });

    if (error) {
      console.error('Error fetching digital releases:', error);
      return [];
    }

    // Filter streams that will become "Now Streaming" in approximately 6 hours
    const upcomingStreams = (streams || []).filter(stream => {
      if (!stream.rDate) return false;
      
      const releaseDate = moment(stream.rDate);
      const timeUntilRelease = releaseDate.diff(now, 'hours', true);
      
      // Check if release will start in approximately 6 hours (within 5.5-6.5 hours range)
      const isIn6HourWindow = timeUntilRelease >= 5.5 && timeUntilRelease <= 6.5;
      
      // Check if it's not already "Now Streaming"
      const isAlreadyStreaming = stream.endDate
        ? moment().isBetween(releaseDate, moment(stream.endDate), null, '[]')
        : (!stream.endDate && moment().isSameOrAfter(releaseDate));
      
      return isIn6HourWindow && !isAlreadyStreaming;
    });

    return upcomingStreams;
  } catch (error) {
    console.error('Error in checkDigitalReleasesIn6Hours:', error);
    return [];
  }
};

/**
 * Check for theatre releases that just became "Now Showing"
 * @returns {Promise<Array>} - Array of releases that just became "Now Showing"
 */
export const checkTheatreReleasesNowShowing = async () => {
  try {
    const now = moment();
    const oneHourAgo = moment().subtract(1, 'hour');
    
    // Fetch releases where rDate is between 1 hour ago and now
    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .gte('rDate', oneHourAgo.toISOString())
      .lte('rDate', now.toISOString())
      .order('rDate', { ascending: false });

    if (error) {
      console.error('Error fetching theatre releases:', error);
      return [];
    }

    // Filter releases that are now showing
    const nowShowingReleases = (releases || []).filter(release => {
      if (!release.rDate) return false;
      
      const releaseDate = moment(release.rDate);
      
      // Check if it's currently "Now Showing"
      const isNowShowing = release.endDate
        ? moment().isBetween(releaseDate, moment(release.endDate), null, '[]')
        : moment().isSameOrAfter(releaseDate);
      
      return isNowShowing;
    });

    return nowShowingReleases;
  } catch (error) {
    console.error('Error in checkTheatreReleasesNowShowing:', error);
    return [];
  }
};

/**
 * Check for digital releases that just became "Now Streaming"
 * @returns {Promise<Array>} - Array of releases that just became "Now Streaming"
 */
export const checkDigitalReleasesNowStreaming = async () => {
  try {
    const now = moment();
    const oneHourAgo = moment().subtract(1, 'hour');
    
    // Fetch streams where rDate is between 1 hour ago and now
    const { data: streams, error } = await supabase
      .from('streams')
      .select('*')
      .gte('rDate', oneHourAgo.toISOString())
      .lte('rDate', now.toISOString())
      .order('rDate', { ascending: false });

    if (error) {
      console.error('Error fetching digital releases:', error);
      return [];
    }

    // Filter streams that are now streaming
    const nowStreamingStreams = (streams || []).filter(stream => {
      if (!stream.rDate) return false;
      
      const releaseDate = moment(stream.rDate);
      
      // Check if it's currently "Now Streaming"
      const isNowStreaming = stream.endDate
        ? moment().isBetween(releaseDate, moment(stream.endDate), null, '[]')
        : moment().isSameOrAfter(releaseDate);
      
      return isNowStreaming;
    });

    return nowStreamingStreams;
  } catch (error) {
    console.error('Error in checkDigitalReleasesNowStreaming:', error);
    return [];
  }
};

/**
 * Send notification for theatre release becoming "Now Showing" in 6 hours
 * @param {Object} release - Release object
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendTheatre6HourNotification = async (release) => {
  try {
    const releaseName = extractReleaseName(release.body);
    const releaseDate = moment(release.rDate);
    const timeUntilRelease = releaseDate.diff(moment(), 'hours', true);
    const hours = Math.floor(timeUntilRelease);
    const minutes = Math.floor((timeUntilRelease - hours) * 60);
    
    const timeText = hours > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`
      : `${minutes} minute${minutes > 1 ? 's' : ''}`;

    // Get image URL if available
    let imageUrl = null;
    if (release.filel) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${release.filel}`;
    } else if (release.file) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${release.file}`;
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

    // Send to all users via Edge Function
    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'all_users',
        },
      }
    );

    if (error) {
      console.error('Error sending theatre 6-hour notification:', error);
      return { success: false, msg: 'Failed to send notification', error: error.message };
    }

    return { success: true, msg: 'Notification sent successfully', data };
  } catch (error) {
    console.error('Error in sendTheatre6HourNotification:', error);
    return { success: false, msg: 'Failed to send notification', error: error.message };
  }
};

/**
 * Send notification for digital release becoming "Now Streaming" in 6 hours
 * @param {Object} stream - Stream object
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendDigital6HourNotification = async (stream) => {
  try {
    const releaseName = extractReleaseName(stream.body);
    const releaseDate = moment(stream.rDate);
    const timeUntilRelease = releaseDate.diff(moment(), 'hours', true);
    const hours = Math.floor(timeUntilRelease);
    const minutes = Math.floor((timeUntilRelease - hours) * 60);
    
    const timeText = hours > 0 
      ? `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`
      : `${minutes} minute${minutes > 1 ? 's' : ''}`;

    // Get image URL if available
    let imageUrl = null;
    if (stream.filel) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.filel}`;
    } else if (stream.file) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.file}`;
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

    // Send to all users via Edge Function
    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'all_users',
        },
      }
    );

    if (error) {
      console.error('Error sending digital 6-hour notification:', error);
      return { success: false, msg: 'Failed to send notification', error: error.message };
    }

    return { success: true, msg: 'Notification sent successfully', data };
  } catch (error) {
    console.error('Error in sendDigital6HourNotification:', error);
    return { success: false, msg: 'Failed to send notification', error: error.message };
  }
};

/**
 * Send notification for theatre release that just became "Now Showing"
 * @param {Object} release - Release object
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendTheatreNowShowingNotification = async (release) => {
  try {
    const releaseName = extractReleaseName(release.body);

    // Get image URL if available
    let imageUrl = null;
    if (release.filel) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${release.filel}`;
    } else if (release.file) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${release.file}`;
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

    // Send to all users via Edge Function
    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'all_users',
        },
      }
    );

    if (error) {
      console.error('Error sending theatre now showing notification:', error);
      return { success: false, msg: 'Failed to send notification', error: error.message };
    }

    return { success: true, msg: 'Notification sent successfully', data };
  } catch (error) {
    console.error('Error in sendTheatreNowShowingNotification:', error);
    return { success: false, msg: 'Failed to send notification', error: error.message };
  }
};

/**
 * Send notification for digital release that just became "Now Streaming"
 * @param {Object} stream - Stream object
 * @returns {Promise<{success: boolean, msg?: string}>}
 */
export const sendDigitalNowStreamingNotification = async (stream) => {
  try {
    const releaseName = extractReleaseName(stream.body);

    // Get image URL if available
    let imageUrl = null;
    if (stream.filel) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.filel}`;
    } else if (stream.file) {
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profileImage/${stream.file}`;
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

    // Send to all users via Edge Function
    const { data, error } = await supabase.functions.invoke(
      'send-push-notification',
      {
        body: {
          notification: notificationPayload,
          target: 'all_users',
        },
      }
    );

    if (error) {
      console.error('Error sending digital now streaming notification:', error);
      return { success: false, msg: 'Failed to send notification', error: error.message };
    }

    return { success: true, msg: 'Notification sent successfully', data };
  } catch (error) {
    console.error('Error in sendDigitalNowStreamingNotification:', error);
    return { success: false, msg: 'Failed to send notification', error: error.message };
  }
};

/**
 * Main function to check and send all release notifications
 * This should be called periodically (e.g., every hour via cron or scheduled function)
 * @returns {Promise<{success: boolean, sent: number, errors: Array}>}
 */
export const checkAndSendReleaseNotifications = async () => {
  try {
    console.log('🔔 Checking for release notifications...');
    
    const results = {
      success: true,
      sent: 0,
      errors: [],
    };

    // Check for releases becoming "Now Showing" in 6 hours
    const theatre6Hours = await checkTheatreReleasesIn6Hours();
    console.log(`Found ${theatre6Hours.length} theatre releases in 6 hours`);
    
    for (const release of theatre6Hours) {
      const result = await sendTheatre6HourNotification(release);
      if (result.success) {
        results.sent++;
      } else {
        results.errors.push({ type: 'theatre_6hours', releaseId: release.id, error: result.msg });
      }
    }

    // Check for streams becoming "Now Streaming" in 6 hours
    const digital6Hours = await checkDigitalReleasesIn6Hours();
    console.log(`Found ${digital6Hours.length} digital releases in 6 hours`);
    
    for (const stream of digital6Hours) {
      const result = await sendDigital6HourNotification(stream);
      if (result.success) {
        results.sent++;
      } else {
        results.errors.push({ type: 'digital_6hours', streamId: stream.id, error: result.msg });
      }
    }

    // Check for releases that just became "Now Showing"
    const theatreNowShowing = await checkTheatreReleasesNowShowing();
    console.log(`Found ${theatreNowShowing.length} theatre releases now showing`);
    
    for (const release of theatreNowShowing) {
      const result = await sendTheatreNowShowingNotification(release);
      if (result.success) {
        results.sent++;
      } else {
        results.errors.push({ type: 'theatre_now_showing', releaseId: release.id, error: result.msg });
      }
    }

    // Check for streams that just became "Now Streaming"
    const digitalNowStreaming = await checkDigitalReleasesNowStreaming();
    console.log(`Found ${digitalNowStreaming.length} digital releases now streaming`);
    
    for (const stream of digitalNowStreaming) {
      const result = await sendDigitalNowStreamingNotification(stream);
      if (result.success) {
        results.sent++;
      } else {
        results.errors.push({ type: 'digital_now_streaming', streamId: stream.id, error: result.msg });
      }
    }

    console.log(`✅ Notification check complete: ${results.sent} notifications sent`);
    if (results.errors.length > 0) {
      console.error(`❌ ${results.errors.length} errors occurred:`, results.errors);
    }

    return results;
  } catch (error) {
    console.error('Error in checkAndSendReleaseNotifications:', error);
    return {
      success: false,
      sent: 0,
      errors: [{ type: 'general', error: error.message }],
    };
  }
};

