import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const QUICK = (__ENV.QUICK || "false").toLowerCase() === "true";

const failedChecks = new Counter("failed_checks");
const successRate = new Rate("success_rate");

export const options = {
  scenarios: {
    hello_spike_attack: {
      executor: "ramping-arrival-rate",
      startRate: 20,
      timeUnit: "1s",
      preAllocatedVUs: 40,
      maxVUs: 400,
      stages: QUICK
        ? [
            { target: 40, duration: "5s" },
            { target: 120, duration: "7s" },
            { target: 0, duration: "3s" },
          ]
        : [
            { target: 50, duration: "20s" },
            { target: 150, duration: "30s" },
            { target: 350, duration: "40s" },
            { target: 500, duration: "20s" },
            { target: 100, duration: "20s" },
            { target: 0, duration: "10s" },
          ],
      exec: "attackHello",
    },

    mixed_endpoint_pressure: {
      executor: "constant-vus",
      vus: QUICK ? 10 : 30,
      duration: QUICK ? "20s" : "90s",
      exec: "mixedTraffic",
      startTime: QUICK ? "3s" : "10s",
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.15"],
    http_req_duration: ["p(95)<2500", "p(99)<4000"],
    checks: ["rate>0.90"],
    success_rate: ["rate>0.90"],
  },
};

function recordChecks(ok) {
  successRate.add(ok ? 1 : 0);
  if (!ok) failedChecks.add(1);
}

export function attackHello() {
  const res = http.get(`${BASE_URL}/hello`);
  const ok = check(res, {
    "hello status is 200": (r) => r.status === 200,
    "hello body is non-empty": (r) => r.body && r.body.length > 0,
  });

  recordChecks(ok);
  sleep(Math.random() * 0.2);
}

export function mixedTraffic() {
  const pick = Math.random();

  if (pick < 0.55) {
    const id = Math.floor(Math.random() * 100000);
    const res = http.get(`${BASE_URL}/users/${id}`);
    const ok = check(res, {
      "users status is 200": (r) => r.status === 200,
    });
    recordChecks(ok);
  } else if (pick < 0.80) {
    const key = `k6-${Math.floor(Math.random() * 100000)}`;
    const res = http.get(`${BASE_URL}/cache/${key}`);
    const ok = check(res, {
      "cache status is 200": (r) => r.status === 200,
      "cache has value field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.value !== undefined;
        } catch {
          return false;
        }
      },
    });
    recordChecks(ok);
  } else if (pick < 0.92) {
    const res = http.get(`${BASE_URL}/slow`);
    const ok = check(res, {
      "slow status is 200": (r) => r.status === 200,
    });
    recordChecks(ok);
  } else {
    const res = http.get(`${BASE_URL}/error`);
    const ok = check(res, {
      "error endpoint returns 500": (r) => r.status === 500,
    });
    recordChecks(ok);
  }

  sleep(Math.random() * 0.3);
}
