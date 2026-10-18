# Adding a language

German and Spanish were made this way, from the Polish game, and French can follow. The people, places, items and errands stay the same (their ids stay Polish); only the words change. Everything a language needs ends up in one file, `src/js/01-data-<lang>.js`, which you can edit by hand afterwards like the Polish one.

The writing is done by AI agents (Claude Code subagents) following the briefs in this folder; the scripts here prepare their inputs and merge their outputs. Working files go in `translate-work/` at the repo root, which git ignores.

1. **Register the language.** Add it to `LANGS` in `src/js/00-lang.js` (name, speech voice, currency) and to `LANGS` in `tools/frequency.mjs`, then run `node tools/frequency.mjs` to add its top 3000 to `src/js/01-frequency.js`. Copy the list to `translate-work/<lang>/top3000.txt` (one form per line). Add its names for every character to `names.json`.
2. **Polish source.** `node tools/translate/pack.mjs` writes `polish-pack.json`, `polish-globals.json` and one `polish-npcs-<group>.json` per group in `groups.json`.
3. **Globals.** One agent follows `globals-prompt.txt` and writes `translate-work/<lang>/globals.json`: items with their noun phrases, labels and signs, phrases, interface words, numbers, the review lines, and the quiz and "this is" templates.
4. **Dialogue.** One agent per group follows `npc-prompt.txt` and writes `npcs-<group>.json`. Fill in its placeholders: `{LANGNAME}`, `{D}` (the `translate-work/` path), `{LANG}`, `{GROUP}`, `{IDS}`, `{RULES}` (anything particular to the language, such as German noun capitals or Spanish ¿¡), `{ACC_EX}`/`{GEN_EX}`/`{NOM_EX}` (an item's phrases as examples), `{INFORMAL}` (du, tú, tu) and `{PUNCT}`.
5. **Build and dictionary.** `node tools/translate/convert.mjs <lang>` writes `src/js/01-data-<lang>.js`. `node tools/translate/collect.mjs <lang> 450 a` lists every word with no entry yet, in chunks `words-a1.json`, `words-a2.json`, …; one agent per chunk follows `dict-prompt.txt` (fill in `{CHUNK}`, `{FORM_EXAMPLES}`, `{NOTE_EXAMPLES}`) and writes `dict-a<n>.json`. Run convert again, then collect with a new tag (`b`, `c`, …) until it finds no words.
6. **Common words.** `node tools/translate/missing.mjs <lang>` shows how much of the top 1000, 2000 and 3000 the game uses; `node tools/translate/missing.mjs <lang> 4` also splits the missing forms into `fill-m1.txt` … `fill-m4.txt`. One agent per list follows `fill-prompt.txt` and writes `more-<lang>-m<n>.json`, extra chats for the park, café, bus stop and school people. Then repeat step 5 for the new words.
7. **Check.** Run `npm run build`, `npm test` (every word has an entry, every scene label has a translation), `npm run smoke -- <lang>`, and `npm run export:unreal -- <lang>`.

After the language has landed, edit `src/js/01-data-<lang>.js` directly; running convert again would overwrite hand edits.
