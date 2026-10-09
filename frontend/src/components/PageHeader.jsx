import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";

function PageHeader({ title, sub }) {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();

  const getRoleDisplay = () => {
    if (user?.position) return user.position;
    if (user?.role === "Owner") return t("role.owner", "Owner");
    if (user?.role === "Team Member") return t("role.team_member", "Team Member");
    if (user?.role === "Receptionist") return t("role.receptionist", "Receptionist");
    return user?.role || "";
  };

  const currentLang = i18n.language?.startsWith("am") ? "am" : "en";

  return (
    <div className="flex justify-between items-start mb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight m-0 mb-1">
          {title}
        </h1>
        <div className="text-muted text-sm">{sub}</div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Language Switcher */}
        <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 border border-neutral-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => i18n.changeLanguage("en")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              currentLang === "en"
                ? "bg-white text-text shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage("am")}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              currentLang === "am"
                ? "bg-white text-text shadow-xs"
                : "text-muted hover:text-text"
            }`}
          >
            አማ
          </button>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-sm font-bold text-text">{user?.username}</div>
          <div className="text-xs text-muted font-medium">
            {getRoleDisplay()}
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
          title={t("common.logout", "Logout")}
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
          <span className="hidden sm:inline">{t("common.logout", "Logout")}</span>
        </button>
      </div>
    </div>
  );
}

export default PageHeader;
