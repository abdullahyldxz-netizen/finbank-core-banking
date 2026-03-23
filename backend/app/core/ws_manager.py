"""
WebSocket connection manager shared by API routes.
"""
from __future__ import annotations

import json
from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        sockets = self.active.get(user_id)
        if not sockets:
            return
        self.active[user_id] = [ws for ws in sockets if ws is not websocket]
        if not self.active[user_id]:
            del self.active[user_id]

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        sockets = self.active.get(user_id, [])
        if not sockets:
            return

        dead_sockets: List[WebSocket] = []
        data = json.dumps(payload)
        for socket in sockets:
            try:
                await socket.send_text(data)
            except Exception:
                dead_sockets.append(socket)

        for socket in dead_sockets:
            self.disconnect(socket, user_id)

    def online_count(self) -> int:
        return sum(len(sockets) for sockets in self.active.values())


ws_manager = ConnectionManager()
