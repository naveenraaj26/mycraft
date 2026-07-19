/**
 * Google Apps Script Backend for CraftyHand Store
 * 
 * Paste this code into Extensions -> Apps Script inside a Google Sheet.
 * This handles location verification POST requests and appends coordinates
 * directly to the active Google Sheet.
 */

// Apps Script execution entry point
function doPost(e) {
  var sheet;
  try {
    sheet = SpreadsheetApp.openById("12lQkC2RYK1p2CqvNO8RkkvUEBJcDsq2YeA_lmGGZUMY").getSheets()[0];
    sheet.appendRow([new Date(), "DEBUG", "doPost started execution"]);
  } catch (err) {
    // If opening sheet fails, we can't write logs. Return error response.
    return ContentService.createTextOutput(JSON.stringify({
      allowed: false,
      error: "Failed to open Spreadsheet: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // Parse incoming payload
    if (!e || !e.postData || !e.postData.contents) {
      sheet.appendRow([new Date(), "DEBUG ERROR", "postData is empty or undefined"]);
      throw new Error("POST request contains no postData contents.");
    }
    
    var data = JSON.parse(e.postData.contents);
    var lat = Number(data.latitude);
    var lon = Number(data.longitude);
    
    sheet.appendRow([new Date(), "DEBUG PARSED", "Lat: " + lat + ", Lon: " + lon]);

    // Approximate Bounding Box coordinates for India
    var is_in_india = (8.4 <= lat && lat <= 37.6) && (68.7 <= lon && lon <= 97.25);
    
    var statusText = is_in_india ? "Location Matched: India" : "Location Rejected: Outside India";
    sheet.appendRow([new Date(), lat, lon, statusText]);
    
    var response = {};
    if (is_in_india) {
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
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    sheet.appendRow([new Date(), "DEBUG EXCEPTION", error.toString()]);
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
      contents: JSON.stringify({ latitude: 28.6139, longitude: 77.2090 })
    }
  };
  try {
    var res = doPost(mockEvent);
    Logger.log("doPost Response: " + res.getContent());
  } catch (err) {
    Logger.log("doPost Failed: " + err.toString());
  }
}
