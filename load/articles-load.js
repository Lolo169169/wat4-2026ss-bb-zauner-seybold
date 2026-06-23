// Load-/Throughput-Test auf den read-heavy Kern-Endpunkt GET /api/articles.
//
// Art:    Lasttest (graduelle Laststeigerung, gehaltenes Plateau).
// Zweck:  Verhalten des meistgenutzten Lese-Endpunkts unter realistischer,
//         steigender Last messen (Latenz p95, Durchsatz, Fehlerrate).
// Szenario: Ramp-up 0->20 VUs (15s), Plateau 20 VUs (30s), Ramp-down (10s).
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  scenarios: {
    articles_read: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 20 },
        { duration: "30s", target: 20 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1 % Fehler
    http_req_duration: ["p(95)<500"], // p95 unter 500 ms
  },
};

// Einmaliges Seeding: ein Nutzer + einige Artikel, damit der Feed nicht leer ist.
export function setup() {
  const id = `loadseed_${Date.now()}`;
  const user = { username: id, email: `${id}@example.com`, password: "password123" };
  const json = { headers: { "Content-Type": "application/json" } };

  const reg = http.post(`${BASE}/api/users`, JSON.stringify({ user }), json);
  const token = reg.json("user.token");
  const auth = {
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
  };

  for (let i = 0; i < 5; i++) {
    const article = {
      title: `Seed Article ${id} ${i}`,
      description: "Seed description",
      body: "Seed body",
      tagList: [],
    };
    http.post(`${BASE}/api/articles`, JSON.stringify({ article }), auth);
  }
  return {};
}

export default function () {
  const res = http.get(`${BASE}/api/articles?limit=10`);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body has articles array": (r) => Array.isArray(r.json("articles")),
  });

  sleep(1);
}
