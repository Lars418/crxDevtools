const i18n = document.querySelectorAll('[data-intl]');
const i18nTitle = document.querySelectorAll('[data-intl-title]');
const i18nPlaceholder = document.querySelectorAll('[data-intl-placeholder]')

i18n.forEach(msg => msg.innerHTML = chrome.i18n.getMessage(msg.dataset.intl || msg.id));
i18nTitle.forEach(msg => msg.title = chrome.i18n.getMessage(msg.getAttribute('data-intl-title')));
i18nPlaceholder.forEach(msg => msg.placeholder = chrome.i18n.getMessage(msg.getAttribute('data-intl-placeholder')));
chrome.i18n.getAcceptLanguages(languages => document.documentElement.lang = languages[0]);