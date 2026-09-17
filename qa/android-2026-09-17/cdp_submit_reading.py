import websocket, json, sys, time

page_id = sys.argv[1]
value = sys.argv[2]

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

expr = """
(function(){
  var input = document.querySelector('input[type=text], input[inputmode=decimal], input[inputmode=numeric]');
  if (!input) return 'NO_INPUT';
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(input, %s);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input.value;
})()
""" % json.dumps(value)
print("SET:", send("Runtime.evaluate", {"expression": expr}))

time.sleep(0.3)

expr2 = """
(function(){
  var btns = Array.from(document.querySelectorAll('button'));
  var b = btns.find(function(x){ return x.textContent.includes('Передати на EPS'); });
  if (!b) return 'NO_BUTTON: ' + btns.map(function(x){return x.textContent}).join('|');
  b.click();
  return 'clicked';
})()
"""
print("CLICK:", send("Runtime.evaluate", {"expression": expr2}))

ws.settimeout(0.5)
start = time.time()
events = []
while time.time() - start < 5:
    try:
        msg = json.loads(ws.recv())
        m = msg.get("method", "")
        if m in ("Network.requestWillBeSent", "Network.responseReceived"):
            events.append((m, msg.get("params", {})))
    except Exception:
        pass

for m, p in events:
    if m == "Network.requestWillBeSent":
        print(m, p.get("request", {}).get("method"), p.get("request", {}).get("url"))
    elif m == "Network.responseReceived":
        print(m, p.get("response", {}).get("status"), p.get("response", {}).get("url"))

expr3 = "JSON.stringify({loc: document.location.href, body: document.body.innerText.slice(0,300)})"
print("FINAL:", send("Runtime.evaluate", {"expression": expr3})["result"]["result"]["value"])

ws.close()
