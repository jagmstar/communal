import json, time, websocket, threading

WS_URL = "ws://localhost:9222/devtools/page/94FD8C13B9EF9546A39C512364FAE33D"

events = []

def on_message(ws, message):
    d = json.loads(message)
    events.append(d)

def on_open(ws):
    def run():
        ws.send(json.dumps({"id": 1, "method": "Network.enable"}))
        time.sleep(0.2)
        ws.send(json.dumps({"id": 2, "method": "Log.enable"}))
        time.sleep(0.2)
        ws.send(json.dumps({"id": 3, "method": "Page.enable"}))
        time.sleep(0.2)
        ws.send(json.dumps({"id": 4, "method": "Page.reload", "params": {"ignoreCache": True}}))
        time.sleep(6)
        ws.close()
    threading.Thread(target=run).start()

ws = websocket.WebSocketApp(WS_URL, on_message=on_message, on_open=on_open)
ws.run_forever()

with open("F:/communal/qa/android-2026-09-17/cdp_events.json", "w", encoding="utf-8") as f:
    json.dump(events, f, indent=1)

for e in events:
    m = e.get("method", "")
    if m in ("Network.responseReceived", "Network.loadingFailed", "Network.requestWillBeSent", "Log.entryAdded"):
        print(m, json.dumps(e.get("params", {}))[:400])
