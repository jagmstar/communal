"use client";

/**
 * Reusable skeleton/shimmer loading component.
 *
 * Used for AC-13.6: "While API data is loading, the system shall display a
 * shimmer/skeleton loading state matching the layout of the loaded content."
 *
 * @param type - The layout type to show: "card" | "list" | "detail"
 */

interface LoadingStateProps {
  type?: "card" | "list" | "detail";
  message?: string;
}

export function LoadingState({ type = "list", message }: LoadingStateProps) {
  if (message) {
    return (
      <div className="px-4 pt-12 space-y-4">
        <p className="text-muted-foreground text-sm">{message}</p>
        <div className="space-y-2">
          <div className="h-[48px] rounded-2xl shimmer" />
          <div className="h-[48px] rounded-2xl shimmer" />
          <div className="h-[48px] rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="px-4 pt-12 space-y-6">
        {/* Hero shimmer */}
        <div className="h-[120px] rounded-3xl shimmer" />
        {/* Alert shimmers */}
        <div className="space-y-2">
          <div className="h-[56px] rounded-2xl shimmer" />
          <div className="h-[56px] rounded-2xl shimmer" />
        </div>
        {/* Insight shimmers */}
        <div className="space-y-2">
          <div className="h-[64px] rounded-2xl shimmer" />
          <div className="h-[64px] rounded-2xl shimmer" />
          <div className="h-[64px] rounded-2xl shimmer" />
        </div>
        {/* Meter card shimmers */}
        <div className="space-y-3">
          <div className="h-[120px] rounded-2xl shimmer" />
          <div className="h-[120px] rounded-2xl shimmer" />
          <div className="h-[120px] rounded-2xl shimmer" />
          <div className="h-[120px] rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className="px-4 pt-12 space-y-6">
        {/* Header shimmer */}
        <div className="h-[32px] w-[60%] rounded-lg shimmer" />
        <div className="h-[20px] w-[80%] rounded shimmer" />
        {/* Card shimmer */}
        <div className="h-[200px] rounded-2xl shimmer" />
        {/* List shimmers */}
        <div className="space-y-2">
          <div className="h-[48px] rounded-2xl shimmer" />
          <div className="h-[48px] rounded-2xl shimmer" />
          <div className="h-[48px] rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  // Default: list type
  return (
    <div className="px-4 pt-12 space-y-4">
      {/* Title shimmer */}
      <div className="h-[32px] w-[40%] rounded-lg shimmer" />
      {/* Pill shimmers */}
      <div className="flex gap-2">
        <div className="h-[36px] w-[80px] rounded-full shimmer" />
        <div className="h-[36px] w-[80px] rounded-full shimmer" />
        <div className="h-[36px] w-[80px] rounded-full shimmer" />
        <div className="h-[36px] w-[80px] rounded-full shimmer" />
      </div>
      {/* Chart shimmer */}
      <div className="h-[200px] rounded-2xl shimmer" />
      {/* List shimmers */}
      <div className="space-y-2">
        <div className="h-[48px] rounded-2xl shimmer" />
        <div className="h-[48px] rounded-2xl shimmer" />
        <div className="h-[48px] rounded-2xl shimmer" />
      </div>
    </div>
  );
}
