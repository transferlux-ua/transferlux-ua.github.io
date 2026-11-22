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

test("price: 1000 km = 125 EUR adult, 62.50 child (10 EUR / 100 km + 25)", () => {
  const q = quote(1000, 1, 1);
  assert.equal(q.adultCents, 12500);
  assert.equal(q.childCents, 6250);
  assert.equal(q.totalCents, 18750);
});
test("price: proportional distance and rounding to cents", () => {
  const q = quote(345.6, 2, 3);
  // 345.6/100*10 = 34.56 + 25 = 59.56
  assert.equal(q.adultCents, 5956);
  assert.equal(q.childCents, 2978);
  assert.equal(q.totalCents, 2 * 5956 + 3 * 2978);
});
test("price: 820.4 km (Kyiv Warsaw) = 107.04 EUR adult, 53.52 child", () => {
  const q = quote(820.4, 1, 1);
  assert.equal(q.adultCents, 10704);
  assert.equal(q.childCents, 5352);
});
test("price: zero passengers gives zero total", () => {
  assert.equal(quote(500, 0, 0).totalCents, 0);
});
test("uah conversion rounds to hryvnia", () => {
  assert.equal(toUah(15500, 49.5717), 7684); // 155.00 EUR x 49.5717
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
