
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
        { success: false, message: "Invalid reservation ID." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'confirmed'
       RETURNING id, status`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Reservation not found or already cancelled.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reservation cancelled successfully.",
      reservation: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to cancel reservation:", error);

    return NextResponse.json(
      { success: false, message: "Failed to cancel reservation." },
      { status: 500 }
    );
  }
}
