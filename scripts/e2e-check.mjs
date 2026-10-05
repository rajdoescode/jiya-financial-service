// scripts/e2e-check.mjs
const BASE_URL = "http://localhost:3000";

async function runChecks() {
  console.log("=== STARTING FULL E2E API VERIFICATION ===");
  let failed = false;

  // 1. Check Login page
  console.log("\n[1] Testing GET /login...");
  const loginRes = await fetch(`${BASE_URL}/login`);
  console.log(`Status: ${loginRes.status}`);
  if (loginRes.status !== 200) throw new Error("Login page failed to render");

  // 2. Test Admin Login
  console.log("\n[2] Testing POST /api/auth/login (Admin)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminLoginJson = await adminLoginRes.json();
  console.log("Admin Login Result:", JSON.stringify(adminLoginJson));
  if (!adminLoginJson.success || adminLoginJson.data.user.role !== "admin") {
    throw new Error("Admin login failed");
  }

  // Extract session cookie
  const rawCookie = adminLoginRes.headers.get("set-cookie");
  const adminCookie = rawCookie ? rawCookie.split(";")[0] : "";
  console.log("Got Admin Session Cookie:", adminCookie ? "YES" : "NO");

  // 3. Test Auth Me
  console.log("\n[3] Testing GET /api/auth/me (Admin)...");
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: adminCookie },
  });
  const meJson = await meRes.json();
  console.log("Me Result:", JSON.stringify(meJson));
  if (!meJson.success || meJson.data.user.username !== "admin") {
    throw new Error("GET /api/auth/me failed for admin");
  }

  // 4. Test Dashboard Data
  console.log("\n[4] Testing GET /api/dashboard (Admin)...");
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { Cookie: adminCookie },
  });
  const dashJson = await dashRes.json();
  console.log("Dashboard Data:", JSON.stringify(dashJson));
  console.log(`Dashboard Stats: Total Sales = ₹${dashJson.data.totalSales}, Total Commission = ₹${dashJson.data.totalComm}, Count = ${dashJson.data.count}`);
  if (!dashJson.success || dashJson.data.totalSales === undefined) {
    throw new Error("Dashboard API returned empty data or failed");
  }

  // 4b. Test Investments List
  console.log("\n[4b] Testing GET /api/investments (Admin)...");
  const invListRes = await fetch(`${BASE_URL}/api/investments`, {
    headers: { Cookie: adminCookie },
  });
  const invListJson = await invListRes.json();
  console.log(`Investments count: ${invListJson.data.length}`);
  if (!invListJson.success || invListJson.data.length === 0) {
    throw new Error("Investments list API failed or returned empty");
  }

  // 4c. Test Agents List
  console.log("\n[4c] Testing GET /api/agents (Admin)...");
  const agentsRes = await fetch(`${BASE_URL}/api/agents`, {
    headers: { Cookie: adminCookie },
  });
  const agentsJson = await agentsRes.json();
  console.log(`Agents count: ${agentsJson.data.length}`);
  if (!agentsJson.success || agentsJson.data.length === 0) {
    throw new Error("Agents list API failed or returned empty");
  }

  // 5. Test Statement Generation
  console.log("\n[5] Testing GET /api/statement (Agent A1, Sep 2026)...");
  const stmtRes = await fetch(`${BASE_URL}/api/statement?agentId=A1&month=9&year=2026`, {
    headers: { Cookie: adminCookie },
  });
  const stmtJson = await stmtRes.json();
  console.log(`Statement Agent: ${stmtJson.data.agent.name}, Total Sales: ₹${stmtJson.data.aggregation.total_sales}, Commission: ₹${stmtJson.data.aggregation.total_commission}`);
  if (!stmtJson.success || !stmtJson.data.agent) {
    throw new Error("Statement API failed");
  }

  // 6. Test New Investment Creation
  console.log("\n[6] Testing POST /api/investments (New Investment)...");
  const newInvRes = await fetch(`${BASE_URL}/api/investments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      clientId: "C1",
      agentId: "A1",
      type: "SIP",
      amount: 20000,
      rate: 1.5,
      date: "2026-10-05",
      scheme: "SBI Small Cap Direct Growth",
    }),
  });
  const newInvJson = await newInvRes.json();
  console.log("New Investment Result:", JSON.stringify(newInvJson));
  if (!newInvJson.success || newInvJson.data.commission !== 300) {
    throw new Error("Investment creation failed or commission mismatch");
  }

  // 7. Test Employee Login & RBAC Gating
  console.log("\n[7] Testing POST /api/auth/login (Employee emp1)...");
  const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "emp1", password: "emp123" }),
  });
  const empLoginJson = await empLoginRes.json();
  console.log("Employee Login Result:", JSON.stringify(empLoginJson));
  if (!empLoginJson.success || empLoginJson.data.user.role !== "employee") {
    throw new Error("Employee login failed");
  }

  const empRawCookie = empLoginRes.headers.get("set-cookie");
  const empCookie = empRawCookie ? empRawCookie.split(";")[0] : "";

  // 8. Test Employee accessing Admin-only route (Must be 403 Forbidden)
  console.log("\n[8] Testing Employee accessing /api/employees (Should be 403 Forbidden)...");
  const empManageRes = await fetch(`${BASE_URL}/api/employees`, {
    headers: { Cookie: empCookie },
  });
  console.log(`Employee access status: ${empManageRes.status}`);
  if (empManageRes.status !== 403) {
    throw new Error(`Expected status 403 for employee on admin route, got ${empManageRes.status}`);
  }

  // 9. Test Logout
  console.log("\n[9] Testing POST /api/auth/logout...");
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  const logoutJson = await logoutRes.json();
  console.log("Logout Result:", JSON.stringify(logoutJson));
  if (!logoutJson.success) throw new Error("Logout failed");

  console.log("\n=============================================");
  console.log("✅ ALL END-TO-END CHECKS PASSED PERFECTLY!");
  console.log("=============================================");
}

runChecks().catch((err) => {
  console.error("❌ E2E VERIFICATION FAILED:", err);
  process.exit(1);
});
