import os
import sys
import httpx
from typing import Dict
from urllib.parse import urlparse

# Global variables
MY_BANK_CODE = "FINB"
BANK_REGISTRY_URL = os.getenv("BANK_REGISTRY_URL", "https://raw.githubusercontent.com/yemreak/bank-ws/refs/heads/main/banks.json")
EXTERNAL_BANKS: Dict[str, str] = {}

async def fetch_external_banks():
    global EXTERNAL_BANKS
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(BANK_REGISTRY_URL)
            resp.raise_for_status()
            data = resp.json()
            if "banks" in data:
                EXTERNAL_BANKS.clear()
                for bk in data["banks"]:
                    b_code = bk.get("bank_code")
                    if b_code == MY_BANK_CODE:
                        continue # Skip self record
                    ws_url = bk.get("ws_url")
                    if b_code and ws_url:
                        # Normalize ws_url
                        parsed = urlparse(ws_url)
                        if parsed.scheme.startswith("http"):
                            real_scheme = "wss" if parsed.scheme == "https" else "ws"
                            ws_url = f"{real_scheme}://{parsed.netloc}{parsed.path}"
                        # Ensure inter-bank endpoint is appended
                        if not ws_url.endswith("/ws/inter-bank"):
                            ws_url = ws_url.rstrip("/") + "/ws/inter-bank"
                        EXTERNAL_BANKS[b_code] = ws_url
                print(f"[Init] Fetched {len(EXTERNAL_BANKS)} external banks from registry.")
    except Exception as e:
        print(f"[Init] Could not fetch banks registry: {e}", file=sys.stderr)
        # Fallbacks
        EXTERNAL_BANKS["CENTRAL"] = "wss://didactic-halibut-jjwrxv44rjr3jq47-8000.app.github.dev/ws/inter-bank"
        EXTERNAL_BANKS["DGBNK"] = "ws://127.0.0.1:8000/ws/inter-bank"
        EXTERNAL_BANKS["TEST"] = "wss://echo.websocket.events/ws/inter-bank"
