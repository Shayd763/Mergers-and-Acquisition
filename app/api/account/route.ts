import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import pool from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
