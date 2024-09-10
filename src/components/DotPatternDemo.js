"use client";

import { cn } from "@/lib/utils";
import DotPattern from "@/components/magicui/dot-pattern";

export function DotPatternDemo() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <p className="absolute z-10 text-center text-5xl font-medium tracking-tighter text-black">
        Dot Pattern
      </p>
      <DotPattern
        width={20}
        height={20}
        cx={10}
        cy={10}
        cr={1.5}
        className={cn(
          "absolute inset-0",
          "[mask-image:radial-gradient(100%_100%_at_center,white,transparent)]",
        )}
      />
    </div>
  );
}
