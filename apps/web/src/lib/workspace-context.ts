import { createContext, useContext } from "react";
import { defaultProfile, type Profile } from "@/lib/data";

export const WorkspaceContext = createContext<{
  profile: Profile;
  openEdit: () => void;
  openAccount: () => void;
  notify: (message: string) => void;
}>({
  profile: defaultProfile,
  openEdit: () => {},
  openAccount: () => {},
  notify: () => {},
});
export const useWorkspace = () => useContext(WorkspaceContext);
