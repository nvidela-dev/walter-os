export type AccessGroup = "admin" | "kitchen" | null;
export type AccessArea = "main" | "inventory";

export function canAccess(group: AccessGroup, area: AccessArea): boolean {
  return group === "admin" || (group === "kitchen" && area === "inventory");
}

export function landingPath(group: AccessGroup): string {
  if (group === "admin") return "/";
  if (group === "kitchen") return "/inventory";
  return "/not-authorized";
}

export function routeDecision(group: AccessGroup, pathname: string, method: string): "allow" | "forbidden" | "inventory" | "request-access" {
  const inventory = pathname === "/inventory" || pathname.startsWith("/inventory/");
  if (canAccess(group, inventory ? "inventory" : "main")) return "allow";
  // Never redirect a mutation to a different feature, or return HTML to an API caller.
  if ((method !== "GET" && method !== "HEAD") || pathname.startsWith("/api/") || pathname === "/api") return "forbidden";
  return group === "kitchen" ? "inventory" : "request-access";
}
