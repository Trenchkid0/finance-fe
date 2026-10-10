import { useState } from "react";
import { Coins, DollarSign, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AssetLogoProps {
  logoUrl?: string;
  name: string;
  symbol: string;
  category?: "indo_stock" | "world_stock" | "currency" | "gold" | "mutual_fund";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AssetLogo({
  logoUrl,
  name,
  symbol,
  category = "indo_stock",
  size = "md",
  className,
}: AssetLogoProps) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "size-8 text-xs rounded-lg",
    md: "size-10 text-sm rounded-xl",
    lg: "size-12 text-base rounded-2xl",
  }[size];

  // If we have an official logo and no error yet, render image
  if (logoUrl && !error) {
    return (
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden border border-border/50 bg-secondary/50 shadow-sm",
          sizeClasses,
          className
        )}
      >
        <img
          src={logoUrl}
          alt={name}
          className="size-full object-contain p-1"
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback to iconic / stylized initials badge
  if (category === "gold") {
    return (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center font-bold border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 text-amber-500 shadow-sm",
          sizeClasses,
          className
        )}
        title={name}
      >
        <Coins className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
      </div>
    );
  }

  if (category === "currency") {
    const cleanSymbol = symbol.replace("IDR=X", "").replace("=X", "").substring(0, 3);
    return (
      <div
        className={cn(
          "shrink-0 flex items-center justify-center font-bold border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-500 shadow-sm",
          sizeClasses,
          className
        )}
        title={name}
      >
        {cleanSymbol === "USD" ? (
          <DollarSign className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
        ) : (
          <Globe className={size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-6"} />
        )}
      </div>
    );
  }

  // Stock initials fallback
  const cleanSymbol = symbol.replace(".JK", "").substring(0, 4);
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center font-black tracking-tight border border-accent/25 bg-accent/10 text-accent shadow-sm select-none",
        sizeClasses,
        className
      )}
      title={name}
    >
      {cleanSymbol}
    </div>
  );
}
