export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // =====================================================================
    // 1. POSTBACK HANDLER: Credits points when user finishes a job/survey
    // =====================================================================
    if (url.pathname === "/api/postback") {
      // Extract parameters sent by Adscend / AdGem / Digital Turbine / CPALead
      const subId = url.searchParams.get("subId") || 
                    url.searchParams.get("subid1") || 
                    url.searchParams.get("user_id") || 
                    url.searchParams.get("playerid") || 
                    url.searchParams.get("uid");

      const reward = parseInt(
        url.searchParams.get("reward") || 
        url.searchParams.get("points") || 
        url.searchParams.get("amount") || "0",
        10
      );

      const txid = url.searchParams.get("txid") || 
                   url.searchParams.get("trans_id") || 
                   `tx_${Date.now()}`;

      // Check for valid inputs
      if (!subId || isNaN(reward) || reward <= 0) {
        return new Response("Missing subId or valid reward amount", { status: 400 });
      }

      if (!env.DB) {
        return new Response("D1 database binding missing on Cloudflare", { status: 500 });
      }

      try {
        // Look up the user by ID or Email
        let user = await env.DB.prepare(
          "SELECT id, points FROM users WHERE id = ? OR email = ?"
        ).bind(subId, subId).first();

        let targetId = subId;

        if (!user) {
          // If the user doesn't exist yet, auto-register them with the reward
          targetId = `usr_${Date.now()}`;
          await env.DB.prepare(
            "INSERT INTO users (id, email, points) VALUES (?, ?, ?)"
          ).bind(targetId, subId.includes("@") ? subId : `${subId}@user.sydehustle.com`, reward).run();
        } else {
          // Increment the existing user's points
          targetId = user.id;
          await env.DB.prepare(
            "UPDATE users SET points = points + ? WHERE id = ?"
          ).bind(reward, user.id).run();
        }

        // Save transaction history so users have proof of work
        await env.DB.prepare(
          "INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, 'job_reward')"
        ).bind(`txn_${Date.now()}`, targetId, reward, txid).run();

        // Ad networks require plain HTTP 200 "OK"
        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response(`Database error: ${err.message}`, { status: 500 });
      }
    }

    // =====================================================================
    // 2. USER BALANCE HANDLER: Returns the current points balance
    // =====================================================================
    if (url.pathname === "/api/user/balance") {
      const userIdentifier = url.searchParams.get("user");
      if (!userIdentifier || !env.DB) {
        return new Response(JSON.stringify({ points: 0 }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      const user = await env.DB.prepare(
        "SELECT id, email, points FROM users WHERE id = ? OR email = ?"
      ).bind(userIdentifier, userIdentifier).first();

      return new Response(JSON.stringify(user || { points: 0 }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // =====================================================================
    // 3. FRONTEND HANDLER: Serves your website pages
    // =====================================================================
    if (env.ASSETS) {
      return await env.ASSETS.fetch(request);
    }

    return new Response("Site assets not found", { status: 404 });
  }
};
