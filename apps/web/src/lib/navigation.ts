import { useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => useRouterSearchParams()[0];
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (url: string, options?: { scroll?: boolean }) => {
        navigate(url);
        if (options?.scroll !== false) window.scrollTo({ top: 0 });
      },
      replace: (url: string, options?: { scroll?: boolean }) => {
        navigate(url, { replace: true });
        if (options?.scroll !== false) window.scrollTo({ top: 0 });
      },
    }),
    [navigate],
  );
}
