"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IAgent, IInvestment, IDashboardStats } from "@/types";
import { formatINR } from "@/lib/utils/currency";
import { formatDisplayDate } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Download,
  Trash2,
  TrendingUp,
  IndianRupee,
  Layers,
  ArrowRightLeft,
  FileSpreadsheet,
  Search,
  X,
  Award,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardTabProps {
  agents: IAgent[];
}

export function DashboardTab({ agents }: DashboardTabProps) {
  const queryClient = useQueryClient();
  const [filterAgent, setFilterAgent] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterYear, setFilterYear] = useState("2026");
  const [filterMonth, setFilterMonth] = useState("09");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Fetch investments with query parameters
  const { data: investments = [], isLoading: isLoadingTxs } = useQuery<IInvestment[]>({
    queryKey: ["investments", filterAgent, filterType, filterYear, filterMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterAgent !== "ALL") params.append("agentId", filterAgent);
      if (filterType !== "ALL") params.append("type", filterType);
      if (filterYear !== "ALL") params.append("year", filterYear);
      if (filterMonth !== "ALL") params.append("month", filterMonth);

      const res = await fetch(`/api/investments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load investments");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch KPI stats
  const { data: stats } = useQuery<IDashboardStats>({
    queryKey: ["dashboard-stats", filterAgent, filterType, filterYear, filterMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterAgent !== "ALL") params.append("agentId", filterAgent);
      if (filterType !== "ALL") params.append("type", filterType);
      if (filterYear !== "ALL") params.append("year", filterYear);
      if (filterMonth !== "ALL") params.append("month", filterMonth);

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load statistics");
      const json = await res.json();
      return json.data || {
        totalSales: 0,
        totalSip: 0,
        totalLump: 0,
        totalCob: 0,
        totalSwitch: 0,
        totalComm: 0,
        count: 0,
      };
    },
  });

  // Delete investment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete transaction");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Investment record deleted");
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Delete failed");
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteMutation.mutate(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  // Filtered investments by search query
  const filteredInvestments = useMemo(() => {
    if (!searchQuery.trim()) return investments;
    const q = searchQuery.toLowerCase().trim();
    return investments.filter((tx) => {
      const clientName = tx.client?.name?.toLowerCase() || "";
      const agentName = tx.agent?.name?.toLowerCase() || "";
      const scheme = tx.scheme?.toLowerCase() || "";
      const type = tx.type?.toLowerCase() || "";
      return (
        clientName.includes(q) ||
        agentName.includes(q) ||
        scheme.includes(q) ||
        type.includes(q)
      );
    });
  }, [investments, searchQuery]);

  // Top 5 Performing Agents Leaderboard
  const topAgents = useMemo(() => {
    const map = new Map<string, { agent: IAgent; sales: number; comm: number; count: number }>();
    agents.forEach((ag) => {
      map.set(ag.id, { agent: ag, sales: 0, comm: 0, count: 0 });
    });

    investments.forEach((tx) => {
      const entry = map.get(tx.agentId);
      if (entry) {
        entry.sales += tx.amount;
        entry.comm += tx.commission;
        entry.count += 1;
      }
    });

    return Array.from(map.values())
      .filter((a) => a.sales > 0)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [investments, agents]);

  // Sales type distribution percentages
  const totalSalesVal = stats?.totalSales || 0;
  const sipPct = totalSalesVal > 0 ? Math.round(((stats?.totalSip || 0) / totalSalesVal) * 100) : 0;
  const lumpPct = totalSalesVal > 0 ? Math.round(((stats?.totalLump || 0) / totalSalesVal) * 100) : 0;
  const cobPct = totalSalesVal > 0 ? Math.round(((stats?.totalCob || 0) / totalSalesVal) * 100) : 0;
  const switchPct = totalSalesVal > 0 ? Math.round(((stats?.totalSwitch || 0) / totalSalesVal) * 100) : 0;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredInvestments.length === 0) {
      toast.error("No investments to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent +=
      "Transaction ID,Date,Client Name,Agent Name,Type,Scheme,Amount (INR),Commission Rate (%),Commission Amount (INR)\n";

    filteredInvestments.forEach((t) => {
      const cName = t.client ? t.client.name.replace(/,/g, " ") : "Client";
      const aName = t.agent ? t.agent.name.replace(/,/g, " ") : "Agent";
      const scheme = (t.scheme || "").replace(/,/g, " ");
      csvContent += `${t.id},${t.date},"${cName}","${aName}",${t.type},"${scheme}",${t.amount},${t.rate},${t.commission}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Jiya_Financial_Sales_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  const renderBadge = (type: string) => {
    switch (type) {
      case "SIP":
        return <Badge variant="sip">SIP</Badge>;
      case "Lumpsum":
        return <Badge variant="lumpsum">Lumpsum</Badge>;
      case "Change of Broker":
        return <Badge variant="cob">COB</Badge>;
      case "Switch":
        return <Badge variant="switch">Switch</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-end">
          <div className="sm:col-span-1 lg:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Agent Filter</label>
            <Select value={filterAgent} onValueChange={setFilterAgent}>
              <SelectTrigger>
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Agents</SelectItem>
                {agents.map((ag) => (
                  <SelectItem key={ag.id} value={ag.id}>
                    {ag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Investment Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SIP">SIP Only</SelectItem>
                <SelectItem value="Lumpsum">Lumpsum Only</SelectItem>
                <SelectItem value="Change of Broker">Change of Broker Only</SelectItem>
                <SelectItem value="Switch">Switch Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Year</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Years</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Month</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Months</SelectItem>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              className="w-full h-10 sm:h-9 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        <Card className="col-span-2 sm:col-span-1 border-l-4 border-l-[#0f766e]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium">Total Investment Sales</span>
              <TrendingUp className="w-4 h-4 text-[#0f766e]" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-slate-900 truncate font-mono">
              {formatINR(stats?.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium">Mutual Fund SIP</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base sm:text-2xl font-bold text-slate-900 truncate font-mono">
              {formatINR(stats?.totalSip)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium">Lumpsum Investment</span>
              <IndianRupee className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base sm:text-2xl font-bold text-slate-900 truncate font-mono">
              {formatINR(stats?.totalLump)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium">Change of Broker</span>
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base sm:text-2xl font-bold text-slate-900 truncate font-mono">
              {formatINR(stats?.totalCob)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] sm:text-xs font-medium">Switch Volume</span>
              <Layers className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-base sm:text-2xl font-bold text-slate-900 truncate font-mono">
              {formatINR(stats?.totalSwitch)}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1 border-l-4 border-l-[#15803d] bg-emerald-50/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-[11px] sm:text-xs font-bold">Commission Payable</span>
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-700 font-mono truncate">
              {formatINR(stats?.totalComm)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics & Top Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 no-print">
        {/* Sales Type Distribution */}
        <Card className="lg:col-span-6">
          <CardHeader className="py-3.5 sm:py-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#1e3a8a]" />
              <CardTitle className="text-sm sm:text-base">Investment Volume Distribution</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Portfolio split across mutual fund categories
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0 space-y-3.5">
            {/* Multi-colored Progress Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              {sipPct > 0 && (
                <div
                  style={{ width: `${sipPct}%` }}
                  className="bg-blue-600 transition-all duration-500"
                  title={`SIP: ${sipPct}%`}
                />
              )}
              {lumpPct > 0 && (
                <div
                  style={{ width: `${lumpPct}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`Lumpsum: ${lumpPct}%`}
                />
              )}
              {cobPct > 0 && (
                <div
                  style={{ width: `${cobPct}%` }}
                  className="bg-purple-600 transition-all duration-500"
                  title={`COB: ${cobPct}%`}
                />
              )}
              {switchPct > 0 && (
                <div
                  style={{ width: `${switchPct}%` }}
                  className="bg-sky-500 transition-all duration-500"
                  title={`Switch: ${switchPct}%`}
                />
              )}
            </div>

            {/* Legend & Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  SIP ({sipPct}%)
                </div>
                <div className="font-mono text-slate-800 font-bold mt-1 text-[11px] truncate">
                  {formatINR(stats?.totalSip)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Lump ({lumpPct}%)
                </div>
                <div className="font-mono text-slate-800 font-bold mt-1 text-[11px] truncate">
                  {formatINR(stats?.totalLump)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
                <div className="flex items-center gap-1.5 font-semibold text-purple-900">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  COB ({cobPct}%)
                </div>
                <div className="font-mono text-slate-800 font-bold mt-1 text-[11px] truncate">
                  {formatINR(stats?.totalCob)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
                <div className="flex items-center gap-1.5 font-semibold text-sky-900">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  Switch ({switchPct}%)
                </div>
                <div className="font-mono text-slate-800 font-bold mt-1 text-[11px] truncate">
                  {formatINR(stats?.totalSwitch)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Performing Agents */}
        <Card className="lg:col-span-6">
          <CardHeader className="py-3.5 sm:py-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm sm:text-base">Top Performing Agents</CardTitle>
              </div>
              <span className="text-xs text-slate-400 font-medium">By sales volume</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
            {topAgents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No agent sales recorded for this period.
              </div>
            ) : (
              <div className="space-y-2">
                {topAgents.map((item, idx) => (
                  <div
                    key={item.agent.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[11px] shrink-0 bg-slate-100 text-slate-700">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.agent.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.count} transaction(s)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900 font-mono">
                        {formatINR(item.sales)}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                        Comm: {formatINR(item.comm)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 sm:py-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1e3a8a]" />
            <CardTitle className="text-base sm:text-lg">Investment Transactions</CardTitle>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredInvestments.length} of {investments.length})
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search client, scheme..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card List View (Visible on < md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {isLoadingTxs ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Loading transactions...
              </div>
            ) : filteredInvestments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm px-4">
                {searchQuery
                  ? `No transactions found matching "${searchQuery}".`
                  : "No investments found matching the selected filters."}
              </div>
            ) : (
              filteredInvestments.map((tx) => (
                <div key={tx.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {tx.client ? tx.client.name : "Client"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {formatDisplayDate(tx.date)} • {tx.agent ? tx.agent.name : "Agent"}
                      </div>
                    </div>
                    <div className="shrink-0">{renderBadge(tx.type)}</div>
                  </div>

                  {tx.scheme && (
                    <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 truncate">
                      {tx.scheme}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div>
                      <span className="text-slate-400">Inv: </span>
                      <strong className="text-slate-900 font-mono text-sm">{formatINR(tx.amount)}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-slate-400">Comm ({tx.rate}%): </span>
                        <strong className="text-emerald-700 font-mono text-sm">{formatINR(tx.commission)}</strong>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => handleDelete(tx.id)}
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (Visible on >= md) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Mapped Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheme / Remarks</TableHead>
                  <TableHead>Investment Amount</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Commission (₹)</TableHead>
                  <TableHead className="no-print text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTxs ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredInvestments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      {searchQuery
                        ? `No transactions found matching "${searchQuery}".`
                        : "No investments found matching the selected filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvestments.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {formatDisplayDate(tx.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {tx.client ? tx.client.name : "Client"}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {tx.agent ? tx.agent.name : "Agent"}
                      </TableCell>
                      <TableCell>{renderBadge(tx.type)}</TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                        {tx.scheme || "-"}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 font-mono whitespace-nowrap">
                        {formatINR(tx.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.rate}%</TableCell>
                      <TableCell className="font-bold text-emerald-700 font-mono whitespace-nowrap">
                        {formatINR(tx.commission)}
                      </TableCell>
                      <TableCell className="no-print text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(tx.id)}
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Investment Record"
        description="Are you sure you want to delete this transaction record? This action will permanently remove it and re-calculate your sales dashboard."
        confirmText="Delete Record"
        variant="destructive"
        icon="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}