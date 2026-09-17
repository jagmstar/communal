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
send("Page.enable")

print("NAV:", send("Page.navigate", {"url": "https://localhost/login"}))
time.sleep(2.5)

state = send("Runtime.evaluate", {"expression": "JSON.stringify({loc: document.location.href, hasInput: !!document.getElementById('pw'), body: document.body.innerText.slice(0,200)})"})
print("STATE AFTER NAV:", state["result"]["result"]["value"])

ws.close()
