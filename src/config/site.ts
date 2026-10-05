export const siteConfig = {
  name: "Jiya Financial Services",
  description: "Mutual Fund Sales & Agent Commission Tracking Portal",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  company: {
    name: "Jiya Financial Services",
    address: "Mutual Fund Distribution & Wealth Management",
  },
  defaultCommissionRates: {
    SIP: 1.5,
    Lumpsum: 1.0,
    "Change of Broker": 0.5,
    Switch: 0.5,
  },
  navItems: [
    { title: "Dashboard", href: "/#dashboard", icon: "BarChart3" },
    { title: "New Investment", href: "/#add-investment", icon: "PlusCircle" },
    { title: "Month-End Slip", href: "/#statement", icon: "FileText" },
    { title: "Agents & Rates", href: "/#agents", icon: "Users2" },
    { title: "Clients", href: "/#clients", icon: "Users" },
    { title: "Manage Employees", href: "/#employees", icon: "ShieldAlert", adminOnly: true },
  ],
};
