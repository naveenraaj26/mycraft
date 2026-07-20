#!/usr/bin/env python3
"""
CraftyHand Custom Web Server
Serves static boutique files and processes Geolocation-based delivery eligibility checks.
"""

import http.server
import socketserver
import json
import os
import ssl

PORT = int(os.environ.get("PORT", 8080))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CraftShopHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Initialize SimpleHTTPRequestHandler serving DIRECTORY
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_POST(self):
        if self.path == '/check-location':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                lat = float(data.get('latitude', 0))
                lon = float(data.get('longitude', 0))
                event_type = data.get('event_type', 'LOCATION_CHECK')
                public_ip = data.get('public_ip') or self.headers.get('True-Client-IP') or self.headers.get('X-Forwarded-For') or self.client_address[0]
                user_agent = data.get('user_agent') or self.headers.get('User-Agent', 'Unknown')
                sec_ch_ua_model = data.get('sec_ch_ua_model') or self.headers.get('Sec-CH-UA-Model', 'Unknown')
                device_id = data.get('device_id') or self.headers.get('X-Device-ID') or self.headers.get('X-Machine-ID', 'Unknown')
                x_forwarded_for = data.get('x_forwarded_for') or self.headers.get('X-Forwarded-For') or public_ip

                # Approximate Bounding Box coordinates for India
                # Latitude: ~8.4° N to ~37.6° N
                # Longitude: ~68.7° E to ~97.25° E
                is_in_india = (8.4 <= lat <= 37.6) and (68.7 <= lon <= 97.25)
                
                status = "Location Match: India" if is_in_india else "Location Rejected: Outside India"
                
                # Write to file with detailed telemetry
                log_file = os.path.join(DIRECTORY, "delivery_locations.txt")
                with open(log_file, "a") as f:
                    f.write(f"[{self.date_time_string()}] Event: {event_type} | Lat: {lat}, Lon: {lon} | IP: {public_ip} | DeviceID: {device_id} | Model: {sec_ch_ua_model} | UA: {user_agent} | X-Forwarded-For: {x_forwarded_for} -> ({status})\n")
                
                response = {
                    "allowed": is_in_india,
                    "message": "Delivery is available to your location! We ship across India." if is_in_india else "Sorry, we currently only deliver within India."
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    # Make sure execution is inside the correct directory
    os.chdir(DIRECTORY)
    
    # Allow port reuse to avoid 'address already in use' errors on quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("0.0.0.0", PORT), CraftShopHandler) as httpd:
        # Configure SSL context to enable HTTPS
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile="cert.pem", keyfile="key.pem")
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"🚀 CraftyHand HTTPS Server running on all interfaces at https://0.0.0.0:{PORT}")
        print(f"📂 Serving static files from: {DIRECTORY}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")

if __name__ == '__main__':
    main()
