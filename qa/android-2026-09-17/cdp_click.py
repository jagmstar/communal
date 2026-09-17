import websocket, json, sys, time

page_id = sys.argv[1]
selector_or_text = sys.argv[2]

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


expr = """
(function(){
  var links = Array.from(document.querySelectorAll('a'));
  var target = links.find(function(l){ return l.textContent.includes(%s); });
  if (!target) return 'NOT_FOUND: ' + links.map(function(l){return l.textContent}).join('|');
  target.click();
  return 'clicked: ' + target.href;
})()
""" % json.dumps(selector_or_text)

r = send("Runtime.evaluate", {"expression": expr})
print(r)
time.sleep(2)
r2 = send("Runtime.evaluate", {"expression": "document.location.href"})
print("LOC:", r2)
ws.close()
