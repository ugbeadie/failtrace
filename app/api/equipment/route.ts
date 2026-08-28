import { NextResponse } from "next/server";
import { listEquipment } from "@/lib/queries";

export async function GET() {
  try {
    const equipment = await listEquipment();
    return NextResponse.json(equipment);
  } catch (err) {
    console.error("GET /api/equipment failed:", err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 503 },
    );
  }
}
