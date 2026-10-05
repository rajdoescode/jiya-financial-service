"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IAgent, IInvestment, IDashboardStats } from "@/types";
import { formatINR } from "@/lib/utils/currency";
import { formatDisplayDate } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Trash2, TrendingUp, IndianRupee, Layers, ArrowRightLeft, FileSpreadsheet } from "lucide-react";
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
    if (!confirm("Are you sure you want to delete this investment record?")) return;
    deleteMutation.mutate(id);
  };

  const handleExportCSV = () => {
    if (!investments.length) {
      toast.error("No transactions to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction ID,Date,Client Name,Agent Name,Type,Scheme,Amount (INR),Commission Rate (%),Commission Amount (INR)\n";

    investments.forEach((t) => {
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
        return <Badge variant="cob">Change of Broker</Badge>;
      case "Switch":
        return <Badge variant="switch">Switch</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-end gap-3 no-print">
        <div className="w-full sm:w-auto flex-1 min-w-[150px] space-y-1">
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

        <div className="w-full sm:w-auto flex-1 min-w-[150px] space-y-1">
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

        <div className="w-full sm:w-auto min-w-[120px] space-y-1">
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

        <div className="w-full sm:w-auto min-w-[140px] space-y-1">
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

        <div className="ml-auto flex items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-[#0f766e]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Total Investment Sales</span>
              <TrendingUp className="w-4 h-4 text-[#0f766e]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatINR(stats?.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Mutual Fund SIP</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatINR(stats?.totalSip)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Lumpsum Investment</span>
              <IndianRupee className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatINR(stats?.totalLump)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Change of Broker</span>
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatINR(stats?.totalCob)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Switch Volume</span>
              <Layers className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatINR(stats?.totalSwitch)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#15803d] bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-bold">Commission Payable</span>
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">
              {formatINR(stats?.totalComm)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1e3a8a]" />
            <CardTitle>Investment Transactions</CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {investments.length} record(s)
          </span>
        </CardHeader>
        <CardContent className="p-0">
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
              ) : investments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No investments found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                investments.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
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
                    <TableCell className="font-bold text-slate-900">
                      {formatINR(tx.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.rate}%</TableCell>
                    <TableCell className="font-bold text-emerald-700 font-mono">
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
        </CardContent>
      </Card>
    </div>
  );
}
