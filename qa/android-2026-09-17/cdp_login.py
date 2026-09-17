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
    return json.loads(ws.recv())

# Set the React-controlled input value via native setter + dispatch input event
# so React's onChange fires (React overrides the native value setter).
expr = """
(function(){
  var input = document.getElementById('pw');
  var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeSetter.call(input, %s);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return input.value;
})()
""" % json.dumps(password)

print(send("Runtime.evaluate", {"expression": expr}))

time.sleep(0.3)

# Click the submit button
expr2 = """
(function(){
  var btn = document.querySelector('button[type=submit]');
  btn.click();
  return btn ? btn.textContent : null;
})()
"""
print(send("Runtime.evaluate", {"expression": expr2}))

time.sleep(3)

expr3 = "JSON.stringify({loc: document.location.href, bodyText: document.body.innerText.slice(0,300)})"
r = send("Runtime.evaluate", {"expression": expr3})
print(r)

ws.close()
