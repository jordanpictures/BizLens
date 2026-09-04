import { NavLink } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Icons = {
  Overview: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9"></rect>
      <rect x="14" y="3" width="7" height="5"></rect>
      <rect x="14" y="12" width="7" height="9"></rect>
      <rect x="3" y="16" width="7" height="5"></rect>
    </svg>
  ),
  Bookings: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Payments: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
      <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
  ),
  Expenses: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  Reports: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Settings: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  ),
  Users: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Logout: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
};

function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  // Use .env configured name, fallback to "service."
  const companyName = import.meta.env.VITE_COMPANY_NAME || "service.";

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-1.5 text-[15px] rounded-lg text-muted no-underline transition-colors ${
      isActive
        ? "bg-neutral-100 text-text font-semibold"
        : "hover:bg-neutral-50 hover:text-text"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center w-full py-2.5 text-[10px] transition-colors ${
      isActive
        ? "text-neutral-900 font-semibold"
        : "text-neutral-500 hover:text-neutral-900"
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-[200px] lg:w-[220px] bg-card border-r border-line p-6 lg:p-7 shrink-0 hidden md:flex flex-col min-h-screen relative z-10">
        <div className="flex flex-col items-center mx-2.5 mb-8 text-center">
          <img
            src="/pwa-512x512.png"
            alt="Logo"
            className="w-16 h-16 object-contain mb-2"
          />
          <div className="text-xl font-bold text-text tracking-tight truncate w-full">
            {companyName}
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          <NavLink to="/" end className={linkClass}>
            <Icons.Overview /> Overview
          </NavLink>
          <NavLink to="/bookings" className={linkClass}>
            <Icons.Bookings /> Bookings
          </NavLink>
          <NavLink to="/payments" className={linkClass}>
            <Icons.Payments /> Payments
          </NavLink>
          <NavLink to="/expenses" className={linkClass}>
            <Icons.Expenses /> Expenses
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            <Icons.Reports /> Reports
          </NavLink>

          {user?.role === "Owner" && (
            <>
              <div className="mt-6 mb-1.5 px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                System
              </div>
              <NavLink to="/users" className={linkClass}>
                <Icons.Users /> Users
              </NavLink>
              <NavLink to="/settings" className={linkClass}>
                <Icons.Settings /> Settings
              </NavLink>
            </>
          )}
        </nav>

        <div className="mt-auto hidden"></div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around items-center pb-2 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <NavLink to="/" end className={mobileLinkClass}>
          <Icons.Overview />
          <span className="mt-1">Home</span>
        </NavLink>
        <NavLink to="/bookings" className={mobileLinkClass}>
          <Icons.Bookings />
          <span className="mt-1">Bookings</span>
        </NavLink>
        <NavLink to="/payments" className={mobileLinkClass}>
          <Icons.Payments />
          <span className="mt-1">Payments</span>
        </NavLink>
        <NavLink to="/expenses" className={mobileLinkClass}>
          <Icons.Expenses />
          <span className="mt-1">Expenses</span>
        </NavLink>
        <NavLink to="/reports" className={mobileLinkClass}>
          <Icons.Reports />
          <span className="mt-1">Reports</span>
        </NavLink>
        {user?.role === "Owner" && (
          <>
            <NavLink to="/users" className={mobileLinkClass}>
              <Icons.Users />
              <span className="mt-1">Users</span>
            </NavLink>
            <NavLink to="/settings" className={mobileLinkClass}>
              <Icons.Settings />
              <span className="mt-1">Settings</span>
            </NavLink>
          </>
        )}
      </div>
    </>
  );
}

export default Sidebar;
