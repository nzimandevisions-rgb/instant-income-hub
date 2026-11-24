type FilterableOffer = {
  title: string;
  description: string;
  meta: string | null;
};

type Rule = { reason: string; pattern: RegExp };

const RULES: Rule[] = [
  // Prize draws and "you won" bait.
  {
    reason: "prize / sweepstakes",
    pattern:
      /\b(win|wins|won|winner|winners|winning|prize|prizes|giveaway|give-away|sweepstakes?|sweeps|raffle|lucky|jackpot|instant win|chance to)\b/i,
  },
  {
    reason: "'congratulations' / 'you were selected' bait",
    pattern: /\b(congrat(s|ulations)?|you('| ha)?ve been (selected|chosen)|you are selected|been selected|selected users?|claim (your|now|it|a|the)|unclaimed)\b/i,
  },
  // Free money / free gift-card bait.
  {
    reason: "gift-card / free-cash bait",
    pattern:
      /\b(gift ?cards?|giftcards?|gitcards?|e-?gift|voucher giveaway|free cash|free money|apple cash|cash ?app (cash|card|gift|reward)|\$\s?\d[\d,.]*\s*(k\b|to spend|gift|on your|cash ?app|apple|amazon|walmart|paypal cash))/i,
  },
  { reason: "unrealistic cash promise", pattern: /\b(free|earn|get|make)\s+\$\s?\d{3,}|\$\s?\d+(\.\d+)?k\b|\$\s?\d{1,3}(,\d{3})+/i },
  { reason: "spin / wheel games", pattern: /\b(spin|spins|spinning|spin the wheel|wheel of)\b/i },
  // Device giveaways.
  {
    reason: "device giveaway",
    pattern: /\b(iphone|ipad|ps5|playstation ?5|xbox|nintendo switch|macbook|airpods|galaxy s\d+|samsung galaxy|smart ?tv)\b/i,
  },
  // Gambling (including baccarat).
  {
    reason: "gambling",
    pattern:
      /\b(casino|casinos|slots?|slot machine|\bbet\b|bets|betting|bettor|sportsbook|wager|poker|bingo|roulette|blackjack|baccarat|lottery|lotto|scratch ?cards?|gambl\w*|fantasy sports|daily fantasy|sports picks|picks|sweepcoins?|sweeps coins?)\b/i,
  },
  // PIN submits & mobile carrier billing traps.
  {
    reason: "pin submit / mobile subscription",
    pattern: /\b(pin ?submit|submit (your )?pin|enter (your )?(mobile|phone) (number|pin)|sms subscription|carrier billing)\b/i,
  },
  // Spammy co-reg / email-submit lead forms.
  {
    reason: "lead-gen / promo-email bait",
    pattern: /\b(enter your information|get the best rewards|protect your personal data|banker or player)\b/i,
  },
  // Sketchy desktop/VPN utility downloads.
  {
    reason: "sketchy utility / free vpn",
    pattern: /\b(free vpn|vpn for windows)\b/i,
  },
  // Adult and dating.
  {
    reason: "adult / dating",
    pattern:
      /\b(adult|xxx|porn\w*|sex\w*|nsfw|hookup|hook-up|dating|date (tonight|local)|singles|flirt\w*|milfs?|cougars?|webcam|cam ?girls?|onlyfans|relationship (scan|test|insight|reading)|soulmate|psychic|tarot|horoscope)\b/i,
  },
  // Crypto doubling and "investment returns" schemes.
  {
    reason: "crypto / get-rich-quick",
    pattern:
      /\b(crypto\w*|bitcoin|btc|ethereum|usdt|airdrop|forex|binary options?|trading signals?|double your|doubl(e|ing) (your )?(money|crypto|investment)|guaranteed (profit|income|returns?)|passive income|mining (app|rig)|cloud mining|get rich)\b/i,
  },
];

/** Returns the first reason an offer is blocked, or null when it is clean. */
export function blockReason(offer: FilterableOffer): string | null {
  const text = `${offer.title} \n ${offer.description} \n ${offer.meta ?? ""}`;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.reason;
  }
  return null;
}

/** Keeps only clean offers and reports what was dropped (for logs/tests). */
export function filterCleanOffers<T extends FilterableOffer>(offers: T[]) {
  const kept: T[] = [];
  const removed: { title: string; reason: string }[] = [];
  for (const offer of offers) {
    const reason = blockReason(offer);
    if (reason) removed.push({ title: offer.title, reason });
    else kept.push(offer);
  }
  return { kept, removed };
}
