import websocket, json, sys

page_id = sys.argv[1] if len(sys.argv) > 1 else "9ABCF5748211BB452698E86C01226602"
ws = websocket.create_connection(
    f"ws://localhost:9222/devtools/page/{page_id}",
    timeout=5, suppress_origin=True
)
expr = (
    "JSON.stringify({loc: document.location.href, "
    "inputs: Array.from(document.querySelectorAll('input')).map(function(i){"
    "return {id:i.id, type:i.type};}), "
    "bodyText: document.body.innerText.slice(0,200)})"
)
ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expr}}))
resp = json.loads(ws.recv())
print(json.dumps(json.loads(resp["result"]["result"]["value"]), ensure_ascii=False, indent=1))
ws.close()
