/* Interface texts. Rule: plain punctuation only, no dashes or arrows in copy. */
export type Lang = "uk" | "en";
export const LANGS: Lang[] = ["uk", "en"];
export const LOCALE: Record<Lang, string> = { uk: "uk-UA", en: "en-GB" };
export const PREFIX: Record<Lang, string> = { uk: "/", en: "/en/" };

/** Slavic plural: forms = [one, few, many] */
export function plural(lang: "uk", n: number, forms: [string, string, string]): string {
  const r = new Intl.PluralRules(lang).select(n);
  return r === "one" ? forms[0] : r === "few" ? forms[1] : forms[2];
}

const uk = {
  metaTitle: "TransferLux. Пасажирські перевезення Україна Європа",
  metaDesc: "Комфортні пасажирські перевезення між Україною та Європою. Розрахунок ціни за реальною відстанню, регулярні рейси та індивідуальні поїздки на Mercedes-Benz Sprinter і Volkswagen.",
  navFleet: "Автопарк", navTrips: "Рейси", navTeam: "Команда", navContacts: "Контакти", menu: "Меню", close: "Закрити",
  heroA: "Європа", heroB: "Україна", heroSub: "Комфортні пасажирські перевезення",
  modeRegular: "Регулярний рейс", modeIndividual: "Індивідуальна поїздка",
  routeLabel: "Звідки і куди", routePh: "Наприклад: Прага Київ",
  from: "Звідки", to: "Куди", swap: "Поміняти місцями", date: "Дата",
  fromPh: "Київ", toPh: "Варшава",
  terms: "Умови перевезення", termsAgree: "Надсилаючи заявку, ви погоджуєтеся з умовами перевезення.",
  adults: "Дорослі", children: "Діти до 14 років",
  searchBtn: "Знайти рейси", calcBtn: "Розрахувати", requestBtn: "Запросити вартість",
  contactBtn: "Написати менеджеру",
  themeLight: "Світла тема", themeDark: "Темна тема",
  navGallery: "Галерея", galleryTitle: "Галерея",
  contactsLead: "Зв'яжіться з менеджером так, як вам зручно.",
  individualLead: "Індивідуальну поїздку узгоджуємо особисто. Оберіть, де вам зручно написати, текст ми вже підготували.",
  msgIndividual: (a: string, b: string, d: string, p: string) => `Доброго дня! Хочу замовити індивідуальну поїздку ${a} ${b}. Дата: ${d}. Пасажири: ${p}.`,
  msgHint: "У WhatsApp текст з'явиться сам. Для Telegram ми скопіюємо його, вставте у чат.",
  msgCopied: "Текст скопійовано. Вставте його в чат Telegram і надішліть.",
  recognized: "Маршрут", notRecognized: "Вкажіть два міста, наприклад: Львів Варшава",
  pickCity: "Оберіть місто",
  loading: "Рахуємо маршрут дорогами",
  km: "км", onRoad: "у дорозі", noBorder: "без очікування на кордоні", via: "Пункт пропуску",
  adultTicket: "Дорослий квиток", childTicket: "Дитина до 14 років включно", total: "Разом",
  passengers: (a: number, c: number) => `${a} ${plural("uk", a, ["дорослий", "дорослих", "дорослих"])}${c ? `, ${c} ${plural("uk", c, ["дитина", "дитини", "дітей"])}` : ""}`,
  rateNote: (r: string, d: string) => `Курс НБУ ${r} ₴ за 1 € на ${d}`,
  rateDown: "Курс гривні тимчасово недоступний, ціна вказана в євро.",
  tripsTitle: "Рейси на ці дати", noTrips: "На ці дати регулярних рейсів поки немає.", noTripsHint: "Залиште заявку на індивідуальну поїздку, менеджер запропонує варіант.",
  seatsLeft: (n: number) => (n === 0 ? "Місць немає" : `Вільних місць: ${n}`),
  choose: "Обрати", requestIndividual: "Індивідуальна поїздка",
  individualNote: "Вартість індивідуальної поїздки розраховує менеджер з урахуванням адрес, дати та побажань.",
  bookTitle: "Заявка на бронювання", name: "Ім'я", phone: "Телефон", contactBy: "Як з вами зв'язатися",
  cTelegram: "Telegram", cWhatsapp: "WhatsApp", cCall: "Дзвінок",
  notes: "Побажання", notesPh: "Адреса, багаж, тварини, дитяче крісло",
  send: "Надіслати заявку", sending: "Надсилаємо",
  okTitle: "Заявку зареєстровано", okStatus: "Статус: Очікує підтвердження",
  okText: "Менеджер зв'яжеться з вами та підтвердить бронювання. До підтвердження місця утримуються за вами, але бронь ще не остаточна.",
  okTextInd: "Менеджер зв'яжеться з вами, щоб узгодити деталі та підтвердити поїздку.",
  number: "Номер заявки",
  errValidation: "Перевірте ім'я та номер телефону.", errSeats: "На цей рейс уже недостатньо вільних місць.",
  errDup: "Заявка з цим номером на цей рейс уже є. Менеджер зв'яжеться з вами.", errRate: "Забагато заявок. Спробуйте трохи пізніше або напишіть нам.",
  errNet: "Не вдалося надіслати заявку. Напишіть нам напряму, ми відповімо.",
  errRoute: "Не вдалося знайти автомобільний маршрут між цими містами.", errRouteDown: "Сервіс маршрутів тимчасово недоступний. Спробуйте ще раз або напишіть менеджеру.",
  errPlace: "Не знайшли місто. Перевірте назву.",
  fleetTitle: "Автопарк", fleetLead: "Mercedes-Benz Sprinter та пасажирські мікроавтобуси Volkswagen. Індивідуальні крісла з регулюванням нахилу.",
  exterior: "Зовні", interior: "Салон", photoNote: "Фото автомобілів компанії.",
  tripsAll: "Найближчі рейси", tripsEmpty: "Розклад оновлюється. Напишіть менеджеру, щоб дізнатися найближчі рейси.",
  teamTitle: "Команда", teamText: "Водії TransferLux. Люди, які щодня дбають про вашу безпеку та спокій у дорозі.",
  contactsTitle: "Контакти", manager: "Менеджер Володимир", channel: "Telegram канал", call: "Подзвонити", write: "Написати",
  popular: "Популярні напрямки", fromPrice: "від", schemeTitle: "Україна і Європа",
  routePageTitle: (a: string, b: string) => `Пасажирські перевезення ${a} ${b}`,
  routeFacts: "Про маршрут", distanceRoad: "Відстань дорогами", travelTime: "Час у дорозі", border: "Пункт пропуску", priceAdult: "Ціна для дорослого", priceChild: "Дитина до 14 років",
  backHome: "На головну", reverse: "Зворотний напрямок", otherRoutes: "Інші напрямки",
  routeText: (a: string, b: string, km: string, t: string, via: string | null) =>
    `Поїздка ${a} ${b} займає близько ${t} за кермом, відстань ${km} км автомобільними дорогами${via ? `, кордон перетинаємо через пункт пропуску ${via}` : ""}. Час на кордоні залежить від черги і не входить у цю оцінку. Ціна квитка розрахована за реальною відстанню, діти до 14 років включно їдуть зі знижкою 50%.`,
  footer: "Пасажирські перевезення між Україною та країнами Європи.",
  hours: "год", minutes: "хв", today: "сьогодні"
};

type Dict = typeof uk;

const en: Dict = {
  metaTitle: "TransferLux. Passenger transport Ukraine Europe",
  metaDesc: "Comfortable passenger transport between Ukraine and Europe. Prices based on real road distance, scheduled trips and private transfers in Mercedes-Benz Sprinter and Volkswagen minibuses.",
  navFleet: "Fleet", navTrips: "Trips", navTeam: "Team", navContacts: "Contacts", menu: "Menu", close: "Close",
  heroA: "Europe", heroB: "Ukraine", heroSub: "Comfortable passenger transport",
  modeRegular: "Scheduled trip", modeIndividual: "Private trip",
  routeLabel: "From and to", routePh: "For example: Prague Kyiv",
  from: "From", to: "To", swap: "Swap", date: "Date",
  fromPh: "Kyiv", toPh: "Warsaw",
  terms: "Terms of carriage", termsAgree: "By sending a request you agree to the terms of carriage.",
  adults: "Adults", children: "Children up to 14",
  searchBtn: "Find trips", calcBtn: "Calculate", requestBtn: "Request a price",
  contactBtn: "Message the manager",
  themeLight: "Light theme", themeDark: "Dark theme",
  navGallery: "Gallery", galleryTitle: "Gallery",
  contactsLead: "Contact the manager in the way that suits you.",
  individualLead: "Private trips are arranged personally. Choose where you would like to write, the message is already prepared.",
  msgIndividual: (a, b, d, p) => `Hello! I would like to book a private trip ${a} ${b}. Date: ${d}. Passengers: ${p}.`,
  msgHint: "In WhatsApp the text appears automatically. For Telegram we copy it, paste it into the chat.",
  msgCopied: "Text copied. Paste it into the Telegram chat and send.",
  recognized: "Route", notRecognized: "Enter two cities, for example: Lviv Warsaw",
  pickCity: "Choose a city",
  loading: "Calculating the road route",
  km: "km", onRoad: "driving", noBorder: "without border waiting time", via: "Border crossing",
  adultTicket: "Adult ticket", childTicket: "Child up to 14 inclusive", total: "Total",
  passengers: (a, c) => `${a} ${a === 1 ? "adult" : "adults"}${c ? `, ${c} ${c === 1 ? "child" : "children"}` : ""}`,
  rateNote: (r, d) => `NBU rate ${r} ₴ per €1 on ${d}`,
  rateDown: "The hryvnia rate is temporarily unavailable, prices are shown in euro.",
  tripsTitle: "Trips around this date", noTrips: "No scheduled trips on these dates yet.", noTripsHint: "Send a private trip request and the manager will suggest an option.",
  seatsLeft: (n) => (n === 0 ? "Fully booked" : `Seats left: ${n}`),
  choose: "Select", requestIndividual: "Private trip",
  individualNote: "The price of a private trip is calculated by the manager based on addresses, date and your wishes.",
  bookTitle: "Booking request", name: "Name", phone: "Phone", contactBy: "How should we contact you",
  cTelegram: "Telegram", cWhatsapp: "WhatsApp", cCall: "Phone call",
  notes: "Requests", notesPh: "Address, luggage, pets, child seat",
  send: "Send request", sending: "Sending",
  okTitle: "Request received", okStatus: "Status: Awaiting confirmation",
  okText: "The manager will contact you to confirm the booking. Seats are held for you until then, but the booking is not final yet.",
  okTextInd: "The manager will contact you to agree the details and confirm the trip.",
  number: "Request number",
  errValidation: "Please check your name and phone number.", errSeats: "There are no longer enough free seats on this trip.",
  errDup: "There is already a request with this phone for this trip. The manager will contact you.", errRate: "Too many requests. Please try again a bit later or message us.",
  errNet: "Could not send the request. Please message us directly, we will reply.",
  errRoute: "No road route was found between these cities.", errRouteDown: "The routing service is temporarily unavailable. Try again or message the manager.",
  errPlace: "City not found. Please check the name.",
  fleetTitle: "Fleet", fleetLead: "Mercedes-Benz Sprinter and Volkswagen passenger minibuses. Individual reclining seats.",
  exterior: "Exterior", interior: "Interior", photoNote: "Photos of the company vehicles.",
  tripsAll: "Upcoming trips", tripsEmpty: "The schedule is being updated. Message the manager to learn about upcoming trips.",
  teamTitle: "Team", teamText: "TransferLux drivers. People who take care of your safety and comfort on the road every day.",
  contactsTitle: "Contacts", manager: "Manager Volodymyr", channel: "Telegram channel", call: "Call", write: "Message",
  popular: "Popular routes", fromPrice: "from", schemeTitle: "Ukraine and Europe",
  routePageTitle: (a, b) => `Passenger transport ${a} ${b}`,
  routeFacts: "About the route", distanceRoad: "Road distance", travelTime: "Driving time", border: "Border crossing", priceAdult: "Adult price", priceChild: "Child up to 14",
  backHome: "Home", reverse: "Return direction", otherRoutes: "Other routes",
  routeText: (a, b, km, t, via) =>
    `The trip ${a} ${b} takes about ${t} of driving, ${km} km by road${via ? `, crossing the border at ${via}` : ""}. Border waiting time depends on the queue and is not included. The ticket price is based on the real distance, children up to 14 inclusive travel with a 50% discount.`,
  footer: "Passenger transport between Ukraine and European countries.",
  hours: "h", minutes: "min", today: "today"
};

export const DICT: Record<Lang, Dict> = { uk, en };
export type T = Dict;

export const CONTACTS = {
  phone: "+380930414853",
  phoneLabel: "+380 93 041 4853",
  whatsapp: "https://wa.me/380930414853",
  telegram: "https://t.me/Transfer_Lux",
  telegramLabel: "@Transfer_Lux",
  channel: "https://t.me/TransferLux"
};
