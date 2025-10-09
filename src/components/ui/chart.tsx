"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  TooltipProps as RechartsTooltipProps,
  Legend as RechartsLegend,
  LegendPayload,
} from "recharts";
import {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Chart Types */
/* -------------------------------------------------------------------------- */

const THEMES = { light: "", dark: ".dark" } as const;
type Theme = keyof typeof THEMES;

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<Theme, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

/* -------------------------------------------------------------------------- */
/* Chart Context */
/* -------------------------------------------------------------------------- */

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context)
    throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

/* -------------------------------------------------------------------------- */
/* ChartContainer */
/* -------------------------------------------------------------------------- */

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactElement;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

/* -------------------------------------------------------------------------- */
/* ChartStyle for Themes */
/* -------------------------------------------------------------------------- */

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.color || cfg.theme
  );
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `\
${prefix} [data-chart=${id}] {\
${colorConfig
  .map(([key, cfg]) => {
    const color = cfg.theme?.[theme as Theme] || cfg.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}\
}`
          )
          .join("\n"),
      }}
    />
  );
};

/* -------------------------------------------------------------------------- */
/* TooltipPayload 型修正 */
/* -------------------------------------------------------------------------- */

export type TooltipPayloadItem = {
  name?: NameType;
  value?: ValueType;
  color?: string;
  dataKey?: string;
};

/* -------------------------------------------------------------------------- */
/* ChartTooltip & ChartTooltipContent */
/* -------------------------------------------------------------------------- */

const ChartTooltip = RechartsTooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: NameType;
  className?: string;
  indicator?: "line" | "dot" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload = [],
      label,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
    },
    ref
  ) => {
    const { config } = useChart();

    if (!active || payload.length === 0) return null;

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel && !hideLabel && label && (
          <div className="font-medium">{label}</div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = config[key];
            const indicatorColor = item.color;

            return (
              <div
                key={index}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {!hideIndicator && (
                  <div
                    className={cn("shrink-0", {
                      "size-2.5 rounded-[2px]": indicator === "dot",
                      "my-0.5 w-1": indicator === "line",
                      "my-0.5 w-0 border-[1.5px] border-dashed bg-transparent":
                        indicator === "dashed",
                    })}
                    style={{
                      backgroundColor: indicatorColor as string,
                      borderColor: indicatorColor as string,
                    }}
                  />
                )}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    nestLabel ? "items-end" : "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    {nestLabel && !hideLabel && label && (
                      <div className="font-medium">{label}</div>
                    )}
                    <span className="text-muted-foreground">
                      {itemConfig?.label ?? item.name}
                    </span>
                  </div>
                  {item.value != null && (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {typeof item.value === "number"
                        ? item.value.toLocaleString()
                        : item.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

/* -------------------------------------------------------------------------- */
/* ChartLegend & LegendContent */
/* -------------------------------------------------------------------------- */

const ChartLegend = RechartsLegend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: LegendPayload[];
    hideIcon?: boolean;
  }
>(({ className, hideIcon, payload = [] }, ref) => {
  const { config } = useChart();
  if (!payload.length) return null;

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
    >
      {payload.map((item, index) => {
        const key = `${item.dataKey}`;
        const itemConfig = config[key];

        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-muted-foreground"
            )}
          >
            {!hideIcon && item.color && (
              <div
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
            )}
            {itemConfig?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

/* -------------------------------------------------------------------------- */
/* Exports */
/* -------------------------------------------------------------------------- */

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
