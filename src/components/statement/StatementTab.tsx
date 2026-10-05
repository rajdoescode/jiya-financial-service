"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { IAgent } from "@/types";
import { formatINR } from "@/lib/utils/currency";
import { formatDisplayDate, formatPeriod } from "@/lib/utils/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, MessageCircle, FileText, CheckCircle2, Send, Copy } from "lucide-react";
import { toast } from "sonner";

interface StatementTabProps {
  agents: IAgent[];
  initialAgentId?: string;
}

export function StatementTab({ agents, initialAgentId }: StatementTabProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(
    initialAgentId || agents[0]?.id || "A1"
  );
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("09");

  const { data, isLoading } = useQuery({
    queryKey: ["statement", selectedAgentId, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!selectedAgentId) return null;
      const res = await fetch(
        `/api/statement?agentId=${selectedAgentId}&year=${selectedYear}&month=${selectedMonth}`
      );
      if (!res.ok) throw new Error("Failed to load agent statement");
      const json = await res.json();
      return json.data;
    },
    enabled: !!selectedAgentId,
  });

  const agent = data?.agent;
  const agg = data?.aggregation;

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    if (!agent || !agg) return "";

    const periodLabel = formatPeriod(selectedYear, selectedMonth);

    let text = `*JIYA FINANCIAL SERVICES*\n`;
    text += `*Commission Statement - ${periodLabel}*\n`;
    text += `------------------------------------\n`;
    text += `👤 *Agent:* ${agent.name}\n`;
    text += `📊 *Commission Rates:*\n`;
    text += `  • SIP: ${agent.ratesSummary?.SIP ?? 0}%\n`;
    text += `  • Lumpsum: ${agent.ratesSummary?.Lumpsum ?? 0}%\n`;
    text += `  • Change of Broker: ${agent.ratesSummary?.["Change of Broker"] ?? 0}%\n`;
    text += `  • Switch: ${agent.ratesSummary?.Switch ?? 0}%\n`;
    text += `------------------------------------\n`;
    text += `📈 *SIP Sales:* ${formatINR(agg.sip_total)}\n`;
    text += `💰 *Lumpsum Sales:* ${formatINR(agg.lumpsum_total)}\n`;
    text += `🔄 *Change of Broker:* ${formatINR(agg.cob_total)}\n`;
    text += `🔀 *Switch Volume:* ${formatINR(agg.switch_total)}\n`;
    text += `📊 *Total Sales Volume:* ${formatINR(agg.total_sales)}\n`;
    text += `------------------------------------\n`;
    text += `💵 *NET COMMISSION PAYABLE: ${formatINR(agg.total_commission)}*\n`;
    text += `Total Transactions: ${agg.count}\n`;
    text += `------------------------------------\n`;
    text += `Thank you for your partnership!`;
    return text;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success("📋 Copied statement summary to clipboard for WhatsApp!");
      });
    } else {
      window.prompt("Copy WhatsApp statement text below:", text);
    }
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    if (!text) return;

    const rawPhone = (agent?.phone || "").replace(/\D/g, "");
    let phoneParam = "";
    if (rawPhone.length === 10) {
      phoneParam = `91${rawPhone}`;
    } else if (rawPhone.length > 10) {
      phoneParam = rawPhone;
    }

    const waUrl = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success(`🚀 Opening WhatsApp for ${agent?.name || "Agent"}!`);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Controls / Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto no-print space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-end">
          <div className="sm:col-span-2 lg:col-span-6 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Select Agent</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 lg:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="01">Jan</SelectItem>
                <SelectItem value="02">Feb</SelectItem>
                <SelectItem value="03">Mar</SelectItem>
                <SelectItem value="04">Apr</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">Jun</SelectItem>
                <SelectItem value="07">Jul</SelectItem>
                <SelectItem value="08">Aug</SelectItem>
                <SelectItem value="09">Sep</SelectItem>
                <SelectItem value="10">Oct</SelectItem>
                <SelectItem value="11">Nov</SelectItem>
                <SelectItem value="12">Dec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="flex-1 sm:flex-none h-10 sm:h-9 gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print Statement
          </Button>

          <Button
            variant="success"
            size="sm"
            onClick={handleSendWhatsApp}
            className="flex-1 sm:flex-none h-10 sm:h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-4 h-4" />
            Send on WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyWhatsApp}
            className="flex-1 sm:flex-none h-10 sm:h-9 gap-1.5 border-slate-300"
          >
            <Copy className="w-4 h-4" />
            Copy Text
          </Button>
        </div>
      </div>

      {/* Printable Statement Document */}
      <div className="statement-card bg-white border border-slate-300 sm:border-2 rounded-xl p-4 sm:p-10 max-w-4xl mx-auto shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-2.5 sm:gap-3 border-b-2 border-dashed border-slate-300 pb-4 sm:pb-5 mb-4 sm:mb-6">
          <Image
            src="/logo.png"
            alt="Jiya Financial Services"
            width={44}
            height={44}
            className="object-contain w-9 h-9 sm:w-12 sm:h-12"
          />
          <div>
            <h2 className="text-lg sm:text-2xl font-black tracking-wide text-[#1e3a8a]">
              JIYA FINANCIAL SERVICES
            </h2>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600">
              Agent Mutual Fund Sales & Commission Settlement Statement
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-4 sm:mb-6">
          <div className="space-y-1">
            <div>
              <span className="text-slate-500 font-medium">Agent Name: </span>
              <strong className="text-slate-900">{agent?.name || "-"}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Mobile: </span>
              <span className="text-slate-800 font-mono">{agent?.phone || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Commission Rates: </span>
              <span className="text-slate-700 text-[11px] sm:text-xs font-mono">
                SIP: {agent?.ratesSummary?.SIP ?? 0}% | Lump: {agent?.ratesSummary?.Lumpsum ?? 0}% | COB:{" "}
                {agent?.ratesSummary?.["Change of Broker"] ?? 0}% | Switch: {agent?.ratesSummary?.Switch ?? 0}%
              </span>
            </div>
          </div>

          <div className="space-y-1 sm:text-right">
            <div>
              <span className="text-slate-500 font-medium">Settlement Period: </span>
              <strong className="text-slate-900">{formatPeriod(selectedYear, selectedMonth)}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Statement Date: </span>
              <span className="text-slate-800">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:justify-end">
              <span className="text-slate-500 font-medium">Status: </span>
              <Badge variant="sip" className="gap-1 text-[11px] py-0">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Summary Figures Grid */}
        <div className="bg-slate-50 rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-center border border-slate-200">
          <div className="p-1.5 sm:p-2 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">SIP VOLUME</div>
            <div className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 font-mono truncate">
              {formatINR(agg?.sip_total)}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">LUMPSUM</div>
            <div className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 font-mono truncate">
              {formatINR(agg?.lumpsum_total)}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">COB VOLUME</div>
            <div className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 font-mono truncate">
              {formatINR(agg?.cob_total)}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">SWITCH VOLUME</div>
            <div className="text-xs sm:text-base font-bold text-slate-900 mt-0.5 sm:mt-1 font-mono truncate">
              {formatINR(agg?.switch_total)}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 bg-white sm:bg-transparent rounded-lg border sm:border-0 border-slate-100">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500">TOTAL SALES</div>
            <div className="text-xs sm:text-base font-bold text-[#1e3a8a] mt-0.5 sm:mt-1 font-mono truncate">
              {formatINR(agg?.total_sales)}
            </div>
          </div>

          <div className="p-1.5 sm:p-2 col-span-2 sm:col-span-1 sm:border-l-2 border-slate-300 bg-emerald-50 sm:bg-transparent rounded-lg border sm:border-0 border-emerald-100">
            <div className="text-[10px] sm:text-[11px] font-bold text-emerald-800">NET COMMISSION</div>
            <div className="text-sm sm:text-lg font-bold text-emerald-700 font-mono mt-0.5 sm:mt-1 truncate">
              {formatINR(agg?.total_commission)}
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Detailed Transactions Breakdown ({agg?.count || 0})
          </h4>

          {/* Mobile Breakdown Cards (< md) */}
          <div className="block md:hidden border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {isLoading ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Loading statement details...
              </div>
            ) : !agg?.transactions?.length ? (
              <div className="text-center py-6 text-slate-400 text-xs px-3">
                No transactions recorded for {agent?.name} in {formatPeriod(selectedYear, selectedMonth)}.
              </div>
            ) : (
              agg.transactions.map((t: any, idx: number) => (
                <div key={idx} className="p-3 space-y-1.5 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">
                        {t.client_name || "Client"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatDisplayDate(t.date)}
                      </div>
                    </div>
                    <div className="shrink-0">{renderBadge(t.type)}</div>
                  </div>

                  {t.scheme && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded truncate">
                      {t.scheme}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div>
                      <span className="text-slate-400">Amt: </span>
                      <strong className="text-slate-900 font-mono">{formatINR(t.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Comm ({t.rate ?? t.commission_rate}%): </span>
                      <strong className="text-emerald-700 font-mono">{formatINR(t.commission)}</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Breakdown Table (>= md, and printed) */}
          <div className="hidden md:block print:block border border-slate-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Rate %</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      Loading statement details...
                    </TableCell>
                  </TableRow>
                ) : !agg?.transactions?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-400">
                      No transactions recorded for {agent?.name} in {formatPeriod(selectedYear, selectedMonth)}.
                    </TableCell>
                  </TableRow>
                ) : (
                  agg.transactions.map((t: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{formatDisplayDate(t.date)}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{t.client_name || "Client"}</TableCell>
                      <TableCell>{renderBadge(t.type)}</TableCell>
                      <TableCell className="text-xs text-slate-600">{t.scheme || "-"}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatINR(t.amount)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{t.rate ?? t.commission_rate}%</TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-700">
                        {formatINR(t.commission)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer with sign-off */}
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-4 sm:gap-6">
          <div>
            Prepared By: <strong className="text-slate-800">Jiya Financial Services</strong>
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 w-48 text-center text-slate-700">
            Agent Signature / Acknowledgement
          </div>
        </div>
      </div>
    </div>
  );
}
