
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <AppSidebar />

      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;