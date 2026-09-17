import websocket, json, time

page_id = "0B048EAD7547F6C99538278FFE6E6D71"
ws = websocket.create_connection(
    f"ws://localhost:9222/devtools/page/{page_id}", timeout=10, suppress_origin=True
)


def send(method, params=None, msg_id=None):
    msg_id = msg_id or int(time.time() * 1000) % 100000
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == msg_id:
            return msg


send("Network.enable")
send("Runtime.enable")
ws.settimeout(0.1)
try:
    while True:
        json.loads(ws.recv())
except Exception:
    pass

expr = "fetch('https://communal-navy.vercel.app/api/meters', {credentials: 'include'}).then(function(r){return r.status;})"
send("Runtime.evaluate", {"expression": expr})

start = time.time()
events = []
while time.time() - start < 4:
    try:
        msg = json.loads(ws.recv())
        events.append(msg)
    except Exception:
        pass

for e in events:
    print(e.get("method"), json.dumps(e.get("params", {}))[:700])

ws.close()
