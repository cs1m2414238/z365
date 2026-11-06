import { createContext, useContext } from "react";
import type { DashboardState } from "@/components/dashboard-provider";

export const profileQueryKey = (
  source: string,
  username: string,
  part?: string,
): string[] => ["profile", source, username, ...(part ? [part] : [])];
export const DashboardContext = createContext<DashboardState | null>(null);
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("DashboardProvider is required.");
  return context;
}
