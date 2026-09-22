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

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Site assets not found", { status: 404 });
  }
};
