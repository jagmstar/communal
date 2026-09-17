import websocket, json, sys, time

page_id = sys.argv[1]
ws = websocket.create_connection(
    f"ws://localhost:9222/devtools/page/{page_id}",
    timeout=10, suppress_origin=True
)

def send(method, params=None, msg_id=None):
    msg_id = msg_id or int(time.time() * 1000) % 100000
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == msg_id:
            return msg

r = send("Network.getCookies", {"urls": ["https://communal-navy.vercel.app", "https://localhost"]})
print(json.dumps(r, indent=1))
ws.close()
