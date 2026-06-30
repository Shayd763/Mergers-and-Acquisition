import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, sector, turnover, netProfit, addBacks, askingPrice, sde, dscr, dscrGrade } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO sell_leads (name, email, sector, turnover, net_profit, add_backs, asking_price, sde, dscr, dscr_grade, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name, sector = EXCLUDED.sector,
         turnover = EXCLUDED.turnover, net_profit = EXCLUDED.net_profit,
         add_backs = EXCLUDED.add_backs, asking_price = EXCLUDED.asking_price,
         sde = EXCLUDED.sde, dscr = EXCLUDED.dscr, dscr_grade = EXCLUDED.dscr_grade,
         updated_at = NOW()`,
      [name, email, sector ?? null, turnover ?? null, netProfit ?? null, addBacks ?? null,
       askingPrice ?? null, sde ?? null, dscr ?? null, dscrGrade ?? null]
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("sell-lead error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
