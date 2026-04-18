"use client";

import type { CSSProperties, MouseEvent } from "react";

import { cn } from "@/lib/utils";

import type { CalendarEventRecord } from "./types";

type CalendarEntryProps = {
  event: CalendarEventRecord;
  style: CSSProperties;
  color: string;
  onClick: () => void;
  onDragStart?: (event: MouseEvent<HTMLElement>) => void;
  onResizeStart?: (
    event: MouseEvent<HTMLElement>,
    edge: "top" | "bottom"
  ) => void;
  isDragging?: boolean;
  isResizing?: boolean;
};

export function CalendarEntry({
  event,
  style,
  color,
  onClick,
  onDragStart,
  onResizeStart,
  isDragging = false,
  isResizing = false,
}: CalendarEntryProps) {
  return (
    <button
      type="button"
      className={cn(
        "absolute overflow-hidden rounded-sm border bg-background/90 text-left",
        "transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        (isDragging || isResizing) && "opacity-80 ring-2 ring-primary"
      )}
      style={style}
      onClick={onClick}
      onMouseDown={(mouseEvent) => {
        if (onDragStart) {
          onDragStart(mouseEvent);
        }
      }}
    >
      {onResizeStart ? (
        <span
          className="absolute left-0 right-0 top-0 h-1.5 cursor-n-resize"
          onMouseDown={(mouseEvent) => {
            mouseEvent.stopPropagation();
            onResizeStart(mouseEvent, "top");
          }}
        />
      ) : null}

      <div className="flex h-full items-center gap-2 px-2 py-1">
        <span
          className="h-full w-1 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-xs font-medium">{event.title}</span>
      </div>

      {onResizeStart ? (
        <span
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-s-resize"
          onMouseDown={(mouseEvent) => {
            mouseEvent.stopPropagation();
            onResizeStart(mouseEvent, "bottom");
          }}
        />
      ) : null}
    </button>
  );
}
