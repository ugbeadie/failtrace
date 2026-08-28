import { NextResponse } from "next/server";
import { getSharedParts } from "@/lib/queries";

export async function GET() {
  try {
    const parts = await getSharedParts();
    return NextResponse.json(parts);
  } catch (err) {
    console.error("GET /api/shared-parts failed:", err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 503 },
    );
  }
}
