import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  SECTOR_DATA, CITY_DATA, SECTORS, CITIES, getMockCompanies,
  type Sector, type City,
} from "@/config/seoData";
import BuyPageClient from "./BuyPageClient";

/* ─── Static params ─────────────────────────────────────────────────────── */
export function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const sector of SECTORS) {
    for (const city of CITIES) {
      params.push({ slug: `${sector}-business-in-${city}` });
    }
  }
  return params;
}

/* ─── Parse slug ─────────────────────────────────────────────────────────── */
function parseSlug(slug: string): { sector: Sector; city: City } | null {
  for (const sector of SECTORS) {
    const suffix = `${sector}-business-in-`;
    if (slug.startsWith(suffix)) {
      const city = slug.slice(suffix.length) as City;
      if (CITIES.includes(city)) return { sector, city };
    }
  }
  return null;
}

/* ─── Metadata ───────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return { title: "Not Found" };
  const { sector, city } = parsed;
  const sd = SECTOR_DATA[sector];
  const cd = CITY_DATA[city];
  const title = `Buy a ${sd.displayName} Business in ${cd.displayName} | Deal Valuation & Debt Analysis`;
  const description = `Analyse ${sd.displayName.toLowerCase()} acquisitions in ${cd.displayName}. Average SDE multiple ${sd.avgSdeMultiple}×. Interactive DSCR calculator, capital stack modelling, and credit memo generation.`;
  return { title, description, openGraph: { title, description } };
}

/* ─── Page (server component) ───────────────────────────────────────────── */
export default async function BuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const { sector, city } = parsed;
  const sd = SECTOR_DATA[sector];
  const cd = CITY_DATA[city];
  const companies = getMockCompanies(sector, city);
  const adjustedPrice = Math.round(sd.avgAskingPrice * (1 + cd.premiumPct));

  return (
    <BuyPageClient
      sector={sector}
      city={city}
      sectorData={sd}
      cityData={cd}
      companies={companies}
      adjustedPrice={adjustedPrice}
    />
  );
}
