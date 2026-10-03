/**
 * Self-check for Mutual Fund Sales & Commission Calculation Logic.
 * Verifies aggregation, per-agent per-type rate computation,
 * all investment types (SIP, Lumpsum, Change of Broker, Switch), and monthly filtering.
 */

function calculateCommission(amount, ratePercent) {
  return Math.round((Number(amount) * Number(ratePercent)) / 100 * 100) / 100;
}

function getAgentRate(agent, type) {
  if (!agent) return 0;
  if (agent.rates && agent.rates[type] !== undefined && agent.rates[type] !== null && agent.rates[type] !== "") {
    return parseFloat(agent.rates[type]) || 0;
  }
  if (agent.rate !== undefined && agent.rate !== null && agent.rate !== "") {
    return parseFloat(agent.rate) || 0;
  }
  return 0;
}

function aggregateAgentSales(transactions, agentId, { month = null, year = null } = {}) {
  let totalSales = 0.0;
  let sipTotal = 0.0;
  let lumpsumTotal = 0.0;
  let cobTotal = 0.0;
  let switchTotal = 0.0;
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

    const t = String(tx.type).trim().toUpperCase();
    if (t === "SIP") {
      sipTotal += amt;
    } else if (t === "LUMPSUM") {
      lumpsumTotal += amt;
    } else if (t === "CHANGE OF BROKER" || t === "COB") {
      cobTotal += amt;
    } else if (t === "SWITCH") {
      switchTotal += amt;
    }

    matchingTxs.push({ ...tx, commission: comm });
  }

  const round2 = (num) => Math.round(num * 100) / 100;

  return {
    agent_id: agentId,
    total_sales: round2(totalSales),
    sip_total: round2(sipTotal),
    lumpsum_total: round2(lumpsumTotal),
    cob_total: round2(cobTotal),
    switch_total: round2(switchTotal),
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
  assertEqual(calculateCommission(50000, 0.5), 250.00, "50k @ 0.5%");

  // Test 2: Per-agent rates lookup across all investment types
  const agent1 = {
    id: "A1",
    name: "Ramesh Sharma",
    rates: {
      "SIP": 1.5,
      "Lumpsum": 1.0,
      "Change of Broker": 0.5,
      "Switch": 0.5
    }
  };

  const agent2 = {
    id: "A2",
    name: "Pooja Mehta",
    rates: {
      "SIP": 2.0,
      "Lumpsum": 1.5,
      "Change of Broker": 0.75,
      "Switch": 0.75
    }
  };

  assertEqual(getAgentRate(agent1, "SIP"), 1.5, "Agent 1 SIP rate");
  assertEqual(getAgentRate(agent1, "Lumpsum"), 1.0, "Agent 1 Lumpsum rate");
  assertEqual(getAgentRate(agent1, "Change of Broker"), 0.5, "Agent 1 Change of Broker rate");
  assertEqual(getAgentRate(agent1, "Switch"), 0.5, "Agent 1 Switch rate");

  assertEqual(getAgentRate(agent2, "SIP"), 2.0, "Agent 2 SIP rate");
  assertEqual(getAgentRate(agent2, "Lumpsum"), 1.5, "Agent 2 Lumpsum rate");
  assertEqual(getAgentRate(agent2, "Change of Broker"), 0.75, "Agent 2 Change of Broker rate");
  assertEqual(getAgentRate(agent2, "Switch"), 0.75, "Agent 2 Switch rate");

  // Test 3: Legacy fallback when agent has single fixed rate
  const legacyAgent = { id: "A3", name: "Vikram", rate: 1.25 };
  assertEqual(getAgentRate(legacyAgent, "SIP"), 1.25, "Legacy fallback SIP");
  assertEqual(getAgentRate(legacyAgent, "Change of Broker"), 1.25, "Legacy fallback COB");

  // Test 4: Transactions aggregation with all 4 investment types
  const transactions = [
    { id: 1, agent_id: "A1", client_name: "Ramesh", amount: 10000, commission_rate: getAgentRate(agent1, "SIP"), type: "SIP", date: "2026-09-05" },
    { id: 2, agent_id: "A1", client_name: "Suresh", amount: 50000, commission_rate: getAgentRate(agent1, "Lumpsum"), type: "Lumpsum", date: "2026-09-12" },
    { id: 3, agent_id: "A1", client_name: "Anand", amount: 200000, commission_rate: getAgentRate(agent1, "Change of Broker"), type: "Change of Broker", date: "2026-09-18" },
    { id: 4, agent_id: "A1", client_name: "Kiran", amount: 40000, commission_rate: getAgentRate(agent1, "Switch"), type: "Switch", date: "2026-09-22" },
    { id: 5, agent_id: "A1", client_name: "Ramesh", amount: 10000, commission_rate: getAgentRate(agent1, "SIP"), type: "SIP", date: "2026-10-05" }, // Next month
    { id: 6, agent_id: "A2", client_name: "Priya", amount: 200000, commission_rate: getAgentRate(agent2, "Change of Broker"), type: "Change of Broker", date: "2026-09-20" }
  ];

  // September 2026 for Agent A1
  const resA1Sep = aggregateAgentSales(transactions, "A1", { month: 9, year: 2026 });
  assertEqual(resA1Sep.total_sales, 300000.00, "A1 Sep total sales (10k+50k+200k+40k)");
  assertEqual(resA1Sep.sip_total, 10000.00, "A1 Sep SIP total");
  assertEqual(resA1Sep.lumpsum_total, 50000.00, "A1 Sep Lumpsum total");
  assertEqual(resA1Sep.cob_total, 200000.00, "A1 Sep Change of Broker total");
  assertEqual(resA1Sep.switch_total, 40000.00, "A1 Sep Switch total");
  // Commission:
  // SIP: 10000 * 1.5% = 150
  // Lumpsum: 50000 * 1.0% = 500
  // COB: 200000 * 0.5% = 1000
  // Switch: 40000 * 0.5% = 200
  // Total Commission = 150 + 500 + 1000 + 200 = 1850.00
  assertEqual(resA1Sep.total_commission, 1850.00, "A1 Sep total commission");
  assertEqual(resA1Sep.count, 4, "A1 Sep count");

  // September 2026 for Agent A2 (COB rate 0.75%: 200,000 * 0.75% = 1500)
  const resA2Sep = aggregateAgentSales(transactions, "A2", { month: 9, year: 2026 });
  assertEqual(resA2Sep.total_sales, 200000.00, "A2 Sep total sales");
  assertEqual(resA2Sep.cob_total, 200000.00, "A2 Sep Change of Broker total");
  assertEqual(resA2Sep.total_commission, 1500.00, "A2 Sep total commission");

  // All-time for Agent A1 (includes October SIP 10,000 @ 1.5% = 150)
  const resA1All = aggregateAgentSales(transactions, "A1");
  assertEqual(resA1All.total_sales, 310000.00, "A1 All-time total sales");
  assertEqual(resA1All.sip_total, 20000.00, "A1 All-time SIP total");
  assertEqual(resA1All.total_commission, 2000.00, "A1 All-time total commission (1850 + 150)");
  assertEqual(resA1All.count, 5, "A1 All-time count");

  console.log("✅ All commission calculations and aggregation tests passed for all investment types!");
}

// Run tests if executed directly in Node
if (typeof module !== "undefined" && require.main === module) {
  testCommissionMath();
}

// Export for module/browser usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateCommission, getAgentRate, aggregateAgentSales, testCommissionMath };
}
