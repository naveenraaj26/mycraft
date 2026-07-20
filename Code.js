/**
 * Google Apps Script Backend for CraftyHand Store
 * 
 * Paste this code into Extensions -> Apps Script inside a Google Sheet.
 * This handles location verification and 5-min activity tracking POST requests
 * and appends coordinates & telemetry (IP, User-Agent, Sec-CH-UA-Model, Device-ID)
 * directly to the active Google Sheet.
 */

// Apps Script execution entry point
function doPost(e) {
  var sheet;
  try {
    sheet = SpreadsheetApp.openById("12lQkC2RYK1p2CqvNO8RkkvUEBJcDsq2YeA_lmGGZUMY").getSheets()[0];
    
    // Ensure column headers exist if sheet is blank
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Event Type",
        "Latitude",
        "Longitude",
        "Public IP",
        "Device / Machine ID",
        "Sec-CH-UA-Model",
        "User Agent",
        "X-Forwarded-For / True-Client-IP",
        "Status / Message"
      ]);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      allowed: false,
      error: "Failed to open Spreadsheet: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Parse incoming payload
    if (!e || !e.postData || !e.postData.contents) {
      sheet.appendRow([new Date(), "ERROR", "-", "-", "-", "-", "-", "-", "-", "POST request contains no postData contents."]);
      throw new Error("POST request contains no postData contents.");
    }
    
    var data = JSON.parse(e.postData.contents);
    var eventType = data.event_type || "LOCATION_CHECK";
    var lat = Number(data.latitude) || 0;
    var lon = Number(data.longitude) || 0;
    var publicIp = data.public_ip || data.true_client_ip || "Unknown";
    var deviceId = data.device_id || data.x_device_id || data.x_machine_id || "Unknown";
    var secChUaModel = data.sec_ch_ua_model || "Unknown";
    var userAgent = data.user_agent || "Unknown";
    var xForwardedFor = data.x_forwarded_for || data.true_client_ip || publicIp;

    // Approximate Bounding Box coordinates for India
    var is_in_india = (8.4 <= lat && lat <= 37.6) && (68.7 <= lon && lon <= 97.25);
    
    var statusText = is_in_india ? "Location Matched: India" : "Location Rejected: Outside India";
    if (eventType === "5MIN_ACTIVITY_PING") {
      statusText = "Activity Ping (" + (is_in_india ? "India" : "Outside India") + ")";
    }

    sheet.appendRow([
      new Date(),
      eventType,
      lat,
      lon,
      publicIp,
      deviceId,
      secChUaModel,
      userAgent,
      xForwardedFor,
      statusText
    ]);
    
    var response = {
      allowed: is_in_india,
      message: is_in_india ? "Delivery is available to your location! We ship across India." : "Sorry, we currently only deliver within India.",
      timestamp: new Date().toISOString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    sheet.appendRow([new Date(), "EXCEPTION", "-", "-", "-", "-", "-", "-", "-", error.toString()]);
    return ContentService.createTextOutput(JSON.stringify({ 
      allowed: false, 
      error: error.toString(),
      message: "Internal script verification error."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple status response for GET requests
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "active", 
    message: "CraftyHand Delivery Feasibility & Telemetry API is online!" 
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper to trigger Google Sheets OAuth permissions dialog
function authorizeScript() {
  var sheet;
  try {
    sheet = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    sheet = SpreadsheetApp.openById("12lQkC2RYK1p2CqvNO8RkkvUEBJcDsq2YeA_lmGGZUMY");
  }
  if (sheet) {
    Logger.log("Success! Script authorized to access Google Sheet: " + sheet.getName());
  }
}

// Debug helper to run doPost manually in the Google editor
function testDoPost() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({ 
        event_type: "TEST_RUN",
        latitude: 28.6139, 
        longitude: 77.2090,
        public_ip: "103.21.124.1",
        device_id: "dev_mock_12345",
        sec_ch_ua_model: "Pixel 6",
        user_agent: "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36",
        x_forwarded_for: "103.21.124.1",
        true_client_ip: "103.21.124.1"
      })
    }
  };
  try {
    var res = doPost(mockEvent);
    Logger.log("doPost Response: " + res.getContent());
  } catch (err) {
    Logger.log("doPost Failed: " + err.toString());
  }
}
