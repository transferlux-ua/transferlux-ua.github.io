/* Terms of carriage. Plain punctuation only, no dashes or arrows in copy. */
import type { Lang } from "./i18n";

export interface TermsSection { title: string; items: string[] }
export interface Terms { title: string; intro: string; sections: TermsSection[]; updated: string }

const uk: Terms = {
  title: "Умови перевезення",
  intro:
    "Ці умови визначають порядок надання послуг пасажирських перевезень TransferLux між Україною та країнами Європи. Бронюючи поїздку, пасажир погоджується з цими умовами.",
  sections: [
    {
      title: "1. Правова основа",
      items: [
        "1.1. Перевезення виконуються відповідно до Цивільного кодексу України (глава 64 «Перевезення»), Закону України «Про автомобільний транспорт» від 05.04.2001 № 2344-III та Правил надання послуг пасажирського автомобільного транспорту, затверджених постановою Кабінету Міністрів України від 18.02.1997 № 176.",
        "1.2. Права пасажирів як споживачів захищені Законом України «Про захист прав споживачів» від 12.05.1991 № 1023-XII.",
        "1.3. На території Європейського Союзу права пасажирів автобусного транспорту визначає Регламент (ЄС) № 181/2011 Європейського Парламенту та Ради."
      ]
    },
    {
      title: "2. Бронювання та підтвердження",
      items: [
        "2.1. Заявку можна залишити на сайті, у Telegram, WhatsApp, електронною поштою або телефоном. Після заявки місця утримуються за пасажиром зі статусом «Очікує підтвердження».",
        "2.2. Бронювання стає остаточним після підтвердження менеджером. Менеджер узгоджує час, місце посадки та порядок оплати.",
        "2.3. Договір перевезення вважається укладеним з моменту підтвердження бронювання."
      ]
    },
    {
      title: "3. Вартість",
      items: [
        "3.1. Вартість поїздки залежить від маршруту, дати та кількості пасажирів. Ціну видно на сайті під час пошуку маршруту, також її повідомляє менеджер.",
        "3.2. Діти до 14 років включно їдуть зі знижкою 50%.",
        "3.3. Ціна у гривнях наведена довідково за офіційним курсом Національного банку України на день розрахунку.",
        "3.4. Вартість індивідуальної поїздки узгоджується з менеджером окремо."
      ]
    },
    {
      title: "4. Документи та кордон",
      items: [
        "4.1. Пасажир самостійно забезпечує наявність чинних документів для виїзду з України та в'їзду до країни призначення: закордонного паспорта, візи або дозволу на проживання, якщо вони потрібні.",
        "4.2. Виїзд дітей за кордон здійснюється відповідно до Правил перетинання державного кордону громадянами України, затверджених постановою Кабінету Міністрів України від 27.01.1995 № 57.",
        "4.3. Перевізник не відповідає за відмову прикордонної чи митної служби у пропуску пасажира. Час проходження кордону залежить від черги і не входить у розрахунковий час поїздки.",
        "4.4. Багаж перевозиться з дотриманням Митного кодексу України та митних правил країн ЄС. Пасажир відповідає за вміст свого багажу."
      ]
    },
    {
      title: "5. Діти та безпека",
      items: [
        "5.1. Діти зростом менше 145 см або віком до 12 років перевозяться з використанням дитячого крісла чи інших засобів пристібання згідно з пунктом 21.11 Правил дорожнього руху. Про потребу в кріслі просимо повідомити під час бронювання.",
        "5.2. Пасажир зобов'язаний пристібатися ременем безпеки під час руху.",
        "5.3. У салоні заборонено палити, вживати алкоголь та перевозити небезпечні речовини."
      ]
    },
    {
      title: "6. Багаж",
      items: [
        "6.1. Норму та габарити багажу пасажир узгоджує з менеджером під час бронювання.",
        "6.2. Перевезення тварин, великогабаритних речей та додаткового багажу можливе за попереднім погодженням."
      ]
    },
    {
      title: "7. Скасування та зміни",
      items: [
        "7.1. Пасажир може скасувати або змінити бронювання, повідомивши менеджера якнайшвидше, бажано не пізніше ніж за 24 години до відправлення.",
        "7.2. Перевізник може змінити час відправлення через погодні умови, стан доріг, ситуацію на кордоні або інші обставини, що не залежать від нього, і заздалегідь повідомляє про це пасажира.",
        "7.3. Якщо поїздку скасовує перевізник, пасажиру пропонують інший рейс або повертають сплачені кошти в повному обсязі."
      ]
    },
    {
      title: "8. Персональні дані",
      items: [
        "8.1. Ім'я та номер телефону використовуються лише для оформлення та підтвердження поїздки відповідно до Закону України «Про захист персональних даних» від 01.06.2010 № 2297-VI.",
        "8.2. Дані не передаються третім особам, крім випадків, передбачених законом, зокрема на вимогу прикордонних органів."
      ]
    },
    {
      title: "9. Звернення",
      items: [
        "9.1. Питання, побажання та скарги приймає менеджер телефоном +380 93 041 4853, у WhatsApp, Telegram @Transfer_Lux або поштою transferlux01@gmail.com. Ми відповідаємо на кожне звернення."
      ]
    }
  ],
  updated: "Редакція від 27.11.2026"
};

const en: Terms = {
  title: "Terms of carriage",
  intro:
    "These terms set out how TransferLux provides passenger transport between Ukraine and European countries. By booking a trip the passenger agrees to these terms.",
  sections: [
    {
      title: "1. Legal basis",
      items: [
        "1.1. Transport is provided in accordance with the Civil Code of Ukraine (Chapter 64 \"Carriage\"), the Law of Ukraine \"On Motor Transport\" No. 2344-III of 05.04.2001 and the Rules for Passenger Road Transport Services approved by Resolution of the Cabinet of Ministers of Ukraine No. 176 of 18.02.1997.",
        "1.2. Passengers' rights as consumers are protected by the Law of Ukraine \"On Consumer Rights Protection\" No. 1023-XII of 12.05.1991.",
        "1.3. Within the European Union the rights of bus and coach passengers are governed by Regulation (EU) No 181/2011 of the European Parliament and of the Council."
      ]
    },
    {
      title: "2. Booking and confirmation",
      items: [
        "2.1. A request can be made on the website, in Telegram, WhatsApp, by email or by phone. After the request the seats are held for the passenger with the status \"Awaiting confirmation\".",
        "2.2. The booking becomes final once confirmed by the manager, who agrees the time, pick up point and payment method.",
        "2.3. The contract of carriage is concluded when the booking is confirmed."
      ]
    },
    {
      title: "3. Price",
      items: [
        "3.1. The price depends on the route, date and number of passengers. It is shown on the website when you search for a route, and the manager can also tell you.",
        "3.2. Children up to 14 inclusive travel with a 50% discount.",
        "3.3. Hryvnia prices are for reference, at the official National Bank of Ukraine rate on the day of calculation.",
        "3.4. The price of a private trip is agreed with the manager separately."
      ]
    },
    {
      title: "4. Documents and border",
      items: [
        "4.1. Passengers are responsible for holding valid documents to leave Ukraine and enter the destination country: a passport, and a visa or residence permit where required.",
        "4.2. Children travel abroad in accordance with the Rules for Crossing the State Border by Citizens of Ukraine approved by Resolution of the Cabinet of Ministers of Ukraine No. 57 of 27.01.1995.",
        "4.3. The carrier is not liable if border or customs authorities refuse entry or exit to a passenger. Border waiting time depends on the queue and is not included in the estimated travel time.",
        "4.4. Luggage is carried in compliance with the Customs Code of Ukraine and EU customs rules. Passengers are responsible for the contents of their luggage."
      ]
    },
    {
      title: "5. Children and safety",
      items: [
        "5.1. Children shorter than 145 cm or under 12 travel in a child seat or with other restraint devices in accordance with clause 21.11 of the Road Traffic Rules of Ukraine. Please mention the need for a child seat when booking.",
        "5.2. Passengers must wear a seat belt while the vehicle is moving.",
        "5.3. Smoking, alcohol and dangerous substances are not allowed in the vehicle."
      ]
    },
    {
      title: "6. Luggage",
      items: [
        "6.1. The luggage allowance and size are agreed with the manager when booking.",
        "6.2. Pets, bulky items and extra luggage are carried by prior arrangement."
      ]
    },
    {
      title: "7. Cancellation and changes",
      items: [
        "7.1. Passengers may cancel or change a booking by informing the manager as early as possible, preferably at least 24 hours before departure.",
        "7.2. The carrier may change the departure time due to weather, road conditions, the situation at the border or other circumstances beyond its control, and informs passengers in advance.",
        "7.3. If the carrier cancels a trip, the passenger is offered another trip or a full refund of any amount paid."
      ]
    },
    {
      title: "8. Personal data",
      items: [
        "8.1. Name and phone number are used only to arrange and confirm the trip, in accordance with the Law of Ukraine \"On Personal Data Protection\" No. 2297-VI of 01.06.2010.",
        "8.2. Data is not shared with third parties except where required by law, including requests from border authorities."
      ]
    },
    {
      title: "9. Contact",
      items: [
        "9.1. Questions, requests and complaints are handled by the manager at +380 93 041 4853, in WhatsApp, Telegram @Transfer_Lux or by email at transferlux01@gmail.com. We reply to every message."
      ]
    }
  ],
  updated: "Version of 27.11.2026"
};

export const TERMS: Record<Lang, Terms> = { uk, en };
