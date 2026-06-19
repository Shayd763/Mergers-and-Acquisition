import { auth } from "@/auth";
import { dealDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deals = await dealDb.list(session.user.email);
  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deal = await req.json();
  if (!deal?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await dealDb.upsert(session.user.email, deal);
  return NextResponse.json({ ok: true });
}
