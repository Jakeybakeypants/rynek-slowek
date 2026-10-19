# Rynek Słówek in Unreal Engine

This folder takes the web game into Unreal Engine 5, so the graphics can be rebuilt there while the words, people and lines stay exactly as they are in the web version.

| Path | What it is |
| --- | --- |
| `Scene/rynek-town.glb` | The whole town as one 3D file: ground, houses, church, town hall, market stalls, café terrace, park and pond, bus stop and road, school. Import it as the starting layout, then swap pieces for real art. |
| `Scene/rynek-props.glb` | The bus and every item you can pick up (glasses, milk, the letter...), one node each, named by item id. |
| `Plugins/RynekSlowek/` | A drop-in plugin. Put a **Rynek Town** actor in the level and press Play: everyone stands where they do in the web game, items lie where they wait to be found, every word label floats over its thing in its colour, and you can walk up to people and talk. |
| `Plugins/RynekSlowek/Data/<language>/` | The data the plugin reads, for `pl`, `de`, `es` and `fr`: `rynek-data.json` plus the same tables as CSV files. |

The people themselves are in `../assets/people.glb` (the Blender model the web game uses).

## Getting it running

You need Unreal Engine 5 (5.4 or newer) from the Epic Games Launcher, and Xcode on a Mac or Visual Studio on Windows, because the plugin is C++ and Unreal builds it the first time.

1. **Make the project.** In the Unreal Project Browser choose **Games → Third Person**, set it to **C++** (not Blueprint), name it `Rynek`, and create it. Close Unreal once it opens. A C++ project is what lets Unreal build the plugin; the Third Person template gives you a character to walk with and the mannequin the plugin uses as a stand-in for people.
2. **Add the plugin.** Copy `Plugins/RynekSlowek` from this folder into the project, so you have `Rynek/Plugins/RynekSlowek/RynekSlowek.uplugin`. Open `Rynek.uproject` again. When it says modules are missing or out of date and asks to rebuild, press **Yes**. The first build takes a few minutes.
3. **Make a level.** **File → New Level → Basic**, then save it (for example `Content/Maps/Rynek`).
4. **Bring in the town.** **File → Import Into Level**, choose `Scene/rynek-town.glb`, and accept the defaults. The town appears around the middle of the level, with the fountain at the centre.
5. **Add the game.** Open **Place Actors** (the + button in the toolbar), search for **Rynek Town**, and drag it anywhere into the level. Where you drop it doesn't matter; it places everything from the data.
6. **Press Play.** You start in front of the fountain. Walk up to someone and press **E**.

| Key | Does |
| --- | --- |
| WASD, mouse | walk and look (the Third Person template's controls) |
| E | talk; next line |
| Tab | pick the next word in the line (its meaning shows under the line) |
| 1 · 2 · 3 | sort that word: new (purple), learning (orange), known (green); labels change colour too |
| Q | leave the conversation |
| L | switch language: Polish, German, Spanish, French |

Progress is saved per language in Unreal's save slots (`Rynek_pl`, `Rynek_de`...), keyed by each written form, as in the web game.

**If people stand inside walls or on roofs**, the town was turned differently on import than expected. Rynek Town checks this on Play: it tries each way round and keeps the one where most people are on the ground, which works when the imported town has collision. If it can't tell, select Rynek Town in the level and set **Town Turn** (try -90, 0, 90, 180) and **Mirror**, with **Auto Align** off. The Output Log (filter for `Rynek`) says what it chose.

**If the plugin doesn't build**, open the project's `.xcworkspace` (Mac) or `.sln` (Windows) to see the error, or copy the error from the Output Log, and send it over.

## Changing the graphics

Everything the plugin spawns is a stand-in, so it can be replaced piece by piece without touching the words:

- **The town.** The imported town is ordinary static meshes in the level. Replace houses, stalls and trees with your own models (Fab, Quixel Megascans, or anything you model), or build over it and delete the blockout. Keep the fountain at the centre and the streets where they are, because people, items and labels are placed by position.
- **People.** Rynek Town's **Person Mesh** and **Idle Animation** pick the model everyone uses (the Third Person mannequin by default; cats and the dog are small cylinders). The next step is giving each character their own look: `Characters` in the data has shirt, trousers, hair, hats and props for each person, and `assets/people.glb` has the web game's pieces.
- **Items.** Items are small gold cubes for now. `Scene/rynek-props.glb` has each item's web model, named by id, to import and swap in.
- **Labels and the dialogue box.** These are drawn by the plugin (`RynekWidgets.cpp`) in the web game's colours: purple, orange and green only ever mean word status.

## Units

Positions are in Unreal units: centimetres, Z up. The web game's metres with Y up become X = x × 100, Y = z × 100, Z = y × 100. Yaw is in degrees around Z. Colours are `#RRGGBB` strings.

## The data

`npm run export:unreal` (in the repo root) writes `Plugins/RynekSlowek/Data/` from the web game, and `npm run export:scene` writes `Scene/`. Re-run them after changing the game. The plugin reads `rynek-data.json`; the CSV files are the same tables for anyone who wants them as Data Table assets (drag one into the Content Browser, choose **Data Table**, and the matching row struct from `RynekDataTypes.h`).

| Table | Row name | What's in it | Struct |
| --- | --- | --- | --- |
| `WordForms` | lower-case written form | every word on screen, with its meaning, what form it is, and its frequency rank; the colours hang on this | `FRynekWordForm` |
| `Words` | lemma | the dictionary | `FRynekWord` |
| `Forms` | form | inflected form → lemma, with a short grammar note | `FRynekForm` |
| `Phrases` | `phrase_N` | multi-word expressions for the word card | `FRynekPhrase` |
| `Frequency` | rank | the top 3000 forms, and whether the game uses each | `FRynekFrequency` |
| `Characters` | character id | name, role, position and facing, looks, errand | `FRynekCharacter` |
| `Dialogue` | `id_section_conv_line` | every fixed line, in the language and in English, in order | `FRynekDialogueLine` |
| `Orders` | `id_ask_N`, `id_ok_N` | shop order templates and the items they draw from | `FRynekOrderLine` |
| `Items` | item id | things to pick up: their forms, English, and where they lie | `FRynekItem` |
| `Labels` | `label_N` | floating word labels and where they sit | `FRynekLabel` |

The characters, items, positions and looks are the same in every language, and the row names (character and item ids) stay Polish in all of them. Only names, lines, words and label text change.

- Word status belongs to each written form, not the lemma, as in the web game: key progress by the `WordForms` row name, the lower-cased word.
- Lines split into words the way the web game splits them: runs of letters, except in French, where an elided word keeps its apostrophe and stands alone (`c'est` is `c'` + `est`), hyphenated words stay whole (`peut-être`), and `aujourd'hui` is one word. `URynekWords::Tokenize` does this.
- Shop orders: pick an item from `ItemPool`, then replace `{acc}`, `{gen}`, `{nom}` and `{why}` in an `ask` line with that item's `Accusative`, `Genitive`, `Nominative` and `WhyText`.

The frequency ranks come from [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave (OpenSubtitles 2018), licensed CC BY-SA 4.0. Keep that credit if you ship them.
