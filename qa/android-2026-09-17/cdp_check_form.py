import websocket, json

ws = websocket.create_connection(
    "ws://localhost:9222/devtools/page/94FD8C13B9EF9546A39C512364FAE33D",
    timeout=5, suppress_origin=True
)
expr = (
    "JSON.stringify({loc: document.location.href, "
    "inputs: Array.from(document.querySelectorAll('input')).map(function(i){"
    "return {id:i.id, type:i.type, value:i.value};})})"
)
ws.send(json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": expr}}))
print(ws.recv())
ws.close()
