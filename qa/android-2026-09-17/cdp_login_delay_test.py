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

# Directly call postLogin via the page's own module, then wait, then fetch meters manually
expr = """
(async function(){
  const res = await fetch('https://communal-navy.vercel.app/api/login', {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({password: %s})
  });
  const loginStatus = res.status;
  await new Promise(r => setTimeout(r, 500));
  const res2 = await fetch('https://communal-navy.vercel.app/api/meters', { credentials: 'include' });
  return JSON.stringify({loginStatus, metersStatus: res2.status});
})()
""" % json.dumps(password)

r = send("Runtime.evaluate", {"expression": expr, "awaitPromise": True})
print(r)
ws.close()
