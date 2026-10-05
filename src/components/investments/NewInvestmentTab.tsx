"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IAgent, IClient, InvestmentType } from "@/types";
import { getAgentRate, calculateCommission } from "@/lib/commission";
import { formatINR } from "@/lib/utils/currency";
import { getTodayDateString } from "@/lib/utils/date";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle, RotateCcw, Calculator, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface NewInvestmentTabProps {
  agents: IAgent[];
  clients: IClient[];
  preselectedClientId?: string;
  onSuccess?: () => void;
}

export function NewInvestmentTab({
  agents,
  clients,
  preselectedClientId,
  onSuccess,
}: NewInvestmentTabProps) {
  const queryClient = useQueryClient();

  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [agentId, setAgentId] = useState("");
  const [type, setType] = useState<InvestmentType>("SIP");
  const [amount, setAmount] = useState<number | string>(50000);
  const [rate, setRate] = useState<number | string>(1.5);
  const [date, setDate] = useState(getTodayDateString());
  const [scheme, setScheme] = useState("");

  // Handle client selection: auto-map agent
  const handleClientChange = (selectedClientId: string) => {
    setClientId(selectedClientId);
    const client = clients.find((c) => c.id === selectedClientId);
    if (client && client.agentId) {
      setAgentId(client.agentId);
      updateRateForAgentAndType(client.agentId, type);
    }
  };

  // Handle agent selection
  const handleAgentChange = (selectedAgentId: string) => {
    setAgentId(selectedAgentId);
    updateRateForAgentAndType(selectedAgentId, type);
  };

  // Handle investment type change
  const handleTypeChange = (newType: InvestmentType) => {
    setType(newType);
    if (agentId) {
      updateRateForAgentAndType(agentId, newType);
    }
  };

  const updateRateForAgentAndType = (agId: string, invType: string) => {
    const ag = agents.find((a) => a.id === agId);
    if (ag) {
      const defaultRate = getAgentRate(ag, invType);
      setRate(defaultRate);
    }
  };

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
      const client = clients.find((c) => c.id === preselectedClientId);
      if (client && client.agentId) {
        setAgentId(client.agentId);
        const ag = agents.find((a) => a.id === client.agentId);
        if (ag) {
          setRate(getAgentRate(ag, type));
        }
      }
    }
  }, [preselectedClientId, clients, agents, type]);

  // Live Commission math
  const numericAmount = parseFloat(String(amount)) || 0;
  const numericRate = parseFloat(String(rate)) || 0;
  const liveCommission = calculateCommission(numericAmount, numericRate);

  const createMutation = useMutation({
    mutationFn: async (payload: {
      clientId: string;
      agentId: string;
      type: InvestmentType;
      amount: number;
      rate: number;
      date: string;
      scheme?: string;
    }) => {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to record investment");
      }
      return data.data;
    },
    onSuccess: () => {
      toast.success("✅ Investment recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      toast.error((err as Error).message || "Failed to record investment");
    },
  });

  const resetForm = () => {
    setClientId("");
    setAgentId("");
    setType("SIP");
    setAmount(50000);
    setRate(1.5);
    setDate(getTodayDateString());
    setScheme("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (!agentId) {
      toast.error("Please select an agent.");
      return;
    }
    if (numericAmount <= 0) {
      toast.error("Investment amount must be greater than 0.");
      return;
    }

    createMutation.mutate({
      clientId,
      agentId,
      type,
      amount: numericAmount,
      rate: numericRate,
      date,
      scheme: scheme.trim(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#1e3a8a]" />
            <CardTitle>Record New Mutual Fund Investment</CardTitle>
          </div>
          <CardDescription>
            Enter client investment details to automatically calculate agent commission.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="invClient">Select Client *</Label>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger id="invClient">
                    <SelectValue placeholder="-- Choose Client --" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => {
                      const mappedAg = agents.find((a) => a.id === c.agentId);
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {mappedAg ? `(Agent: ${mappedAg.name})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">
                  Selecting a client automatically maps their assigned agent
                </p>
              </div>

              {/* Agent Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="invAgent">Mapped Agent *</Label>
                <Select value={agentId} onValueChange={handleAgentChange}>
                  <SelectTrigger id="invAgent">
                    <SelectValue placeholder="-- Choose Agent --" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">
                  Receives the commission payout on this investment
                </p>
              </div>

              {/* Investment Type */}
              <div className="space-y-1.5">
                <Label htmlFor="invType">Investment Type *</Label>
                <Select
                  value={type}
                  onValueChange={(val) => handleTypeChange(val as InvestmentType)}
                >
                  <SelectTrigger id="invType">
                    <SelectValue placeholder="Investment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIP">Mutual Fund SIP</SelectItem>
                    <SelectItem value="Lumpsum">Lumpsum Investment</SelectItem>
                    <SelectItem value="Change of Broker">Change of Broker</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Investment Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="invAmount">Investment Amount (₹) *</Label>
                <Input
                  id="invAmount"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50000"
                />
              </div>

              {/* Commission Rate */}
              <div className="space-y-1.5">
                <Label htmlFor="invRate">Agent Commission Rate (%) *</Label>
                <Input
                  id="invRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 1.5"
                />
                <p className="text-[11px] text-slate-500">
                  Auto-filled from Agent&apos;s rate for this type (adjustable)
                </p>
              </div>

              {/* Investment Date */}
              <div className="space-y-1.5">
                <Label htmlFor="invDate">Investment Date *</Label>
                <DatePicker
                  id="invDate"
                  value={date}
                  onChange={(newDate) => setDate(newDate)}
                  placeholder="Select investment date"
                />
              </div>

              {/* Scheme / Note */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="invScheme">Mutual Fund Scheme / Note (Optional)</Label>
                <Input
                  id="invScheme"
                  type="text"
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value)}
                  placeholder="e.g. SBI Bluechip Fund / HDFC Midcap Opp"
                />
              </div>
            </div>

            {/* Live Commission Preview Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  Calculated Commission to Agent:
                </div>
                <div className="text-xs font-mono text-emerald-700">
                  {formatINR(numericAmount)} × {numericRate}% = {formatINR(liveCommission)}
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatINR(liveCommission)}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                disabled={createMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Save Investment
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
