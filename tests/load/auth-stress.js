// Stress-/Spike-Test auf den Auth-Endpunkt POST /api/users/login.
//
// Art:    Stresstest mit Spike (plötzlicher Lastsprung, danach gehaltene Hochlast).
// Zweck:  Den CPU-intensiven Login-Pfad (bcrypt-Vergleich) gezielt unter Druck
//         setzen und den Punkt finden, ab dem Latenz/Fehlerrate ansteigen.
// Szenario: Warmup 0->10 VUs (10s), Spike auf 100 VUs (5s), Halten 100 VUs (20s),
//           Ramp-down (5s).
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  scenarios: {
    auth_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "5s", target: 100 },
        { duration: "20s", target: 100 },
        { duration: "5s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    // Unter Stress bewusst tolerantere Schwellen; dienen der Beobachtung.
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

// Einen Nutzer anlegen, gegen den anschließend wiederholt eingeloggt wird.
export function setup() {
  const id = `loaduser_${Date.now()}`;
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
