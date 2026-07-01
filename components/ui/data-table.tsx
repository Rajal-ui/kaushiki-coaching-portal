import * as React from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  label: string
  isNumeric?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  className?: string
  onRowClick?: (item: T) => void
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border bg-white shadow-sm", className)}>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-body">
          <thead className="border-b border-border bg-bg text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-6 py-4 font-medium",
                    col.isNumeric ? "text-right font-mono" : "text-left"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-muted">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "h-14 transition-colors hover:bg-primary-subtle/50",
                    onRowClick ? "cursor-pointer" : ""
                  )}
                >
                  {columns.map((col) => {
                    // @ts-ignore
                    const value = row[col.key]
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-6 py-3",
                          col.isNumeric ? "text-right font-mono font-medium text-dark" : "text-left"
                        )}
                      >
                        {col.render ? col.render(value, row) : String(value ?? "")}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Reusable Status Badge Component matching design.md specifications
export interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const upperStatus = status.toUpperCase()
  
  let styles = "bg-gray-100 text-gray-700"
  
  switch (upperStatus) {
    case "NEW":
    case "SUCCEEDED":
      styles = "bg-[#E8F5E9] text-[#2E7D32]"
      break
    case "CONTACTED":
      styles = "bg-[#E3F2FD] text-[#1565C0]"
      break
    case "ENROLLED":
    case "ACTIVE":
      styles = "bg-primary-subtle text-primary"
      break
    case "CLOSED":
      styles = "bg-[#F5F5F5] text-[#757575]"
      break
    case "PENDING":
      styles = "bg-[#FFF9C4] text-[#F57F17]"
      break
    case "FAILED":
      styles = "bg-[#FFEBEE] text-[#C62828]"
      break
    case "REFUNDED":
      styles = "bg-[#F3E5F5] text-[#6A1B9A]"
      break
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        styles,
        className
      )}
    >
      {status}
    </span>
  )
}
