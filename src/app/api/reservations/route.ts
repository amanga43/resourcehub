
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.resource_id,
         r.reserved_by,
         r.purpose,
         r.start_at,
         r.end_at,
         r.status,
         r.created_at,
         res.name AS resource_name,
         res.type AS resource_type
       FROM reservations r
       JOIN resources res ON res.id = r.resource_id
       ORDER BY r.start_at DESC`
    );

    return NextResponse.json({
      success: true,
      reservations: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch reservations:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch reservations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const resourceId =
      typeof body.resource_id === "string"
        ? body.resource_id.trim()
        : "";
    const reservedBy =
      typeof body.reserved_by === "string"
        ? body.reserved_by.trim()
        : "";
    const purpose =
      typeof body.purpose === "string"
        ? body.purpose.trim()
        : "";

    const startAt = new Date(body.start_at);
    const endAt = new Date(body.end_at);

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      !uuidPattern.test(resourceId) ||
      !reservedBy ||
      reservedBy.length > 120 ||
      !purpose ||
      purpose.length > 250 ||
      typeof body.start_at !== "string" ||
      typeof body.end_at !== "string" ||
      !Number.isFinite(startAt.getTime()) ||
      !Number.isFinite(endAt.getTime()) ||
      endAt <= startAt
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid reservation details and a valid time range.",
        },
        { status: 400 }
      );
    }

    const resource = await pool.query(
      `SELECT id
       FROM resources
       WHERE id = $1 AND is_active = TRUE`,
      [resourceId]
    );

    if (resource.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Resource not found or is inactive.",
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO reservations
         (resource_id, reserved_by, purpose, start_at, end_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, resource_id, reserved_by, purpose,
                 start_at, end_at, status, created_at`,
      [
        resourceId,
        reservedBy,
        purpose,
        startAt.toISOString(),
        endAt.toISOString(),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Reservation created successfully.",
        reservation: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23P01") {
      return NextResponse.json(
        {
          success: false,
          message: "This resource is already reserved during that time. Please choose another time.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to create reservation:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create reservation." },
      { status: 500 }
    );
  }
}
