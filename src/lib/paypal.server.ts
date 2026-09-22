type PayPalEnv = Record<string, unknown>;

function envValue(env: PayPalEnv, key: string): string {
  return typeof env[key] === "string" ? String(env[key]).trim() : "";
}

async function getAccessToken(env: PayPalEnv): Promise<string> {
  const clientId = envValue(env, "PAYPAL_CLIENT_ID");
  const clientSecret = envValue(env, "PAYPAL_CLIENT_SECRET");
  const environment = envValue(env, "PAYPAL_ENVIRONMENT").toLowerCase() || "live";
  if (!clientId || !clientSecret) throw new Error("PayPal credentials are not configured.");
  const base = environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const basic = btoa(unescape(encodeURIComponent(clientId + ":" + clientSecret)));
  const response = await fetch(base + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + basic,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error("PayPal authentication failed: " + (data.error_description || data.error || response.status));
  }
  return String(data.access_token);
}

export async function createPayPalPayout(
  env: PayPalEnv,
  cashoutId: string,
  recipient: string,
  amountUsd: number,
) {
  const environment = envValue(env, "PAYPAL_ENVIRONMENT").toLowerCase() || "live";
  const base = environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const token = await getAccessToken(env);
  const response = await fetch(base + "/v1/payments/payouts", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Accept: "application/json",
      "PayPal-Request-Id": cashoutId,
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: cashoutId,
        recipient_type: "EMAIL",
        email_subject: "Your Syde Hustle payout",
        email_message: "Your Syde Hustle reward payout has been submitted.",
      },
      items: [{
        recipient_type: "EMAIL",
        receiver: recipient,
        sender_item_id: cashoutId,
        amount: { currency: "USD", value: amountUsd.toFixed(2) },
        note: "Syde Hustle reward",
        purpose: "CASHBACK",
      }],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.details?.[0]?.description || data?.message || data?.name || ("HTTP " + response.status);
    throw new Error("PayPal payout rejected: " + message);
  }
  return {
    batchId: String(data?.batch_header?.payout_batch_id ?? ""),
    batchStatus: String(data?.batch_header?.batch_status ?? "PENDING"),
    itemId: String(data?.items?.[0]?.payout_item_id ?? ""),
  };
}

export async function getPayPalPayout(env: PayPalEnv, batchId: string) {
  const environment = envValue(env, "PAYPAL_ENVIRONMENT").toLowerCase() || "live";
  const base = environment === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const token = await getAccessToken(env);
  const response = await fetch(base + "/v1/payments/payouts/" + encodeURIComponent(batchId), {
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Unable to check PayPal payout status: " + (data?.message || response.status));
  return data;
}
