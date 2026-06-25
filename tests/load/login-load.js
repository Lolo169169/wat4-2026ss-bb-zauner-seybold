// Last-/Throughput-Test auf den Auth-Endpunkt POST /api/users/login.
//
// Art:    Lasttest (graduelle Laststeigerung, gehaltenes Plateau bei moderater Last).
// Zweck:  Verhalten des Logins unter realistischer Normallast messen
//         (Latenz p95, Durchsatz, Fehlerrate) – Gegenstück zum Spike-Test.
// Szenario: Ramp-up 0->15 VUs (15s), Plateau 15 VUs (30s), Ramp-down (10s).
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  scenarios: {
    login_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 15 },
        { duration: "30s", target: 15 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"], // < 1 % Fehler
    http_req_duration: ["p(95)<1000"], // p95 unter 1 s bei Normallast
  },
};

// Einen Nutzer anlegen, gegen den anschließend wiederholt eingeloggt wird.
export function setup() {
  const id = `loginload_${Date.now()}`;
  const user = { username: id, email: `${id}@example.com`, password: "password123" };
  http.post(`${BASE}/api/users`, JSON.stringify({ user }), {
    headers: { "Content-Type": "application/json" },
  });
  return { email: user.email, password: user.password };
}

export default function (data) {
  const payload = JSON.stringify({
    user: { email: data.email, password: data.password },
  });
  const res = http.post(`${BASE}/api/users/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "got token": (r) => !!r.json("user.token"),
  });
}
