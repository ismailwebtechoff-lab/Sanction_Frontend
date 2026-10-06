

import {
  ShieldCheck,
  Plus,
  FileText,
  Activity,
  LayoutDashboard,
  Users,
  LogOut,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const { userContext } = useData();

  const role = user?.role;

  const isDashboard = location.pathname === "/";

  const isSanctions =
    location.pathname === "/sanctions" ||
    location.pathname.startsWith("/sanction/");

  const isActivity = location.pathname === "/activity";

  const isUsers = location.pathname === "/users";

  const userName =
    userContext?.name ||
    user?.name ||
    "User";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">

      {/* Desktop Header */}
      <div className="max-w-[1380px] w-full mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">

        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6 min-w-0">

          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">
                SanctionDMS
              </span>

              <span className="text-[11px] text-slate-500 font-medium">
                Document Management
              </span>
            </div>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">

            {/* Dashboard */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                isDashboard
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Sanctions */}
            <button
              type="button"
              onClick={() => navigate("/sanctions")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                isSanctions
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Sanctions</span>
            </button>

            {/* Activity */}
            <button
              type="button"
              onClick={() => navigate("/activity")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                isActivity
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Activity History</span>
            </button>

            {/* Users */}
            {(role === "Admin" || role === "Owner") && (
              <button
                type="button"
                onClick={() => navigate("/users")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  isUsers
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />

                <span>
                  {role === "Admin"
                    ? "User Management"
                    : "Employees"}
                </span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* Add Sanction */}
          <button
            type="button"
            onClick={() => navigate("/sanctions?add=true")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ADD SANCTION</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {userName}
              </p>

              <p className="text-[10px] font-mono font-semibold text-blue-700 mt-0.5">
                {role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 bg-slate-50 py-1.5 px-2">

        <button
          type="button"
          onClick={() => navigate("/")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold ${
            isDashboard
              ? "bg-blue-100 text-blue-800"
              : "text-slate-600"
          }`}
        >
          Dashboard
        </button>

        <button
          type="button"
          onClick={() => navigate("/sanctions")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold ${
            isSanctions
              ? "bg-blue-100 text-blue-800"
              : "text-slate-600"
          }`}
        >
          Sanctions
        </button>

        <button
          type="button"
          onClick={() => navigate("/activity")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold ${
            isActivity
              ? "bg-blue-100 text-blue-800"
              : "text-slate-600"
          }`}
        >
          History
        </button>

        {(role === "Admin" || role === "Owner") && (
          <button
            type="button"
            onClick={() => navigate("/users")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold ${
              isUsers
                ? "bg-blue-100 text-blue-800"
                : "text-slate-600"
            }`}
          >
            Users
          </button>
        )}
      </div>
    </header>
  );
}

export default AppSidebar;