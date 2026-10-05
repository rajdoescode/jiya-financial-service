export type Role = "ADMIN" | "EMPLOYEE" | "admin" | "employee";

export type UserStatus = "Active" | "Inactive";

export interface IUser {
  _id?: any;
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE" | "admin" | "employee";
  status: UserStatus;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

export type InvestmentType = "SIP" | "Lumpsum" | "Change of Broker" | "Switch";

export interface IAgentRates {
  SIP: number;
  Lumpsum: number;
  "Change of Broker": number;
  Switch: number;
  [key: string]: number;
}

export interface IAgent {
  _id?: any;
  id: string;
  name: string;
  phone?: string;
  rates: IAgentRates;
  rate?: number; // legacy fallback
  createdAt?: string;
  updatedAt?: string;
}

export interface IClient {
  _id?: any;
  id: string;
  name: string;
  phone?: string;
  agentId: string;
  agent?: IAgent;
  createdAt?: string;
  updatedAt?: string;
}

export interface IInvestment {
  _id?: any;
  id: string;
  clientId: string;
  agentId: string;
  type: InvestmentType;
  amount: number;
  rate: number;
  commission: number;
  date: string; // YYYY-MM-DD
  scheme?: string;
  client?: IClient;
  agent?: IAgent;
  createdAt?: string;
  updatedAt?: string;
}

export interface IAgentAggregation {
  agent_id: string;
  total_sales: number;
  sip_total: number;
  lumpsum_total: number;
  cob_total: number;
  switch_total: number;
  total_commission: number;
  count: number;
  transactions: IInvestment[];
}

export interface IDashboardStats {
  totalSales: number;
  totalSip: number;
  totalLump: number;
  totalCob: number;
  totalSwitch: number;
  totalComm: number;
  count: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthUserSession {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE" | "admin" | "employee";
}
