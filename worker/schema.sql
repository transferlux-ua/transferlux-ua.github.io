-- TransferLux API database (Cloudflare D1, SQLite)

-- geocoding cache (OpenStreetMap), so each city is looked up only once
CREATE TABLE IF NOT EXISTS geo (
  id TEXT PRIMARY KEY,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  label TEXT,
  cc TEXT,
  updated INTEGER
);

-- road distance cache (OSRM)
CREATE TABLE IF NOT EXISTS route_cache (
  k TEXT PRIMARY KEY,
  km REAL NOT NULL,
  minutes INTEGER NOT NULL,
  via TEXT,
  updated INTEGER
);

-- regular trips managed from the Telegram bot
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  depart_date TEXT NOT NULL,      -- YYYY-MM-DD (Kyiv time)
  depart_time TEXT NOT NULL,      -- HH:MM
  seats_total INTEGER NOT NULL,
  seats_free INTEGER NOT NULL CHECK (seats_free >= 0),
  status TEXT NOT NULL DEFAULT 'active',   -- active | cancelled
  created INTEGER
);
CREATE INDEX IF NOT EXISTS trips_route ON trips (from_id, to_id, depart_date);

-- booking requests: regular trip or individual trip quote
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,             -- regular | individual
  trip_id INTEGER,
  from_text TEXT,
  to_text TEXT,
  travel_date TEXT,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact TEXT,                   -- telegram | whatsapp | phone
  notes TEXT,
  price_cents INTEGER,
  km REAL,
  lang TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | rejected | cancelled
  idem TEXT UNIQUE,               -- client key: protects from double submit
  ip_hash TEXT,
  created INTEGER
);
CREATE INDEX IF NOT EXISTS bookings_trip ON bookings (trip_id, status);
CREATE INDEX IF NOT EXISTS bookings_ip ON bookings (ip_hash, created);

-- Telegram admins (only these chats can manage trips)
CREATE TABLE IF NOT EXISTS admins (
  chat_id INTEGER PRIMARY KEY,
  name TEXT,
  created INTEGER
);

-- small key/value cache (exchange rate)
CREATE TABLE IF NOT EXISTS kv (
  k TEXT PRIMARY KEY,
  v TEXT,
  updated INTEGER
);
