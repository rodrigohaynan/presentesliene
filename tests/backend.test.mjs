import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

let server;
let fetchBackend;

before(async () => {
  server = createServer(async (request, response) => {
    if (request.url === "/invalid") {
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("invalid");
      return;
    }

    let body = "";
    for await (const chunk of request) body += chunk;
    response.writeHead(request.url === "/conflict" ? 409 : 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ method: request.method, path: request.url, body }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  process.env.RESERVATIONS_BACKEND_ORIGIN = `http://127.0.0.1:${address.port}`;
  ({ fetchBackend } = await import(`../lib/backend.ts?test=${Date.now()}`));
});

after(() => new Promise((resolve) => server.close(resolve)));

test("encaminha consulta e impede cache", async () => {
  const response = await fetchBackend("/api/gifts");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(await response.json(), { method: "GET", path: "/api/gifts", body: "" });
});

test("encaminha reserva e preserva o status do serviço", async () => {
  const body = JSON.stringify({ giftId: "bolsa", name: "Convidado", email: "teste@exemplo.com" });
  const response = await fetchBackend("/conflict", { method: "POST", body });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { method: "POST", path: "/conflict", body });
});

test("recusa respostas que não sejam JSON", async () => {
  await assert.rejects(() => fetchBackend("/invalid"), /Resposta inesperada/);
});
