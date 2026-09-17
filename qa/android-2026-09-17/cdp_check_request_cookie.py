import websocket, json, sys, time

page_id = sys.argv[1]
password = sys.argv[2]

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

expr = """
(async function(){
  const res = await fetch('https://communal-navy.vercel.app/api/login', {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({password: %s})
  });
  return res.status;
})()
""" % json.dumps(password)
print("LOGIN:", send("Runtime.evaluate", {"expression": expr, "awaitPromise": True}))

time.sleep(1)

# Now fetch meters and capture the actual outgoing request's cookie header via
# Network.requestWillBeSentExtraInfo (has 'associatedCookies' - shows what
# was actually attached / blocked and why).
expr2 = "fetch('https://communal-navy.vercel.app/api/meters', {credentials:'include'}).then(r=>r.status)"
send("Runtime.evaluate", {"expression": expr2})

ws.settimeout(0.5)
start = time.time()
while time.time() - start < 4:
    try:
        msg = json.loads(ws.recv())
        m = msg.get("method", "")
        if m == "Network.requestWillBeSentExtraInfo":
            p = msg["params"]
            print("REQ COOKIES:", json.dumps(p.get("associatedCookies", []), indent=1))
            print("REQ HEADERS:", json.dumps(p.get("headers", {}), indent=1))
        if m == "Network.responseReceived":
            print("RESP:", msg["params"].get("response", {}).get("status"), msg["params"].get("response", {}).get("url"))
    except Exception:
        pass

ws.close()
