"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface SidebarContextValue {
  isCollapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export const SidebarProvider = ({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
}) => {
  const [isCollapsed, setCollapsed] = React.useState(defaultCollapsed)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed, setCollapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col h-screen bg-dash-sidebar text-dash-sidebarText transition-all duration-250 ease-in-out border-r border-border/10",
        isCollapsed ? "w-16" : "w-60",
        className
      )}
      {...props}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setCollapsed(!isCollapsed)}
        className="absolute top-4 -right-3 h-6 w-6 rounded-full bg-primary border border-border/20 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform z-10"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {children}
    </div>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("flex h-16 items-center px-4 border-b border-border/10 shrink-0", className)}
      {...props}
    />
  )
}

export const SidebarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4", className)}
      {...props}
    />
  )
}

export const SidebarGroup = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("px-3 space-y-1", className)} {...props} />
}

export const SidebarGroupLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { isCollapsed } = useSidebar()
  if (isCollapsed) return null
  return (
    <div
      className={cn(
        "px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
}

export interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  icon?: React.ReactNode
}

export const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ className, active, icon, children, ...props }, ref) => {
    const { isCollapsed } = useSidebar()

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-sans transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-50",
          active
            ? "bg-primary text-white font-medium"
            : "hover:bg-white/5 text-dash-sidebarText hover:text-white",
          isCollapsed ? "justify-center" : "justify-start",
          className
        )}
        {...props}
      >
        {icon && <span className={cn("shrink-0", active ? "text-white" : "text-dash-sidebarText")}>{icon}</span>}
        {!isCollapsed && <span>{children}</span>}
      </button>
    )
  }
)
SidebarItem.displayName = "SidebarItem"

export const SidebarFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("p-4 border-t border-border/10 shrink-0", className)}
      {...props}
    />
  )
}
