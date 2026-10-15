import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid resource ID." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    let query: string;
    let values: unknown[];

    if (body && typeof body.is_active === "boolean") {
      query = `UPDATE resources
               SET is_active = $2
               WHERE id = $1
               RETURNING id, name, type, location, capacity, description, is_active, created_at`;
      values = [id, body.is_active];
    } else {
      query = `UPDATE resources
               SET is_active = NOT is_active
               WHERE id = $1
               RETURNING id, name, type, location, capacity, description, is_active, created_at`;
      values = [id];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Resource not found." },
        { status: 404 }
      );
    }

    const updatedResource = result.rows[0];

    return NextResponse.json({
      success: true,
      message: `Resource is now ${updatedResource.is_active ? "active and available" : "offline / inactive"}.`,
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Failed to update resource status:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update resource status." },
      { status: 500 }
    );
  }
}
