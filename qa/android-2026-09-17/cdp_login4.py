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
(function(){
  var input = document.getElementById('pw');
  if (!input) return 'NO_INPUT';
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(input, %s);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input.value;
})()
""" % json.dumps(password)
print("SET:", send("Runtime.evaluate", {"expression": expr}))
time.sleep(0.3)
expr2 = "(function(){var b=document.querySelector('button[type=submit]'); if(!b) return 'NO_BUTTON'; b.click(); return 'clicked';})()"
print("CLICK:", send("Runtime.evaluate", {"expression": expr2}))

ws.settimeout(0.5)
start = time.time()
events = []
while time.time() - start < 6:
    try:
        msg = json.loads(ws.recv())
        m = msg.get("method", "")
        events.append((m, msg.get("params", {})))
    except Exception:
        pass

for m, p in events:
    if m in ("Network.requestWillBeSent", "Network.responseReceived", "Network.loadingFailed", "Network.responseReceivedExtraInfo", "Network.requestWillBeSentExtraInfo"):
        print("---", m)
        print(json.dumps(p, indent=1)[:1500])

ws.close()
