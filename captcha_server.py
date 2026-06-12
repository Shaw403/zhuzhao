#!/usr/bin/env python3.8
"""
ddddocr 验证码识别服务
启动: python3.8 captcha_server.py
端口: 19876
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, base64

import ddddocr
ocr = ddddocr.DdddOcr(show_ad=False)
print("[*] ddddocr 加载成功")

class CaptchaHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
            data = json.loads(body)
            b64 = data.get("image", "")
            if "," in b64:
                b64 = b64.split(",", 1)[1]
            result = ocr.classification(base64.b64decode(b64))
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"text": result}).encode())
            print(f"[+] {result}")
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"text": "", "error": str(e)}).encode())
            print(f"[!] {e}")

    def log_message(self, *args):
        pass

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 19876), CaptchaHandler)
    print("[*] 验证码识别服务已启动: http://127.0.0.1:19876")
    server.serve_forever()
