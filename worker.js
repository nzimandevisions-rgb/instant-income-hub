export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Site assets not found", { status: 404 });
  }
};
