import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function PageHeader({ title, sub }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight m-0 mb-1">
          {title}
        </h1>
        <div className="text-muted text-sm">{sub}</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-text">{user?.username}</div>
          <div className="text-xs text-muted font-medium">{user?.role}</div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
          title="Logout"
        >
          <svg
            width="16"
            height="16"
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
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default PageHeader;
