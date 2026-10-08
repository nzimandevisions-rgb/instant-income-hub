import { envString, getEnv, type D1DatabaseLike } from "@/lib/d1";
import { createPayPalPayout } from "@/lib/paypal.server";

/**
 * Cash-outs wait for the owner's approval unless PAYOUTS_MODE is set to
 * "auto" in Cloudflare. Keep it manual until you trust your fraud checks.
 */
export function autoPayoutsEnabled(context: unknown): boolean {
  return (envString(context, "PAYOUTS_MODE") ?? "manual").toLowerCase() === "auto";
}

/**
 * Sends one cash-out to PayPal. The row must already be in status
 * 'processing'. On failure the points are returned to the user.
 */
export async function sendCashout(
  db: D1DatabaseLike,
  context: unknown,
  cashout: { id: string; userId: string; destination: string; usd: number; points: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const payout = await createPayPalPayout(getEnv(context), cashout.id, cashout.destination, cashout.usd);
    await db
      .prepare(
        "UPDATE cashouts SET status = 'pending', paypal_batch_id = ?, paypal_item_id = ?, paypal_status = ? WHERE id = ?",
      )
      .bind(payout.batchId, payout.itemId, payout.batchStatus, cashout.id)
      .run();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "PayPal payout failed.";
    await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(cashout.points, cashout.userId).run();
    await db
      .prepare("UPDATE cashouts SET status = 'failed', error_message = ? WHERE id = ?")
      .bind(message, cashout.id)
      .run();
    return { ok: false, error: message };
  }
}
