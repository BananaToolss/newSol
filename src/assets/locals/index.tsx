import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 引入翻译文件
import translations from './translations.json';

// 配置i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      EN: { translation: Object.fromEntries(Object.entries(translations).map(([key, value]) => [key, key])) },
      ZH: { translation: translations }
    },
    lng: 'ZH', // 默认语言为英文
    fallbackLng: 'EN',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;