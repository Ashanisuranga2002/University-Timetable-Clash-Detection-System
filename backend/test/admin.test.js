const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const app = require("../src/server");

describe("Admin Module - Comprehensive Functional Tests", () => {
  let server;
  let baseUrl;
  let testCreatedUserId = null;

  before(async () => {
    // Wait for DB connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ── 1. Authentication & Security Tests ─────────────────────────────────────
  describe("1. Admin Authentication & Role Authorization", () => {
    test("TC-ADM-01: Admin login with valid credentials succeeds", async () => {
      const res = await fetch(`${baseUrl}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: "ADM001", password: "admin123" }),
      });
      const data = await res.json();

      assert.strictEqual(res.status, 200, "Should return HTTP 200");
      assert.strictEqual(data.success, true);
      assert.ok(data.admin, "Should return admin payload");
      assert.strictEqual(data.admin.adminId, "ADM001");
    });

    test("TC-ADM-02: Admin login with invalid password fails with 401", async () => {
      const res = await fetch(`${baseUrl}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: "ADM001", password: "wrong_password" }),
      });
      const data = await res.json();

      assert.strictEqual(res.status, 401, "Should return HTTP 401 Unauthorized");
      assert.strictEqual(data.success, false);
      assert.match(data.message, /invalid/i);
    });

    test("TC-ADM-03: Authorization guard rejects non-admin roles with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "Student",
        },
      });
      const data = await res.json();

      assert.strictEqual(res.status, 403, "Should return HTTP 403 Forbidden");
      assert.strictEqual(data.success, false);
      assert.match(data.message, /forbidden/i);
    });
  });

  // ── 2. Dashboard Telemetry & System Health Tests ───────────────────────────
  describe("2. System Health & Clash Telemetry Aggregation", () => {
    test("TC-ADM-04: GET /api/admin/dashboard/stats returns aggregated metrics", async () => {
      const res = await fetch(`${baseUrl}/admin/dashboard/stats`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.data.users, "Must contain users metrics");
      assert.ok(json.data.monitors, "Must contain monitors metrics");
      assert.ok(json.data.alerts, "Must contain alerts metrics");
      assert.ok(json.data.clashes, "Must contain clashes metrics");
      assert.ok(json.data.systemHealth, "Must contain system health");
      assert.ok(typeof json.data.systemHealth.status === "string");
    });

    test("TC-ADM-05: GET /api/admin/system-health returns OS diagnostics and fleet services", async () => {
      const res = await fetch(`${baseUrl}/admin/system-health`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.data.server, "Must report server host");
      assert.ok(Array.isArray(json.data.services), "Must list monitored services");
      assert.ok(json.data.uptime >= 0, "Must calculate uptime percentage");
    });
  });

  // ── 3. User Management CRUD Tests ──────────────────────────────────────────
  describe("3. User Management (CRUD)", () => {
    test("TC-ADM-06: GET /api/admin/users lists directory users", async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data), "Should return array of users");
      assert.ok(json.data.length > 0, "Should contain seeded users");
    });

    test("TC-ADM-07: POST /api/admin/users creates a new user (Create)", async () => {
      const testUser = {
        userId: `TST${Date.now().toString().slice(-4)}`,
        name: "Test Faculty Member",
        email: `test.${Date.now()}@uni.edu`,
        role: "Coordinator",
        department: "Curriculum Planning",
        password: "TestPassword@123",
      };

      const res = await fetch(`${baseUrl}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "Administrator",
        },
        body: JSON.stringify(testUser),
      });
      const json = await res.json();

      assert.strictEqual(res.status, 201);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.userId, testUser.userId);
      testCreatedUserId = json.data._id || json.data.userId;
    });

    test("TC-ADM-08: PUT /api/admin/users/:id updates user details (Update)", async () => {
      assert.ok(testCreatedUserId, "Created user ID must exist");

      const res = await fetch(`${baseUrl}/admin/users/${testCreatedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "Administrator",
        },
        body: JSON.stringify({ department: "Advanced Robotics Lab" }),
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.department, "Advanced Robotics Lab");
    });

    test("TC-ADM-09: DELETE /api/admin/users/:id deletes user (Delete)", async () => {
      assert.ok(testCreatedUserId, "Created user ID must exist");

      const res = await fetch(`${baseUrl}/admin/users/${testCreatedUserId}`, {
        method: "DELETE",
        headers: { "x-admin-role": "Administrator" },
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
    });
  });

  // ── 4. Monitor Probes & Health Diagnostics ─────────────────────────────────
  describe("4. Monitor Probes & Live Probe Checks", () => {
    test("TC-ADM-10: GET /api/admin/monitors returns active service monitors", async () => {
      const res = await fetch(`${baseUrl}/admin/monitors`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const json = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data.some((m) => m.serviceName.includes("Clash Detection")));
    });

    test("TC-ADM-11: POST /api/admin/monitors/:id/check executes live diagnostic ping", async () => {
      // Find Clash Detection probe
      const listRes = await fetch(`${baseUrl}/admin/monitors`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const listJson = await listRes.json();
      const target = listJson.data[0];

      const checkRes = await fetch(`${baseUrl}/admin/monitors/${target._id || target.monitorId}/check`, {
        method: "POST",
        headers: { "x-admin-role": "Administrator" },
      });
      const checkJson = await checkRes.json();

      assert.strictEqual(checkRes.status, 200);
      assert.strictEqual(checkJson.success, true);
      assert.ok(checkJson.data.responseTime, "Must record response time");
    });
  });

  // ── 5. Incident Alerts Lifecycle ───────────────────────────────────────────
  describe("5. Incident Alert Resolution Lifecycle", () => {
    test("TC-ADM-12: Alert workflow transitions: Acknowledge -> Resolve", async () => {
      const listRes = await fetch(`${baseUrl}/admin/alerts`, {
        headers: { "x-admin-role": "Administrator" },
      });
      const listJson = await listRes.json();
      const alert = listJson.data[0];
      assert.ok(alert, "Seeded alert must exist");

      const alertId = alert._id || alert.alertId;

      // Acknowledge
      const ackRes = await fetch(`${baseUrl}/admin/alerts/${alertId}/acknowledge`, {
        method: "PATCH",
        headers: { "x-admin-role": "Administrator" },
      });
      const ackJson = await ackRes.json();
      assert.strictEqual(ackRes.status, 200);
      assert.strictEqual(ackJson.data.state, "acknowledged");

      // Resolve with note
      const resRes = await fetch(`${baseUrl}/admin/alerts/${alertId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "Administrator",
        },
        body: JSON.stringify({ note: "Verified cluster memory autoscaling stabilized load." }),
      });
      const resJson = await resRes.json();
      assert.strictEqual(resRes.status, 200);
      assert.strictEqual(resJson.data.state, "resolved");
    });
  });
});
