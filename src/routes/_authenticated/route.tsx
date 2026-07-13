import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoSession } from "@/lib/demo-auth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VehicleProvider } from "@/lib/vehicle-context";
import { VehicleSelector } from "@/components/vehicle-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    await ensureDemoSession();
    const { data } = await supabase.auth.getUser();
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <VehicleProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
              <SidebarTrigger />
              <div className="flex-1" />
              <VehicleSelector />
              <ThemeToggle />
            </header>
            <main className="flex-1 p-4 sm:p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </VehicleProvider>
  );
}
