import websocket, json

ws = websocket.create_connection(
    "ws://localhost:9222/devtools/page/94FD8C13B9EF9546A39C512364FAE33D",
    timeout=5, suppress_origin=True
)
expr = (
    "JSON.stringify({loc: document.location.href, "
    "html: document.documentElement.outerHTML.slice(0,2000)})"
)
ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expr}}))
resp = json.loads(ws.recv())
val = json.loads(resp["result"]["result"]["value"])
print("LOC:", val["loc"])
print(val["html"])
ws.close()
