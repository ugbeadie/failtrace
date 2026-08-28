import { NextResponse } from "next/server";
import { getCriticality } from "@/lib/queries";

export async function GET() {
  try {
    const rows = await getCriticality();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/criticality failed:", err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 503 },
    );
  }
}
