# Rynek Słówek

A 3D Polish market square where you learn words by talking to people and running their errands. Every Polish word in the game, in speech or on a label over a thing, is coloured by how well you know it, the way Language Reactor does it:

| Colour | Meaning |
| --- | --- |
| Purple | New: you haven't met it, or haven't sorted it yet. Every word starts here. |
| Orange | You're learning it. |
| Green | You know it. |

Each written form is its own word, the way a child learns them: `mam` and `masz` are sorted separately, and so are `gruszka`, `gruszkę` and `gruszki`. Click any word to see what it means, which dictionary form it comes from (`gruszkę → gruszka`, object form), any phrase it belongs to (`dzień dobry`), and to sort it with 1, 2 or 3. The colour changes everywhere at once.

**Play it:** <https://claude.ai/artifact/RhDfB4eqWVcRcvQUpjFbkv> (private to the owner unless shared), or open `dist/index.html` from this repo.

## What's on the square

Fifteen characters, each with an errand told in Polish:

| Who | Where | Errand | Then |
| --- | --- | --- | --- |
| Józef | bench by the fountain | find his glasses (`okulary`) | offers to review your orange words |
| Filemon, a cat | town hall steps | bring milk (`mleko`) | sleeps |
| Marek | fruit stall | bring an apple (`jabłko`) | fruit and vegetable orders |
| Basia | bakery | take bread (`chleb`) to Ola | bakery orders |
| Ola | café | (receives Basia's bread) | drink orders |
| Kuba | sandpit | find his ball (`piłka`) behind the town hall | toy orders |
| Zosia | flower shop | find her keys (`klucze`) under a bench | flower orders |
| Ewa, a painter | easel near the café | find her brush (`pędzel`) by the town hall | paint orders, which teach colours |
| Tadeusz, the postman | post office | take a letter (`list`) to Józef | post office orders |
| Halina, the bookseller | bookshop | find her bag of books (`torba`) by the sandpit | bookshop orders |
| Burek, a dog | trees by the flower shop | find his bone (`kość`) under a tree | wags his tail |
| Zuzia | hopscotch near the flower shop | find her skipping rope (`skakanka`) by the fountain | sets sums: tap the number word that answers `Ile to jest dwa plus trzy?` |
| Staszek | town hall, with an accordion | find his sheet music (`nuty`) by a tree | plays you a tune |
| Bogdan | clothes stall | (none: he needs help straight away) | clothes orders, each with a reason: `Pada deszcz. Poproszę parasolkę.` |
| Babcia Krysia | bench by the fountain, feeding pigeons | bring a roll (`bułka`) from the bakery | talks about her family: `Józef to mój brat.` |

Repeat orders come in several phrasings that need different cases: `Poproszę gruszkę` (accusative), `Szukam gruszki` (genitive), `Gdzie jest miś?` (nominative). Ewa's paint orders put an adjective in front, so the colour changes too: `Poproszę czerwoną farbę`, `Potrzebuję niebieskiej farby`. Bring the wrong thing and they tell you what it actually is: `Nie, to nie to. To jest cytryna.` Orders favour words you haven't marked green yet.

You carry things in a bag that holds six. Errands, sums, meeting people, meeting new words and sorting them earn XP, shown as `Poziom` (level) at the top of the task panel. Other things: about 270 words, numbers from one to ten, a word list (V) with a review mode, the lines read aloud when the device has a Polish voice, a challenge setting that hides labels of green words, a dusk scene with lit street lamps in dark mode, and touch controls on phones.

## Controls

| Keys | Does |
| --- | --- |
| WASD or arrows | walk (Shift runs) |
| Drag, wheel | look around, zoom |
| E or Space | talk, pick up, next line |
| 1 · 2 · 3 | sort the open word: new, learning, known |
| T · R | show English for the line · hear it again |
| V · I | word list · your bag (`torba`) |
| G | put back the last thing you picked up |
| Esc | leave a conversation, or close whatever is open (there's also a Leave button) |

On a phone: the left joystick walks, drag to look, the round button talks.

## Saving

Progress (word colours, errands, coins, settings) is always saved in the browser. When the page runs as a claude.ai artifact it is also saved to the viewer's own Claude account, in the artifact's private per-person storage (`data/users/<id>/progress`), so it follows you between devices. Nobody else, including the artifact's owner, can read another person's progress.

## Working on it

Plain HTML, CSS and JavaScript with no framework. three.js 0.160.0 is loaded from jsDelivr at run time.

```
src/head.html     <title>, fonts, all the CSS (colour tokens at the top, light and dark)
src/body.html     the HUD, dialogue box, word card, word list, review, settings, intro
src/js/           one module script, split into files that share a single scope:
  01-data.js        the dictionary (LEX), word forms (FORMS), phrases, items, people and their lines
  02-words.js       small DOM helpers, tokenizing, lookups, the lexicon check
  03-state.js       state, saving, speech and sound effects
  04-ui.js          word card, dialogue, errand logic, tasks, word list, review, settings, intro
  05-world.js       renderer, sky, textures, houses, town hall, church, fountain
  06-props.js       stall, shops, benches, trees, lamps, people, items, pigeons
  07-loop.js        player, camera, labels, minimap, input, the game loop, start-up
blender/people.py builds the people in Blender: writes assets/people.glb (used by the game) and assets/people.blend
build.mjs         joins src/ into dist/index.html (a full page) and dist/artifact.html (for claude.ai)
test/             lexicon and build checks (npm test), browser smoke test (npm run smoke)
```

```sh
npm run build       # rebuild dist/ after any change in src/ (dist/ is committed)
npm test            # dist/ is up to date, every word has an entry, data is consistent
npm install         # once, for the smoke test (playwright-core, three)
npm run smoke       # plays the game in headless Chromium; add "-- phone" for phone size, dark mode
```

### The people (Blender)

Everyone on the square is one model, `assets/people.glb`, built by `blender/people.py`. It holds every hairstyle, hat and prop; each character in `LOOKS` (`06-props.js`) picks which pieces to wear and their colours. The build embeds the model in the page, so the game is still one file. If the model ever fails to load, the game falls back to drawing simple people itself.

```sh
pip install bpy     # once: Blender as a Python module (or run the script inside Blender)
npm run models      # rebuild assets/people.glb and assets/people.blend, then npm run build
```

To shape people by hand, open `assets/people.blend` in Blender, edit, and export with File > Export > glTF 2.0 (.glb) over `assets/people.glb`. Keep the object and material names: the game looks them up. After hand edits, stop running `npm run models`, since it rebuilds both files from scratch. The walking, waving and talking are animated in `07-loop.js` by turning the named joints (`arm_l`, `forearm_l`, `leg_l`, `shin_l`, `head`, `torso`).

To run it locally, serve the folder (`python3 -m http.server -d dist`) and open the address it prints, or open `dist/index.html` directly.

### Adding words, people or errands

Everything Polish lives in `src/js/01-data.js`:

- `LEX` maps a lemma to its English, part of speech and an optional note.
- `FORMS` maps an inflected form to its lemma and a short description of the form. Item forms (accusative and genitive) are filled in automatically from `ITEMS`.
- `PHRASES` are multi-word expressions shown on the word card.
- `ITEMS` are things you can pick up. Each needs its accusative, genitive and English, plus a model in `itemModel()` and a home position in `HOMES` (`06-props.js`). An item named by a phrase (the paint: `nom: "czerwona farba"`, `acc: "czerwoną farbę"`) lists every word of every form in `FORMS` by hand.
- `NPCS` holds each person's lines as `[Polish, English]` pairs. Order templates fill in `{acc}`, `{gen}`, `{nom}` and `{why}` (an item's reason, as Bogdan's clothes have) from the item, and `{en}`, `{the}`, `{whyEn}` in English. A person with `quiz` sets sums from `quizQuestion()` in `02-words.js`; one with `music` plays a tune.

`npm test` fails if any word on screen has no dictionary entry. Avoid masculine inanimate items such as `tulipan`, where everyday Polish often uses a different object form than the textbook one.
