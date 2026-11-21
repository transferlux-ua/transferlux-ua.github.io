// Run: npm test   (node --test, TypeScript compiled on the fly by esbuild via the loader below)
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

async function load(file) {
  const r = await build({ entryPoints: [file], bundle: true, format: "esm", platform: "node", write: false });
  const url = "data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64");
  return import(url);
}
const { quote, toUah } = await load("shared/price.ts");
const { parseRoute, suggestCities } = await load("shared/parse.ts");

test("price: 1000 km = 155 EUR adult, 77.50 child", () => {
  const q = quote(1000, 1, 1);
  assert.equal(q.adultCents, 15500);
  assert.equal(q.childCents, 7750);
  assert.equal(q.totalCents, 23250);
});
test("price: proportional distance and rounding to cents", () => {
  const q = quote(345.6, 2, 3);
  // 345.6/100*13 = 44.928 + 25 = 69.928 -> 69.93
  assert.equal(q.adultCents, 6993);
  assert.equal(q.childCents, 3497); // 34.965 rounds to 34.97
  assert.equal(q.totalCents, 2 * 6993 + 3 * 3497);
});
test("price: zero passengers gives zero total", () => {
  assert.equal(quote(500, 0, 0).totalCents, 0);
});
test("uah conversion rounds to hryvnia", () => {
  assert.equal(toUah(15500, 49.5717), 7684);
});

const cases = [
  ["Прага Київ", "prague", "kyiv"],
  ["Из Оломоуца в Берлин", "olomouc", "berlin"],
  ["Хочу из Львова в Париж", "lviv", "paris"],
  ["з Києва до Варшави", "kyiv", "warsaw"],
  ["kiev praga", "kyiv", "prague"],
  ["Hamburg to Lviv", "hamburg", "lviv"],
  ["в Мюнхен из Черновцов", "chernivtsi", "munich"],
  ["Ивано-Франковск Краков", "ivano-frankivsk", "krakow"],
  ["Біла Церква Відень", "bila-tserkva", "vienna"],
  ["Kamianets Podilskyi Brno", "kamianets-podilskyi", "brno"],
  ["варшва киев", "warsaw", "kyiv"],
  ["Den Haag Odessa", "the-hague", "odesa"],
  ["з Ужгорода в Будапешт", "uzhhorod", "budapest"],
  ["München Kyjiw", "munich", "kyiv"],
  ["хочу поїхати з Тернополя до Праги", "ternopil", "prague"]
];
for (const [q, from, to] of cases) {
  test(`parse: ${q}`, () => {
    const r = parseRoute(q);
    assert.equal(r.from?.id, from, "from");
    assert.equal(r.to?.id, to, "to");
  });
}
test("suggest: 'вар' -> Warsaw first", () => {
  assert.equal(suggestCities("вар")[0].id, "warsaw");
});
