import { Outlet } from "react-router-dom";

import { AppHeader } from "@/shared/components/navigation/app-header";
import { AppSidebar } from "@/shared/components/navigation/app-sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1680px] gap-6 px-4 py-4 lg:grid-cols-[290px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <div className="hidden lg:block">
          <AppSidebar />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <AppHeader />
          <div className="lg:hidden">
            <AppSidebar />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
