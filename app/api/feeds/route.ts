import { NextResponse } from "next/server";
import { getFeedEdges } from "@/lib/queries";

export async function GET() {
  try {
    const feeds = await getFeedEdges();
    return NextResponse.json(feeds);
  } catch (err) {
    console.error("GET /api/feeds failed:", err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 503 },
    );
  }
}
