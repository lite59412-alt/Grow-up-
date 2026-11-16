"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

type Section = "overview" | "money" | "notes" | "routines" | "games" | "reminders" | "settings";
type Language = "en" | "hi";
type TextSize = "compact" | "comfortable" | "large" | "extraLarge" | "huge";
type Direction = "given" | "taken";
type EntryStatus = "pending" | "partial" | "paid";
type Frequency = "Daily" | "Weekly" | "Custom";
type GameKey = "memory" | "math" | "number" | "odd" | "count";
type Payment = { amount: number; date: string };
type Transaction = {
  id: string;
  direction: Direction;
  person: string;
  amount: number;
  paid: number;
  date: string;
  dueDate: string;
  note: string;
  payments: Payment[];
};
type PersonalNote = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  important: boolean;
  reminder: boolean;
  reminderDate: string;
};
type RoutineMiss = { date: string; reason: string; note: string };
type Routine = {
  id: string;
  name: string;
  time: string;
  frequency: Frequency;
  days: number[];
  doneDates: string[];
  reminder: boolean;
  missLog: RoutineMiss[];
};
type GameRecord = { level: number; bestScore: number; lastScore: number; plays: number };
type AppData = {
  transactions: Transaction[];
  notes: PersonalNote[];
  routines: Routine[];
  games: Record<GameKey, GameRecord>;
  gameDays: string[];
  settings: { language: Language; darkMode: boolean; notifications: boolean; textSize: TextSize; sound: boolean };
};
type GameSession = {
  game: GameKey;
  level: number;
  mode: "playing" | "memorize" | "recall" | "complete";
  score?: number;
  cards?: string[];
  flipped?: number[];
  matched?: number[];
  moves?: number;
  question?: { prompt: string; answer: number };
  answer?: string;
  feedback?: string;
  sequence?: string;
  oddIndex?: number;
  target?: string;
  targetCount?: number;
  startedAt?: number;
  elapsed?: number;
};
type ReminderItem = { id: string; title: string; detail: string; when: string; kind: "money" | "routine" | "note"; enabled: boolean };

type Translation = {
  overview: string; money: string; notes: string; routines: string; games: string; reminders: string; settings: string;
  goodMorning: string; goodAfternoon: string; goodEvening: string; daySubtitle: string; today: string;
  toReceive: string; toPay: string; completedToday: string; pendingReminders: string; recentNotes: string;
  quickActions: string; addEntry: string; addNote: string; addRoutine: string; playGame: string;
  moneyTitle: string; moneySubtitle: string; moneyGiven: string; moneyTaken: string; all: string; pending: string; partial: string; paid: string;
  search: string; person: string; amount: string; date: string; dueDate: string; note: string; save: string; cancel: string;
  notesTitle: string; notesSubtitle: string; pinned: string; important: string; favorite: string; createNote: string;
  routinesTitle: string; routinesSubtitle: string; daily: string; weekly: string; custom: string; markDone: string;
  gamesTitle: string; gamesSubtitle: string; level: string; bestScore: string; todayProgress: string; streak: string;
  remindersTitle: string; remindersSubtitle: string; enabled: string; paused: string;
  settingsTitle: string; language: string; darkMode: string; notifications: string; exportData: string; localPrivacy: string; textSize: string; textSizeHint: string; textSizePreview: string;
  noResults: string; viewAll: string; dueSoon: string; localOnly: string;
};

const copy: Record<Language, Translation> = {
  en: {
    overview: "Overview", money: "Money", notes: "Notes", routines: "Routines", games: "Mind games", reminders: "Reminders", settings: "Settings",
    goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening", daySubtitle: "Small steps, one brighter day at a time.", today: "Today",
    toReceive: "To receive", toPay: "To pay", completedToday: "Completed today", pendingReminders: "Pending reminders", recentNotes: "Recent notes",
    quickActions: "Quick actions", addEntry: "Add money entry", addNote: "Write a note", addRoutine: "New routine", playGame: "Play a game",
    moneyTitle: "Money, made clearer", moneySubtitle: "Keep every lend and repayment in one calm place.", moneyGiven: "Money given", moneyTaken: "Money taken", all: "All", pending: "Pending", partial: "Partial", paid: "Paid",
    search: "Search by person, note or amount…", person: "Person’s name", amount: "Amount (₹)", date: "Date", dueDate: "Expected return date", note: "Note (optional)", save: "Save changes", cancel: "Cancel",
    notesTitle: "A little space for your thoughts", notesSubtitle: "Keep ideas, plans and the things you want to remember.", pinned: "Pinned", important: "Important", favorite: "Favorites", createNote: "Create note",
    routinesTitle: "Build a rhythm that feels like you", routinesSubtitle: "A gentle nudge, one check at a time.", daily: "Daily", weekly: "Weekly", custom: "Custom", markDone: "Mark complete",
    gamesTitle: "A few minutes for a sharper mind", gamesSubtitle: "Five quick games. New levels keep getting trickier—there’s no final level.", level: "Level", bestScore: "Best score", todayProgress: "Today’s progress", streak: "day streak",
    remindersTitle: "Your gentle nudges", remindersSubtitle: "Upcoming returns, routines and personal reminders, all together.", enabled: "On", paused: "Paused",
    settingsTitle: "Make Better You yours", language: "Language", darkMode: "Dark mode", notifications: "Reminders & notifications", exportData: "Export my data", localPrivacy: "Your data stays on this device.", textSize: "Text size", textSizeHint: "Make every screen easier to read.", textSizePreview: "A little clearer, a little more comfortable.",
    noResults: "Nothing here just yet. Add something to get started.", viewAll: "View all", dueSoon: "Due soon", localOnly: "Private · stored on this device",
  },
  hi: {
    overview: "होम", money: "पैसे", notes: "नोट्स", routines: "दिनचर्या", games: "माइंड गेम्स", reminders: "रिमाइंडर", settings: "सेटिंग्स",
    goodMorning: "सुप्रभात", goodAfternoon: "नमस्ते", goodEvening: "शुभ संध्या", daySubtitle: "छोटे कदम, हर दिन थोड़ा बेहतर।", today: "आज",
    toReceive: "लेने बाकी", toPay: "देने बाकी", completedToday: "आज पूरे हुए", pendingReminders: "बाकी रिमाइंडर", recentNotes: "हाल के नोट्स",
    quickActions: "झटपट जोड़ें", addEntry: "पैसों की एंट्री", addNote: "नोट लिखें", addRoutine: "नई दिनचर्या", playGame: "गेम खेलें",
    moneyTitle: "पैसों का साफ़ हिसाब", moneySubtitle: "उधार और भुगतान का हिसाब एक ही जगह रखें।", moneyGiven: "दिए हुए पैसे", moneyTaken: "लिए हुए पैसे", all: "सभी", pending: "बाकी", partial: "कुछ भुगतान", paid: "चुकता",
    search: "नाम, नोट या रकम खोजें…", person: "व्यक्ति का नाम", amount: "रकम (₹)", date: "तारीख", dueDate: "वापसी की तारीख", note: "नोट (ज़रूरी नहीं)", save: "सेव करें", cancel: "रद्द करें",
    notesTitle: "अपने ख़यालों के लिए एक जगह", notesSubtitle: "ज़रूरी बातें, योजनाएँ और यादें सहेजें।", pinned: "पिन किए हुए", important: "ज़रूरी", favorite: "पसंदीदा", createNote: "नोट बनाएँ",
    routinesTitle: "अपनी पसंद की अच्छी आदतें बनाएँ", routinesSubtitle: "छोटे कदमों से हर दिन की लय बनाएँ।", daily: "रोज़", weekly: "साप्ताहिक", custom: "अपनी पसंद", markDone: "पूरा करें",
    gamesTitle: "तेज़ दिमाग़ के लिए कुछ मिनट", gamesSubtitle: "पाँच छोटे गेम। हर नए लेवल में चुनौती बढ़ेगी—लेवल कभी खत्म नहीं होंगे।", level: "लेवल", bestScore: "सर्वश्रेष्ठ स्कोर", todayProgress: "आज की प्रगति", streak: "दिन की लय",
    remindersTitle: "आपके ज़रूरी रिमाइंडर", remindersSubtitle: "वापसी की तारीख़, आदतें और निजी रिमाइंडर एक जगह।", enabled: "चालू", paused: "बंद",
    settingsTitle: "Better You को अपना बनाएँ", language: "भाषा", darkMode: "डार्क मोड", notifications: "रिमाइंडर और नोटिफ़िकेशन", exportData: "मेरा डेटा एक्सपोर्ट करें", localPrivacy: "आपका डेटा इसी डिवाइस पर रहता है।", textSize: "अक्षरों का आकार", textSizeHint: "हर स्क्रीन को पढ़ना आसान बनाएँ।", textSizePreview: "थोड़ा साफ़, थोड़ा और आरामदेह।",
    noResults: "अभी यहाँ कुछ नहीं है। शुरू करने के लिए कुछ जोड़ें।", viewAll: "सभी देखें", dueSoon: "जल्द देय", localOnly: "निजी · इसी डिवाइस पर सेव",
  },
};

const GAME_META: Record<GameKey, { title: string; subtitle: string; icon: string; tone: string; instruction: string }> = {
  memory: { title: "Memory Match", subtitle: "Remember more, one flip at a time.", icon: "🧠", tone: "violet", instruction: "Find every matching pair. Each level adds more cards." },
  math: { title: "Math Sprint", subtitle: "A tiny calculation, a sharper mind.", icon: "✳️", tone: "cyan", instruction: "Solve the challenge to clear this level. Numbers grow as you progress." },
  number: { title: "Number Memory", subtitle: "See it. Remember it. Type it back.", icon: "🔢", tone: "pink", instruction: "Memorize the number before it hides. Every level adds another digit." },
  odd: { title: "Odd One Out", subtitle: "Spot the tile that does not belong.", icon: "🧩", tone: "orange", instruction: "Find the one different tile. Grids get bigger and trickier every level." },
  count: { title: "Quick Count", subtitle: "Count only the target symbol.", icon: "🎯", tone: "green", instruction: "Ignore the distractors and count the target. More symbols appear every level." },
};
const GAME_KEYS: GameKey[] = ["memory", "math", "number", "odd", "count"];
const EMOJIS = ["🌙", "🌱", "🪐", "🍒", "🦋", "🌈", "🐚", "🍋", "🪷", "🧿", "🍄", "🐳", "🌻", "🪴", "🎈", "🧸", "💎", "🍀"];
const ODD_PAIRS = [
  { base: "🍎", odd: "🍏" },
  { base: "⭐", odd: "🌟" },
  { base: "😀", odd: "😄" },
  { base: "🔵", odd: "🟣" },
  { base: "🌸", odd: "🌼" },
  { base: "🐶", odd: "🐱" },
  { base: "7", odd: "1" },
  { base: "B", odd: "8" },
  { base: "◆", odd: "⬥" },
  { base: "●", odd: "⬤" },
];
const COUNT_TARGETS = ["⭐", "🍓", "🐠", "🍎", "🎈", "🌸", "🍋", "🦋"];
const MISS_REASONS = ["Forgot", "Busy day", "Low energy", "Not well", "Travelling", "Family time", "Work ran late", "Needed a rest"];
const MOTIVATIONS = [
  { icon: "🌱", title: "You don’t need a perfect day.", body: "One small check is still progress. Start with the next five minutes." },
  { icon: "🔥", title: "Your streak is built one choice at a time.", body: "Future you is watching. Do this one tiny thing for them today." },
  { icon: "🌙", title: "Missing once is human. Returning is the habit.", body: "Don’t miss twice. A gentle restart is stronger than guilt." },
  { icon: "☀️", title: "Discipline can be kind.", body: "You are not behind. You are exactly one action away from a better day." },
  { icon: "🪴", title: "Small things, repeated, become who you are.", body: "Show up softly. Consistency loves small, doable steps." },
  { icon: "✦", title: "Motivation follows movement.", body: "Begin before you feel ready. The energy arrives after the first step." },
  { icon: "🌊", title: "A pause is not a failure.", body: "Note what got in the way, then choose your next small win." },
];
function motivationFor(date: string) {
  const seed = Number(date.replaceAll("-", "")) || 0;
  return MOTIVATIONS[seed % MOTIVATIONS.length];
}
function minutesOfDay(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return (hour || 0) * 60 + (minute || 0);
}
const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STORAGE_KEY = "better-you-local-v1";

function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function dateOffset(offset: number, base = new Date()) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 12);
  return localDate(date);
}
function dayIndex(value: string) {
  return (new Date(`${value}T12:00:00`).getDay() + 6) % 7;
}
function makeSeedData(): AppData {
  const today = localDate();
  const history = Array.from({ length: 8 }, (_, index) => dateOffset(-index));
  return {
    transactions: [
      { id: "tx-1", direction: "given", person: "Maya Sharma", amount: 12500, paid: 4000, date: dateOffset(-6), dueDate: dateOffset(2), note: "For the new apartment deposit", payments: [{ amount: 2500, date: dateOffset(-3) }, { amount: 1500, date: dateOffset(-1) }] },
      { id: "tx-2", direction: "given", person: "Arjun Mehta", amount: 5000, paid: 2000, date: dateOffset(-3), dueDate: dateOffset(5), note: "Bike repair", payments: [{ amount: 2000, date: dateOffset(-1) }] },
      { id: "tx-3", direction: "taken", person: "Priya Verma", amount: 8000, paid: 2200, date: dateOffset(-9), dueDate: dateOffset(1), note: "Shared travel booking", payments: [{ amount: 2200, date: dateOffset(-4) }] },
      { id: "tx-4", direction: "taken", person: "Aman Kapoor", amount: 2500, paid: 2500, date: dateOffset(-14), dueDate: dateOffset(-2), note: "Dinner and tickets", payments: [{ amount: 2500, date: dateOffset(-2) }] },
    ],
    notes: [
      { id: "note-1", title: "My little goals", content: "Be consistent.\nFocus on health.\nSave more money.\nLearn new skills.\nBe a better version of myself.", createdAt: new Date(Date.now() - 4 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(), pinned: true, important: true, reminder: false, reminderDate: "" },
      { id: "note-2", title: "Books to come back to", content: "Atomic Habits — James Clear\nDeep Work — Cal Newport\nThe Psychology of Money — Morgan Housel", createdAt: new Date(Date.now() - 8 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(), pinned: false, important: false, reminder: false, reminderDate: "" },
      { id: "note-3", title: "A thoughtful reminder", content: "Progress is quiet. Keep showing up, especially on the ordinary days.", createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), pinned: false, important: true, reminder: true, reminderDate: dateOffset(1) },
    ],
    routines: [
      { id: "routine-1", name: "Drink a glass of water", time: "08:00", frequency: "Daily", days: [0, 1, 2, 3, 4, 5, 6], doneDates: history.slice(0, 6), reminder: true, missLog: [{ date: history[6], reason: "Forgot", note: "Woke up late and rushed out." }] },
      { id: "routine-2", name: "A little morning stretch", time: "08:30", frequency: "Daily", days: [0, 1, 2, 3, 4, 5, 6], doneDates: history.slice(0, 5), reminder: true, missLog: [{ date: history[5], reason: "Low energy", note: "Slept poorly." }] },
      { id: "routine-3", name: "Read for twenty minutes", time: "20:00", frequency: "Daily", days: [0, 1, 2, 3, 4, 5, 6], doneDates: history.slice(0, 3), reminder: false, missLog: [{ date: history[4], reason: "Busy day", note: "Work ran late." }] },
      { id: "routine-4", name: "Move your body", time: "18:00", frequency: "Weekly", days: [0, 2, 4, 5], doneDates: [dateOffset(-4), dateOffset(-2)], reminder: true, missLog: [] },
      { id: "routine-5", name: "Plan the week ahead", time: "10:00", frequency: "Weekly", days: [6], doneDates: [dateOffset(-7)], reminder: false, missLog: [] },
    ],
    games: {
      memory: { level: 3, bestScore: 540, lastScore: 420, plays: 5 },
      math: { level: 2, bestScore: 320, lastScore: 250, plays: 2 },
      number: { level: 1, bestScore: 0, lastScore: 0, plays: 0 },
      odd: { level: 1, bestScore: 0, lastScore: 0, plays: 0 },
      count: { level: 1, bestScore: 0, lastScore: 0, plays: 0 },
    },
    gameDays: history.slice(0, 4),
    settings: { language: "en", darkMode: true, notifications: true, textSize: "comfortable", sound: true },
  };
}
function shuffle<T,>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function getEntryStatus(entry: Transaction): EntryStatus {
  if (entry.paid >= entry.amount) return "paid";
  return entry.paid > 0 ? "partial" : "pending";
}
function remaining(entry: Transaction) {
  return Math.max(0, entry.amount - entry.paid);
}
function money(value: number, language: Language = "en") {
  return new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}
function prettyDate(value: string, language: Language = "en") {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return date.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function friendlyDate(value: string, language: Language = "en") {
  const delta = Math.round((new Date(`${value}T12:00:00`).getTime() - new Date(`${localDate()}T12:00:00`).getTime()) / 86400000);
  if (delta === 0) return language === "hi" ? "आज" : "Today";
  if (delta === 1) return language === "hi" ? "कल" : "Tomorrow";
  if (delta === -1) return language === "hi" ? "कल" : "Yesterday";
  return prettyDate(value, language);
}
function idFor(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function createQuestion(level: number) {
  if (level < 3) {
    const scale = 20 + level * 12;
    const a = Math.ceil(Math.random() * scale);
    const b = Math.ceil(Math.random() * scale);
    return Math.random() > 0.5 ? { prompt: `${a} + ${b}`, answer: a + b } : { prompt: `${Math.max(a, b)} − ${Math.min(a, b)}`, answer: Math.abs(a - b) };
  }
  if (level < 7) {
    const a = Math.ceil(Math.random() * (5 + level * 3));
    const b = Math.ceil(Math.random() * (3 + level * 2));
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) return { prompt: `${a} × ${b}`, answer: a * b };
    if (mode === 1) return { prompt: `${a + b} − ${b}`, answer: a };
    return { prompt: `${a * b} ÷ ${a}`, answer: b };
  }
  const a = Math.ceil(Math.random() * (10 + level * 4));
  const b = Math.ceil(Math.random() * (5 + level * 2));
  const multiplier = Math.max(2, Math.floor(level / 7));
  return Math.random() > 0.5 ? { prompt: `${a} × ${b} + ${level}`, answer: a * b + level } : { prompt: `(${a} + ${b}) × ${multiplier}`, answer: (a + b) * multiplier };
}
function randomDigits(length: number) {
  const first = String(1 + Math.floor(Math.random() * 9));
  const rest = Array.from({ length: Math.max(0, length - 1) }, () => String(Math.floor(Math.random() * 10))).join("");
  return `${first}${rest}`;
}
function oddPairForLevel(level: number) {
  return ODD_PAIRS[(level - 1) % ODD_PAIRS.length];
}
function makeOddCards(level: number) {
  const total = Math.min(48, 12 + level * 2);
  const pair = oddPairForLevel(level);
  const oddIndex = Math.floor(Math.random() * total);
  const cards = Array.from({ length: total }, () => pair.base);
  cards[oddIndex] = pair.odd;
  return { cards, oddIndex };
}
function makeCountCards(level: number) {
  const total = Math.min(60, 16 + level * 3);
  const target = COUNT_TARGETS[(level - 1) % COUNT_TARGETS.length];
  const targetCount = Math.min(total - 5, Math.max(4, 3 + level + Math.floor(Math.random() * 3)));
  const distractors = [...EMOJIS, "🍇", "🍉", "🥝", "🍑", "🚗", "✈️", "🏀", "🎁"].filter((item) => item !== target);
  const cards = [
    ...Array.from({ length: targetCount }, () => target),
    ...Array.from({ length: total - targetCount }, () => distractors[Math.floor(Math.random() * distractors.length)]),
  ];
  return { cards: shuffle(cards), target, targetCount };
}
function buildReminders(data: AppData, today: string): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  data.transactions.forEach((entry) => {
    if (remaining(entry) > 0 && entry.dueDate) {
      const delta = Math.round((new Date(`${entry.dueDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);
      if (delta <= 7) reminders.push({ id: `money-${entry.id}`, title: `${entry.direction === "given" ? "Return from" : "Repay"} ${entry.person}`, detail: `${money(remaining(entry))} ${entry.direction === "given" ? "to receive" : "to pay"}`, when: entry.dueDate, kind: "money", enabled: data.settings.notifications });
    }
  });
  data.routines.forEach((routine) => {
    if (routine.reminder && routine.days.includes(dayIndex(today)) && !routine.doneDates.includes(today)) {
      reminders.push({ id: `routine-${routine.id}`, title: routine.name, detail: `${routine.time} · daily routine`, when: today, kind: "routine", enabled: data.settings.notifications });
    }
  });
  data.notes.forEach((note) => {
    if (note.reminder && note.reminderDate) reminders.push({ id: `note-${note.id}`, title: note.title, detail: "Personal note reminder", when: note.reminderDate, kind: "note", enabled: data.settings.notifications });
  });
  return reminders.sort((a, b) => a.when.localeCompare(b.when));
}
function calculateStreak(days: string[]) {
  const set = new Set(days);
  let start = set.has(localDate()) ? 0 : 1;
  let streak = 0;
  for (let i = start; i < 365; i += 1) {
    if (set.has(dateOffset(-i))) streak += 1;
    else break;
  }
  return streak;
}
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
function formatGameTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function HomePage() {
  const [data, setData] = useState<AppData>(() => makeSeedData());
  const [hydrated, setHydrated] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [moneyTab, setMoneyTab] = useState<"all" | Direction>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EntryStatus>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [moneyModal, setMoneyModal] = useState(false);
  const [moneyEditId, setMoneyEditId] = useState<string | null>(null);
  const [moneyForm, setMoneyForm] = useState({ direction: "given" as Direction, person: "", amount: "", paid: "0", date: localDate(), dueDate: "", note: "" });
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [noteModal, setNoteModal] = useState(false);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "", pinned: false, important: false, reminder: false, reminderDate: "" });
  const [noteFilter, setNoteFilter] = useState<"all" | "pinned" | "important">("all");
  const [routineModal, setRoutineModal] = useState(false);
  const [routineEditId, setRoutineEditId] = useState<string | null>(null);
  const [routineForm, setRoutineForm] = useState({ name: "", time: "08:00", frequency: "Daily" as Frequency, days: [0, 1, 2, 3, 4, 5, 6], reminder: true });
  const [routineFilter, setRoutineFilter] = useState<"all" | Frequency>("all");
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameNow, setGameNow] = useState(() => Date.now());
  const [showAllReminders, setShowAllReminders] = useState(false);
  const [routineNow, setRoutineNow] = useState(() => Date.now());
  const [pushStatus, setPushStatus] = useState<"off" | "on" | "working" | "denied" | "unsupported" | "iframe">("off");
  const [pushBanner, setPushBanner] = useState(false);
  const [pushPrompt, setPushPrompt] = useState(false);
  const [pushDiag, setPushDiag] = useState<{ secure: boolean; embedded: boolean; sw: boolean; push: boolean; permission: string }>({ secure: true, embedded: false, sw: true, push: true, permission: "default" });
  const [historyRange, setHistoryRange] = useState<7 | 30 | 90 | 0>(7);
  const [historyRoutine, setHistoryRoutine] = useState("all");
  const [missModal, setMissModal] = useState<{ routineId: string; date: string; reason: string; note: string } | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memoryLock = useRef(false);
  const gameComplete = useRef(false);
  const gameSessionRef = useRef<GameSession | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const autoPushBusy = useRef(false);
  const lang = data.settings.language;
  const t = copy[lang];
  const today = localDate();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AppData>;
        const fresh = makeSeedData();
        const savedGames = (parsed.games ?? {}) as Partial<Record<GameKey, GameRecord>>;
        const cleanGames = GAME_KEYS.reduce<Record<GameKey, GameRecord>>((records, key) => {
          records[key] = { ...fresh.games[key], ...(savedGames[key] ?? {}) };
          return records;
        }, {} as Record<GameKey, GameRecord>);
        const cleanRoutines = (parsed.routines ?? fresh.routines).map((routine) => ({ ...routine, doneDates: routine.doneDates ?? [], missLog: routine.missLog ?? [] }));
        setData({ ...fresh, ...parsed, settings: { ...fresh.settings, ...(parsed.settings ?? {}) }, games: cleanGames, routines: cleanRoutines });
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!toast) return;
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    notificationTimer.current = setTimeout(() => setToast(""), 3000);
    return () => { if (notificationTimer.current) clearTimeout(notificationTimer.current); };
  }, [toast]);

  useEffect(() => {
    gameSessionRef.current = gameSession;
  }, [gameSession]);

  useEffect(() => () => {
    if (memoryTimer.current) clearTimeout(memoryTimer.current);
    if (numberTimer.current) clearTimeout(numberTimer.current);
  }, []);

  useEffect(() => {
    if (!gameSession || gameSession.mode === "complete") return;
    setGameNow(Date.now());
    const interval = setInterval(() => setGameNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [gameSession?.game, gameSession?.level, gameSession?.mode]);

  useEffect(() => {
    setRoutineNow(Date.now());
    const interval = setInterval(() => setRoutineNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const diag = readPushEnvironment();
    setPushDiag(diag);
    const enabled = window.localStorage.getItem("by-push-enabled") === "1";
    if (diag.embedded) { setPushStatus("iframe"); setPushBanner(true); return; }
    if (!diag.secure || !diag.sw || !diag.push) { setPushStatus("unsupported"); return; }
    if (diag.permission === "granted") {
      setPushStatus(enabled ? "on" : "working");
      void autoEnablePhoneAlerts();
      return;
    }
    if (diag.permission === "denied") { setPushStatus("denied"); setPushBanner(true); return; }
    // First visit: ask straight away, then again on the first tap if the browser
    // needs a user gesture before it shows its permission prompt.
    // Show the prompt immediately, but only call requestPermission from a real
    // tap (the Allow button or the first interaction listener) so browsers never
    // silently mark this site as "blocked".
    setPushBanner(true);
    setPushPrompt(true);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    let done = false;
    const ask = () => {
      if (done) return;
      done = true;
      void autoEnablePhoneAlerts();
    };
    window.addEventListener("pointerdown", ask, { once: true });
    window.addEventListener("keydown", ask, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (window.localStorage.getItem("by-push-enabled") !== "1") return;
    const timer = setTimeout(() => { void syncAlarmsToServer(); }, 700);
    return () => clearTimeout(timer);
  }, [hydrated, data.routines]);

  useEffect(() => {
    if (!hydrated || !data.settings.notifications) return;
    const checkRoutineAlarms = () => {
      const now = new Date();
      const day = localDate(now);
      const current = now.getHours() * 60 + now.getMinutes();
      const pending = data.routines.filter((routine) => routine.reminder && routine.days.includes(dayIndex(day)) && !routine.doneDates.includes(day));
      pending.forEach((routine) => {
        const due = minutesOfDay(routine.time);
        if (current < due || current >= due + 20) return;
        const key = `by-alert-${day}-${routine.id}-start`;
        if (window.localStorage.getItem(key)) return;
        window.localStorage.setItem(key, "1");
        void sendRoutineAlert(routine, "start");
      });
      const overdue = pending.filter((routine) => current >= minutesOfDay(routine.time) + 20);
      const overdueKey = `by-alert-${day}-overdue`;
      if (overdue.length && !window.localStorage.getItem(overdueKey)) {
        window.localStorage.setItem(overdueKey, "1");
        const motivation = motivationFor(day);
        void sendDeviceNotification(
          `${overdue.length} routine${overdue.length > 1 ? "s" : ""} still waiting ⏰`,
          `${overdue.map((routine) => routine.name).slice(0, 3).join(", ")} — time is over. ${motivation.body} You can still log a reason if today is difficult.`,
          "overdue",
        );
      }
    };
    checkRoutineAlarms();
    const interval = setInterval(checkRoutineAlarms, 30000);
    return () => clearInterval(interval);
  }, [hydrated, data.settings.notifications, data.routines]);

  const sectionTitles: Record<Section, string> = { overview: t.overview, money: t.money, notes: t.notes, routines: t.routines, games: t.games, reminders: t.reminders, settings: t.settings };
  const totalReceive = data.transactions.filter((entry) => entry.direction === "given").reduce((sum, entry) => sum + remaining(entry), 0);
  const totalPay = data.transactions.filter((entry) => entry.direction === "taken").reduce((sum, entry) => sum + remaining(entry), 0);
  const scheduledRoutines = data.routines.filter((routine) => routine.days.includes(dayIndex(today)));
  const completedRoutines = scheduledRoutines.filter((routine) => routine.doneDates.includes(today)).length;
  const routineProgress = scheduledRoutines.length ? Math.round((completedRoutines / scheduledRoutines.length) * 100) : 0;
  const reminders = useMemo(() => buildReminders(data, today), [data, today]);
  useEffect(() => {
    if (!hydrated || !data.settings.notifications || typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
    const sentKey = `better-you-notified-${today}`;
    let sent = new Set<string>();
    try { sent = new Set(JSON.parse(window.sessionStorage.getItem(sentKey) ?? "[]") as string[]); } catch { sent = new Set(); }
    let changed = false;
    reminders.filter((item) => item.enabled && item.when <= today && item.kind !== "routine").forEach((item) => {
      if (sent.has(item.id)) return;
      sent.add(item.id);
      changed = true;
      void sendDeviceNotification(item.title, `${item.detail} · ${item.when === today ? "Due today" : "Past due"}`, "start", false);
    });
    if (changed) window.sessionStorage.setItem(sentKey, JSON.stringify([...sent]));
  }, [hydrated, data.settings.notifications, reminders, today]);
  const gameStreak = calculateStreak(data.gameDays);
  const routineDays = Array.from({ length: 7 }, (_, index) => {
    const monday = dayIndex(today);
    const date = dateOffset(index - monday);
    const scheduled = data.routines.filter((routine) => routine.days.includes(dayIndex(date)));
    const done = scheduled.filter((routine) => routine.doneDates.includes(date)).length;
    return { date, label: WEEKDAY_SHORT[index], done, total: scheduled.length };
  });
  const recentNotes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);

  function notify(message: string) { setToast(message); }
  function changeSection(section: Section) { setActiveSection(section); setSearch(""); }
  function setSetting<K extends keyof AppData["settings"]>(key: K, value: AppData["settings"][K]) {
    setData((current) => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  function openMoneyForm(entry?: Transaction) {
    setMoneyEditId(entry?.id ?? null);
    setMoneyForm(entry ? { direction: entry.direction, person: entry.person, amount: String(entry.amount), paid: String(entry.paid), date: entry.date, dueDate: entry.dueDate, note: entry.note } : { direction: "given", person: "", amount: "", paid: "0", date: today, dueDate: "", note: "" });
    setMoneyModal(true);
    setSelectedTransactionId(null);
  }
  function saveMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(moneyForm.amount);
    const paid = Math.min(amount, Math.max(0, Number(moneyForm.paid) || 0));
    if (!moneyForm.person.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setData((current) => {
      if (moneyEditId) return { ...current, transactions: current.transactions.map((entry) => entry.id === moneyEditId ? { ...entry, ...moneyForm, person: moneyForm.person.trim(), amount, paid, payments: entry.payments } : entry) };
      return { ...current, transactions: [{ ...moneyForm, id: idFor("tx"), person: moneyForm.person.trim(), amount, paid, payments: paid > 0 ? [{ amount: paid, date: moneyForm.date || today }] : [] }, ...current.transactions] };
    });
    setMoneyModal(false);
    notify(moneyEditId ? "Money entry updated" : "Money entry saved");
  }
  function addPayment(entry: Transaction) {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining(entry)) return;
    setData((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === entry.id ? { ...item, paid: Math.min(item.amount, item.paid + amount), payments: [...item.payments, { amount, date: today }] } : item) }));
    setPaymentAmount("");
    notify("Payment added to the history");
  }
  function markEntryPaid(entry: Transaction) {
    const balance = remaining(entry);
    if (balance <= 0) return;
    setData((current) => ({ ...current, transactions: current.transactions.map((item) => item.id === entry.id ? { ...item, paid: item.amount, payments: [...item.payments, { amount: balance, date: today }] } : item) }));
    notify("Marked as fully paid");
  }
  function deleteTransaction(entry: Transaction) {
    if (!window.confirm(`Delete the entry for ${entry.person}?`)) return;
    setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== entry.id) }));
    setSelectedTransactionId(null);
    notify("Money entry deleted");
  }

  function openNoteForm(note?: PersonalNote) {
    setNoteEditId(note?.id ?? null);
    setNoteForm(note ? { title: note.title, content: note.content, pinned: note.pinned, important: note.important, reminder: note.reminder, reminderDate: note.reminderDate } : { title: "", content: "", pinned: false, important: false, reminder: false, reminderDate: "" });
    setNoteModal(true);
  }
  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteForm.title.trim()) return;
    const now = new Date().toISOString();
    setData((current) => noteEditId ? { ...current, notes: current.notes.map((note) => note.id === noteEditId ? { ...note, ...noteForm, title: noteForm.title.trim(), updatedAt: now } : note) } : { ...current, notes: [{ ...noteForm, id: idFor("note"), title: noteForm.title.trim(), createdAt: now, updatedAt: now }, ...current.notes] });
    setNoteModal(false);
    notify(noteEditId ? "Note updated" : "Note saved on this device");
  }
  function toggleNoteFlag(noteId: string, field: "pinned" | "important") {
    setData((current) => ({ ...current, notes: current.notes.map((note) => note.id === noteId ? { ...note, [field]: !note[field], updatedAt: new Date().toISOString() } : note) }));
  }
  function deleteNote(noteId: string) {
    if (!window.confirm("Delete this note?")) return;
    setData((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== noteId) }));
    setNoteModal(false);
    notify("Note deleted");
  }

  function openRoutineForm(routine?: Routine) {
    setRoutineEditId(routine?.id ?? null);
    setRoutineForm(routine ? { name: routine.name, time: routine.time, frequency: routine.frequency, days: [...routine.days], reminder: routine.reminder } : { name: "", time: "08:00", frequency: "Daily", days: [0, 1, 2, 3, 4, 5, 6], reminder: true });
    setRoutineModal(true);
  }
  function saveRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!routineForm.name.trim()) return;
    setData((current) => routineEditId ? { ...current, routines: current.routines.map((routine) => routine.id === routineEditId ? { ...routine, ...routineForm, name: routineForm.name.trim() } : routine) } : { ...current, routines: [{ ...routineForm, id: idFor("routine"), name: routineForm.name.trim(), doneDates: [], missLog: [] }, ...current.routines] });
    setRoutineModal(false);
    notify(routineEditId ? "Routine updated" : "Routine added" );
  }
  function toggleRoutineDone(routine: Routine, date = today) {
    const done = routine.doneDates.includes(date);
    setData((current) => ({ ...current, routines: current.routines.map((item) => item.id === routine.id ? { ...item, doneDates: done ? item.doneDates.filter((value) => value !== date) : [...item.doneDates, date], missLog: done ? item.missLog : item.missLog.filter((miss) => miss.date !== date) } : item) }));
  }
  function deleteRoutine(routine: Routine) {
    if (!window.confirm(`Delete “${routine.name}”?`)) return;
    setData((current) => ({ ...current, routines: current.routines.filter((item) => item.id !== routine.id) }));
    setRoutineModal(false);
    notify("Routine deleted");
  }

  function readPushEnvironment() {
    if (typeof window === "undefined") return { secure: true, embedded: false, sw: false, push: false, permission: "unsupported" };
    let embedded = false;
    try { embedded = window.self !== window.top; } catch { embedded = true; }
    return {
      secure: window.isSecureContext !== false,
      embedded,
      sw: "serviceWorker" in navigator,
      push: "PushManager" in window,
      permission: "Notification" in window ? Notification.permission : "unsupported",
    };
  }
  function openStandaloneApp() {
    const url = new URL(window.location.href);
    url.searchParams.set("push", "1");
    const opened = window.open(url.toString(), "_blank", "noopener,noreferrer");
    if (!opened) notify("Pop-up blocked. Open this page’s link directly in a new browser tab.");
    else notify("Opened in a new tab — tap “Turn on phone alerts” there once.");
  }
  async function syncAlarmsToServer() {
    const alarms = data.routines.filter((routine) => routine.reminder).map((routine) => ({ id: routine.id, name: routine.name, time: routine.time, days: routine.days }));
    try {
      await fetch("/api/push/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alarms }) });
      return true;
    } catch { return false; }
  }
  async function registerAndSubscribePush(): Promise<"on" | "denied" | "unsupported" | "iframe" | "error"> {
    if (typeof window === "undefined") return "unsupported";
    const diag = readPushEnvironment();
    setPushDiag(diag);
    if (!diag.secure) return "unsupported";
    if (diag.embedded) return "iframe";
    if (!diag.sw || !("Notification" in window) || !diag.push) return "unsupported";
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
    } catch { return "unsupported"; }
    if (!registration.pushManager) return "unsupported";
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPushDiag(readPushEnvironment());
      if (permission !== "granted") return "denied";
      const keyResponse = await fetch("/api/push/key");
      const { publicKey } = await keyResponse.json() as { publicKey?: string };
      if (!publicKey) return "error";
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const raw = subscription.toJSON();
      const saved = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint, keys: raw.keys, tzOffset: new Date().getTimezoneOffset() }) });
      if (!saved.ok) return "error";
      const synced = await syncAlarmsToServer();
      if (!synced) return "error";
      window.localStorage.setItem("by-push-enabled", "1");
      setPushStatus("on");
      setPushBanner(false);
      return "on";
    } catch { return "error"; }
  }
  async function autoEnablePhoneAlerts() {
    if (typeof window === "undefined" || autoPushBusy.current) return;
    const diag = readPushEnvironment();
    if (diag.embedded || !diag.secure || !diag.sw || !diag.push) return;
    autoPushBusy.current = true;
    setPushStatus("working");
    const result = await registerAndSubscribePush();
    setPushStatus(result === "on" ? "on" : result === "denied" ? "denied" : result === "iframe" ? "iframe" : "off");
    autoPushBusy.current = false;
    if (result === "on") notify("Phone notifications allowed — reminders now arrive on your phone directly.");
  }
  async function enablePhoneAlerts() {
    if (typeof window === "undefined") return;
    const diag = readPushEnvironment();
    setPushDiag(diag);
    if (!diag.secure) {
      setPushStatus("unsupported");
      notify("Phone notifications need an HTTPS link. Open the app on its https:// address.");
      return;
    }
    // Permission prompts are blocked inside embedded preview frames, so continue in a real tab.
    if (diag.embedded) {
      setPushStatus("iframe");
      openStandaloneApp();
      return;
    }
    setPushStatus("working");
    const result = await registerAndSubscribePush();
    setPushStatus(result === "on" ? "on" : result === "denied" ? "denied" : result === "iframe" ? "iframe" : result === "unsupported" ? "unsupported" : "off");
    if (result === "on") { notify("Phone notifications are on — reminders arrive directly on your phone."); return; }
    if (result === "denied") { notify("Notifications are blocked. Allow them in your browser’s site settings, then retry."); return; }
    if (result === "unsupported") { notify("This browser cannot show background notifications. Try Chrome on Android or add the app to your iPhone Home Screen."); return; }
    if (result === "error") { notify("Couldn’t connect this phone for notifications. Please retry."); return; }
    openStandaloneApp();
  }
  async function sendBackgroundTest() {
    const result = await fetch("/api/push/test", { method: "POST" });
    const data = await result.json() as { sent?: number };
    notify(data.sent ? "Test sent — check your phone’s notification panel" : "No device is subscribed yet. Turn on phone alerts first.");
  }
  function ensureAudio() {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioRef.current = new Ctx();
    }
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  }
  function playChime(kind: "start" | "overdue" = "start") {
    if (!data.settings.sound) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const notes = kind === "overdue" ? [523.25, 440, 349.23] : [659.25, 880];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const start = ctx.currentTime + index * 0.3;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.22, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.7);
    });
  }
  async function sendDeviceNotification(title: string, body: string, kind: "start" | "overdue" = "start", chime = true) {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") { if (chime) playChime(kind); return; }
    const options = {
      body,
      tag: `better-you-${kind}-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      vibrate: [220, 100, 220],
      data: { url: "/" },
    } as NotificationOptions & { renotify: boolean; vibrate: number[] };
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration() ?? await navigator.serviceWorker.register("/sw.js");
        await registration.showNotification(`Better You · ${title}`, options);
      } else {
        new Notification(`Better You · ${title}`, options);
      }
    } catch {
      try { new Notification(`Better You · ${title}`, options); } catch { /* in-app reminder still visible */ }
    }
    if (chime) playChime(kind);
  }
  async function sendRoutineAlert(routine: Routine, kind: "start" | "overdue") {
    const motivation = motivationFor(today);
    const title = kind === "start" ? `Time for: ${routine.name}` : `Time over: ${routine.name}`;
    const body = kind === "start"
      ? `${routine.time} · ${motivation.icon} ${motivation.body}`
      : `You haven’t checked this one yet. ${motivation.body} If today is not possible, log the reason in Better You.`;
    if (!("Notification" in window) || Notification.permission !== "granted") {
      notify("Allow phone notifications so routine alerts reach your notification panel.");
    }
    await sendDeviceNotification(title, body, kind);
  }
  function toggleSound() {
    const next = !data.settings.sound;
    if (next) { ensureAudio(); playChime("start"); }
    setSetting("sound", next);
    notify(next ? "Alarm sound is on. Keep the app open for routine alerts." : "Alarm sound is off");
  }
  function openMissForm(routine: Routine, date = today) {
    const existing = routine.missLog.find((item) => item.date === date);
    setMissModal({ routineId: routine.id, date, reason: existing?.reason ?? "", note: existing?.note ?? "" });
  }
  function saveMiss(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!missModal) return;
    const reason = missModal.reason.trim();
    if (!reason) return;
    setData((current) => ({
      ...current,
      routines: current.routines.map((routine) => routine.id !== missModal.routineId ? routine : {
        ...routine,
        doneDates: routine.doneDates.filter((date) => date !== missModal.date),
        missLog: [...routine.missLog.filter((item) => item.date !== missModal.date), { date: missModal.date, reason, note: missModal.note.trim() }],
      }),
    }));
    setMissModal(null);
    notify("Reason saved. Understanding the miss helps you return stronger.");
  }

  function recordGameResult(score: number) {
    if (gameComplete.current || !gameSession) return;
    gameComplete.current = true;
    const game = gameSession.game;
    const elapsed = gameSession.startedAt ? Math.max(0, Math.floor((Date.now() - gameSession.startedAt) / 1000)) : gameSession.elapsed ?? 0;
    setData((current) => {
      const record = current.games[game] ?? { level: 1, bestScore: 0, lastScore: 0, plays: 0 };
      return { ...current, games: { ...current.games, [game]: { ...record, level: Math.max(record.level, gameSession.level + 1), bestScore: Math.max(record.bestScore, score), lastScore: score, plays: record.plays + 1 } }, gameDays: Array.from(new Set([...current.gameDays, today])) };
    });
    setGameSession((current) => current ? { ...current, mode: "complete", score, elapsed } : current);
  }
  function startGame(game: GameKey, levelOverride?: number) {
    if (memoryTimer.current) clearTimeout(memoryTimer.current);
    if (numberTimer.current) clearTimeout(numberTimer.current);
    memoryLock.current = false;
    const level = levelOverride ?? data.games[game]?.level ?? 1;
    const startedAt = Date.now();
    setGameNow(startedAt);
    gameComplete.current = false;
    if (game === "memory") {
      const pairs = 3 + level;
      const faces = Array.from({ length: pairs }, (_, index) => `${EMOJIS[index % EMOJIS.length]}${index < EMOJIS.length ? "" : `|${Math.floor(index / EMOJIS.length) + 1}`}`);
      const cards = shuffle([...faces, ...faces]);
      setGameSession({ game, level, mode: "playing", cards, flipped: [], matched: [], moves: 0, startedAt, elapsed: 0 });
    } else if (game === "math") {
      setGameSession({ game, level, mode: "playing", question: createQuestion(level), answer: "", startedAt, elapsed: 0 });
    } else if (game === "number") {
      const digits = 3 + level;
      const sequence = randomDigits(digits);
      setGameSession({ game, level, mode: "memorize", sequence, answer: "", moves: 0, startedAt, elapsed: 0 });
      const delay = Math.min(12000, 1400 + digits * 420);
      numberTimer.current = setTimeout(() => {
        setGameSession((current) => current?.game === "number" && current.sequence === sequence && current.mode === "memorize" ? { ...current, mode: "recall", answer: "" } : current);
      }, delay);
    } else if (game === "odd") {
      const { cards, oddIndex } = makeOddCards(level);
      setGameSession({ game, level, mode: "playing", cards, oddIndex, moves: 0, feedback: "", startedAt, elapsed: 0 });
    } else {
      const { cards, target, targetCount } = makeCountCards(level);
      setGameSession({ game, level, mode: "playing", cards, target, targetCount, answer: "", moves: 0, feedback: "", startedAt, elapsed: 0 });
    }
  }
  function closeGame() {
    if (memoryTimer.current) clearTimeout(memoryTimer.current);
    if (numberTimer.current) clearTimeout(numberTimer.current);
    memoryLock.current = false;
    setGameSession(null);
  }
  function hideNumber() {
    if (!gameSession || gameSession.game !== "number" || gameSession.mode !== "memorize") return;
    if (numberTimer.current) clearTimeout(numberTimer.current);
    setGameSession({ ...gameSession, mode: "recall", answer: "" });
  }
  function submitNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameSession || gameSession.game !== "number" || gameSession.mode !== "recall") return;
    const typed = (gameSession.answer ?? "").replace(/\s/g, "");
    if (typed === gameSession.sequence) {
      recordGameResult(160 + (gameSession.sequence?.length ?? 0) * 35 + gameSession.level * 20);
    } else {
      setGameSession({ ...gameSession, feedback: "Not quite. Look at the length and try once more." });
    }
  }
  function chooseOdd(index: number) {
    if (!gameSession || gameSession.game !== "odd" || gameSession.mode !== "playing") return;
    if (index === gameSession.oddIndex) {
      const total = gameSession.cards?.length ?? 0;
      const mistakes = gameSession.moves ?? 0;
      recordGameResult(Math.max(60, 240 + gameSession.level * 30 + total * 4 - mistakes * 25));
    } else {
      setGameSession({ ...gameSession, moves: (gameSession.moves ?? 0) + 1, feedback: "That one matches the group. Keep scanning." });
    }
  }
  function submitCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameSession || gameSession.game !== "count" || gameSession.mode !== "playing") return;
    if (Number(gameSession.answer) === gameSession.targetCount) {
      recordGameResult(170 + (gameSession.cards?.length ?? 0) * 3 + gameSession.level * 30);
    } else {
      setGameSession({ ...gameSession, feedback: "Close guess. Count only the target symbol, slowly." });
    }
  }
  function revealMemory(index: number) {
    if (!gameSession || gameSession.game !== "memory" || gameSession.mode !== "playing" || memoryLock.current) return;
    const flipped = gameSession.flipped ?? [];
    const matched = gameSession.matched ?? [];
    // Lock the board while a mismatch is being shown. Without this guard a third
    // tap could pair the wrong cards and leave one card permanently unmatched.
    if (flipped.length >= 2) return;
    if (matched.includes(index)) return;
    if (!flipped.length) {
      setGameSession({ ...gameSession, flipped: [index] });
      return;
    }
    if (flipped.includes(index)) {
      setGameSession({ ...gameSession, flipped: [] });
      return;
    }
    const first = flipped[0];
    const nextMoves = (gameSession.moves ?? 0) + 1;
    const sessionId = gameSession.level;
    if (gameSession.cards?.[first] === gameSession.cards?.[index]) {
      const nextMatched = [...matched, first, index];
      setGameSession({ ...gameSession, flipped: [], matched: nextMatched, moves: nextMoves });
      if (nextMatched.length === gameSession.cards?.length) {
        const score = Math.max(50, 650 - nextMoves * 14 + gameSession.level * 25);
        memoryLock.current = true;
        if (memoryTimer.current) clearTimeout(memoryTimer.current);
        memoryTimer.current = setTimeout(() => {
          memoryLock.current = false;
          if (gameSessionRef.current?.game === "memory" && gameSessionRef.current.level === sessionId) recordGameResult(score);
        }, 450);
      }
    } else {
      setGameSession({ ...gameSession, flipped: [first, index], moves: nextMoves });
      memoryLock.current = true;
      if (memoryTimer.current) clearTimeout(memoryTimer.current);
      memoryTimer.current = setTimeout(() => {
        memoryLock.current = false;
        setGameSession((current) => current?.game === "memory" && current.mode === "playing" ? { ...current, flipped: [] } : current);
      }, 720);
    }
  }
  function submitMath(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gameSession || gameSession.game !== "math") return;
    if (Number(gameSession.answer) === gameSession.question?.answer) recordGameResult(180 + gameSession.level * 35);
    else setGameSession({ ...gameSession, feedback: "Not quite—give it another go." });
  }
  const filteredTransactions = data.transactions.filter((entry) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${entry.person} ${entry.note} ${entry.amount} ${remaining(entry)}`.toLowerCase().includes(q);
    return matchesSearch && (moneyTab === "all" || entry.direction === moneyTab) && (statusFilter === "all" || getEntryStatus(entry) === statusFilter)
      && (!fromDate || entry.date >= fromDate) && (!toDate || entry.date <= toDate)
      && (!minAmount || entry.amount >= Number(minAmount)) && (!maxAmount || entry.amount <= Number(maxAmount));
  }).sort((a, b) => b.date.localeCompare(a.date));
  const filteredNotes = data.notes.filter((note) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || `${note.title} ${note.content}`.toLowerCase().includes(q);
    return matchesSearch && (noteFilter === "all" || (noteFilter === "pinned" ? note.pinned : note.important));
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const filteredRoutines = data.routines.filter((routine) => routineFilter === "all" || routine.frequency === routineFilter);
  const selectedTransaction = data.transactions.find((entry) => entry.id === selectedTransactionId) ?? null;
  const shownReminders = showAllReminders ? reminders : reminders.slice(0, 5);
  const activeGameElapsed = gameSession ? gameSession.mode === "complete" ? gameSession.elapsed ?? 0 : Math.max(0, Math.floor((gameNow - (gameSession.startedAt ?? gameNow)) / 1000)) : 0;
  const routineClock = new Date(routineNow);
  const routineMinuteNow = routineClock.getHours() * 60 + routineClock.getMinutes();
  const todayMotivation = motivationFor(today);
  const overdueRoutines = scheduledRoutines.filter((routine) => !routine.doneDates.includes(today) && routineMinuteNow >= minutesOfDay(routine.time) + 20);
  const dueRoutines = scheduledRoutines.filter((routine) => !routine.doneDates.includes(today) && routineMinuteNow >= minutesOfDay(routine.time) && routineMinuteNow < minutesOfDay(routine.time) + 20);
  const historyDays = historyRange === 0
    ? Math.min(180, Math.max(7, ...data.routines.flatMap((routine) => [...routine.doneDates, ...routine.missLog.map((miss) => miss.date)]).map((date) => Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) / 86400000) + 1)))
    : historyRange;
  const historyRoutines = data.routines.filter((routine) => historyRoutine === "all" || routine.id === historyRoutine);
  const historyRows = Array.from({ length: historyDays }, (_, index) => {
    const date = dateOffset(-index);
    const weekday = dayIndex(date);
    const entries = historyRoutines.filter((routine) => routine.days.includes(weekday)).map((routine) => {
      const miss = routine.missLog.find((item) => item.date === date);
      const status: "done" | "missed" | "open" = routine.doneDates.includes(date) ? "done" : miss ? "missed" : date < today ? "open" : routineMinuteNow >= minutesOfDay(routine.time) + 20 ? "open" : "open";
      return { routine, miss, status };
    });
    return { date, entries };
  }).filter((row) => row.entries.length > 0);
  const historyScheduled = historyRows.reduce((total, row) => total + row.entries.length, 0);
  const historyDone = historyRows.reduce((total, row) => total + row.entries.filter((entry) => entry.status === "done").length, 0);
  const historyMissed = historyRows.reduce((total, row) => total + row.entries.filter((entry) => entry.status === "missed").length, 0);
  const historyRate = historyScheduled ? Math.round((historyDone / historyScheduled) * 100) : 0;

  function exportData() {
    const rows = [
      ["Type", "Title / Person", "Amount", "Paid", "Remaining", "Date", "Due date", "Status", "Note / Content"],
      ...data.transactions.map((entry) => [entry.direction === "given" ? "Money given" : "Money taken", entry.person, entry.amount, entry.paid, remaining(entry), entry.date, entry.dueDate, getEntryStatus(entry), entry.note]),
      ...data.notes.map((note) => ["Note", note.title, "", "", "", note.createdAt.slice(0, 10), "", note.important ? "Important" : "", note.content.replaceAll("\n", " ")]),
      ...data.routines.map((routine) => ["Routine", routine.name, "", "", "", "", routine.time, routine.frequency, `Days: ${routine.days.map((day) => WEEKDAY_SHORT[day]).join(" ")}`]),
      ...data.routines.flatMap((routine) => routine.missLog.map((miss) => ["Missed routine", routine.name, "", "", "", miss.date, routine.time, "Missed", `Reason: ${miss.reason}${miss.note ? ` — ${miss.note}` : ""}`])),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "better-you-backup.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Your CSV export is ready");
  }
  async function toggleNotifications() {
    const next = !data.settings.notifications;
    let browserAllowed = true;
    if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      try { browserAllowed = await Notification.requestPermission() === "granted"; } catch { browserAllowed = false; }
    } else if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "denied") {
      browserAllowed = false;
    }
    setSetting("notifications", next);
    notify(next ? browserAllowed ? "Reminders are on" : "In-app reminders are on; browser alerts need permission" : "Reminders are paused");
  }
  function resetLocalData() {
    if (!window.confirm("Reset all Better You data stored on this device? This cannot be undone.")) return;
    window.localStorage.removeItem(STORAGE_KEY);
    const fresh = makeSeedData();
    setData(fresh);
    notify("Local data has been reset");
  }

  const greeting = new Date().getHours() < 12 ? t.goodMorning : new Date().getHours() < 17 ? t.goodAfternoon : t.goodEvening;
  const title = sectionTitles[activeSection];

  return (
    <main className={`app-shell ${data.settings.darkMode ? "" : "light-mode"}`} data-text-size={data.settings.textSize}>
      <aside className="sidebar">
        <button className="brand-lockup" onClick={() => changeSection("overview")} aria-label="Better You home">
          <span className="brand-mark"><span>✦</span></span>
          <span className="brand-words">better<span>you</span><small>YOUR LITTLE EVERYDAY WIN</small></span>
        </button>
        <div className="nav-caption">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {(["overview", "money", "notes", "routines", "games"] as Section[]).map((section) => {
            const icons: Record<string, string> = { overview: "◈", money: "₹", notes: "▤", routines: "◷", games: "✧" };
            return <button key={section} className={`nav-item ${activeSection === section ? "active" : ""}`} onClick={() => changeSection(section)}><span className="nav-icon">{icons[section]}</span><span>{sectionTitles[section]}</span>{section === "games" && gameStreak > 0 && <span className="nav-trailing">{gameStreak}🔥</span>}</button>;
          })}
        </nav>
        <div className="nav-caption nav-caption-spaced">KEEP IN MIND</div>
        <nav className="side-nav">
          <button className={`nav-item ${activeSection === "reminders" ? "active" : ""}`} onClick={() => changeSection("reminders")}><span className="nav-icon">♧</span><span>{t.reminders}</span>{reminders.length > 0 && <span className="nav-count">{reminders.length}</span>}</button>
          <button className={`nav-item ${activeSection === "settings" ? "active" : ""}`} onClick={() => changeSection("settings")}><span className="nav-icon">⚙</span><span>{t.settings}</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-privacy"><span className="privacy-orb">✦</span><div><strong>{t.localOnly}</strong><small>No account. No cloud. Just you.</small></div><span className="privacy-lock">⌑</span></div>
        <button className="profile-mini" onClick={() => changeSection("settings")}><span className="avatar avatar-profile">B</span><span className="profile-copy"><strong>Barun</strong><small>Personal space</small></span><span className="profile-more">···</span></button>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-heading"><div className="breadcrumb"><span>BETTER YOU</span><span className="crumb-divider">/</span><span>{title.toUpperCase()}</span></div><h1>{title}</h1></div>
          <div className="topbar-actions">
            <label className="top-search"><span className="search-symbol">⌕</span><input aria-label="Search" placeholder={activeSection === "notes" ? "Search your notes" : activeSection === "money" ? "Search transactions" : "Search anything"} value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label>
            <button className="top-icon-button notification-button" onClick={() => changeSection("reminders")} aria-label="Open reminders"><span>♧</span>{reminders.length > 0 && <i />}</button>
            <button className="top-icon-button theme-button" onClick={() => setSetting("darkMode", !data.settings.darkMode)} aria-label="Toggle light and dark mode">{data.settings.darkMode ? "☼" : "☾"}</button>
            <button className="top-profile" onClick={() => changeSection("settings")}><span className="avatar avatar-profile">B</span><span><strong>Barun</strong><small>My space</small></span><span className="chevron">⌄</span></button>
          </div>
        </header>

        <div className="content-area">
          {activeSection === "overview" && <>
            <section className="welcome-row">
              <div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR DAY, YOUR PACE <span className="eyebrow-date">{prettyDate(today, lang)}</span></div><h2>{greeting}, Barun <span className="wave">✦</span></h2><p>{t.daySubtitle} You’re doing better than you think.</p></div>
              <button className="button button-primary welcome-action" onClick={() => openMoneyForm()}><span>＋</span> {t.addEntry}</button>
            </section>

            <section className="summary-grid" aria-label="Financial and daily summary">
              <button className="summary-card summary-receive" onClick={() => { changeSection("money"); setMoneyTab("given"); }}><span className="summary-icon">↙</span><span className="summary-label">{t.toReceive}</span><strong>{money(totalReceive, lang)}</strong><span className="summary-foot">From {data.transactions.filter((entry) => entry.direction === "given" && remaining(entry) > 0).length} people <span>↗</span></span><span className="card-glow" /></button>
              <button className="summary-card summary-pay" onClick={() => { changeSection("money"); setMoneyTab("taken"); }}><span className="summary-icon">↗</span><span className="summary-label">{t.toPay}</span><strong>{money(totalPay, lang)}</strong><span className="summary-foot">Across {data.transactions.filter((entry) => entry.direction === "taken" && remaining(entry) > 0).length} entries <span>↗</span></span><span className="card-glow" /></button>
              <button className="summary-card summary-progress" onClick={() => changeSection("routines")}><span className="summary-icon">✳</span><span className="summary-label">{t.completedToday}</span><strong>{completedRoutines}<small> / {scheduledRoutines.length}</small></strong><div className="mini-progress"><span style={{ width: `${routineProgress}%` }} /></div><span className="summary-foot">{routineProgress >= 60 ? "A lovely start to your day" : "One small step at a time"}</span></button>
              <button className="summary-card summary-reminder" onClick={() => changeSection("reminders")}><span className="summary-icon">♧</span><span className="summary-label">{t.pendingReminders}</span><strong>{reminders.length}<small> {reminders.length === 1 ? "reminder" : "reminders"}</small></strong><span className="summary-foot">{reminders.length ? "Your next nudge is waiting" : "You’re all caught up"}</span><span className="reminder-spark">✧</span></button>
            </section>

            <section className="dashboard-main-grid">
              <div className="panel financial-panel">
                <div className="panel-heading"><div><div className="panel-kicker">A LITTLE FINANCIAL CLARITY</div><h3>Money at a glance</h3></div><button className="text-link" onClick={() => changeSection("money")}>{t.viewAll}<span> ↗</span></button></div>
                <div className="chart-legend"><span><i className="legend-cyan" />Given</span><span><i className="legend-pink" />Taken</span><span className="chart-range">Last 7 days <span>⌄</span></span></div>
                <div className="chart-area">
                  <div className="chart-axis"><span>₹15k</span><span>₹10k</span><span>₹5k</span><span>₹0</span></div>
                  <div className="chart-bars">
                    {Array.from({ length: 7 }, (_, index) => {
                      const day = dateOffset(index - dayIndex(today));
                      const given = data.transactions.filter((entry) => entry.date === day && entry.direction === "given").reduce((sum, entry) => sum + entry.amount, 0);
                      const taken = data.transactions.filter((entry) => entry.date === day && entry.direction === "taken").reduce((sum, entry) => sum + entry.amount, 0);
                      const scale = Math.max(12500, given, taken);
                      return <div className="chart-column" key={day}><div className="bar-pair"><span className="chart-bar bar-given" style={{ height: `${Math.max(given ? 12 : 4, Math.round(given / scale * 102))}px` }} title={`Given ${money(given, lang)}`} /><span className="chart-bar bar-taken" style={{ height: `${Math.max(taken ? 12 : 4, Math.round(taken / scale * 102))}px` }} title={`Taken ${money(taken, lang)}`} /></div><small>{WEEKDAY_SHORT[index]}</small></div>;
                    })}
                  </div>
                </div>
                <div className="chart-foot"><span><i className="legend-cyan" />Open balance to receive</span><strong>{money(totalReceive, lang)}</strong><span className="chart-foot-divider" /><span><i className="legend-pink" />Open balance to pay</span><strong>{money(totalPay, lang)}</strong></div>
              </div>

              <div className="panel progress-panel">
                <div className="panel-heading"><div><div className="panel-kicker">A WIN IS A WIN</div><h3>Your daily rhythm</h3></div><button className="round-link" onClick={() => changeSection("routines")}>↗</button></div>
                <div className="progress-center"><div className="progress-ring" style={{ "--progress": `${routineProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{completedRoutines}<span>/{scheduledRoutines.length}</span></strong><small>done today</small></div></div><div className="progress-caption"><strong>{routineProgress >= 80 ? "Beautifully done!" : "Keep your momentum"}</strong><span>Small habits make a big life.</span><div className="streak-line"><span>🔥</span><strong>{Math.max(1, calculateStreak(data.routines.flatMap((routine) => routine.doneDates)))} days</strong><small>current streak</small></div></div></div>
                <div className="week-progress">{routineDays.map((day) => <div className="week-day" key={day.date}><span className={`${day.total && day.done === day.total ? "week-dot done" : day.done > 0 ? "week-dot some" : "week-dot"}`}>{day.total && day.done === day.total ? "✓" : ""}</span><small>{day.label}</small></div>)}</div>
                <button className="progress-cta" onClick={() => changeSection("routines")}>See your routines <span>→</span></button>
              </div>
            </section>

            <section className="dashboard-bottom-grid">
              <div className="panel notes-preview-panel">
                <div className="panel-heading"><div><div className="panel-kicker">SAVED FOR LATER</div><h3>{t.recentNotes}</h3></div><button className="text-link" onClick={() => changeSection("notes")}>{t.viewAll}<span> ↗</span></button></div>
                <div className="recent-note-list">{recentNotes.map((note, index) => <button className="recent-note-row" key={note.id} onClick={() => { changeSection("notes"); openNoteForm(note); }}><span className={`note-mini-icon note-tone-${index % 3}`}>{note.important ? "✦" : "▤"}</span><span className="recent-note-copy"><strong>{note.title}</strong><small>{note.content.replaceAll("\n", " ")}</small></span><span className="note-row-end">{note.pinned ? "⌖" : "↗"}</span></button>)}{recentNotes.length === 0 && <div className="empty-inline">{t.noResults}</div>}</div>
              </div>
              <div className="panel game-preview-panel">
                <div className="panel-heading"><div><div className="panel-kicker">A QUICK BRAIN BREAK</div><h3>Ready for a tiny challenge?</h3></div><span className="game-orbit">✧</span></div>
                <div className="game-preview-content"><div className="brain-illustration">🧠<span>✦</span><i>✧</i></div><div><strong>{GAME_META.memory.title}</strong><span>Level {data.games.memory.level} is waiting for you.</span><small>✨ {gameStreak} day practice streak</small></div></div>
                <button className="button button-glow game-preview-button" onClick={() => { changeSection("games"); startGame("memory"); }}>{t.playGame}<span> →</span></button>
              </div>
            </section>
            <section className="quick-action-row"><span className="quick-action-label">{t.quickActions}</span><button onClick={() => openMoneyForm()}><span className="quick-icon q-money">₹</span>{t.addEntry}<b>＋</b></button><button onClick={() => openNoteForm()}><span className="quick-icon q-note">▤</span>{t.addNote}<b>＋</b></button><button onClick={() => openRoutineForm()}><span className="quick-icon q-routine">◷</span>{t.addRoutine}<b>＋</b></button><button onClick={() => changeSection("games")}><span className="quick-icon q-game">✧</span>{t.playGame}<b>→</b></button></section>
          </>}

          {activeSection === "money" && <>
            <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> PERSONAL FINANCE</div><h2>{t.moneyTitle}</h2><p>{t.moneySubtitle}</p></div><button className="button button-primary" onClick={() => openMoneyForm()}><span>＋</span> {t.addEntry}</button></section>
            <section className="money-totals"><div className="money-total-card total-in"><span className="money-total-icon">↙</span><div><small>{t.toReceive}</small><strong>{money(totalReceive, lang)}</strong></div><span className="money-total-caption">{data.transactions.filter((entry) => entry.direction === "given" && remaining(entry) > 0).length} open entries</span></div><div className="money-total-card total-out"><span className="money-total-icon">↗</span><div><small>{t.toPay}</small><strong>{money(totalPay, lang)}</strong></div><span className="money-total-caption">{data.transactions.filter((entry) => entry.direction === "taken" && remaining(entry) > 0).length} open entries</span></div><div className="money-total-card total-net"><span className="money-total-icon">◈</span><div><small>Net open balance</small><strong>{money(totalReceive - totalPay, lang)}</strong></div><span className="money-total-caption">{data.transactions.length} total records</span></div></section>
            <section className="panel money-list-panel">
              <div className="panel-heading money-heading"><div><div className="panel-kicker">YOUR TRANSACTIONS</div><h3>Every little detail, in one place</h3></div><button className="button button-secondary export-button" onClick={exportData}><span>↓</span> Export CSV</button></div>
              <div className="money-tabs"><button className={moneyTab === "all" ? "selected" : ""} onClick={() => setMoneyTab("all")}>{t.all}<span>{data.transactions.length}</span></button><button className={moneyTab === "given" ? "selected" : ""} onClick={() => setMoneyTab("given")}>{t.moneyGiven}<span>{data.transactions.filter((entry) => entry.direction === "given").length}</span></button><button className={moneyTab === "taken" ? "selected" : ""} onClick={() => setMoneyTab("taken")}>{t.moneyTaken}<span>{data.transactions.filter((entry) => entry.direction === "taken").length}</span></button></div>
              <div className="filter-grid"><label className="input-search"><span>⌕</span><input placeholder={t.search} value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="select-wrap"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | EntryStatus)}><option value="all">All statuses</option><option value="pending">{t.pending}</option><option value="partial">{t.partial}</option><option value="paid">{t.paid}</option></select><b>⌄</b></label><label className="date-filter"><span>From</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="date-filter"><span>To</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label><label className="amount-filter"><span>Min ₹</span><input type="number" min="0" placeholder="0" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} /></label><label className="amount-filter"><span>Max ₹</span><input type="number" min="0" placeholder="Any" value={maxAmount} onChange={(event) => setMaxAmount(event.target.value)} /></label></div>
              <div className="transaction-list">{filteredTransactions.map((entry) => { const status = getEntryStatus(entry); return <button className="transaction-row" key={entry.id} onClick={() => { setSelectedTransactionId(entry.id); setPaymentAmount(""); }}><span className={`person-avatar ${entry.direction === "given" ? "person-given" : "person-taken"}`}>{entry.person.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="transaction-person"><strong>{entry.person}</strong><small>{entry.direction === "given" ? "↙ Lent to" : "↗ Borrowed from"} · {prettyDate(entry.date, lang)}</small></span><span className="transaction-note">{entry.note || "No note added"}<small>Due {prettyDate(entry.dueDate, lang)}</small></span><span className="transaction-value"><strong>{money(entry.amount, lang)}</strong><small>{remaining(entry) > 0 ? `${money(remaining(entry), lang)} left` : "Fully settled"}</small></span><span className={`status-badge status-${status}`}><i />{status === "pending" ? t.pending : status === "partial" ? t.partial : t.paid}</span><span className="row-chevron">›</span></button>; })}{filteredTransactions.length === 0 && <div className="empty-state"><span>◎</span><strong>{t.noResults}</strong><button className="button button-secondary" onClick={() => openMoneyForm()}>{t.addEntry}</button></div>}</div>
            </section>
            <p className="privacy-note"><span>⌑</span> Your financial details are stored locally in this browser. They aren’t sent to a server.</p>
          </>}

          {activeSection === "notes" && <>
            <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> A HOME FOR YOUR THOUGHTS</div><h2>{t.notesTitle}</h2><p>{t.notesSubtitle}</p></div><button className="button button-primary" onClick={() => openNoteForm()}><span>＋</span> {t.createNote}</button></section>
            <div className="notes-toolbar"><div className="notes-filter-tabs"><button className={noteFilter === "all" ? "selected" : ""} onClick={() => setNoteFilter("all")}>All notes <span>{data.notes.length}</span></button><button className={noteFilter === "pinned" ? "selected" : ""} onClick={() => setNoteFilter("pinned")}>⌖ {t.pinned}</button><button className={noteFilter === "important" ? "selected" : ""} onClick={() => setNoteFilter("important")}>✦ {t.important}</button></div><div className="notes-sort-label">Sorted by last updated <span>⌄</span></div></div>
            <section className="notes-grid">{filteredNotes.map((note, index) => <article className={`note-card note-card-${index % 4}`} key={note.id}><div className="note-card-top"><span className="note-card-icon">{index % 4 === 0 ? "▤" : index % 4 === 1 ? "✦" : index % 4 === 2 ? "◉" : "▧"}</span><div className="note-card-flags">{note.pinned && <span className="flag-pill">⌖ Pinned</span>}{note.reminder && <span className="flag-pill flag-reminder">♧ Reminder</span>}</div><button className={`star-button ${note.important ? "starred" : ""}`} onClick={() => toggleNoteFlag(note.id, "important")} aria-label={note.important ? "Remove important flag" : "Mark important"}>{note.important ? "★" : "☆"}</button></div><button className="note-card-open" onClick={() => openNoteForm(note)}><h3>{note.title}</h3><p>{note.content}</p></button><div className="note-card-footer"><span>Updated {prettyDate(note.updatedAt.slice(0, 10), lang)}</span><div><button onClick={() => toggleNoteFlag(note.id, "pinned")} aria-label={note.pinned ? "Unpin note" : "Pin note"}>{note.pinned ? "⌖" : "⌁"}</button><button onClick={() => openNoteForm(note)} aria-label="Edit note">↗</button></div></div></article>)}<button className="add-note-tile" onClick={() => openNoteForm()}><span>＋</span><strong>Start a new thought</strong><small>Make a little room for an idea.</small></button>{filteredNotes.length === 0 && data.notes.length > 0 && <div className="empty-state notes-empty"><span>⌕</span><strong>No notes match that search.</strong></div>}</section>
            <div className="notes-local-tip"><span>✦</span><div><strong>A little reminder</strong><p>Notes stay on this device. Add a date in a note to put a personal reminder on your list.</p></div><button onClick={() => changeSection("reminders")}>See reminders <span>→</span></button></div>
          </>}

          {activeSection === "routines" && <>
            <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> PROGRESS, NOT PERFECTION</div><h2>{t.routinesTitle}</h2><p>{t.routinesSubtitle}</p></div><button className="button button-primary" onClick={() => openRoutineForm()}><span>＋</span> {t.addRoutine}</button></section>
            <section className="motivation-card">
              <span className="motivation-icon">{todayMotivation.icon}</span>
              <div className="motivation-copy"><div className="panel-kicker">TODAY’S LITTLE PUSH FOR BARUN</div><strong>{todayMotivation.title}</strong><p>{todayMotivation.body}</p></div>
              <div className="motivation-actions">
                <button className={`sound-chip ${data.settings.sound ? "on" : ""}`} onClick={toggleSound}>{data.settings.sound ? "🔊 Sound on" : "🔇 Turn sound on"}</button>
                <button className="sound-chip" onClick={() => { const routine = overdueRoutines[0] ?? scheduledRoutines[0]; if (routine) void sendRoutineAlert(routine, overdueRoutines.length ? "overdue" : "start"); else void sendDeviceNotification("Better You reminder", todayMotivation.body, "start"); }}>🔔 Test alert</button>
              </div>
            </section>
            {(overdueRoutines.length > 0 || dueRoutines.length > 0) && <section className="overdue-alert">
              <span className="overdue-alert-icon">⏰</span>
              <div className="overdue-alert-copy"><strong>{overdueRoutines.length > 0 ? `${overdueRoutines.length} routine${overdueRoutines.length > 1 ? "s" : ""} — time is over` : `${dueRoutines.length} routine${dueRoutines.length > 1 ? "s" : ""} waiting right now`}</strong><p>{overdueRoutines.length > 0 ? "Don’t miss twice. Tick it if you can, or note the honest reason so you can learn from it." : "A gentle nudge: start now. Future you will be grateful."}</p></div>
              <div className="overdue-alert-list">{[...overdueRoutines, ...dueRoutines].map((routine) => <div className="overdue-alert-item" key={routine.id}><span><strong>{routine.name}</strong><small>{routine.time}{routine.missLog.some((miss) => miss.date === today) ? " · reason saved" : ""}</small></span><div><button onClick={() => toggleRoutineDone(routine)}>✓ Did it</button><button onClick={() => openMissForm(routine)}>{routine.missLog.some((miss) => miss.date === today) ? "Edit reason" : "Why missed?"}</button></div></div>)}</div>
            </section>}
            <section className="routine-hero panel"><div className="routine-hero-copy"><div className="panel-kicker">{t.today.toUpperCase()} · {prettyDate(today, lang).toUpperCase()}</div><h3>Every little check counts.</h3><p>You’ve completed <strong>{completedRoutines} of {scheduledRoutines.length}</strong> routines today. Keep being kind to yourself.</p><div className="routine-hero-track"><span style={{ width: `${routineProgress}%` }} /></div><div className="routine-hero-foot"><span>{routineProgress}% complete</span><span>🔥 {Math.max(1, calculateStreak(data.routines.flatMap((routine) => routine.doneDates)))} day streak</span></div></div><div className="routine-hero-ring" style={{ "--progress": `${routineProgress * 3.6}deg` } as React.CSSProperties}><div><strong>{completedRoutines}<small>/{scheduledRoutines.length}</small></strong><span>today</span></div></div><span className="routine-hero-spark spark-one">✦</span><span className="routine-hero-spark spark-two">✧</span></section>
            <section className="week-overview panel"><div className="panel-heading"><div><div className="panel-kicker">YOUR WEEK, AT A GLANCE</div><h3>A little progress each day</h3></div><span className="week-legend"><i /> Routine complete</span></div><div className="week-overview-days">{routineDays.map((day) => <div className={`week-overview-day ${day.date === today ? "is-today" : ""}`} key={day.date}><small>{day.label}</small><strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong><span className={`week-overview-dot ${day.total && day.done === day.total ? "is-done" : day.done ? "is-some" : ""}`}>{day.total && day.done === day.total ? "✓" : day.done ? day.done : ""}</span><em>{day.total ? `${day.done}/${day.total}` : "Rest"}</em></div>)}</div></section>
            <section className="routine-section-heading"><div><div className="panel-kicker">SHOW UP FOR YOURSELF</div><h3>Your routines <span>{data.routines.length}</span></h3></div><div className="routine-filters">{(["all", "Daily", "Weekly", "Custom"] as const).map((item) => <button className={routineFilter === item ? "selected" : ""} key={item} onClick={() => setRoutineFilter(item)}>{item === "all" ? "All" : item}</button>)}</div></section>
            <section className="routine-list">{filteredRoutines.map((routine) => { const done = routine.doneDates.includes(today); const scheduled = routine.days.includes(dayIndex(today)); return <article className={`routine-row ${done ? "routine-row-done" : ""}`} key={routine.id}><button className={`routine-check ${done ? "checked" : ""}`} onClick={() => toggleRoutineDone(routine)} aria-label={done ? "Mark routine not done" : "Mark routine done"}>{done ? "✓" : ""}</button><span className={`routine-icon routine-icon-${routine.frequency.toLowerCase()}`}>{routine.name.toLowerCase().includes("water") ? "💧" : routine.name.toLowerCase().includes("read") ? "📖" : routine.name.toLowerCase().includes("move") ? "🌿" : routine.name.toLowerCase().includes("plan") ? "✦" : "☀️"}</span><div className="routine-name"><strong>{routine.name}</strong><small>{routine.time} <span>·</span> {routine.frequency} {scheduled ? "· Today" : "· Not scheduled today"}</small></div>{!done && scheduled && routineMinuteNow >= minutesOfDay(routine.time) && <button className={`routine-miss-button ${routine.missLog.some((miss) => miss.date === today) ? "saved" : ""}`} onClick={() => openMissForm(routine)}>{routine.missLog.some((miss) => miss.date === today) ? "Reason saved" : "Why missed?"}</button>}<span className={`routine-frequency frequency-${routine.frequency.toLowerCase()}`}>{routine.frequency}</span><button className={`routine-reminder-toggle ${routine.reminder ? "on" : ""}`} onClick={() => setData((current) => ({ ...current, routines: current.routines.map((item) => item.id === routine.id ? { ...item, reminder: !item.reminder } : item) }))} title={routine.reminder ? "Turn reminder off" : "Turn reminder on"}>♧</button><button className="routine-edit" onClick={() => openRoutineForm(routine)} aria-label={`Edit ${routine.name}`}>···</button></article>; })}{filteredRoutines.length === 0 && <div className="empty-state"><span>◷</span><strong>{t.noResults}</strong><button className="button button-secondary" onClick={() => openRoutineForm()}>{t.addRoutine}</button></div>}</section>
            <section className="panel routine-history-panel">
              <div className="panel-heading routine-history-heading"><div><div className="panel-kicker">YOUR HONEST TRACK RECORD</div><h3>Routine history <span>{historyDays} days</span></h3></div><div className="history-filters"><div className="history-range">{[7, 30, 90, 0].map((range) => <button key={range} className={historyRange === range ? "active" : ""} onClick={() => setHistoryRange(range as 7 | 30 | 90 | 0)}>{range === 0 ? "All" : `${range}d`}</button>)}</div><select value={historyRoutine} onChange={(event) => setHistoryRoutine(event.target.value)} aria-label="Filter history by routine"><option value="all">All routines</option>{data.routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}</select></div></div>
              <div className="history-stats"><div><strong>{historyDone}</strong><small>Completed</small></div><div><strong>{historyMissed}</strong><small>Reasons logged</small></div><div><strong>{historyScheduled - historyDone - historyMissed}</strong><small>No reason yet</small></div><div className="history-rate"><strong>{historyRate}%</strong><small>Show-up rate</small><div className="history-rate-track"><span style={{ width: `${historyRate}%` }} /></div></div></div>
              <div className="history-list">{historyRows.map((row) => <div className="history-day" key={row.date}><div className="history-day-label"><strong>{prettyDate(row.date, lang)}</strong><small>{friendlyDate(row.date, lang)}</small></div><div className="history-day-entries">{row.entries.map((entry) => <div className="history-entry" key={`${row.date}-${entry.routine.id}`}><span className={`history-status history-${entry.status}`}>{entry.status === "done" ? "✓" : entry.status === "missed" ? "✕" : "○"}</span><span className="history-routine-name">{entry.routine.name}</span>{entry.miss ? <span className="history-reason">“{entry.miss.reason}”{entry.miss.note ? ` — ${entry.miss.note}` : ""}</span> : entry.status === "done" ? <span className="history-reason is-done">Completed with care</span> : <span className="history-reason is-open">No reason logged</span>}<div className="history-actions">{entry.status !== "done" ? <><button onClick={() => toggleRoutineDone(entry.routine, row.date)}>✓ Done</button><button onClick={() => openMissForm(entry.routine, row.date)}>{entry.miss ? "Edit reason" : "Log reason"}</button></> : <button onClick={() => toggleRoutineDone(entry.routine, row.date)}>Undo</button>}</div></div>)}</div></div>)}{historyRows.length === 0 && <div className="empty-state"><span>◷</span><strong>No routine history in this range yet.</strong></div>}</div>
            </section>
            <div className="routine-footer-tip"><span>✧</span><span>Consistency isn’t about being perfect. It’s about coming back to your good intentions.</span></div>
          </>}

          {activeSection === "games" && <>
            <section className="games-hero"><div><div className="eyebrow"><span className="eyebrow-dot" /> LITTLE GAMES, BIG BRAIN ENERGY</div><h2>{t.gamesTitle}</h2><p>{t.gamesSubtitle}</p><div className="game-streak-pill"><span>🔥</span><strong>{gameStreak} day streak</strong><i /><small>{data.gameDays.length} practice days saved</small></div></div><div className="games-hero-art"><span className="hero-orbit orbit-a" /><span className="hero-orbit orbit-b" /><span className="hero-brain">🧠</span><i>✧</i><b>✦</b></div></section>
            <section className="game-challenge-banner"><div className="challenge-icon">✨</div><div><strong>Your next tiny challenge</strong><span>Pick a game. Clear a level. Come back tomorrow a little sharper.</span></div><div className="challenge-stat"><span>{data.games["memory"].level}</span><small>next level</small></div><button className="button button-glow" onClick={() => startGame("memory")}>Keep your streak <span>→</span></button></section>
            <section className="games-section-head"><div><div className="panel-kicker">CHOOSE YOUR CHALLENGE</div><h3>Five ways to give your brain a boost</h3></div><span>All levels keep going ∞</span></section>
            <section className="games-grid">{GAME_KEYS.map((key, index) => { const record = data.games[key]; return <article className={`game-card game-card-${GAME_META[key].tone}`} key={key}><div className="game-card-top"><span className="game-icon">{GAME_META[key].icon}</span><span className="game-level-pill">{t.level} {record.level} <span>↗</span></span></div><h3>{GAME_META[key].title}</h3><p>{GAME_META[key].subtitle}</p><div className="game-card-meta"><div><small>{t.bestScore}</small><strong>{record.bestScore || "—"}</strong></div><div><small>Played</small><strong>{record.plays} <span>times</span></strong></div><div className="game-level-meta"><small>Next up</small><strong>Level {record.level}</strong></div></div><button className="game-play-button" onClick={() => startGame(key)}><span>▶</span> Play {index === 0 ? "now" : "a round"}<b>→</b></button><span className="game-card-orb" /></article>; })}</section>
            <section className="level-note"><span>∞</span><div><strong>No final level. Just your next best.</strong><p>Every game remembers your progress on this device. Clear a challenge to unlock the next level—difficulty grows a little at a time.</p></div></section>
          </>}

          {activeSection === "reminders" && <>
            <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> A GENTLE NUDGE, WHEN YOU NEED IT</div><h2>{t.remindersTitle}</h2><p>{t.remindersSubtitle}</p></div><button className={`toggle-control ${data.settings.notifications ? "on" : ""}`} onClick={toggleNotifications} aria-label="Toggle all reminders"><span />{data.settings.notifications ? "Reminders on" : "Reminders paused"}</button></section>
            <section className="panel alarm-panel">
              <div className="alarm-head"><span className="alarm-bell">🔔</span><div><div className="panel-kicker">ROUTINE ALARMS</div><strong>A nudge at the right time — and a kind follow-up.</strong><p>At your routine time you get a phone notification and a gentle chime, with a motivation line to help you start. If the time passes and it’s still unchecked, a second “time over” alert arrives so the day doesn’t slip away.</p></div><span className={`alarm-state ${data.settings.notifications ? "on" : ""}`}>{data.settings.notifications ? (data.settings.sound ? "Sound + alerts on" : "Alerts on · sound off") : "Alerts paused"}</span></div>
              <div className="alarm-steps"><div><span>1</span><strong>Alarm at routine time</strong><small>Notification + chime + motivation</small></div><div><span>2</span><strong>Time-over nudge</strong><small>20 minutes later if still pending</small></div><div><span>3</span><strong>Write the real reason</strong><small>Log it once, learn from it, return</small></div></div>
              <div className="alarm-controls"><button className="button button-secondary" onClick={toggleSound}>{data.settings.sound ? "🔊 Mute alarm sound" : "🔊 Turn alarm sound on"}</button><button className="button button-glow" onClick={() => { const routine = overdueRoutines[0] ?? scheduledRoutines[0]; if (routine) void sendRoutineAlert(routine, overdueRoutines.length ? "overdue" : "start"); else void sendDeviceNotification("Better You reminder", todayMotivation.body, "start"); }}>Send test notification</button><button className="button button-secondary" onClick={() => void enablePhoneAlerts()}>{pushStatus === "on" ? "✓ Phone alerts on" : "📱 Alerts when app is closed"}</button><button className="button button-quiet" onClick={() => changeSection("routines")}>Open routines →</button></div>
              <p className="alarm-note">Sound plays when the app is open in this browser. On phones, install or keep Better You open in a tab to receive the chime; the phone’s notification sound is used when the browser shows the alert.</p>
            </section>
            <section className="reminder-summary-row"><div className="reminder-summary-card"><span className="reminder-summary-icon money-reminder-icon">₹</span><div><strong>{reminders.filter((item) => item.kind === "money").length}</strong><small>Money dates</small></div></div><div className="reminder-summary-card"><span className="reminder-summary-icon routine-reminder-icon">◷</span><div><strong>{reminders.filter((item) => item.kind === "routine").length}</strong><small>Routine nudges</small></div></div><div className="reminder-summary-card"><span className="reminder-summary-icon note-reminder-icon">▤</span><div><strong>{reminders.filter((item) => item.kind === "note").length}</strong><small>Note reminders</small></div></div><div className="reminder-summary-card reminder-master-card"><span className="master-shield">⌑</span><div><strong>{data.settings.notifications ? "Everything is on" : "A quiet moment"}</strong><small>{data.settings.notifications ? "You’ll see gentle reminders here" : "Turn reminders on when you’re ready"}</small></div><span className={`master-dot ${data.settings.notifications ? "enabled" : ""}`} /></div></section>
            <section className="panel reminders-panel"><div className="panel-heading"><div><div className="panel-kicker">UP NEXT</div><h3>Your upcoming nudges <span className="reminder-count">{reminders.length}</span></h3></div><span className="reminder-time-note">Sorted by date ↑</span></div><div className="reminders-list">{shownReminders.map((item) => <div className={`reminder-row ${!data.settings.notifications ? "reminder-paused" : ""}`} key={item.id}><span className={`reminder-kind-icon ${item.kind}-kind`}>{item.kind === "money" ? "₹" : item.kind === "routine" ? "◷" : "▤"}</span><div className="reminder-copy"><strong>{item.title}</strong><small>{item.detail}</small></div><span className={`reminder-when ${item.when < today ? "overdue" : ""}`}>{item.when < today ? "Overdue" : friendlyDate(item.when, lang)}<small>{prettyDate(item.when, lang)}</small></span><span className={`reminder-status-pill ${data.settings.notifications ? "is-on" : ""}`}>{data.settings.notifications ? "On" : "Paused"}</span></div>)}{reminders.length === 0 && <div className="empty-state"><span>♧</span><strong>All quiet, all caught up.</strong><p>Due dates for money, scheduled habits and notes with reminders will appear here.</p><button className="button button-secondary" onClick={() => changeSection("money")}>Review your money</button></div>}</div>{reminders.length > 5 && <button className="load-reminders" onClick={() => setShowAllReminders(!showAllReminders)}>{showAllReminders ? "Show fewer" : `Show all ${reminders.length} reminders`} <span>⌄</span></button>}</section>
            <div className="reminder-tip"><span>✦</span><div><strong>Your data, your pace</strong><p>Reminders are kept on this device. Browser notifications need permission and work while the app is open.</p></div><button onClick={() => changeSection("settings")}>Reminder settings <span>→</span></button></div>
          </>}

          {activeSection === "settings" && <>
            <section className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE, YOUR RULES</div><h2>{t.settingsTitle}</h2><p>Personalise your experience and keep your information close.</p></div></section>
            <section className="settings-layout"><div className="settings-main-column">
              <div className="panel settings-panel"><div className="settings-profile-card"><span className="avatar settings-avatar">B</span><div><strong>Barun</strong><span>Personal space · No account needed</span></div><span className="local-badge">⌑ LOCAL ONLY</span></div><div className="settings-divider" />
                <div className="setting-row"><span className="setting-icon setting-language">文</span><div className="setting-copy"><strong>{t.language}</strong><small>Choose the language you feel at home in.</small></div><div className="language-switch"><button className={lang === "en" ? "active" : ""} onClick={() => setSetting("language", "en")}>English</button><button className={lang === "hi" ? "active" : ""} onClick={() => setSetting("language", "hi")}>हिंदी</button></div></div>
                <div className="setting-row"><span className="setting-icon setting-theme">☾</span><div className="setting-copy"><strong>{t.darkMode}</strong><small>Easy on the eyes, any time of day.</small></div><button className={`toggle-control compact ${data.settings.darkMode ? "on" : ""}`} onClick={() => setSetting("darkMode", !data.settings.darkMode)} aria-label="Toggle dark mode"><span /></button></div>
                <div className="setting-row text-size-setting"><span className="setting-icon setting-text-size">Aa</span><div className="setting-copy"><strong>{t.textSize}</strong><small>{t.textSizeHint}</small><div className="text-size-preview"><strong>Better You</strong>{t.textSizePreview}</div></div><div className="text-size-options" role="group" aria-label={t.textSize}>{(["compact", "comfortable", "large", "extraLarge", "huge"] as TextSize[]).map((size) => <button key={size} className={data.settings.textSize === size ? "active" : ""} onClick={() => setSetting("textSize", size)} aria-pressed={data.settings.textSize === size} title={size === "compact" ? "Compact" : size === "comfortable" ? "Comfortable" : size === "large" ? "Large" : size === "extraLarge" ? "Extra large" : "Huge"}>A</button>)}</div></div>
                <div className="setting-row"><span className="setting-icon setting-notify">♧</span><div className="setting-copy"><strong>{t.notifications}</strong><small>Money dates, habits and note reminders.</small></div><button className={`toggle-control compact ${data.settings.notifications ? "on" : ""}`} onClick={toggleNotifications} aria-label="Toggle reminders"><span /></button></div>
                <div className="setting-row"><span className="setting-icon setting-sound">🔊</span><div className="setting-copy"><strong>Alarm sound</strong><small>Play a gentle chime when a routine reminder fires.</small><div className="sound-test-row"><button type="button" className="sound-test-button" onClick={toggleSound}>{data.settings.sound ? "Sound is on" : "Turn sound on"}</button><button type="button" className="sound-test-button" onClick={() => { const routine = scheduledRoutines[0]; if (routine) void sendRoutineAlert(routine, "start"); else void sendDeviceNotification("Better You reminder", todayMotivation.body, "start"); }}>Send test alert</button></div></div><button className={`toggle-control compact ${data.settings.sound ? "on" : ""}`} onClick={toggleSound} aria-label="Toggle alarm sound"><span /></button></div>
                <div className="setting-row push-setting"><span className="setting-icon setting-push">📱</span><div className="setting-copy"><strong>Phone notifications — app closed</strong><small>Background push alerts for routine time and time-over, even when Better You is not open.</small><div className="sound-test-row"><button type="button" className={`sound-test-button ${pushStatus === "on" ? "is-on" : ""}`} onClick={() => void enablePhoneAlerts()}>{pushStatus === "working" ? "Turning on…" : pushStatus === "on" ? "✓ Notifications allowed" : pushStatus === "denied" ? "Retry permission" : "Allow phone notifications"}</button><button type="button" className="sound-test-button" onClick={() => void sendBackgroundTest()}>Send test</button></div><div className="push-diag">{[[pushDiag.secure, "HTTPS"], [pushDiag.sw, "Service worker"], [pushDiag.push, "Push API"], [!pushDiag.embedded, "Top-level tab"], [pushDiag.permission === "granted", "Permission"]] .map(([ok, label]) => <span key={String(label)} className={ok ? "ok" : "warn"}>{ok ? "✓" : "!"} {label}</span>)}</div>
                  <div className="sound-test-row"><button type="button" className="sound-test-button" onClick={openStandaloneApp}>Open in a new tab</button>{pushDiag.embedded && <span className="push-inline-note">Preview frames can’t ask for push permission — open a tab once.</span>}</div>
                  <small className="push-hint">{pushStatus === "iframe" ? "This preview runs inside a frame, where browsers block push permission. Use “Open in a new tab”, then tap “Turn on phone alerts”. If the tab still fails, use Chrome on Android or add the app to your iPhone Home Screen." : pushStatus === "unsupported" ? "This browser/context has push disabled. Open the HTTPS link in Chrome (Android) or add it to the Home Screen on iPhone, then retry." : pushStatus === "denied" ? "Notifications are blocked for this site. Open the browser’s site settings → Notifications → Allow, then retry." : "On iPhone, add Better You to the Home Screen first (Share → Add to Home Screen), then enable alerts from there."}</small></div><span className={`alarm-state ${pushStatus === "on" ? "on" : ""}`}>{pushStatus === "on" ? "Active" : pushStatus === "denied" ? "Blocked" : "Off"}</span></div>
              </div>
              <div className="panel settings-panel data-panel"><div className="panel-heading"><div><div className="panel-kicker">YOUR PERSONAL DATA</div><h3>Private by design</h3></div><span className="data-lock">⌑</span></div><p>Everything you add—money, notes, habits and scores—lives in this browser on this device. Better You does not send personal data to a server.</p><div className="data-stats"><div><strong>{data.transactions.length}</strong><small>Money entries</small></div><div><strong>{data.notes.length}</strong><small>Notes</small></div><div><strong>{data.routines.length}</strong><small>Routines</small></div><div><strong>{data.gameDays.length}</strong><small>Game days</small></div></div><button className="button button-secondary" onClick={exportData}><span>↓</span>{t.exportData} · CSV</button><button className="danger-text-button" onClick={resetLocalData}>Reset my local data</button></div>
            </div><div className="settings-side-column"><div className="panel settings-help-panel"><span className="settings-help-emoji">🌱</span><h3>Grow at your own pace.</h3><p>This space is here for the small things that add up: a thoughtful plan, a kind habit, a clearer money picture.</p><span className="settings-sparkle">✦</span></div><div className="panel about-panel"><div className="panel-kicker">ABOUT BETTER YOU</div><h3>Small habits.<br />Big changes.</h3><p>Version 1.0 · Made for the everyday stuff that matters.</p><div className="about-tag">✦ Your personal space</div></div></div></section>
          </>}
        </div>
        <footer className="app-footer"><span>✦ BETTER YOU</span><span>Manage · Grow · Be better</span><span>Private by design <i>⌑</i></span></footer>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">{(["overview", "money", "notes", "routines", "games"] as Section[]).map((section) => <button key={section} className={activeSection === section ? "active" : ""} onClick={() => changeSection(section)}><span>{({ overview: "◈", money: "₹", notes: "▤", routines: "◷", games: "✧" } as Record<string, string>)[section]}</span><small>{sectionTitles[section]}</small></button>)}</nav>

      {moneyModal && <div className="modal-backdrop" onMouseDown={() => setMoneyModal(false)}><form className="modal-card money-modal" onSubmit={saveMoney} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="panel-kicker">MONEY TRACKER</div><h2>{moneyEditId ? "Edit money entry" : "Add a money entry"}</h2><p>Keep the details handy, so you can let the rest go.</p></div><button type="button" className="modal-close" onClick={() => setMoneyModal(false)} aria-label="Close">×</button></div><div className="direction-switch"><button type="button" className={moneyForm.direction === "given" ? "selected" : ""} onClick={() => setMoneyForm({ ...moneyForm, direction: "given" })}>↙ Money given</button><button type="button" className={moneyForm.direction === "taken" ? "selected" : ""} onClick={() => setMoneyForm({ ...moneyForm, direction: "taken" })}>↗ Money taken</button></div><div className="form-grid"><label className="form-field full-width"><span>{t.person}</span><input required autoFocus placeholder="e.g. Aanya Mehta" value={moneyForm.person} onChange={(event) => setMoneyForm({ ...moneyForm, person: event.target.value })} /></label><label className="form-field"><span>{t.amount}</span><input required type="number" min="1" step="0.01" placeholder="0" value={moneyForm.amount} onChange={(event) => setMoneyForm({ ...moneyForm, amount: event.target.value })} /></label><label className="form-field"><span>Already paid (₹)</span><input type="number" min="0" step="0.01" placeholder="0" value={moneyForm.paid} onChange={(event) => setMoneyForm({ ...moneyForm, paid: event.target.value })} /></label><label className="form-field"><span>{t.date}</span><input required type="date" value={moneyForm.date} onChange={(event) => setMoneyForm({ ...moneyForm, date: event.target.value })} /></label><label className="form-field"><span>{t.dueDate}</span><input type="date" value={moneyForm.dueDate} onChange={(event) => setMoneyForm({ ...moneyForm, dueDate: event.target.value })} /></label><label className="form-field full-width"><span>{t.note}</span><textarea rows={3} placeholder="Add a little context for later…" value={moneyForm.note} onChange={(event) => setMoneyForm({ ...moneyForm, note: event.target.value })} /></label></div><div className="modal-footer"><button type="button" className="button button-quiet" onClick={() => setMoneyModal(false)}>{t.cancel}</button><button type="submit" className="button button-primary">{moneyEditId ? t.save : "Save entry"}<span> →</span></button></div></form></div>}

      {selectedTransaction && <div className="modal-backdrop" onMouseDown={() => setSelectedTransactionId(null)}><section className="modal-card transaction-detail-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="panel-kicker">TRANSACTION DETAILS</div><h2>Your money, clearly tracked</h2></div><button className="modal-close" onClick={() => setSelectedTransactionId(null)} aria-label="Close">×</button></div><div className="transaction-detail-person"><span className={`person-avatar detail-avatar ${selectedTransaction.direction === "given" ? "person-given" : "person-taken"}`}>{selectedTransaction.person.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><div><strong>{selectedTransaction.person}</strong><small>{selectedTransaction.direction === "given" ? "You lent money to" : "You borrowed money from"}</small></div><span className={`status-badge status-${getEntryStatus(selectedTransaction)}`}><i />{getEntryStatus(selectedTransaction)}</span></div><div className="detail-amount-card"><div><span>Original amount</span><strong>{money(selectedTransaction.amount, lang)}</strong></div><div><span>Remaining</span><strong className={selectedTransaction.direction === "given" ? "green-text" : "pink-text"}>{money(remaining(selectedTransaction), lang)}</strong></div><div className="balance-track"><span style={{ width: `${Math.min(100, selectedTransaction.paid / selectedTransaction.amount * 100)}%` }} /></div><small>{money(selectedTransaction.paid, lang)} paid · {selectedTransaction.amount ? Math.round(selectedTransaction.paid / selectedTransaction.amount * 100) : 0}% settled</small></div><div className="detail-date-row"><div><span>{selectedTransaction.direction === "given" ? "Lent on" : "Borrowed on"}</span><strong>{prettyDate(selectedTransaction.date, lang)}</strong></div><div><span>Expected date</span><strong>{prettyDate(selectedTransaction.dueDate, lang)}</strong></div></div>{selectedTransaction.note && <div className="detail-note"><span>✎</span><p>{selectedTransaction.note}</p></div>}<div className="payment-history"><div className="payment-history-heading"><strong>Payment history</strong><small>{selectedTransaction.payments.length} {selectedTransaction.payments.length === 1 ? "payment" : "payments"}</small></div>{selectedTransaction.payments.length ? selectedTransaction.payments.map((payment, index) => <div className="payment-history-row" key={`${payment.date}-${index}`}><span className="payment-check">✓</span><span><strong>{money(payment.amount, lang)}</strong><small>{prettyDate(payment.date, lang)}</small></span></div>) : <p className="payment-empty">No payments recorded yet.</p>}</div>{remaining(selectedTransaction) > 0 && <div className="add-payment-box"><label><span>Add a partial payment</span><div><span>₹</span><input type="number" min="1" max={remaining(selectedTransaction)} step="0.01" placeholder={`Up to ${remaining(selectedTransaction)}`} value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /><button onClick={() => addPayment(selectedTransaction)} disabled={!paymentAmount}>Add payment</button></div></label><button className="mark-paid-link" onClick={() => markEntryPaid(selectedTransaction)}>Mark the remaining amount as paid →</button></div>}<div className="detail-actions"><button className="button button-secondary" onClick={() => openMoneyForm(selectedTransaction)}>✎ Edit</button><button className="button button-danger-quiet" onClick={() => deleteTransaction(selectedTransaction)}>⌫ Delete</button><button className="button button-quiet" onClick={() => setSelectedTransactionId(null)}>Close</button></div></section></div>}

      {noteModal && <div className="modal-backdrop" onMouseDown={() => setNoteModal(false)}><form className="modal-card note-modal" onSubmit={saveNote} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="panel-kicker">A NOTE TO YOURSELF</div><h2>{noteEditId ? "Edit your note" : "Capture a thought"}</h2><p>Some things are nice to have close by.</p></div><button type="button" className="modal-close" onClick={() => setNoteModal(false)} aria-label="Close">×</button></div><label className="form-field"><span>Title</span><input required autoFocus placeholder="Give this thought a name" value={noteForm.title} onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })} /></label><label className="form-field note-content-field"><span>Your note</span><textarea rows={8} placeholder="Write whatever you need to remember…" value={noteForm.content} onChange={(event) => setNoteForm({ ...noteForm, content: event.target.value })} /></label><div className="note-options"><label className="check-option"><input type="checkbox" checked={noteForm.pinned} onChange={(event) => setNoteForm({ ...noteForm, pinned: event.target.checked })} /><span>⌖</span> Pin to the top</label><label className="check-option"><input type="checkbox" checked={noteForm.important} onChange={(event) => setNoteForm({ ...noteForm, important: event.target.checked })} /><span>★</span> Mark important</label></div><label className="check-option note-reminder-check"><input type="checkbox" checked={noteForm.reminder} onChange={(event) => setNoteForm({ ...noteForm, reminder: event.target.checked })} /><span>♧</span> Remind me about this note</label>{noteForm.reminder && <label className="form-field note-reminder-date"><span>Reminder date</span><input type="date" min={today} value={noteForm.reminderDate} onChange={(event) => setNoteForm({ ...noteForm, reminderDate: event.target.value })} /></label>}<div className="modal-footer">{noteEditId && <button type="button" className="button button-danger-quiet" onClick={() => deleteNote(noteEditId)}>Delete note</button>}<span className="modal-footer-spacer" /><button type="button" className="button button-quiet" onClick={() => setNoteModal(false)}>{t.cancel}</button><button type="submit" className="button button-primary">{noteEditId ? t.save : "Save note"}<span> →</span></button></div></form></div>}

      {routineModal && <div className="modal-backdrop" onMouseDown={() => setRoutineModal(false)}><form className="modal-card routine-modal" onSubmit={saveRoutine} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="panel-kicker">A GOOD THING TO COME BACK TO</div><h2>{routineEditId ? "Edit your routine" : "Start a new routine"}</h2><p>It doesn’t have to be big to make a difference.</p></div><button type="button" className="modal-close" onClick={() => setRoutineModal(false)} aria-label="Close">×</button></div><label className="form-field"><span>Routine name</span><input required autoFocus placeholder="e.g. A short walk outside" value={routineForm.name} onChange={(event) => setRoutineForm({ ...routineForm, name: event.target.value })} /></label><div className="form-two-columns"><label className="form-field"><span>Frequency</span><select value={routineForm.frequency} onChange={(event) => setRoutineForm({ ...routineForm, frequency: event.target.value as Frequency })}><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Custom">Custom</option></select></label><label className="form-field"><span>Time</span><input type="time" value={routineForm.time} onChange={(event) => setRoutineForm({ ...routineForm, time: event.target.value })} /></label></div><div className="form-field"><span>Days to show up</span><div className="day-picker">{WEEKDAY_SHORT.map((day, index) => <button type="button" key={day} className={routineForm.days.includes(index) ? "selected" : ""} onClick={() => setRoutineForm({ ...routineForm, days: routineForm.days.includes(index) ? routineForm.days.filter((item) => item !== index) : [...routineForm.days, index].sort() })}>{day}</button>)}</div></div><label className="check-option routine-reminder-option"><input type="checkbox" checked={routineForm.reminder} onChange={(event) => setRoutineForm({ ...routineForm, reminder: event.target.checked })} /><span>♧</span> Remind me at this time</label><div className="modal-footer">{routineEditId && <button type="button" className="button button-danger-quiet" onClick={() => { const routine = data.routines.find((item) => item.id === routineEditId); if (routine) deleteRoutine(routine); }}>Delete routine</button>}<span className="modal-footer-spacer" /><button type="button" className="button button-quiet" onClick={() => setRoutineModal(false)}>{t.cancel}</button><button type="submit" className="button button-primary">{routineEditId ? t.save : "Save routine"}<span> →</span></button></div></form></div>}

      {gameSession && <div className="modal-backdrop game-backdrop" onMouseDown={closeGame}><section className={`modal-card game-modal game-modal-${GAME_META[gameSession.game].tone}`} onMouseDown={(event) => event.stopPropagation()}><div className="game-modal-top"><div><span className="game-modal-icon">{GAME_META[gameSession.game].icon}</span><div><div className="panel-kicker">DAILY BRAIN BREAK</div><h2>{GAME_META[gameSession.game].title}</h2></div></div><button className="modal-close" onClick={closeGame} aria-label="Close game">×</button></div><div className="game-modal-level"><span>{t.level} {gameSession.level}</span><div><i style={{ width: gameSession.game === "memory" && gameSession.cards?.length ? `${(gameSession.matched?.length ?? 0) / gameSession.cards.length * 100}%` : gameSession.game === "number" ? (gameSession.mode === "recall" ? "55%" : "25%") : gameSession.mode === "complete" ? "100%" : "18%" }} /></div><small>∞</small><span className="game-timer" aria-label="Elapsed time">⏱ {formatGameTime(activeGameElapsed)}</span>{gameSession.mode !== "complete" && <button className="game-try-button" onClick={() => startGame(gameSession.game, gameSession.level)}>↻ Try again</button>}</div>
        {gameSession.mode === "complete" ? <div className="game-complete"><span className="complete-sparkle">✦</span><div className="complete-check">✓</div><div className="panel-kicker">LEVEL {gameSession.level} COMPLETE</div><h3>That was a lovely little win.</h3><p>You earned <strong>{gameSession.score}</strong> points. Level {gameSession.level + 1} is ready when you are.</p><div className="complete-score-row"><span>New best score</span><strong>{Math.max(data.games[gameSession.game].bestScore, gameSession.score ?? 0)}</strong></div><div className="complete-time-row"><span>Time taken</span><strong>⏱ {formatGameTime(gameSession.elapsed ?? activeGameElapsed)}</strong></div><button className="button button-primary" onClick={() => startGame(gameSession.game)}>Play level {data.games[gameSession.game].level}<span> →</span></button><button className="button button-secondary complete-try-button" onClick={() => startGame(gameSession.game, gameSession.level)}>↻ Try this level again</button><button className="text-link complete-close" onClick={closeGame}>Take a little break</button></div> : <div className="game-play-area">
          {gameSession.game === "memory" && <><div className="game-instruction-row"><p>{GAME_META.memory.instruction}</p><span>Moves <strong>{gameSession.moves ?? 0}</strong></span></div><div className="memory-grid" style={{ "--memory-columns": `${Math.min(6, Math.max(3, Math.ceil(Math.sqrt(gameSession.cards?.length ?? 8))))}` } as React.CSSProperties}>{gameSession.cards?.map((emoji, index) => { const revealed = gameSession.flipped?.includes(index) || gameSession.matched?.includes(index); const [face, marker] = emoji.split("|"); return <button key={`${emoji}-${index}`} className={`memory-card ${revealed ? "revealed" : ""} ${gameSession.matched?.includes(index) ? "matched" : ""}`} onClick={() => revealMemory(index)} aria-label={revealed ? emoji.replace("|", " ") : "Reveal card"}>{revealed ? <><span>{face}</span>{marker && <small>{marker}</small>}</> : "✦"}</button>; })}</div><div className="game-soft-tip">{gameSession.matched?.length ? `${(gameSession.matched.length / 2)} of ${(gameSession.cards?.length ?? 0) / 2} pairs found` : "Take your time. You’ve got this."}</div></>}
          {gameSession.game === "number" && <><p className="game-instruction-copy">{GAME_META.number.instruction}</p>{gameSession.mode === "memorize" ? <div className="number-memory-stage"><small>MEMORIZE THIS NUMBER</small><div className="digit-row">{gameSession.sequence?.split("").map((digit, index) => <span key={`${digit}-${index}`}>{digit}</span>)}</div><p>It will hide by itself. Tap the button when you are ready.</p><button className="button button-primary game-start-button" onClick={hideNumber}>I remember it <span>→</span></button></div> : <><div className="number-recall-stage"><small>NOW TYPE IT FROM MEMORY</small><strong>{gameSession.sequence?.length ?? 0} digits</strong><span>The number is hidden — trust your memory.</span></div><form className="game-answer-form" onSubmit={submitNumber}><input autoFocus inputMode="numeric" autoComplete="off" placeholder="Type the number…" value={gameSession.answer ?? ""} onChange={(event) => setGameSession({ ...gameSession, answer: event.target.value.replace(/[^0-9]/g, ""), feedback: "" })} /><button className="button button-primary" type="submit">Check <span>→</span></button></form>{gameSession.feedback && <p className="game-feedback">{gameSession.feedback}</p>}</>}</>}
          {gameSession.game === "math" && <><p className="game-instruction-copy">{GAME_META.math.instruction}</p><div className="math-question"><small>QUICK MATH · LEVEL {gameSession.level}</small><strong>{gameSession.question?.prompt} <span>=</span> ?</strong></div><form className="game-answer-form" onSubmit={submitMath}><input autoFocus inputMode="numeric" type="number" placeholder="Your answer" value={gameSession.answer ?? ""} onChange={(event) => setGameSession({ ...gameSession, answer: event.target.value, feedback: "" })} /><button className="button button-primary" type="submit">Check <span>→</span></button></form>{gameSession.feedback && <p className="game-feedback">{gameSession.feedback}</p>}</>}
          {gameSession.game === "odd" && <><div className="game-instruction-row"><p>{GAME_META.odd.instruction}</p><span>Mistakes <strong>{gameSession.moves ?? 0}</strong></span></div><div className="odd-grid" style={{ "--odd-columns": `${Math.min(8, Math.max(4, Math.ceil(Math.sqrt(gameSession.cards?.length ?? 16))))}` } as React.CSSProperties}>{gameSession.cards?.map((item, index) => <button key={`${item}-${index}`} className="odd-tile" onClick={() => chooseOdd(index)} aria-label={`Tile ${index + 1}: ${item}`}>{item}</button>)}</div>{gameSession.feedback ? <p className="game-feedback">{gameSession.feedback}</p> : <div className="game-soft-tip">One tile is different from all the others.</div>}</>}
          {gameSession.game === "count" && <><div className="count-heading"><p>{GAME_META.count.instruction}</p><span>Count only <strong>{gameSession.target}</strong></span></div><div className="count-grid" style={{ "--count-columns": `${Math.min(10, Math.max(5, Math.ceil(Math.sqrt(gameSession.cards?.length ?? 25))))}` } as React.CSSProperties}>{gameSession.cards?.map((item, index) => <span key={`${item}-${index}`} className={item === gameSession.target ? "count-tile is-target" : "count-tile"}>{item}</span>)}</div><form className="game-answer-form" onSubmit={submitCount}><input autoFocus inputMode="numeric" type="number" min="0" placeholder={`How many ${gameSession.target ?? "targets"}?`} value={gameSession.answer ?? ""} onChange={(event) => setGameSession({ ...gameSession, answer: event.target.value, feedback: "" })} /><button className="button button-primary" type="submit">Check <span>→</span></button></form>{gameSession.feedback && <p className="game-feedback">{gameSession.feedback}</p>}</>}
        </div>}
        <div className="game-modal-footer"><span>✦ Saved on this device</span>{gameSession.mode !== "complete" && <button className="game-reset-link" onClick={() => startGame(gameSession.game, gameSession.level)}>↻ Try again</button>}<span>Best: {data.games[gameSession.game].bestScore || "—"}</span></div></section></div>}

      {missModal && <div className="modal-backdrop" onMouseDown={() => setMissModal(null)}><form className="modal-card miss-modal" onSubmit={saveMiss} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="panel-kicker">A KIND CHECK-IN</div><h2>Why did this one slip?</h2><p>{data.routines.find((routine) => routine.id === missModal.routineId)?.name ?? "Routine"} · {prettyDate(missModal.date, lang)}</p></div><button type="button" className="modal-close" onClick={() => setMissModal(null)} aria-label="Close">×</button></div><div className="miss-encouragement"><span>✦</span><p>No judgement here. Naming the reason turns a missed habit into useful information — it helps you make the next day easier.</p></div><div className="form-field"><span>What got in the way?</span><div className="miss-reasons">{MISS_REASONS.map((reason) => <button type="button" key={reason} className={missModal.reason === reason ? "selected" : ""} onClick={() => setMissModal({ ...missModal, reason })}>{reason}</button>)}</div></div><label className="form-field"><span>Or write your own reason</span><input required value={missModal.reason} onChange={(event) => setMissModal({ ...missModal, reason: event.target.value })} placeholder="e.g. Guests at home, forgot after lunch" /></label><label className="form-field"><span>A small note for future you (optional)</span><textarea rows={3} value={missModal.note} onChange={(event) => setMissModal({ ...missModal, note: event.target.value })} placeholder="What would make this easier tomorrow?" /></label><div className="modal-footer"><button type="button" className="button button-quiet" onClick={() => setMissModal(null)}>Cancel</button>{!data.routines.find((item) => item.id === missModal.routineId)?.doneDates.includes(missModal.date) && <button type="button" className="button button-secondary" onClick={() => { const routine = data.routines.find((item) => item.id === missModal.routineId); setMissModal(null); if (routine) toggleRoutineDone(routine, missModal.date); }}>✓ I actually did it</button>}<button type="submit" className="button button-primary">Save reason<span> →</span></button></div></form></div>}

      {pushBanner && pushStatus !== "on" && <div className="push-banner"><span className="push-banner-icon">🔔</span><div><strong>Allow phone notifications</strong><p>{pushStatus === "iframe" ? "Open the app in its own tab once to allow notifications. Reminders then arrive in your phone’s notification panel." : pushStatus === "denied" ? "Notifications are blocked. Open browser site settings → Notifications → Allow, then reload." : "Reminders go straight to your phone’s notification panel — even when this app is closed."}</p></div>{pushStatus === "iframe" ? <button className="button button-glow" onClick={openStandaloneApp}>Open in new tab</button> : <button className="button button-glow" onClick={() => void enablePhoneAlerts()}>{pushStatus === "working" ? "Allowing…" : "Allow notifications"}</button>}<button className="push-banner-close" onClick={() => setPushBanner(false)} aria-label="Dismiss">×</button></div>}

      {pushPrompt && pushStatus !== "on" && <div className="modal-backdrop push-modal-backdrop" onMouseDown={() => setPushPrompt(false)}><section className="modal-card push-permission-modal" onMouseDown={(event) => event.stopPropagation()}><div className="push-permission-art">🔔<span>✦</span></div><div className="panel-kicker">ONE QUICK PERMISSION</div><h2>Let Better You remind you</h2><p className="push-permission-copy">Allow notifications once, and every routine reminder and “time over” alert will appear directly in your phone’s notification panel — with sound — even when the app is closed.</p><ul className="push-permission-list"><li>✓ Routine time par direct phone notification</li><li>✓ Time over hone par dusra alert</li><li>✓ App band ho tab bhi notification aayega</li></ul>{pushStatus === "iframe" ? <p className="push-permission-warn">This preview runs inside a frame where browsers block the permission prompt. Tap below to open the app in its own tab once.</p> : pushStatus === "denied" ? <p className="push-permission-warn">Notifications are blocked for this site. Allow them in browser settings, then tap retry.</p> : null}<div className="push-permission-actions"><button className="button button-primary" onClick={() => { setPushPrompt(false); if (pushStatus === "iframe") openStandaloneApp(); else void enablePhoneAlerts(); }}>{pushStatus === "iframe" ? "Open app in new tab" : pushStatus === "denied" ? "Retry permission" : "Allow notifications"}<span> →</span></button><button className="button button-quiet" onClick={() => setPushPrompt(false)}>Not now</button></div><p className="push-permission-foot">Private by design · You can turn this off any time in Settings.</p></section></div>}
      {toast && <div className="toast-message" role="status"><span>✓</span>{toast}</div>}
      {!hydrated && <div className="saving-indicator">Opening your personal space…</div>}
    </main>
  );
}
