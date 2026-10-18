// Plays the real page in headless Chromium: starts the game, walks, finishes Józef's
// errand, takes Tadeusz's letter to Józef, delivers Basia's bread to Ola, completes a café
// order and one of Bogdan's, answers one of Zuzia's sums, sorts a word, opens the word list,
// and fails on any page error.
// Screenshots land in test/shots/ (git-ignored).
//
//   npm install          (once: playwright-core, plus three.js to serve locally)
//   npm run smoke        (desktop, light)     npm run smoke -- phone   (390×844, dark)
//
// Chromium: set CHROMIUM to an executable, or it uses the cloud container's headless shell.
// The CDN is usually blocked in the container, so three.js is served from node_modules.
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { build } from "../build.mjs";

const phone = process.argv[2] === "phone";
const exe = process.env.CHROMIUM || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const shots = new URL("./shots/", import.meta.url).pathname;
mkdirSync(shots, { recursive: true });
const page_html = build()["dist/index.html"];
const threeFile = path => readFileSync(new URL("../node_modules/three/" + path, import.meta.url));

const browser = await chromium.launch({ executablePath: exe, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await browser.newContext(phone
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: "dark" }
  : { viewport: { width: 1280, height: 800 }, colorScheme: "light" });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.route("**/*", r => {
  const u = r.request().url();
  if (u === "https://rynek.test/") return r.fulfill({ contentType: "text/html; charset=utf-8", body: page_html });
  const three = u.match(/three@0\.160\.0\/(.*)$/); // three.js and its glTF loader
  if (three) return r.fulfill({ contentType: "text/javascript", headers: { "access-control-allow-origin": "*" }, body: threeFile(three[1]) });
  return r.abort(); // fonts and anything else: the page must cope without them
});

let failures = 0;
const check = (ok, what) => { console.log((ok ? "  ok  " : "  FAIL ") + what); if (!ok) failures++; };
const R = (fn, arg) => page.evaluate(fn, arg);
const shot = name => page.screenshot({ path: `${shots}${phone ? "phone" : "desktop"}-${name}.png` });
const state = () => R(() => JSON.parse(JSON.stringify(window.__rynek.st)));
async function goTo(x, z, promptText) {
  await R(([x, z]) => window.__rynek.player.pos.set(x, 0, z), [x, z]);
  await page.waitForFunction(t => { const p = document.querySelector("#prompt"); return !p.hidden && p.textContent.includes(t); }, promptText, { timeout: 20000 });
}
async function press(key = "e") { await page.keyboard.press(key); await page.waitForTimeout(150); }
async function talkThrough() {
  await page.waitForFunction(() => !document.querySelector("#dialogue").hidden, null, { timeout: 15000 });
  const lines = [];
  for (let i = 0; i < 20; i++) {
    if (await R(() => document.querySelector("#dialogue").hidden)) break;
    lines.push(await R(() => document.querySelector("#d-line").textContent));
    const action = await page.$("#d-extra button:last-child");
    if (action) await action.click(); else await page.click("#d-next");
    await page.waitForTimeout(150);
  }
  return lines;
}
const npcAt = (id, dx, dz) => R(([id, dx, dz]) => { const o = window.__rynek.npcObjs[id]; return [o.x + dx, o.z + dz]; }, [id, dx, dz]);

await page.goto("https://rynek.test/");
await page.waitForFunction(() => window.__rynek, null, { timeout: 30000 });
await page.waitForTimeout(1500);
check((await R(() => window.__rynek.validateLexicon().missing.length)) === 0, "every word has a dictionary entry");
check(await R(() => window.__rynek.modelledPeople), "the people come from the Blender model");
await shot("1-intro");
await page.click("#start");
await page.waitForFunction(() => document.querySelector("#intro").hidden);

const before = await R(() => window.__rynek.player.pos.z);
await page.keyboard.down("KeyW"); await page.waitForTimeout(1500); await page.keyboard.up("KeyW");
check((await R(() => window.__rynek.player.pos.z)) < before - 0.05, "W walks forward");

await goTo(5.2, 12.9, "Józef"); await press();
await page.waitForFunction(() => !document.querySelector("#dialogue").hidden);
check((await R(() => document.querySelector("#d-line").textContent)) === "Dzień dobry! Mam na imię Józef.", "Józef greets in Polish");
await page.click("#d-line .w >> nth=0");
await page.waitForFunction(() => !document.querySelector("#card").hidden);
check((await R(() => document.querySelector("#card .c-gloss").textContent)) === "day", "clicking Dzień shows 'day'");
check(!(await R(() => document.querySelector("#card").textContent.includes("null"))), "word card has no stray text");
await shot("2-card");
await press("2");
check((await R(() => document.querySelector("#d-line .w").dataset.s)) === "1", "pressing 2 turns the word orange");
await press("Escape");
await talkThrough();
check((await state()).npc.jozef.stage === "active", "Józef's errand starts");

await goTo(-2.6, 2.9, "okulary"); await press();
check((await state()).bag.includes("okulary"), "picks up okulary");
await goTo(5.2, 12.9, "Józef"); await press();
const done = await talkThrough();
const s1 = await state();
check(done[0] === "Moje okulary! Dziękuję bardzo!" && s1.npc.jozef.stage === "done" && s1.coins === 20, "Józef's errand completes (+20 zł)");

// Tadeusz's letter goes to Józef, who already has an errand of his own
const [tx, tz] = await npcAt("tadeusz", 0, -1.6);
await goTo(tx, tz, "Tadeusz"); await press(); await talkThrough();
check((await state()).bag.includes("list"), "Tadeusz hands over a letter for Józef");
await goTo(5.2, 12.9, "Józef"); await press();
const letter = await talkThrough();
const sL = await state();
check(letter[0] === "List dla mnie? Od mojej wnuczki!" && sL.npc.tadeusz.stage === "done" && sL.coins === 40 && !sL.bag.length, "Józef receives the letter (+20 zł)");

const [bx, bz] = await npcAt("basia", 1.6, 0);
await goTo(bx, bz, "Basia"); await press(); await talkThrough();
check((await state()).bag.includes("chleb"), "Basia hands over the bread");
const [ox, oz] = await npcAt("ola", -1.6, 0);
await goTo(ox, oz, "Ola"); await press(); await talkThrough();
const s2 = await state();
check(s2.npc.basia.stage === "done" && s2.coins === 60 && !s2.bag.length, "Ola receives the bread (+20 zł)");

await goTo(ox, oz, "Ola"); await press(); await talkThrough();
const want = (await state()).npc.ola.order;
check(!!want, `Ola orders something (${want})`);
const [hx, hz] = await R(id => { const h = window.__rynek.HOMES[id]; return [h.x - 1, h.z]; }, want);
await R(([x, z]) => window.__rynek.player.pos.set(x, 0, z), [hx, hz]);
await page.waitForFunction(id => window.__rynek.itemObjs[id].label.btn.classList.contains("near"), want, { timeout: 20000 });
await press();
check((await state()).bag.includes(want), `picks up ${want} from the counter`);
await goTo(ox, oz, "Ola"); await press(); await talkThrough();
check((await state()).coins === 65, "the café order pays 5 zł");
await shot("3-after-errands");

// Bogdan says hello and gives an order with a reason in the same breath
const [gx, gz] = await npcAt("bogdan", 0, 1.6);
await goTo(gx, gz, "Bogdan"); await press();
const bLines = await talkThrough();
const bOrder = (await state()).npc.bogdan.order;
check(!!bOrder && /^(Jest|Wieje|Pada|Ktoś)/.test(bLines.at(-1)), `Bogdan orders with a reason: "${bLines.at(-1)}"`);
const [cx, cz] = await R(id => { const h = window.__rynek.HOMES[id]; return [h.x, h.z + 1]; }, bOrder);
await R(([x, z]) => window.__rynek.player.pos.set(x, 0, z), [cx, cz]);
await page.waitForFunction(id => window.__rynek.itemObjs[id].label.btn.classList.contains("near"), bOrder, { timeout: 20000 });
await press();
check((await state()).bag.includes(bOrder), `picks up ${bOrder} from the clothes stall`);
await goTo(gx, gz, "Bogdan"); await press(); await talkThrough();
check((await state()).coins === 70, "Bogdan's order pays 5 zł");

// Zuzia: find her skipping rope, then answer a sum by tapping the number word
const [zx, zz] = await npcAt("zuzia", 1.4, 0);
await goTo(zx, zz, "Zuzia"); await press(); await talkThrough();
const sk = await R(() => { const h = window.__rynek.HOMES.skakanka; return [h.x, h.z + 1]; });
await goTo(sk[0], sk[1], "skakanka"); await press();
check((await state()).bag.includes("skakanka"), "picks up skakanka");
await goTo(zx, zz, "Zuzia"); await press();
await page.waitForFunction(() => !document.querySelector("#dialogue").hidden);
for (let i = 0; i < 6 && !(await page.$("#d-extra .answer")); i++) { await page.click("#d-next"); await page.waitForTimeout(200); }
const NUM = ["zero", "jeden", "dwa", "trzy", "cztery", "pięć", "sześć", "siedem", "osiem", "dziewięć", "dziesięć"];
const sum = (await R(() => document.querySelector("#d-line").textContent)).match(/Ile to jest (\S+) plus (\S+)\?/);
const answer = NUM[NUM.indexOf(sum[1]) + NUM.indexOf(sum[2])];
check((await page.$$("#d-extra .answer")).length === 3, "the sum offers three number words");
await shot("5-quiz");
await page.click(`#d-extra .answer[data-key="${answer}"]`);
await page.waitForFunction(() => document.querySelector("#d-line").textContent.startsWith("Tak!"), null, { timeout: 15000 });
check((await state()).coins === 93, `answering "${answer}" pays 3 zł, after 20 for the errand`);
for (let i = 0; i < 8 && !(await R(() => document.querySelector("#dialogue").hidden)); i++) {
  const quit = await page.$("#d-extra button:not(.answer)");
  if (quit) await quit.click(); else await page.click("#d-next");
  await page.waitForTimeout(200);
}
check(await R(() => document.querySelector("#dialogue").hidden), "That's enough ends the sums");

// leave a conversation halfway: Marek's errand still starts
const [mx, mz] = await npcAt("marek", 1.6, 0); // from the side away from the fruit
await goTo(mx, mz, "Marek"); await press();
await page.waitForFunction(() => !document.querySelector("#dialogue").hidden);
await page.click("#d-next");
await page.click("#d-leave");
check(await R(() => document.querySelector("#dialogue").hidden), "Leave closes the conversation mid-way");
check((await state()).npc.marek.stage === "active", "leaving early still starts Marek's errand");

// the bag holds more than one thing, and things can go back
for (const id of ["gruszka", "śliwka"]) {
  const [ix, iz] = await R(id => { const h = window.__rynek.HOMES[id]; return [h.x, h.z + 1]; }, id);
  await R(([x, z]) => window.__rynek.player.pos.set(x, 0, z), [ix, iz]);
  await page.waitForFunction(id => window.__rynek.itemObjs[id].label.btn.classList.contains("near"), id, { timeout: 20000 });
  await press();
}
check(JSON.stringify((await state()).bag) === JSON.stringify(["gruszka", "śliwka"]), "the bag holds gruszka and śliwka together");
await press("i");
await page.waitForFunction(() => !document.querySelector("#bag").hidden);
check((await page.$$("#bag-list .slot:not(.empty)")).length === 2, "the bag shows two things and four empty slots");
await shot("6-bag");
await page.click("#bag-list .slot button.ghost");
check(JSON.stringify((await state()).bag) === JSON.stringify(["śliwka"]), "Put back returns gruszka to the stall");
await press("Escape");
const xp = await state();
check(xp.xp > 100 && /Poziom [2-9]/.test(await R(() => document.querySelector("#xp-level").textContent)), `XP adds up and levels rise (${xp.xp} XP)`);

// walk out of the square through the new street and into the park
await R(() => { const r = window.__rynek; r.player.pos.set(24, 0, (r.park.gate[0] + r.park.gate[1]) / 2); r.cam.yaw = -Math.PI / 2; });
await page.keyboard.down("ShiftLeft"); await page.keyboard.down("KeyW");
await page.waitForFunction(() => window.__rynek.player.pos.x > 38, null, { timeout: 90000 }).catch(() => {});
await page.keyboard.up("KeyW"); await page.keyboard.up("ShiftLeft");
check((await R(() => window.__rynek.player.pos.x)) > 38, "you can walk from the square into the park");

// Wiesław has a different conversation each time
const [wx, wz] = await npcAt("wieslaw", 1.6, 0);
const chat = async () => { await goTo(wx, wz, "Wiesław"); await press(); return (await talkThrough())[0]; };
const firstW = await chat(), secondW = await chat(), thirdW = await chat();
check(firstW.startsWith("Dzień dobry") && secondW === "Ludzie nigdy nie słuchają." && thirdW.startsWith("Kiedy byłem młody"), "Wiesław says hello, then something new each visit");

await press("v");
await page.waitForFunction(() => !document.querySelector("#vocab").hidden);
check((await R(() => document.querySelectorAll("#v-list .v-row").length)) > 20, "the word list shows the words met so far");
await page.click('#v-tabs button[data-tab="freq"]');
check(/^9\d of these 100 are in the game/.test(await R(() => document.querySelector("#f-summary").textContent)), "the Top 1000 tab shows how many of the top 100 the game teaches");
check((await page.$$("#f-list .f-row")).length === 100, "each page lists 100 words");
await page.click('#v-tabs button[data-tab="mine"]');
await shot("4-word-list");
await press("Escape");
check((await R(() => document.documentElement.scrollWidth <= innerWidth)), "no sideways scroll");

const reload = await state();
await page.reload();
await page.waitForFunction(() => window.__rynek, null, { timeout: 30000 });
check((await state()).coins === reload.coins && (await state()).words["dzień"]?.s === 1, "progress survives a reload");

check(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
await browser.close();
console.log(failures ? `${failures} check(s) failed` : "all checks passed");
process.exit(failures ? 1 : 0);
