# Rynek Słówek data for Unreal Engine

`Data/` holds the game's content as Data Table files, made by `npm run export:unreal` from the web version (`src/`). Re-run it after changing the game, so Unreal gets the latest words and lines.

| File | Row name | What's in it | Struct |
| --- | --- | --- | --- |
| `WordForms.csv` | lower-case written form | every word on screen, with its meaning, what form it is, and its frequency rank; this is the table the colours (new, learning, known) hang on | `FRynekWordForm` |
| `Words.csv` | lemma | the dictionary | `FRynekWord` |
| `Forms.csv` | form | inflected form → lemma, with a short grammar note | `FRynekForm` |
| `Phrases.csv` | `phrase_N` | multi-word expressions for the word card | `FRynekPhrase` |
| `Frequency.csv` | rank | the top 3000 forms, and whether the game uses each | `FRynekFrequency` |
| `Characters.csv` | character id | name, role, position and facing, looks (colours, hair, hat, props), errand | `FRynekCharacter` |
| `Dialogue.csv` | `id_section_conv_line` | every fixed line, Polish and English, in order | `FRynekDialogueLine` |
| `Orders.csv` | `id_ask_N`, `id_ok_N` | shop order templates and the items they draw from | `FRynekOrderLine` |
| `Items.csv` | item id | things to pick up: their forms, English, and where they lie | `FRynekItem` |
| `Labels.csv` | `label_N` | floating word labels and where they sit | `FRynekLabel` |

`rynek-data.json` has all of the tables in one file, for scripts.

## Units

Positions are already in Unreal units: centimetres, Z up. The web game's metres with Y up were converted as X = x × 100, Y = z × 100, Z = y × 100. Yaw is in degrees around Z. Colours are `#RRGGBB` strings.

## Importing

**With C++ (recommended).** Copy `RynekDataTypes.h` into `Source/<YourProject>/`, and add `"Engine"` to the module's dependencies if it isn't there. Build, then in the editor drag a CSV from `Data/` into the Content Browser. In the import dialog choose **Data Table** and the matching row struct from the table above, then press **Apply**.

**Blueprint only.** Make a Blueprint Structure for each table with the same field names and types: `FString` → String, `int32` → Integer, `float` → Float, `bool` → Boolean. Then import the CSV the same way, choosing your structure. The field names must match the CSV column names exactly.

All files are UTF-8 with a byte-order mark, so Polish letters (ą, ę, ł, ż…) come through. Row names keep them too.

## Using the tables

- Word status belongs to each written form, not the lemma, as in the web game: key the player's progress by the `WordForms` row name, which is the lower-cased word.
- To show a line, split `Dialogue.Polish` into words, lower-case each one, and look it up in `WordForms` to colour it and to fill the word card. Use `Phrases` to show a phrase when the word is part of one.
- Shop orders: pick an item from `ItemPool`, then replace `{acc}`, `{gen}`, `{nom}` and `{why}` in an `ask` line with that item's `Accusative`, `Genitive`, `Nominative` and `WhyPolish`.
- Zuzia's sums are made in code in the web game (`quizQuestion` in `src/js/02-words.js`): "Ile to jest {a} plus {b}?" with the number words `zero` to `dziesięć`, all of which are in `WordForms`.

The frequency ranks come from [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave (OpenSubtitles 2018), licensed CC BY-SA 4.0. Keep that credit if you ship them.
