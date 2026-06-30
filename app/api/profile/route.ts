import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await req.json() as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length > 200) {
    return NextResponse.json({ error: "Name must be under 200 characters" }, { status: 400 });
  }

  await pool.query("UPDATE users SET name = $1 WHERE email = $2", [name.trim(), session.user.email]);
  return NextResponse.json({ ok: true });
}
