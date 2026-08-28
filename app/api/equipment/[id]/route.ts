import { NextResponse } from "next/server";
import { getEquipmentDetail } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const detail = await getEquipmentDetail(id);

    if (!detail) {
      return NextResponse.json(
        { error: `No equipment with id ${id}.` },
        { status: 404 },
      );
    }

    return NextResponse.json(detail);
  } catch (err) {
    console.error(`GET /api/equipment/${id} failed:`, err);
    return NextResponse.json(
      { error: "Could not reach the database." },
      { status: 503 },
    );
  }
}
