import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Profile-style card primitives — "Blueprint / Terminal" design language.
 *
 * Sharp borders, decorative corner marks, mono typography, accent hover glow.
 * Use these for data-dense, technical-feel sections (Profile, Audit, Metrics).
 *
 * The default Card in `@/components/ui/card` is the standard rounded card
 * used on Dashboard, Accounts, Transactions, etc.
 */

/* ─── Corner Marks ─────────────────────────────────────────── */

export function CornerMarks({ size = "sm" }: { size?: "sm" | "lg" }) {
  const cornerSize = size === "lg" ? "h-3 w-3" : "h-2 w-2";

  return (
    <>
      <div
        className={`absolute -left-px -top-px z-10 border-l-2 border-t-2 border-text-muted/20 ${cornerSize}`}
      />
      <div
        className={`absolute -right-px -top-px z-10 border-r-2 border-t-2 border-text-muted/20 ${cornerSize}`}
      />
      <div
        className={`absolute -bottom-px -left-px z-10 border-b-2 border-l-2 border-text-muted/20 ${cornerSize}`}
      />
      <div
        className={`absolute -bottom-px -right-px z-10 border-b-2 border-r-2 border-text-muted/20 ${cornerSize}`}
      />
    </>
  );
}

/* ─── Profile Card ─────────────────────────────────────────── */

interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show corner bracket marks (default: true) */
  corners?: boolean;
  /** Corner mark size */
  cornerSize?: "sm" | "lg";
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, corners = true, cornerSize = "sm", children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="profile-card"
      className={cn(
        "group relative overflow-hidden border border-border bg-background transition-colors hover:border-accent/40",
        className,
      )}
      {...props}
    >
      {corners && <CornerMarks size={cornerSize} />}

      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition-colors duration-200 group-hover:bg-accent/40" />

      {/* Top glow gradient on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {children}
    </div>
  ),
);
ProfileCard.displayName = "ProfileCard";

/* ─── Profile Card Header ──────────────────────────────────── */

interface ProfileCardHeaderProps {
  kicker: string;
  title: string;
  action?: React.ReactNode;
  actionCode?: string;
  className?: string;
}

function ProfileCardHeader({
  kicker,
  title,
  action,
  actionCode,
  className,
}: ProfileCardHeaderProps) {
  return (
    <div className={cn("border-b border-border p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm tracking-[-0.2em] text-text-muted/50">
            //
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              {kicker}
            </p>
            <h3 className="font-mono text-sm font-medium uppercase tracking-wide text-text-primary">
              {title}
            </h3>
          </div>
        </div>

        {action ??
          (actionCode ? (
            <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
              {actionCode}
            </span>
          ) : null)}
      </div>
    </div>
  );
}

/* ─── Profile Card Content ─────────────────────────────────── */

const ProfileCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
ProfileCardContent.displayName = "ProfileCardContent";

/* ─── Profile Card Section Title ───────────────────────────── */

function ProfileSectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-sm tracking-[-0.2em] text-text-muted/50">
            //
          </span>
          <h2 className="font-mono text-sm font-medium uppercase tracking-wide text-text-primary">
            {title}
          </h2>
        </div>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
    </div>
  );
}

/* ─── Profile Activity Item ────────────────────────────────── */

interface ProfileActivityItemProps {
  index: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

function ProfileActivityItem({
  index,
  icon,
  title,
  description,
  time,
}: ProfileActivityItemProps) {
  return (
    <div className="group relative flex items-start gap-3 overflow-hidden p-4 transition-colors hover:bg-muted/30">
      <div className="absolute left-0 top-0 h-full w-0.5 bg-transparent transition-colors group-hover:bg-accent/40" />

      <div className="mt-1 text-text-muted transition-colors group-hover:text-accent">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary">
          <span className="font-mono font-medium">{title}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text-muted">
          {description}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-text-muted/60">
          {time}
        </p>
      </div>

      <span className="font-mono text-[10px] tabular-nums text-text-muted/40">
        [{index}]
      </span>
    </div>
  );
}

export {
  ProfileCard,
  ProfileCardHeader,
  ProfileCardContent,
  ProfileSectionTitle,
  ProfileActivityItem,
};
