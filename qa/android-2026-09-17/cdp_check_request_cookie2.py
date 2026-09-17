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

send("Network.enable")
send("Runtime.enable")
send("Network.setCacheDisabled", {"cacheDisabled": True})

expr2 = "fetch('https://communal-navy.vercel.app/api/meters', {credentials:'include', cache:'no-store'}).then(r=>r.status)"

all_events = []
ws.settimeout(0.1)
# drain any backlog first
try:
    while True:
        json.loads(ws.recv())
except Exception:
    pass

send("Runtime.evaluate", {"expression": expr2})

start = time.time()
while time.time() - start < 4:
    try:
        msg = json.loads(ws.recv())
        all_events.append(msg)
    except Exception:
        pass

for msg in all_events:
    m = msg.get("method", "")
    if m == "Network.requestWillBeSent":
        p = msg["params"]
        print("REQ:", p.get("request", {}).get("method"), p.get("request", {}).get("url"))
        print("  headers:", json.dumps(p.get("request", {}).get("headers", {})))
    if m == "Network.requestWillBeSentExtraInfo":
        p = msg["params"]
        print("EXTRA associatedCookies:", json.dumps(p.get("associatedCookies", [])))
    if m == "Network.responseReceived":
        p = msg["params"]
        print("RESP:", p.get("response", {}).get("status"), p.get("response", {}).get("url"))

ws.close()
