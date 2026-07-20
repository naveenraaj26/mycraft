#!/usr/bin/env python3
"""
CraftyHand Custom Web Server & Local Telemetry Tester
Serves static boutique files and processes Geolocation-based delivery eligibility checks.
Logs all telemetry directly to delivery_locations.txt for local verification.
"""

import http.server
import socketserver
import json
import os
import urllib.parse

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CraftShopHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_telemetry(self, data, method="GET"):
        lat = data.get('lat') or data.get('latitude') or '0'
        lon = data.get('lon') or data.get('longitude') or '0'
        event_type = data.get('e') or data.get('event_type') or 'LOCATION_CHECK'
        public_ip = data.get('ip') or data.get('public_ip') or self.client_address[0]
        user_agent = data.get('ua') or data.get('user_agent') or self.headers.get('User-Agent', 'Unknown')
        sec_ch_ua_model = data.get('m') or data.get('sec_ch_ua_model') or self.headers.get('Sec-CH-UA-Model', 'Unknown')
        device_id = data.get('id') or data.get('device_id') or 'Unknown'

        try:
            flat = float(lat)
            flon = float(lon)
            is_in_india = (6.5 <= flat <= 37.6) and (68.0 <= flon <= 97.5) if (flat != 0 or flon != 0) else True
        except ValueError:
            is_in_india = True
            
        status = "Location Match: India" if is_in_india else "Location Rejected: Outside India"
        
        log_entry = f"[{self.date_time_string()}] ({method}) Event: {event_type} | Lat: {lat}, Lon: {lon} | IP: {public_ip} | DeviceID: {device_id} | Model: {sec_ch_ua_model} | UA: {user_agent} -> ({status})\n"
        
        log_file = os.path.join(DIRECTORY, "delivery_locations.txt")
        with open(log_file, "a") as f:
            f.write(log_entry)
            
        print(f"✅ [LOCAL TELEMETRY RECEIVED]: {log_entry.strip()}")
        return {"allowed": is_in_india, "message": "Delivery is available to your location! We ship across India." if is_in_india else "Sorry, we currently only deliver within India."}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ['/telemetry', '/check-location']:
            query_params = urllib.parse.parse_qs(parsed.query)
            # Flatten single parameter lists
            flat_params = {k: v[0] for k, v in query_params.items() if v}
            self.log_telemetry(flat_params, method="GET")
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ['/telemetry', '/check-location']:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception:
                data = {}
                
            res = self.log_telemetry(data, method="POST")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("0.0.0.0", PORT), CraftShopHandler) as httpd:
        print(f"🚀 CraftyHand Local HTTP Test Server running at http://localhost:{PORT}")
        print(f"📂 Logging all local telemetry to: {os.path.join(DIRECTORY, 'delivery_locations.txt')}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down local test server...")

if __name__ == '__main__':
    main()
