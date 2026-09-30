/**
 * Self-check for Mutual Fund Sales & Commission Calculation Logic.
 * Verifies aggregation, rate computation, SIP/Lumpsum separation, and monthly filtering.
 * Converted from Python to JavaScript for static web / GitHub Pages compatibility.
 */

function calculateCommission(amount, ratePercent) {
  return Math.round((Number(amount) * Number(ratePercent)) / 100 * 100) / 100;
}

function aggregateAgentSales(transactions, agentId, { month = null, year = null } = {}) {
  let totalSales = 0.0;
  let sipTotal = 0.0;
  let lumpsumTotal = 0.0;
  let totalCommission = 0.0;
  const matchingTxs = [];

  for (const tx of transactions) {
    if (tx.agent_id !== agentId) {
      continue;
    }

    // Date format YYYY-MM-DD
    const [txYear, txMonth] = tx.date.split("-");
    if (year !== null && year !== undefined && txYear !== String(year)) {
      continue;
    }
    if (month !== null && month !== undefined && txMonth !== String(month).padStart(2, "0")) {
      continue;
    }

    const amt = parseFloat(tx.amount);
    const comm = calculateCommission(amt, parseFloat(tx.commission_rate));

    totalSales += amt;
    totalCommission += comm;

    if (String(tx.type).toUpperCase() === "SIP") {
      sipTotal += amt;
    } else {
      lumpsumTotal += amt;
    }

    matchingTxs.push({ ...tx, commission: comm });
  }

  const round2 = (num) => Math.round(num * 100) / 100;

  return {
    agent_id: agentId,
    total_sales: round2(totalSales),
    sip_total: round2(sipTotal),
    lumpsum_total: round2(lumpsumTotal),
    total_commission: round2(totalCommission),
    count: matchingTxs.length,
    transactions: matchingTxs
  };
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (Expected ${expected}, got ${actual})`);
  }
}

function testCommissionMath() {
  console.log("Running Commission Calculation & Aggregation Tests...");

  // Test 1: Single calculation
  assertEqual(calculateCommission(100000, 1.5), 1500.00, "100k @ 1.5%");
  assertEqual(calculateCommission(5000, 2.0), 100.00, "5k @ 2.0%");
  assertEqual(calculateCommission(25000, 0.75), 187.50, "25k @ 0.75%");

  // Test 2: Transactions aggregation
  const transactions = [
    { id: 1, agent_id: "A1", client_name: "Ramesh", amount: 10000, commission_rate: 1.5, type: "SIP", date: "2026-09-05" },
    { id: 2, agent_id: "A1", client_name: "Suresh", amount: 50000, commission_rate: 1.5, type: "Lumpsum", date: "2026-09-12" },
    { id: 3, agent_id: "A1", client_name: "Ramesh", amount: 10000, commission_rate: 1.5, type: "SIP", date: "2026-10-05" }, // Next month
    { id: 4, agent_id: "A2", client_name: "Priya", amount: 200000, commission_rate: 2.0, type: "Lumpsum", date: "2026-09-20" }
  ];

  // September 2026 for Agent A1
  const resA1Sep = aggregateAgentSales(transactions, "A1", { month: 9, year: 2026 });
  assertEqual(resA1Sep.total_sales, 60000.00, "A1 Sep total sales");
  assertEqual(resA1Sep.sip_total, 10000.00, "A1 Sep SIP total");
  assertEqual(resA1Sep.lumpsum_total, 50000.00, "A1 Sep Lumpsum total");
  // 10000 * 1.5% = 150, 50000 * 1.5% = 750 => Total 900.00
  assertEqual(resA1Sep.total_commission, 900.00, "A1 Sep total commission");
  assertEqual(resA1Sep.count, 2, "A1 Sep count");

  // September 2026 for Agent A2 (different commission rate: 2.0%)
  const resA2Sep = aggregateAgentSales(transactions, "A2", { month: 9, year: 2026 });
  assertEqual(resA2Sep.total_sales, 200000.00, "A2 Sep total sales");
  assertEqual(resA2Sep.total_commission, 4000.00, "A2 Sep total commission");

  // All-time for Agent A1
  const resA1All = aggregateAgentSales(transactions, "A1");
  assertEqual(resA1All.total_sales, 70000.00, "A1 All-time total sales");
  assertEqual(resA1All.total_commission, 1050.00, "A1 All-time total commission");
  assertEqual(resA1All.count, 3, "A1 All-time count");

  console.log("✅ All commission calculations and aggregation tests passed in JavaScript!");
}

// Run tests if executed directly in Node
if (typeof module !== "undefined" && require.main === module) {
  testCommissionMath();
}

// Export for module/browser usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateCommission, aggregateAgentSales, testCommissionMath };
}
