import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import App from "./App";
import "@fontsource-variable/manrope";
import "@fontsource-variable/sora";
import "./styles/globals.css";
import "./styles/profile-enhancements.css";
import { ApiContractError } from "@/lib/api/client";
import { ThemeProvider } from "@/components/theme-provider";
import "./styles/themes.css";
import "./styles/auth.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failures, error) =>
        failures < 1 &&
        !(error instanceof ApiContractError) &&
        !(
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status < 500
        ),
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
