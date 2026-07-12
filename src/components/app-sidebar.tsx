import { Link, useRouterState } from "@tanstack/react-router";
import { Car, Gauge, Wrench, Brain, AlertTriangle, ScanLine, MessagesSquare, BellRing } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "My Vehicles", url: "/vehicles", icon: Car },
  { title: "Service History", url: "/service-history", icon: Wrench },
  { title: "AI Predictions", url: "/predictions", icon: Brain },
  { title: "Part Failure", url: "/part-failure", icon: AlertTriangle },
  { title: "OBD Diagnostic", url: "/obd", icon: ScanLine },
  { title: "Complaints", url: "/complaints", icon: MessagesSquare },
  { title: "Reminders", url: "/reminders", icon: BellRing },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-hero text-primary-foreground">
            <Car className="h-4 w-4" />
          </div>
          {!collapsed && <span className="font-display text-base font-bold">AutoMind</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Garage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
