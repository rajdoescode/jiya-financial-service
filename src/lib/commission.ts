import { IAgent, InvestmentType } from "@/types";

export interface TxInput {
  id?: string | number;
  agent_id?: string;
  agentId?: string;
  clientId?: string;
  client_name?: string;
  type: InvestmentType | string;
  amount: number | string;
  rate?: number | string;
  commission_rate?: number | string;
  commission?: number | string;
  date: string;
  scheme?: string;
}

export function calculateCommission(amount: number | string, ratePercent: number | string): number {
  const amt = Number(amount);
  const rate = Number(ratePercent);
  if (isNaN(amt) || isNaN(rate)) return 0;
  return Math.round(((amt * rate) / 100) * 100) / 100;
}

export function getAgentRate(agent: Partial<IAgent> | any, type: string): number {
  if (!agent) return 0;

  if (
    agent.rates &&
    agent.rates[type] !== undefined &&
    agent.rates[type] !== null &&
    String(agent.rates[type]) !== ""
  ) {
    return parseFloat(String(agent.rates[type])) || 0;
  }

  if (agent.rate !== undefined && agent.rate !== null && String(agent.rate) !== "") {
    return parseFloat(String(agent.rate)) || 0;
  }

  return 0;
}

export interface AggregateOptions {
  month?: number | string | null;
  year?: number | string | null;
}

export interface AggregationResult {
  agent_id: string;
  total_sales: number;
  sip_total: number;
  lumpsum_total: number;
  cob_total: number;
  switch_total: number;
  total_commission: number;
  count: number;
  transactions: (TxInput & { commission: number })[];
}

export function aggregateAgentSales(
  transactions: TxInput[],
  agentId: string,
  { month = null, year = null }: AggregateOptions = {}
): AggregationResult {
  let totalSales = 0.0;
  let sipTotal = 0.0;
  let lumpsumTotal = 0.0;
  let cobTotal = 0.0;
  let switchTotal = 0.0;
  let totalCommission = 0.0;
  const matchingTxs: (TxInput & { commission: number })[] = [];

  for (const tx of transactions) {
    const txAgentId = tx.agentId || tx.agent_id;
    if (txAgentId !== agentId) {
      continue;
    }

    if (tx.date) {
      const [txYear, txMonth] = tx.date.split("-");
      if (year !== null && year !== undefined && txYear !== String(year)) {
        continue;
      }
      if (
        month !== null &&
        month !== undefined &&
        txMonth !== String(month).padStart(2, "0")
      ) {
        continue;
      }
    }

    const amt = parseFloat(String(tx.amount)) || 0;
    const rawRate = tx.commission_rate !== undefined ? tx.commission_rate : tx.rate;
    const rateVal = rawRate !== undefined ? parseFloat(String(rawRate)) : 0;
    const comm =
      tx.commission !== undefined
        ? parseFloat(String(tx.commission))
        : calculateCommission(amt, rateVal);

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

  const round2 = (num: number) => Math.round(num * 100) / 100;

  return {
    agent_id: agentId,
    total_sales: round2(totalSales),
    sip_total: round2(sipTotal),
    lumpsum_total: round2(lumpsumTotal),
    cob_total: round2(cobTotal),
    switch_total: round2(switchTotal),
    total_commission: round2(totalCommission),
    count: matchingTxs.length,
    transactions: matchingTxs,
  };
}
