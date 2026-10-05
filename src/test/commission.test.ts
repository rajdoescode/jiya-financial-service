import { describe, it, expect } from "vitest";
import {
  calculateCommission,
  getAgentRate,
  aggregateAgentSales,
} from "@/lib/commission";
import { IAgent } from "@/types";

describe("Commission Math & Aggregation Test Suite", () => {
  it("calculates commission accurately with roundTo2", () => {
    expect(calculateCommission(100000, 1.5)).toBe(1500.0);
    expect(calculateCommission(5000, 2.0)).toBe(100.0);
    expect(calculateCommission(25000, 0.75)).toBe(187.5);
    expect(calculateCommission(50000, 0.5)).toBe(250.0);
  });

  it("handles edge cases in calculateCommission (zeros, invalid strings)", () => {
    expect(calculateCommission(0, 1.5)).toBe(0);
    expect(calculateCommission(10000, 0)).toBe(0);
    expect(calculateCommission("invalid", 1.5)).toBe(0);
    expect(calculateCommission(10000, "invalid")).toBe(0);
  });

  it("retrieves per-agent rates across all investment types", () => {
    const agent1: IAgent = {
      id: "A1",
      name: "Ramesh Sharma",
      rates: {
        SIP: 1.5,
        Lumpsum: 1.0,
        "Change of Broker": 0.5,
        Switch: 0.5,
      },
    };

    const agent2: IAgent = {
      id: "A2",
      name: "Pooja Mehta",
      rates: {
        SIP: 2.0,
        Lumpsum: 1.5,
        "Change of Broker": 0.75,
        Switch: 0.75,
      },
    };

    expect(getAgentRate(agent1, "SIP")).toBe(1.5);
    expect(getAgentRate(agent1, "Lumpsum")).toBe(1.0);
    expect(getAgentRate(agent1, "Change of Broker")).toBe(0.5);
    expect(getAgentRate(agent1, "Switch")).toBe(0.5);

    expect(getAgentRate(agent2, "SIP")).toBe(2.0);
    expect(getAgentRate(agent2, "Lumpsum")).toBe(1.5);
    expect(getAgentRate(agent2, "Change of Broker")).toBe(0.75);
    expect(getAgentRate(agent2, "Switch")).toBe(0.75);
  });

  it("supports legacy rate fallback when rates object is not present or partial", () => {
    const legacyAgent = { id: "A3", name: "Vikram", rate: 1.25 };
    expect(getAgentRate(legacyAgent as any, "SIP")).toBe(1.25);
    expect(getAgentRate(legacyAgent as any, "Change of Broker")).toBe(1.25);
    expect(getAgentRate(null, "SIP")).toBe(0);
  });

  it("aggregates transactions across all 4 investment types and respects date filters", () => {
    const agent1 = {
      id: "A1",
      rates: {
        SIP: 1.5,
        Lumpsum: 1.0,
        "Change of Broker": 0.5,
        Switch: 0.5,
      },
    };

    const agent2 = {
      id: "A2",
      rates: {
        "Change of Broker": 0.75,
      },
    };

    const transactions = [
      {
        id: 1,
        agent_id: "A1",
        client_name: "Ramesh",
        amount: 10000,
        commission_rate: getAgentRate(agent1 as any, "SIP"),
        type: "SIP",
        date: "2026-09-05",
      },
      {
        id: 2,
        agent_id: "A1",
        client_name: "Suresh",
        amount: 50000,
        commission_rate: getAgentRate(agent1 as any, "Lumpsum"),
        type: "Lumpsum",
        date: "2026-09-12",
      },
      {
        id: 3,
        agent_id: "A1",
        client_name: "Anand",
        amount: 200000,
        commission_rate: getAgentRate(agent1 as any, "Change of Broker"),
        type: "Change of Broker",
        date: "2026-09-18",
      },
      {
        id: 4,
        agent_id: "A1",
        client_name: "Kiran",
        amount: 40000,
        commission_rate: getAgentRate(agent1 as any, "Switch"),
        type: "Switch",
        date: "2026-09-22",
      },
      {
        id: 5,
        agent_id: "A1",
        client_name: "Ramesh",
        amount: 10000,
        commission_rate: getAgentRate(agent1 as any, "SIP"),
        type: "SIP",
        date: "2026-10-05",
      },
      {
        id: 6,
        agent_id: "A2",
        client_name: "Priya",
        amount: 200000,
        commission_rate: getAgentRate(agent2 as any, "Change of Broker"),
        type: "Change of Broker",
        date: "2026-09-20",
      },
    ];

    // September 2026 for Agent A1
    const resA1Sep = aggregateAgentSales(transactions, "A1", { month: 9, year: 2026 });
    expect(resA1Sep.total_sales).toBe(300000.0);
    expect(resA1Sep.sip_total).toBe(10000.0);
    expect(resA1Sep.lumpsum_total).toBe(50000.0);
    expect(resA1Sep.cob_total).toBe(200000.0);
    expect(resA1Sep.switch_total).toBe(40000.0);
    expect(resA1Sep.total_commission).toBe(1850.0);
    expect(resA1Sep.count).toBe(4);

    // September 2026 for Agent A2 (COB rate 0.75%: 200,000 * 0.75% = 1500)
    const resA2Sep = aggregateAgentSales(transactions, "A2", { month: 9, year: 2026 });
    expect(resA2Sep.total_sales).toBe(200000.0);
    expect(resA2Sep.cob_total).toBe(200000.0);
    expect(resA2Sep.total_commission).toBe(1500.0);
    expect(resA2Sep.count).toBe(1);

    // All-time for Agent A1 (includes October SIP 10,000 @ 1.5% = 150)
    const resA1All = aggregateAgentSales(transactions, "A1");
    expect(resA1All.total_sales).toBe(310000.0);
    expect(resA1All.sip_total).toBe(20000.0);
    expect(resA1All.total_commission).toBe(2000.0);
    expect(resA1All.count).toBe(5);
  });
});
