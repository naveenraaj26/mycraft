/**
 * Google Apps Script Backend for CraftyHand Store
 * 
 * Paste this code into Extensions -> Apps Script inside a Google Sheet.
 * This handles location verification POST requests and appends coordinates
 * directly to the active Google Sheet.
 */

// Apps Script execution entry point
function doPost(e) {
  try {
    // Parse incoming payload
    // Using text/plain content to prevent CORS preflight OPTIONS requests from blockages
    var data = JSON.parse(e.postData.contents);
    var lat = Number(data.latitude);
    var lon = Number(data.longitude);
    
    // Approximate Bounding Box coordinates for India
    // Latitude: ~8.4° N to ~37.6° N
    // Longitude: ~68.7° E to ~97.25° E
    var is_in_india = (8.4 <= lat && lat <= 37.6) && (68.7 <= lon && lon <= 97.25);
    
    var response = {};
    if (is_in_india) {
      // Append coordinates directly to the active Google Sheet
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      
      // If sheet is empty, add headers first
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Latitude", "Longitude", "Status"]);
      }
      
      sheet.appendRow([new Date(), lat, lon, "Location Matched: India"]);
      
      response = {
        allowed: true,
        message: "Delivery is available to your location! We ship across India."
      };
    } else {
      response = {
        allowed: false,
        message: "Sorry, we currently only deliver within India."
      };
    }
    
    // Return response JSON
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
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
    message: "CraftyHand Delivery Feasibility API is online!" 
  })).setMimeType(ContentService.MimeType.JSON);
}
