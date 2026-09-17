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

expr = "fetch('https://communal-navy.vercel.app/api/meters?ts=' + Date.now(), {credentials: 'include'}).then(function(r){return r.status;})"
msg_id = int(time.time() * 1000) % 100000
ws.send(json.dumps({"id": msg_id, "method": "Runtime.evaluate", "params": {"expression": expr}}))

ws.settimeout(0.3)
start = time.time()
events = []
while time.time() - start < 5:
    try:
        msg = json.loads(ws.recv())
        events.append(msg)
    except Exception:
        pass

for e in events:
    if "method" in e:
        print(e.get("method"), json.dumps(e.get("params", {}))[:900])

ws.close()
