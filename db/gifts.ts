import { getDb } from "./index";

export type GiftItem = {
  id: string;
  name: string;
  description: string;
  priceHint: string;
  icon: string;
};

export async function getAvailableGifts() {
  const rows = await getDb().sql`
    SELECT id, name, description, price_hint AS "priceHint", icon
    FROM gifts
    WHERE reserved_at IS NULL
    ORDER BY sort_order ASC
  `;
  return rows as GiftItem[];
}
