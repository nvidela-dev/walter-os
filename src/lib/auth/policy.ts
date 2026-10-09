export type AccessGroup = "admin" | "kitchen" | "waitress" | null;
export type AccessArea = "main" | "inventory" | "drinks";

export function canAccess(group: AccessGroup, area: AccessArea): boolean {
  return group === "admin" || (group === "kitchen" && area === "inventory") || (group === "waitress" && area === "drinks");
}

export function landingPath(group: AccessGroup): string {
  if (group === "admin") return "/";
  if (group === "kitchen") return "/inventory";
  if (group === "waitress") return "/drinks";
  return "/not-authorized";
}

export function routeDecision(group: AccessGroup, pathname: string, method: string): "allow" | "forbidden" | "inventory" | "drinks" | "request-access" {
  const inventory = pathname === "/inventory" || pathname.startsWith("/inventory/");
  const drinks = (pathname === "/drinks" || pathname.startsWith("/drinks/"))
    && pathname !== "/drinks/manage" && !pathname.startsWith("/drinks/manage/");
  if (canAccess(group, inventory ? "inventory" : drinks ? "drinks" : "main")) return "allow";
  // Never redirect a mutation to a different feature, or return HTML to an API caller.
  if ((method !== "GET" && method !== "HEAD") || pathname.startsWith("/api/") || pathname === "/api") return "forbidden";
  return group === "kitchen" ? "inventory" : group === "waitress" ? "drinks" : "request-access";
}
