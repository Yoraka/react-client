import { useId } from "react";
import { cn } from "@/lib/utils";

export function DotPattern({
  width = 40,
  height = 40,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}) {
  const id = useId();

  return (
    <div className={cn("absolute inset-0 z-0 overflow-hidden", className)} {...props}>
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={id}
            x="0"
            y="0"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

export default DotPattern;
