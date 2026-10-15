
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, name, type, location, capacity,
              description, is_active, created_at
       FROM resources
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      resources: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch resources:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch resources." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const type =
      typeof body.type === "string" ? body.type.trim() : "";
    const location =
      typeof body.location === "string"
        ? body.location.trim()
        : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";
    const capacity = Number(body.capacity);

    if (
      !name ||
      !type ||
      name.length > 120 ||
      type.length > 60 ||
      location.length > 150 ||
      description.length > 5000 ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 100000
    ) {
      return NextResponse.json(
        { success: false, message: "Please provide valid resource details." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO resources
         (name, type, location, capacity, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, type, location, capacity,
                 description, is_active, created_at`,
      [
        name,
        type,
        location || null,
        capacity,
        description || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Resource created successfully.",
        resource: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create resource:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create resource." },
      { status: 500 }
    );
  }
}
