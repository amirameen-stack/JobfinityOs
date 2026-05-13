export type DashboardAgentId =
  | "accounting-amira"
  | "bookkeeping-zoey"
  | "insurance"
  | "cyber-security";

export type DashboardAgent = {
  id: DashboardAgentId;
  name: string;
  subtitle: string;
  description: string;
  accent: string; // hex
};

export const DASHBOARD_AGENTS: DashboardAgent[] = [
  {
    id: "accounting-amira",
    name: "Amira",
    subtitle: "Jobfinity Accounting UK",
    description:
      "Ready accountancy services for businesses below £1m turnover on set monthly packages.",
    accent: "#1E6FD9",
  },
  {
    id: "bookkeeping-zoey",
    name: "Zoey",
    subtitle: "Jobfinity Bookkeeping UK",
    description:
      "Ready bookkeeping services to UK & sold in weekly, monthly, quarterly installments.",
    accent: "#6366F1",
  },
];

export function getDashboardAgentById(id: string | null | undefined) {
  if (!id) return null;
  return DASHBOARD_AGENTS.find((a) => a.id === id) ?? null;
}

