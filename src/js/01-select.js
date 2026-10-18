// ===================================================================
// the chosen language's data, and what is the same in every language
// ===================================================================
const { LEX, FORMS, PHRASES, ITEMS, NPCS, NUMBERS, REVIEW_LINES, thisIs, QUIZ, UI, LABELS } = L10N[LANG]();
const FREQ = FREQ_BY_LANG[LANG] ?? [];
const FREQ_RANK = new Map(FREQ.map((w, i) => [w, i + 1]));
const CURRENCY = LANGS[LANG].currency;
// labels and painted signs are written in Polish in the scene code; this gives the chosen language's
// word ("ławka" → "Bank"), and for signs in capitals falls back to the capitalised label ("RATUSZ")
const tr = text => LABELS[text] ?? (text === text.toUpperCase() && LABELS[text.toLowerCase()] ? LABELS[text.toLowerCase()].toUpperCase() : text);
const NPC_ORDER = ["jozef", "filemon", "marek", "basia", "ola", "kuba", "zosia", "ewa", "tadeusz", "halina", "burek", "zuzia", "staszek", "bogdan", "krysia", "ania", "wieslaw", "tomek", "piotr", "teresa", "marta", "michal", "zbigniew", "kasia", "roman", "ela", "bartek", "dorota", "jerzy", "hania", "kacper"];
