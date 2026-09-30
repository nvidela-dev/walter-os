import { NextResponse } from "next/server";

import manifest from "@/lib/inventory/manifest";

export function GET(): NextResponse {
  return NextResponse.json(manifest(), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
