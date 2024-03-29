import i18next from 'i18next';
import { initReactI18next } from "react-i18next";
import { localePreferenceStore } from '../lib/states';

const pages = [
  'beet',
  'blockchain',
  'images',
  'setup',
];

const oldLocale = localePreferenceStore.getState().locale;
const locale = oldLocale || 'en';

i18next
  .use(initReactI18next)
  .init({
    resources: window.electron.fetchLocales(),
    lng: locale,
    defaultNS: pages,
    fallbackLng: ['en'],
    ns: pages,
  }, (err, t) => {
    if (err) {
      console.log('something went wrong loading', err);
    }
  });

export default i18next;
