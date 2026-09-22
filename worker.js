export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Public live-wall feed used by the TanStack UI. These links carry the user's
    // account ID so provider-side postbacks can attribute completed offers.
    if (url.pathname === "/api/public/feed/offer" || url.pathname === "/api/public/feed/survey") {
      const subid = url.searchParams.get("subid") || "";
      const survey = url.pathname.endsWith("/survey");
      const walls = survey
        ? [
            ["monlix", "Monlix Surveys & Tasks", "https://survey.monlix.com/", "userId"],
            ["adscend", "Adscend Media Rewards", "https://asmtech.adscendmedia.com/adwall/publisher/3359608/profile/default", "subid1"],
          ]
        : [
            ["cpalead", "CPAlead Offers", "https://www.mobtrk.link/wall/HnRe", "subid"],
            ["cpagrip", "CPAGrip Global Offers", "https://www.cpagrip.com/showoffer.php", "subid"],
            ["adscend", "Adscend Media Rewards", "https://asmtech.adscendmedia.com/adwall/publisher/3359608/profile/default", "subid1"],
            ["adgem", "AdGem Gaming Wall", "https://player.adgem.com/v1/wall", "playerid"],
          ];
      const tasks = walls.map(([network, title, base, param], i) => {
        const target = new URL(base);
        if (network === "monlix") target.searchParams.set("appId", "sydehustle");
        if (network === "adgem") target.searchParams.set("appid", "sydehustle");
        if (subid) target.searchParams.set(param, subid);
        return { id: "wall-" + network + "-" + i, title, description: survey ? "Open the live survey wall and choose an eligible survey." : "Open the live offer wall and choose an eligible task.", points: 0, meta: "LIVE WALL", url: target.toString(), hot: i === 0, network };
      });
      return Response.json({ tasks });
    }

    // Accept provider callbacks at the public domain as well as the legacy /api/postback path.
    if (url.pathname === "/api/public/postback") {
      const subId = url.searchParams.get("subId") || url.searchParams.get("subid") || url.searchParams.get("subid1") || url.searchParams.get("player_id") || url.searchParams.get("playerid") || url.searchParams.get("user_id") || url.searchParams.get("uid");
      const rawReward = url.searchParams.get("reward") || url.searchParams.get("points") || url.searchParams.get("amount");
      const payoutUsd = Number(url.searchParams.get("payout") || url.searchParams.get("amount_usd") || 0);
      const reward = rawReward ? Math.round(Number(rawReward)) : Math.round(payoutUsd * 1000);
      const txid = (url.searchParams.get("txid") || url.searchParams.get("trans_id") || url.searchParams.get("transaction_id") || url.searchParams.get("event_id") || "tx_" + Date.now()).slice(0, 160);
      if (!DB) return new Response("D1 database binding missing", { status: 500 });
      if (!subId || !Number.isInteger(reward) || reward <= 0 || reward > 100000000) return new Response("Missing subId or valid reward amount", { status: 400 });
      try {
        await DB.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(subId, subId + "@user.sydehustle.com").run();
        const transactionId = ("txn_" + subId + "_" + txid).slice(0, 220);
        const inserted = await DB.prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)").bind(transactionId, subId, reward, txid, "job_reward").run();
        if (inserted.meta?.changes !== 0) await DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(reward, subId).run();
        return new Response("OK", { status: 200 });
      } catch (error) {
        return new Response("Database error: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
      }
    }

    if (url.pathname === "/api/postback") {
      const subId = url.searchParams.get("subId") || url.searchParams.get("subid") || url.searchParams.get("subid1") || url.searchParams.get("user_id") || url.searchParams.get("playerid") || url.searchParams.get("uid");
      const rawReward = url.searchParams.get("reward") || url.searchParams.get("points") || url.searchParams.get("amount");
      const payoutUsd = url.searchParams.get("payout");
      const reward = rawReward ? Number.parseInt(rawReward, 10) : Math.round(Number(payoutUsd || 0) * 1000);
      const txid = (url.searchParams.get("txid") || url.searchParams.get("trans_id") || url.searchParams.get("transId") || "tx_" + Date.now()).slice(0, 160);

      if (!subId || !/^[A-Za-z0-9_.@+-]{1,128}$/.test(subId) || !Number.isInteger(reward) || reward <= 0 || reward > 100000000) return new Response("Missing subId or valid reward amount", { status: 400 });
      if (!env.DB) return new Response("D1 database binding missing on Cloudflare", { status: 500 });

      try {
        const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ? OR email = ?").bind(subId, subId).first();
        const targetId = existing?.id || subId;
        const email = subId.includes("@") ? subId : subId + "@user.sydehustle.com";
        await env.DB.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(targetId, email).run();
        const transactionId = ("txn_" + targetId + "_" + txid).slice(0, 220);
        const inserted = await env.DB.prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)").bind(transactionId, targetId, reward, txid, "job_reward").run();
        if (inserted.meta?.changes !== 0) await env.DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(reward, targetId).run();
        return new Response("OK", { status: 200 });
      } catch (error) {
        return new Response("Database error: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
      }
    }

    if (url.pathname === "/api/user/balance") {
      const userIdentifier = url.searchParams.get("user");
      if (!userIdentifier || !env.DB) return Response.json({ points: 0 });
      try {
        const user = await env.DB.prepare("SELECT id, email, points FROM users WHERE id = ? OR email = ?").bind(userIdentifier, userIdentifier).first();
        return Response.json(user || { id: userIdentifier, points: 0 });
      } catch (error) {
        return Response.json({ points: 0 });
      }
    }

    // Cash-out rail: 1,000 PTS = $1 USD. Providers are enabled only when their secrets exist.
    if (url.pathname === "/api/user/withdraw" && request.method === "POST") {
      if (!DB) return Response.json({ error: "D1 database binding missing" }, { status: 500 });
      let body; try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
      const userId = String(body.userId || "").trim();
      const points = Math.round(Number(body.points));
      const method = String(body.method || "paypal").toLowerCase();
      const destination = String(body.destination || "").trim();
      if (!userId || !Number.isInteger(points) || points < 500 || !destination) return Response.json({ error: "Valid account, destination and at least 500 PTS are required" }, { status: 400 });
      const amountUsd = points / 1000;
      const reference = "payout-" + crypto.randomUUID();
      try {
        const debited = await DB.prepare("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?").bind(points, userId, points).run();
        if (debited.meta?.changes !== 1) return Response.json({ error: "Insufficient balance" }, { status: 400 });
        let provider;
        if (method === "paypal") {
          if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) throw new Error("PayPal payout credentials are not configured");
          const base = String(env.PAYPAL_MODE || "sandbox").toLowerCase() === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
          const tokenRes = await fetch(base + "/v1/oauth2/token", { method: "POST", headers: { Authorization: "Basic " + btoa(env.PAYPAL_CLIENT_ID + ":" + env.PAYPAL_CLIENT_SECRET), "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
          const token = await tokenRes.json();
          if (!token.access_token) throw new Error("PayPal OAuth failed");
          const payRes = await fetch(base + "/v1/payments/payouts", { method: "POST", headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ sender_batch_header: { sender_batch_id: reference, email_subject: "Your Syde Hustle payout" }, items: [{ recipient_type: "EMAIL", amount: { value: amountUsd.toFixed(2), currency: "USD" }, receiver: destination, note: "Syde Hustle earnings" }] }) });
          provider = await payRes.json();
          if (!payRes.ok) throw new Error(provider.message || "PayPal payout failed");
        } else if (method === "airtime" || method === "data") {
          if (!env.RELOADLY_CLIENT_ID || !env.RELOADLY_CLIENT_SECRET) throw new Error("Reloadly credentials are not configured");
          const tokenRes = await fetch("https://auth.reloadly.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.RELOADLY_CLIENT_ID, client_secret: env.RELOADLY_CLIENT_SECRET, grant_type: "client_credentials", audience: "https://topups.reloadly.com" }) });
          const token = await tokenRes.json();
          if (!token.access_token) throw new Error("Reloadly OAuth failed");
          const detect = await fetch("https://topups.reloadly.com/operators/auto-detect/phone/" + encodeURIComponent(destination) + "/countryisocode/ZA", { headers: { Authorization: "Bearer " + token.access_token, Accept: "application/com.reloadly.topups-v1+json" } });
          const op = await detect.json();
          if (!op.operatorId) throw new Error("Could not detect a South African mobile operator");
          const topup = await fetch("https://topups.reloadly.com/topups", { method: "POST", headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/com.reloadly.topups-v1+json", Accept: "application/com.reloadly.topups-v1+json" }, body: JSON.stringify({ operatorId: op.operatorId, amount: amountUsd, useLocalAmount: false, recipientPhone: { countryCode: "ZA", number: destination }, customIdentifier: reference }) });
          provider = await topup.json();
          if (!topup.ok) throw new Error(provider.message || "Reloadly top-up failed");
        } else {
          if (!env.FLUTTERWAVE_SECRET_KEY) throw new Error("Flutterwave payout credentials are not configured");
          const detail = body.details && typeof body.details === "object" ? body.details : {};
          const transfer = await fetch("https://api.flutterwave.com/v3/transfers", { method: "POST", headers: { Authorization: "Bearer " + env.FLUTTERWAVE_SECRET_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ account_bank: detail.bankCode || body.bankCode || method.toUpperCase(), account_number: detail.accountNumber || destination, amount: Number((amountUsd * 18.5).toFixed(2)), currency: "ZAR", narration: "Syde Hustle Payout", reference }) });
          provider = await transfer.json();
          if (!transfer.ok || provider.status === "failed") throw new Error(provider.message || "Flutterwave payout failed");
        }
        await DB.prepare("INSERT OR IGNORE INTO transactions (id,user_id,amount,txid,type) VALUES (?,?,?,?,?)").bind(reference, userId, points, reference, "withdrawal").run();
        const balance = await DB.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first();
        return Response.json({ success: true, reference, balance: balance?.points || 0, provider });
      } catch (error) {
        try { await DB.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run(); } catch {}
        return Response.json({ error: error instanceof Error ? error.message : "Payout failed" }, { status: 502 });
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Site assets not found", { status: 404 });
  }
};
