import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import hi from "./locales/hi";
import bn from "./locales/bn";
import ta from "./locales/ta";
import mr from "./locales/mr";
import te from "./locales/te";
import gu from "./locales/gu";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    bn: { translation: bn },
    ta: { translation: ta },
    mr: { translation: mr },
    te: { translation: te },
    gu: { translation: gu },
  },
  lng: localStorage.getItem("language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
