/* ==========================================================================
   MELIA'S iPHONE — EDITABLE STORY CONTENT
   ========================================================================== */

const CONFIG = {
  passcode: "280108",
  owner: "Melia Nadya",
  date: "Thursday, 22 October",
  dayNumber: "22",
  time: "10:41",
  weather: { temp: "18°", cond: "Cloudy", place: "London" },
  authorNotes: false,
  wallpaper: { lock: "", home: "" },
  mapImage: "",
  libraryAlbum: "Recents",
  notifications: [
    { app: "Messages", title: "Ezra Mikael", time: "09:16", body: "Audio Message", open: { app: "messages", chat: "ezra" } },
    { app: "Calendar", title: "Reminder", time: "08:41", body: "Seminar reading — check the article", open: { app: "calendar" } }
  ]
};

const APPS = [
  { id: "messages", n: "Messages", g: "●", c: "#1685f8", dock: 1 },
  { id: "phone", n: "Phone", g: "☎", c: "#32c66a", dock: 1 },
  { id: "photos", n: "Photos", g: "✿", c: "#fff", fg: "#e65a8d", dock: 1 },
  { id: "music", n: "Music", g: "♫", c: "#fa3159", dock: 1 },
  { id: "mail", n: "Mail", g: "✉", c: "#1685f8" },
  { id: "calendar", n: "Calendar", g: "·", c: "#fff", fg: "#e34a4a" },
  { id: "notes", n: "Notes", g: "▤", c: "#fff", fg: "#b28a32" },
  { id: "wallet", n: "Wallet", g: "▣", c: "#292d36" },
  { id: "facetime", n: "FaceTime", g: "◉", c: "#35c86a" },
  { id: "files", n: "Files", g: "▰", c: "#fff", fg: "#4d8ee8" },
  { id: "safari", n: "Safari", g: "◉", c: "#e9f4ff", fg: "#1685f8" },
  { id: "findmy", n: "Find My", g: "◎", c: "#fff", fg: "#31b86a" },
  { id: "settings", n: "Settings", g: "⚙", c: "#8d929b" },
  { id: "contacts", n: "Contacts", g: "♙", c: "#fff", fg: "#dc8b42" },
  { id: "maps", n: "Maps", g: "⌖", c: "#e8f2e8", fg: "#389a68" },
  { id: "reminders", n: "Reminders", g: "☷", c: "#fff", fg: "#3988e8" },
  { id: "voice", n: "Voice Memos", g: "〰", c: "#fff", fg: "#d65d75" },
  { id: "passwords", n: "Passwords", g: "🔑", c: "#f1c94a", fg: "#493b16" },
  { id: "university", n: "University", g: "U", c: "#263d66" },
  { id: "bank", n: "Banking", g: "£", c: "#173f35" },
  { id: "weather", n: "Weather", g: "☁", c: "#8bb7e9" },
  { id: "notebook", n: "Investigation", g: "✎", c: "#f1c94a", fg: "#493b16" }
];

const D = {

  /* ---- MESSAGES ---------------------------------------------------------- */
  chats: [
    { id: "ezra", name: "Ezra", avatar: "E", messages: [
      { f: "in", t: "Yesterday 21:08", s: "You home?" },
      { f: "out", t: "Yesterday 21:10", s: "yeah. finally" },
      { f: "in", t: "Yesterday 21:10", s: "Long day?" },
      { f: "out", t: "Yesterday 21:11", s: "long and boring. mostly boring" },
      { f: "in", t: "Today 10:03", s: "Have you eaten?" },
      { f: "out", t: "Today 10:05", s: "not yet. don't start" },
      { f: "in", t: "Today 10:22", s: "You've gone quiet. Everything alright?" },
      { f: "out", t: "Today 10:23", s: "yeah. just got to campus" },
      { f: "in", t: "Today 10:23", s: "That's not an answer." },
      { f: "out", t: "Today 10:24", s: "something weird happened at the locker a few days ago" },
      { f: "in", t: "Today 10:24", s: "What happened?" },
      { f: "out", t: "Today 10:26", s: "someone put my underwear in my locker. the one at uni." },
      { f: "out", t: "Today 10:26", s: "it had blood on it too. actual period blood. i don't understand how someone even got it" },
      { f: "in", t: "Today 10:28", s: "That's rather unpleasant. When did you find it?" },
      { f: "out", t: "Today 10:29", s: "monday. i've been thinking about it since" },
      { f: "in", t: "Today 10:30", s: "Did you tell anyone?" },
      { f: "out", t: "Today 10:31", s: "no. what am i even supposed to say ", status: "Read 10:31" }
    ] },
    { id: "group", name: "seminar people", avatar: "4", messages: [
      { f: "in", t: "Monday 14:20", s: "does anyone have the reading list?" },
      { f: "out", t: "Monday 14:23", s: "i'll send it later" },
      { f: "in", t: "Monday 14:24", s: "thank you!!" }
    ] }
  ],

  /* ---- LOCKER STORY ---- */
  story: {
    chat: "ezra",
    end: "Conversation paused · You can explore the phone.",
    steps: [
      { prompt: "What does Melia say?", t: ["10:32", "10:33"], clues: [0], options: [
        { me: "i genuinely don't know how someone got it. it was in my locker when i opened it.", them: "Could be someone messing around. Did you leave the locker unlocked?" },
        { me: "it's been three days and i still keep thinking about it. it's so fucking weird.", them: "I can imagine. You shouldn't have to deal with that at university." },
        { me: "i just want to know how they got it. that's the part i can'figure out.", them: "We can think through who could access the locker, if you like." }
      ] },
      { prompt: "Ezra asks if she wants him to help. How does she respond?", t: ["10:34", "10:35"], clues: [1], options: [
        { me: "can you? i don't even know where to start", them: "Of course. We can start with the practical things." },
        { me: "maybe. i don't want to make it into a whole thing", them: "It already is a thing, Melia. You don't have to pretend otherwise." },
        { me: "i was hoping you'd have some idea because you're annoyingly observant", them: "Flattery. I'll see what I can find out." }
      ] },
      { prompt: "What does Melia want to check first?", t: ["10:36", "10:37"], clues: [2, 3], options: [
        { me: "whether the corridor has cctv", them: "I'll ask what the university can actually provide. Don't expect much." },
        { me: "who else can access those lockers", them: "We can make a list of people with legitimate access." },
        { me: "whether someone could've got into my room", them: "That's worth checking. Have you noticed anything missing or out of place?" }
      ] },
      { prompt: "After the checks lead nowhere, Ezra suggests somewhere safer.", t: ["10:38", "10:39"], clues: [4], options: [
        { me: "i don't know. staying at yours feels like a lot", them: "You can say no. I thought it might make things easier for a few days." },
        { me: "maybe for a few nights. i need to think", them: "Then a few nights. No need to decide anything else now." },
        { me: "would you actually mind if i stayed?", them: "I wouldn't have offered if I minded, pretty." }
      ] }
    ]
  },

  /* ---- INVESTIGATION NOTEBOOK ---- */
  clues: [
    ["The locker", "The underwear was left inside Melia's assigned UCL locker, not somewhere public-facing."],
    ["The stain", "The blood stain was old enough to have dried. Melia recognises it as her own period blood."],
    ["Access", "Melia cannot work out how anyone got access to the item or the locker."],
    ["CCTV", "The corridor camera does not give them a useful view of the locker itself."],
    ["The timeline", "Ezra was away at a Van Der Berg customer gathering when Melia first found it."]
  ],

  /* ---- PHONE / FACETIME ---- */
  calls: [
    { name: "Ezra", kind: "FaceTime", when: "Yesterday, 22:16", duration: "1 hour 20min" },
    { name: "Rania", kind: "Mobile", when: "Yesterday, 17:48", duration: "6 min" },
    { name: "University reception", kind: "Mobile", when: "Monday, 11:04", duration: "2 min" },
    { name: "James Roomate", kind: "FaceTime Audio", when: "Sunday, 20:32", duration: "5 min" }
  ],

  /* ---- CONTACTS ---- */
  contacts: [
    { name: "Rania", sub: "Mobile · saved contact" },
    { name: "James Roomate", sub: "Mobile · saved contact" },
    { name: "Ezra Mikael", sub: "Mobile · saved contact" },
    { name: "University reception", sub: "Work · saved contact" }
  ],

  /* ---- PHOTOS ---- */
  photos: [
    {
      name: "Recents",
      count: 128,
      items: [
        { name: "Coffee after class", src: "asset/coffee21.jpg", date: "Today", loc: "London" },
        { name: "Breakfast", src: "asset/breakfast.jpg", date: "Yesterday", loc: "Belgravia" },
        { name: "writing", src: "asset/ezra.jpg", date: "Last week", loc: "Belgravia" },
        { name: "bags", src: "asset/bags.jpg", date: "Last week", loc: "Belgravia" },
        { name: "Ezra", src: "asset/111.jpg", date: "Last week", loc: "Belgravia" },
        { name: "Belgravia 1", src: "asset/Belgravia1.jpg", date: "Last week", loc: "Belgravia" },
        { name: "Belgravia Street", src: "asset/belgarvia.jpg", date: "Last week", loc: "Belgravia" },
        { name: "Books", src: "asset/books.jpg", date: "Last week", loc: "Library" },
        { name: "Mess", src: "asset/mess.jpg", date: "Last week", loc: "Home" },
        { name: "Study", src: "asset/study.jpg", date: "Last week", loc: "Library" },
        { name: "Campus Clip", video: "asset/video1.mp4", duration: "0:15", date: "Yesterday", loc: "London" }
      ]
    },
    { 
      name: "People", 
      count: 34, 
      items: [
        { name: "Best friend", src: "asset/111.jpg", date: "Oct 12", loc: "London" }, 
        { name: "Group photo", src: "asset/belgarvia.jpg", date: "Sep 28", loc: "Belgravia" }
      ] 
    },
    { 
      name: "University", 
      count: 26, 
      items: [
        { name: "Library table", src: "asset/books.jpg", date: "Oct 18", loc: "UCL Library" }, 
        { name: "Study session", src: "asset/study.jpg", date: "Oct 15", loc: "Campus" }
      ] 
    },
    { 
      name: "Screenshots", 
      count: 41, 
      items: [
        { name: "Coffee receipt", src: "asset/coffee21.jpg", date: "Today", loc: "London" }
      ] 
    },
    { 
      name: "Videos", 
      count: 12, 
      items: [
        { name: "Campus Walk", video: "asset/video1.mp4", duration: "0:15", date: "Yesterday", loc: "London" },
        { name: "Evening Clip", video: "asset/video2.mp4", duration: "0:30", date: "Last week", loc: "Belgravia" }
      ] 
    }
  ],

  /* ---- NOTES ---- */
  notes: [
    { id: "locker", title: "locker??", folder: "Personal", date: "Today", body: "old combination doesn't work.\n\ncheck the student handbook again.\nask reception tomorrow.\n\nmaybe I wrote the number somewhere else." },
    { id: "accounts", title: "accounts — update later", folder: "Personal", date: "Monday", body: "uni email — check recovery email\nspotify — old one?\n\nBANKING:\nuse the banking app's official password reset. don't put the actual password here." },
    { id: "shopping", title: "shopping", folder: "Personal", date: "Sunday", body: "shampoo\nlaundry detergent\ncoffee\nbread\n\nremember tote bag" }
  ],

  /* ---- MAIL ---- */
  emails: [
    { from: "UCL Student Services", subject: "Your student timetable", date: "Today", preview: "Your timetable is available to view.", body: "Hello Melia,\n\nYour student timetable is available through the student portal. Please check the portal for room changes and updated seminar information.\n\nStudent Services" },
    { from: "Library Services", subject: "Book due date reminder", date: "Yesterday", preview: "A borrowed item is due soon.", body: "This is a reminder that one of your borrowed library items is due soon. Please check your library account for details." },
    { from: "Online Store", subject: "Your order confirmation", date: "Monday", preview: "Thank you for your order.", body: "Thank you for your order. This is a fictional sample receipt." }
  ],

  /* ---- MUSIC ---- */
  playlists: [
    { name: "on the way back", subtitle: "Made by Melia · 24 songs", tracks: [["Track 01", "Artist Name", "3:42"], ["Track 02", "Artist Name", "2:58"], ["Track 03", "Artist Name", "4:06"]] },
    { name: "don't talk to me", subtitle: "Made by Melia · 18 songs", tracks: [["Track 04", "Artist Name", "3:21"], ["Track 05", "Artist Name", "3:57"]] },
    { name: "liked songs", subtitle: "Saved music · 86 songs", tracks: [["Track 06", "Artist Name", "3:32"], ["Track 07", "Artist Name", "4:11"]] }
  ],

  /* ---- WALLET ---- */
  wallet: [
    { type: "Debit Card", name: "Everyday account", number: "•••• 4821", issuer: "Barclays" },
    { type: "Student Pass", name: "University ID", number: "UCL · 2209142", issuer: "UCL Student Union" }
  ],
  transactions: [
    { merchant: "Coffee shop", date: "Today · 08:52", amount: "£4.20", method: "Debit card" },
    { merchant: "Campus shop", date: "Yesterday · 13:18", amount: "£6.75", method: "Debit card" },
    { merchant: "Transport for London", date: "Monday · 09:04", amount: "£2.80", method: "Contactless" }
  ],

  /* ---- APPLE ACCOUNT ---- */
  family: {
    members: [
      { name: "Melia Nadya", you: true, role: "Organizer" },
      { name: "Ezra Mikael", role: "Adult" }
    ],
    features: ["iCloud+ 200GB", "Apple Music Family"]
  },
  icloud: [
    { name: "Photos", value: "On" }, { name: "Notes", value: "On" },
    { name: "iCloud Drive", value: "On" }, { name: "Messages", value: "On" }
  ],
  devices: [
    { name: "Melia's iPhone 17 Pro", detail: "This iPhone · Current device", status: "Current" },
    { name: "MacBook Air M2", detail: "Apple Account device", status: "Known" }
  ],

  /* ---- FIND MY ---- */
  findmy: { 
    people: [
      { name: "Ezra Mikael", loc: "Belgravia, London", dist: "1.2 mi" },
      { name: "Rania", loc: "Bloomsbury, London", dist: "0.4 mi" }
    ] 
  },

  /* ---- CALENDAR / REMINDERS ---- */
  calendar: [
    { day: "Today · 11:00", title: "Psychology seminar", place: "UCL Main Building · Room 102" },
    { day: "Today · 15:00", title: "Library study", place: "Science Library" },
    { day: "Tomorrow · 10:00", title: "Lecture", place: "Cruciform Building" }
  ],
  reminders: ["Return library book", "Buy laundry detergent", "Send photos to Ezra", "Check seminar reading"],

  /* ---- SAFARI ---- */
  safari: ["UCL student portal", "how to reset a combination lock", "library catalogue", "train times"],
  readingList: [{ title: "Saved article", sub: "University reading placeholder" }],

  /* ---- FILES ---- */
  files: ["Downloads", "University", "Documents", "On My iPhone", "iCloud Drive"],

  /* ---- VOICE MEMOS / PASSWORDS / MAPS ---- */
  voiceMemos: [{ title: "Seminar notes", duration: "2:14", date: "Monday" }],
  passwords: [
    { site: "University Account", user: "melia.nadya@ucl.ac.uk" }, 
    { site: "Banking App", user: "m_nadya99" }
  ],
  maps: [{ name: "UCL Campus", sub: "Gower St, London" }, { name: "Main Library", sub: "Wilkins Building" }]
};
