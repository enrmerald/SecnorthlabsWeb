import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importamos tus archivos de texto
import esTranslation from './es.json';
import enTranslation from './en.json';

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador solo
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslation },
      en: { translation: enTranslation }
    },
    fallbackLng: 'es', // Si no entiende el idioma, usa español
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;