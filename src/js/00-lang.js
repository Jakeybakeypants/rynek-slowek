// ===================================================================
// the language being learned
// ===================================================================
// Each language has its own data file, 01-data-<code>.js, which adds a function to L10N that
// builds everything said or shown in that language: the dictionary, the lines, the item forms,
// the labels and signs. The town, the people and their errands are the same in every language.
// The choice comes from #lang=<code> in the address, then the last choice saved in this
// browser, then Polish. Tests set globalThis.RYNEK_LANG.
const LANGS = {
  pl: { name: "Polish", native: "Polski", speech: "pl-PL", currency: "zł", money: "złoty" },
  de: { name: "German", native: "Deutsch", speech: "de-DE", currency: "€", money: "euros" },
  es: { name: "Spanish", native: "Español", speech: "es-ES", currency: "€", money: "euros" },
  // French splits elisions off the way its frequency list does (c'est → c' + est) and keeps hyphenated words whole (peut-être)
  fr: { name: "French", native: "Français", speech: "fr-FR", currency: "€", money: "euros", words: /aujourd'hui|\p{L}+(?:-\p{L}+)*(?:'(?=\p{L}))?/gu },
};
const L10N = {};
const LANG_KEY = "rynek-slowek:lang";
const LANG = (() => {
  const fromHash = typeof location !== "undefined" ? (location.hash.match(/lang=([a-z]+)/) || [])[1] : null;
  let saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch {}
  return [globalThis.RYNEK_LANG, fromHash, saved].find(c => c && LANGS[c]) || "pl";
})();
