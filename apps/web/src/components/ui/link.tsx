import {
  Link as RouterLink,
  useLocation,
  type LinkProps,
} from "react-router-dom";

/** Preserve the existing view components while using React Router navigation. */
export default function Link({
  href,
  ...props
}: Omit<LinkProps, "to"> & { href: string }) {
  const location = useLocation();
  const source = new URLSearchParams(location.search).get("source");
  const destination =
    href !== "/"
      ? href
      : source === "demo" || location.pathname === "/preview"
        ? "/?source=demo"
        : location.pathname.startsWith("/u/")
          ? `${location.pathname}?source=api`
          : href;
  return <RouterLink to={destination} {...props} />;
}
