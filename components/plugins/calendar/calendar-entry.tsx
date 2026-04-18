"use client";

import type { CSSProperties, MouseEvent } from "react";

import { cn } from "@/lib/utils";

import type { CalendarEventRecord } from "./types";

type CalendarEntryProps = {
  event: CalendarEventRecord;
  style: CSSProperties;
  color: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
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
  // Convert hex color to rgba for background
  const backgroundColor = `${color}20`; // 20% opacity
  const borderColor = color;

  return (
    <button
      type="button"
      className={cn(
        "absolute overflow-hidden rounded-md border text-left cursor-grab active:cursor-grabbing",
        "transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        (isDragging || isResizing) && "opacity-80 ring-2 ring-primary"
      )}
      style={{
        ...style,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderLeftWidth: '4px',
      }}
      onClick={onClick}
      onMouseDown={(mouseEvent) => {
        mouseEvent.stopPropagation();
        if (onDragStart) {
          onDragStart(mouseEvent as any);
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

      <div className="flex h-full w-full flex-col pl-2 pr-1 py-1">
        <span className="truncate text-xs font-semibold" style={{ color: color }}>
          {event.title}
        </span>
        <span className="truncate text-[10px] opacity-80" style={{ color: color }}>
          {new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </span>
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
