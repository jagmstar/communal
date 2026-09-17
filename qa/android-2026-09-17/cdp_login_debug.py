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

# reload the login page fresh
send("Page.enable")
send("Page.navigate", {"url": "https://localhost/login"})
time.sleep(2)

expr = """
(function(){
  var input = document.getElementById('pw');
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(input, %s);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input.value;
})()
""" % json.dumps(password)
print(send("Runtime.evaluate", {"expression": expr}))

time.sleep(0.3)

expr2 = "document.querySelector('button[type=submit]').click(); 'clicked'"
print(send("Runtime.evaluate", {"expression": expr2}))

# collect network + console events for a few seconds
ws.settimeout(0.5)
start = time.time()
events = []
while time.time() - start < 6:
    try:
        msg = json.loads(ws.recv())
        m = msg.get("method", "")
        if m in ("Network.requestWillBeSent", "Network.responseReceived", "Network.loadingFailed", "Runtime.exceptionThrown", "Network.requestWillBeSentExtraInfo"):
            events.append((m, msg.get("params", {})))
    except Exception:
        pass

for m, p in events:
    if m == "Network.requestWillBeSent":
        print(m, p.get("request", {}).get("method"), p.get("request", {}).get("url"))
    elif m == "Network.responseReceived":
        print(m, p.get("response", {}).get("status"), p.get("response", {}).get("url"))
    elif m == "Network.loadingFailed":
        print(m, p.get("errorText"), p.get("type"), p.get("blockedReason", ""))
    elif m == "Runtime.exceptionThrown":
        print(m, json.dumps(p)[:500])

ws.close()
