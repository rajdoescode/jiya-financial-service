"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthUserSession, IAgent, IClient } from "@/types";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardTab } from "@/components/dashboard/DashboardTab";
import { NewInvestmentTab } from "@/components/investments/NewInvestmentTab";
import { StatementTab } from "@/components/statement/StatementTab";
import { AgentsTab } from "@/components/agents/AgentsTab";
import { ClientsTab } from "@/components/clients/ClientsTab";
import { EmployeesTab } from "@/components/employees/EmployeesTab";
import { AdminPasswordDialog } from "@/components/layout/AdminPasswordDialog";
import {
  BarChart3,
  PlusCircle,
  FileText,
  Users2,
  Users,
  ShieldAlert,
} from "lucide-react";

interface PortalContainerProps {
  initialUser: AuthUserSession;
}

export function PortalContainer({ initialUser }: PortalContainerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);
  const [statementAgentId, setStatementAgentId] = useState<string | undefined>(undefined);
  const [adminPasswordModalOpen, setAdminPasswordModalOpen] = useState(false);

  const isAdmin = initialUser.role.toLowerCase() === "admin";

  // Fetch agents
  const { data: agents = [] } = useQuery<IAgent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to load agents");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<IClient[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const json = await res.json();
      return json.data || [];
    },
  });

  const handleQuickInvest = (clientId: string) => {
    setPreselectedClientId(clientId);
    setActiveTab("add-investment");
  };

  const handleViewSlip = (agentId: string) => {
    setStatementAgentId(agentId);
    setActiveTab("statement");
  };

  const handleDataRestored = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <Header user={initialUser} onDataRestored={handleDataRestored} />

      {/* Tabs Navigation & Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Bar */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-1 mb-6 no-print">
            <TabsList className="bg-transparent border-0 h-auto p-0 flex flex-wrap gap-1">
              <TabsTrigger
                value="dashboard"
                className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
              >
                <BarChart3 className="w-4 h-4" />
                Sales & Commission Dashboard
              </TabsTrigger>

              <TabsTrigger
                value="add-investment"
                className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
              >
                <PlusCircle className="w-4 h-4" />
                New Investment Entry
              </TabsTrigger>

              <TabsTrigger
                value="statement"
                className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
              >
                <FileText className="w-4 h-4" />
                Month-End Agent Slip
              </TabsTrigger>

              <TabsTrigger
                value="agents"
                className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
              >
                <Users2 className="w-4 h-4" />
                Agents & Rates
              </TabsTrigger>

              <TabsTrigger
                value="clients"
                className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
              >
                <Users className="w-4 h-4" />
                Clients
              </TabsTrigger>

              {isAdmin && (
                <TabsTrigger
                  value="employees"
                  className="gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white rounded-md py-2 px-3 text-xs sm:text-sm font-semibold border-0"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Manage Employees
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* 1. Dashboard Tab */}
          <TabsContent value="dashboard">
            <DashboardTab agents={agents} />
          </TabsContent>

          {/* 2. New Investment Tab */}
          <TabsContent value="add-investment">
            <NewInvestmentTab
              agents={agents}
              clients={clients}
              preselectedClientId={preselectedClientId}
              onSuccess={() => {
                setPreselectedClientId(undefined);
                setActiveTab("dashboard");
              }}
            />
          </TabsContent>

          {/* 3. Statement Tab */}
          <TabsContent value="statement">
            <StatementTab
              agents={agents}
              initialAgentId={statementAgentId}
            />
          </TabsContent>

          {/* 4. Agents Tab */}
          <TabsContent value="agents">
            <AgentsTab onViewSlip={handleViewSlip} />
          </TabsContent>

          {/* 5. Clients Tab */}
          <TabsContent value="clients">
            <ClientsTab
              agents={agents}
              onQuickInvest={handleQuickInvest}
            />
          </TabsContent>

          {/* 6. Employees Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="employees">
              <EmployeesTab
                onOpenAdminPasswordModal={() => setAdminPasswordModalOpen(true)}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Admin Password Modal Dialog */}
      {isAdmin && (
        <AdminPasswordDialog
          open={adminPasswordModalOpen}
          onOpenChange={setAdminPasswordModalOpen}
        />
      )}
    </div>
  );
}
