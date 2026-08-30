import { Link } from "@tanstack/react-router";
import { ClipboardList, Gamepad2, PlayCircle, Wallet } from "lucide-react";

const items = [
  { to: "/", label: "Surveys", icon: ClipboardList },
  { to: "/offers", label: "Offers", icon: Gamepad2 },
  { to: "/watch", label: "Watch", icon: PlayCircle },
  { to: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-3 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            activeProps={{ "data-active": "true" }}
            className="group flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] text-muted-foreground transition-colors data-[active=true]:bg-secondary data-[active=true]:text-foreground"
          >
            <Icon className="size-5 transition-colors group-data-[active=true]:text-gold" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
