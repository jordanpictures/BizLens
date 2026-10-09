import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import am from "./locales/am.json";

const savedLang = localStorage.getItem("bizlens_lang") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = savedLang;

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("bizlens_lang", lng);
  document.documentElement.lang = lng;
});

export default i18n;
