import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentLang = (i18n.language || "en").toLowerCase().startsWith("am")
    ? "am"
    : "en";

  const toggleLanguage = () => {
    const nextLang = currentLang === "en" ? "am" : "en";
    i18n.changeLanguage(nextLang);
  };

  // Use .env configured name, fallback to "service."
  const companyName = import.meta.env.VITE_COMPANY_NAME || "service.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-white hover:bg-neutral-50 text-neutral-800 transition-colors cursor-pointer shadow-sm"
          title="Switch language / ቋንቋ ቀይር"
        >
          {currentLang === "en" ? "አማርኛ" : "English"}
        </button>
      </div>

      <div className="card-panel p-8 w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <img
            src="/pwa-512x512.png"
            alt="Logo"
            className="w-20 h-20 object-contain mb-3"
          />
          <div className="text-2xl font-bold text-text tracking-tight mb-2 truncate w-full">
            {companyName}
          </div>
          <p className="text-muted text-sm">{t("login.sub")}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text">
              {t("login.username")}
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-text">
              {t("login.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input-field w-full pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
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
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="btn mt-2" disabled={loading}>
            {loading ? t("login.signing_in") : t("login.signin_btn")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
