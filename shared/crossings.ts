/* Open passenger border crossings Ukraine and EU (Ukrainian side first).
   Used as a via point so a route never goes through closed borders
   (Belarus, Russia). Coordinates point at the checkpoint roads; the router
   snaps them to the nearest road. */
export const CROSSINGS = [
  { id: "yahodyn", name: { uk: "Ягодин, Дорогуськ", en: "Yahodyn, Dorohusk" }, lat: 51.1758, lon: 23.8139 },
  { id: "rava-ruska", name: { uk: "Рава-Руська, Гребенне", en: "Rava-Ruska, Hrebenne" }, lat: 50.2583, lon: 23.6342 },
  { id: "krakovets", name: { uk: "Краковець, Корчова", en: "Krakovets, Korczowa" }, lat: 49.9579, lon: 23.1012 },
  { id: "shehyni", name: { uk: "Шегині, Медика", en: "Shehyni, Medyka" }, lat: 49.8015, lon: 22.9495 },
  { id: "uzhhorod", name: { uk: "Ужгород, Вишнє Нємецке", en: "Uzhhorod, Vysne Nemecke" }, lat: 48.6676, lon: 22.2638 },
  { id: "chop", name: { uk: "Чоп, Захонь", en: "Chop, Zahony" }, lat: 48.4057, lon: 22.1802 },
  { id: "porubne", name: { uk: "Порубне, Сірет", en: "Porubne, Siret" }, lat: 47.9902, lon: 26.0433 }
];
export const CROSSING_NAMES: Record<string, { uk: string; en: string }> = Object.fromEntries(CROSSINGS.map((c) => [c.id, c.name]));
