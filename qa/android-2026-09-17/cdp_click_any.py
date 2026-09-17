import websocket, json, sys, time

page_id = sys.argv[1]
text = sys.argv[2]

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
  var all = Array.from(document.querySelectorAll('button, a, [role=button], div'));
  var candidates = all.filter(function(el){
    return el.textContent.includes(%s) && el.children.length <= 6;
  });
  // Prefer the smallest (most specific) matching element's closest clickable ancestor
  candidates.sort(function(a,b){ return a.textContent.length - b.textContent.length; });
  var target = candidates[0];
  if (!target) return 'NOT_FOUND';
  // climb to nearest button/a/role=button if the matched el itself isn't clickable
  var clickable = target.closest('button, a, [role=button]') || target;
  clickable.click();
  return 'clicked: ' + clickable.tagName + ' ' + clickable.textContent.slice(0,60);
})()
""" % json.dumps(text)

r = send("Runtime.evaluate", {"expression": expr})
print(r)
time.sleep(1.5)
r2 = send("Runtime.evaluate", {"expression": "document.location.href"})
print("LOC:", r2)
ws.close()
