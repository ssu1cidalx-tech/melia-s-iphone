"use strict";
/* ==========================================================================
   MELIA'S iPHONE — interface engine
   Story content lives in data.js. This file should rarely need editing.
   ========================================================================== */

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const has = (q, ...f) => !q || f.some(x => String(x ?? "").toLowerCase().includes(q.trim().toLowerCase()));
const pad2 = n => String(n).padStart(2, "0");
const initials = n => String(n).split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
const note = html => CONFIG.authorNotes ? `<p class="muted author">${html}</p>` : "";
const empty = (title, sub = "") => `<div class="empty"><b>${esc(title)}</b>${esc(sub)}</div>`;
const avatar = (name, o = {}) => `<div class="avatar ${o.cls || ""}">${o.img ? `<img src="${esc(o.img)}" alt="">` : esc(o.txt || initials(name))}</div>`;
const kv = pairs => `<div class="kv">${pairs.filter(p => p[1] !== undefined && p[1] !== "").map(p => `<div><span>${esc(p[0])}</span><span>${esc(p[1])}</span></div>`).join("")}</div>`;
const clockText = () => CONFIG.time.replace(/^0/, "");

/* ---------- state ---------- */
const S = { screen: "lock", pass: "", current: null, pending: null, nav: {}, voice: null, playing: null, toggles: {}, toastTimer: null, spot: [], step: 0, clues: [] };
const navOf = () => S.nav[S.current];

/* ---------- screens ---------- */
function screen(id) {
  S.screen = id;
  ["lock", "passcode", "home", "app", "search"].forEach(x => $("#" + x).classList.toggle("hidden", x !== id));
  $("#hardware").classList.toggle("on-light", ["passcode", "app", "search"].includes(id));
}
function toast(s) {
  const old = $(".toast"); if (old) old.remove();
  const d = document.createElement("div"); d.className = "toast"; d.textContent = s; $("#screen").append(d);
  clearTimeout(S.toastTimer); S.toastTimer = setTimeout(() => d.remove(), 1700);
}

/* ---------- lock screen, passcode, home ---------- */
function appIcon(a) {
  const glyph = a.id === "calendar" ? CONFIG.dayNumber : a.g;
  return `<button class="app-icon" data-app="${a.id}"><span class="art" style="background:${a.c};color:${a.fg || "white"}">${glyph}</span><span>${esc(a.n)}</span></button>`;
}
function buildLock() {
  $("#lockDate").textContent = CONFIG.date;
  $("#lockTime").textContent = clockText();
  $("#clock").textContent = clockText();
  const ev = D.calendar[0], w = CONFIG.weather;
  $("#lockWidgets").innerHTML =
    `<div><small>WEATHER</small><b>${esc(w.temp)}</b><span>${esc(w.cond)}</span></div>` +
    `<div><small>CALENDAR</small><b>${ev ? esc(ev.title) : "Today"}</b><span>${ev ? esc(ev.day.split("·").pop().trim()) : "Nothing scheduled"}</span></div>`;
  $("#notifications").innerHTML = CONFIG.notifications.map((n, i) =>
    `<div class="notification" data-notif="${i}"><small>${esc(n.app)} · ${esc(n.title)} · ${esc(n.time)}</small><p>${esc(n.body)}</p></div>`).join("");
  const wp = CONFIG.wallpaper;
  if (wp.lock) { $("#lock").classList.add("wp"); $("#lock").style.backgroundImage = `url("${wp.lock}")`; }
  if (wp.home) { $("#home").classList.add("wp"); $("#home").style.backgroundImage = `url("${wp.home}")`; }
}
function buildHome() {
  $("#homeDate").textContent = CONFIG.date;
  const w = CONFIG.weather, ev = D.calendar[0];
  const widgets = `<div class="widgets"><button data-app="weather"><b>☁ ${esc(w.temp)}</b><small>${esc(w.cond)} · ${esc(w.place)}</small></button>` +
    `<button data-app="calendar"><small>UP NEXT</small><b>${ev ? esc(ev.title) : "No events"}</b><small>${ev ? esc(ev.day + " · " + ev.place) : "Tap to open Calendar"}</small></button></div>`;
  const list = APPS.filter(a => !a.dock), pages = [];
  for (let i = 0; i < list.length; i += 16) pages.push(list.slice(i, i + 16));
  $("#pages").innerHTML = pages.map((p, i) =>
    `<div class="page ${i === 0 ? "first" : ""}">${i === 0 ? widgets : ""}<div class="apps">${p.map(appIcon).join("")}</div></div>`).join("");
  $("#dock").innerHTML = APPS.filter(a => a.dock).map(appIcon).join("");
  $("#pageDots").innerHTML = pages.length > 1 ? pages.map((_, i) => `<i data-page="${i}" class="${i === 0 ? "on" : ""}"></i>`).join("") : "";
  $("#pages").addEventListener("scroll", () => {
    const pg = $("#pages"), i = Math.round(pg.scrollLeft / pg.clientWidth);
    $$("#pageDots i").forEach((d, k) => d.classList.toggle("on", k === i));
  });
}
function openPass() { S.pass = ""; paintDots(); $("#error").textContent = ""; screen("passcode"); }
function paintDots() { $$("#dots i").forEach((x, i) => x.classList.toggle("filled", i < S.pass.length)); }
function digit(k) {
  if (k === "del") { S.pass = S.pass.slice(0, -1); paintDots(); return; }
  if (S.pass.length >= 6) return;
  S.pass += k; paintDots();
  if (S.pass.length === 6) {
    if (S.pass === CONFIG.passcode) setTimeout(unlockPhone, 120);
    else { $("#error").textContent = "Incorrect Passcode"; setTimeout(() => { S.pass = ""; paintDots(); $("#error").textContent = ""; }, 650); }
  }
}
function unlockPhone() {
  S.pass = "";
  if (S.pending) { const t = S.pending; S.pending = null; openTarget(t); }
  else screen("home");
}
function lockPhone() { stopVoice(); S.pass = ""; S.pending = null; screen("lock"); }
function goHome() { saveScroll(); stopVoice(); screen("home"); }
function homebar() { if (S.screen === "lock") openPass(); else if (S.screen === "app" || S.screen === "search") goHome(); }

/* ---------- row helper ---------- */
function row(icon, title, sub = "", act = "", arg = "", meta = "", o = {}) {
  const lead = String(icon).startsWith("<") ? icon : `<div class="row-icon">${icon}</div>`;
  const tail = o.toggle !== undefined
    ? `<button class="toggle ${o.toggle ? "on" : ""}" data-do="toggle" data-a="${esc(o.key)}" aria-label="${esc(title)}"></button>`
    : (o.noChev ? "" : `<span class="chev">›</span>`);
  return `<div class="row ${o.cls || ""}" ${act ? `data-do="${act}" data-a="${esc(arg)}"` : ""}>${lead}<div class="row-main"><b class="${o.red ? "red" : ""}">${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>${meta ? `<span class="meta">${esc(meta)}</span>` : ""}${tail}</div>`;
}
const card = rows => rows.length ? `<div class="card">${rows.join("")}</div>` : "";
const sbar = (v, ph = "Search") => `<div class="searchbar">⌕ <input data-q value="${esc(v.q || "")}" placeholder="${esc(ph)}" autocomplete="off"></div>`;
const listBox = v => `<div id="list">${v.search(v.q || "", navOf())}</div>`;

/* ---------- navigation ---------- */
const TABS = {
  phone: [["Favourites", "★"], ["Recents", "◷"], ["Contacts", "♙"], ["Keypad", "▦"], ["Voicemail", "◉"]],
  photos: [["Library", "▦"], ["Collections", "▧"], ["Search", "⌕"]],
  music: [["Home", "⌂"], ["New", "✦"], ["Radio", "◖"], ["Library", "♫"], ["Search", "⌕"]],
  findmy: [["People", "♙"], ["Devices", "▣"], ["Items", "⌖"], ["Me", "☺"]]
};
const DEFAULT_TAB = { phone: "Recents", photos: "Library", music: "Library", findmy: "Devices" };
const ROOTS = {
  messages: () => [messagesView()], phone: () => [phoneView()], photos: () => [photosView()], music: () => [musicView()],
  mail: () => [mailboxesView(), inboxView()], calendar: () => [calendarView()], notes: () => [foldersView(), notesListView(null)],
  wallet: () => [walletView()], facetime: () => [facetimeView()], files: () => [filesView()], safari: () => [safariView()],
  findmy: () => [findmyView()], settings: () => [settingsView()], contacts: () => [contactsView()], maps: () => [mapsView()],
  reminders: () => [remindersView()], voice: () => [voiceView()], passwords: () => [passwordsView()],
  university: () => [universityView()], bank: () => [bankView()], weather: () => [weatherView()], notebook: () => [notebookView()]
};
function openApp(id) {
  if (!S.nav[id]) S.nav[id] = { stack: (ROOTS[id] || (() => [genericView(id)]))(), tab: DEFAULT_TAB[id] || null };
  S.current = id; screen("app"); paint();
}
function resetApp(id) { delete S.nav[id]; }
function scrollEl() { const n = navOf(); if (!n) return null; return n.stack.at(-1).fixed ? $(".thread") : $("#content"); }
function saveScroll() { const n = navOf(), el = scrollEl(); if (n && el) n.stack.at(-1).scroll = el.scrollTop; }
function push(v) { saveScroll(); navOf().stack.push(v); paint(); }
function replaceTop(v) { const n = navOf(); n.stack[n.stack.length - 1] = v; paint(); }
function back() { const n = navOf(); if (S.screen === "app" && n && n.stack.length > 1) { n.stack.pop(); paint(); } }
function paint() {
  stopVoice();
  const n = navOf(), v = n.stack.at(-1), root = n.stack.length === 1, app = APPS.find(a => a.id === S.current);
  $("#back").style.visibility = root ? "hidden" : "visible";
  if (!root) $("#backLabel").textContent = n.stack.at(-2).title || app.n;
  $("#title").textContent = root ? "" : v.title;
  const defs = TABS[S.current], showTabs = !!defs && root, c = $("#content");
  c.className = "content" + (v.fixed ? " fixed" : "") + (showTabs ? "" : " no-tabs");
  c.innerHTML = v.render(v, n);
  $("#tabs").innerHTML = showTabs ? defs.map(t => `<button class="tab ${t[0] === n.tab ? "active" : ""}" data-tab="${t[0]}"><b>${t[1]}</b>${t[0]}</button>`).join("") : "";
  const sc = v.fixed ? $(".thread") : c;
  if (sc) sc.scrollTop = v.scroll != null ? v.scroll : (v.fixed ? sc.scrollHeight : 0);
  paintMini();
  if (v.mount) v.mount(v);
}
function genericView(id) {
  const a = APPS.find(x => x.id === id);
  return { title: a ? a.n : id, render: () => `<h2 class="heading">${esc(a ? a.n : id)}</h2>${empty("Nothing here yet")}` };
}

/* ---------- Messages ---------- */
const chatById = id => D.chats.find(c => c.id === id);
function parseT(t) {
  const m = /^(.*?)\s*(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
  return m ? { day: m[1].trim(), mins: +m[2] * 60 + +m[3], time: pad2(m[2]) + ":" + m[3] } : null;
}
function needStamp(a, b) { const pa = parseT(a.t), pb = parseT(b.t); if (!pa || !pb) return a.t !== b.t; return pa.day !== pb.day || pb.mins - pa.mins >= 60; }
function stamp(t) { const p = parseT(t); return p ? `<div class="time"><b>${esc(p.day)}</b> ${p.time}</div>` : `<div class="time">${esc(t)}</div>`; }
function listStamp(t) { const p = parseT(t); return p ? (p.day === "Today" ? p.time : p.day) : t; }
function previewOf(m) { if (!m) return ""; if (m.voice) return "Audio Message"; if (m.img) return "Photo"; if (m.video) return "Video"; return m.s || ""; }
function messagesView() {
  return {
    title: "Messages", q: "",
    search: q => {
      const hits = D.chats.map(c => { const m = q ? c.messages.find(m => has(q, m.s, m.transcript)) : null; return has(q, c.name) || m ? { c, m } : null; }).filter(Boolean);
      return hits.length ? card(hits.map(({ c, m }) => {
        const l = c.messages.at(-1), pv = q && m && !has(q, c.name) ? m.s : previewOf(l);
        return row(avatar(c.name, { img: c.img, txt: c.avatar }), c.name, pv, "chat", c.id, listStamp(l.t));
      })) : empty("No Results", "Try a different search.");
    },
    render: v => `<h2 class="heading">Messages</h2>${sbar(v)}${listBox(v)}${note("Seed dialogue — replace in data.js.")}`
  };
}
function bubble(m, cont, c, i) {
  const cls = `bubble ${m.f}${c.sms && m.f === "out" ? " sms" : ""}${cont ? " cont" : ""}`;
  if (m.voice) {
    return `<div class="${cls} voicebubble"><button class="vplay" data-vid="c|${c.id}|${i}" aria-label="Play audio message">▶</button><div class="wave"></div><small class="vtime">${esc(m.duration || "0:10")}</small></div>` +
      (m.transcript ? `<div class="transcript">${esc(m.transcript)}</div>` : "");
  }
  let html = "";
  if (m.img || m.imgLabel || m.video) {
    const inner = m.img ? `<img src="${esc(m.img)}" alt="">` : esc(m.imgLabel || (m.video ? "Video" : "Photo"));
    html += `<div class="${cls} media"><div class="attach" data-do="attach" data-a="${esc(m.img || "")}|${esc(m.imgLabel || "Photo")}">${inner}${m.video ? `<span class="play">▶</span><span class="dur">${esc(m.duration || "")}</span>` : ""}</div></div>`;
    if (m.s) html += `<div class="${cls} cont">${esc(m.s)}</div>`;
    return html;
  }
  return `<div class="${cls}">${esc(m.s)}</div>`;
}
function threadInner(c) {
  let out = "", lastOut = -1;
  c.messages.forEach((m, i) => { if (m.f === "out") lastOut = i; });
  c.messages.forEach((m, i) => {
    const prev = c.messages[i - 1], st = !prev || needStamp(prev, m);
    if (st) out += stamp(m.t);
    out += bubble(m, !!prev && !st && prev.f === m.f, c, i);
    if (i === lastOut) out += `<div class="status">${esc(m.status || "Delivered")}</div>`;
  });
  return out;
}
function storyPanel(c) {
  const st = D.story; if (!st || c.id !== st.chat) return "";
  const s = st.steps[S.step];
  if (s) return `<div class="story" id="storyPanel"><p class="choice-prompt">${esc(s.prompt)}</p>${s.options.map((o, i) => `<button class="choice" data-do="storyPick" data-a="${i}">${esc(o.me)}</button>`).join("")}</div>`;
  return `<div class="story" id="storyPanel"><p class="choice-prompt">${esc(st.end)}</p><button class="choice link" data-do="notebook">✎ Open investigation notebook · ${S.clues.length} / ${D.clues.length} clues</button></div>`;
}
function threadHtml(c) {
  const sp = storyPanel(c), choosing = !!D.story && c.id === D.story.chat && S.step < D.story.steps.length;
  return `<div class="thread">${threadInner(c)}</div>${sp}${choosing ? "" : composerHtml(c)}`;
}
function composerHtml(c) {
  return `<div class="composer"><button class="plus" data-action="plus" aria-label="Add">+</button><input id="messageInput" placeholder="${c.sms ? "Text Message" : "iMessage"}" autocomplete="off"><button class="pill sendbtn" data-action="send" aria-label="Send">↑</button></div>`;
}
function openChat(id) {
  const c = chatById(id); if (!c) return;
  push({ title: c.name, fixed: true, chatId: id, render: () => threadHtml(c) });
}
function sendMessage() {
  const n = navOf(), v = n && n.stack.at(-1), inp = $("#messageInput");
  if (!v || !v.chatId || !inp || !inp.value.trim()) return;
  const c = chatById(v.chatId);
  c.messages.push({ f: "out", t: "Today " + CONFIG.time, s: inp.value.trim(), status: "Delivered" });
  const th = $(".thread"); th.innerHTML = threadInner(c); th.scrollTop = th.scrollHeight;
  inp.value = ""; inp.focus();
}

/* ---------- investigation notebook ---------- */
function updateClueCount() { const el = $("#clueCount"); if (el && D.clues) el.textContent = `${S.clues.length} / ${D.clues.length} clues`; }
function addClue(i) { if (!S.clues.includes(i)) { S.clues.push(i); updateClueCount(); return true; } return false; }
function notebookView() {
  return {
    title: "Notebook",
    render: (v, n) => (n.stack.length === 1 ? `<h2 class="heading">Investigation</h2>` : "") +
      `<div class="note nb"><b class="note-title">Locker incident</b><span class="muted">Notes from Melia's conversation with Ezra · ${S.clues.length} / ${D.clues.length} clues</span>` +
      D.clues.map((c, i) => { const on = S.clues.includes(i); return `<div class="clue"><b>${on ? "✓" : "○"} ${esc(c[0])}</b><p>${on ? esc(c[1]) : "Not yet established."}</p></div>`; }).join("") + `</div>`
  };
}

/* voice playback (real audio when `src` is given, otherwise a timed simulation) */
function secs(d) { const p = String(d || "0:10").split(":").map(Number); return p.length === 2 ? p[0] * 60 + p[1] : (p[0] || 10); }
function voiceInfo(id) {
  const [k, a, b] = id.split("|");
  if (k === "c") { const m = chatById(a).messages[+b]; return { duration: m.duration, src: m.src }; }
  const m = D.voiceMemos[+a]; return { duration: m.duration, src: m.src };
}
function stopVoice() {
  const v = S.voice; if (!v) return;
  clearInterval(v.timer);
  if (v.audio) { try { v.audio.pause(); } catch (e) { /* ignore */ } }
  v.btn.textContent = "▶";
  const w = v.btn.parentElement, wave = w && w.querySelector(".wave"), tt = w && w.querySelector(".vtime");
  if (wave) wave.style.setProperty("--p", "0%");
  if (tt) tt.textContent = v.label;
  S.voice = null;
}
function toggleVoice(btn) {
  const id = btn.dataset.vid;
  if (S.voice && S.voice.id === id) { stopVoice(); return; }
  stopVoice();
  const info = voiceInfo(id), v = { id, btn, total: secs(info.duration), start: Date.now(), label: info.duration || "0:10" };
  S.voice = v; btn.textContent = "❚❚";
  if (info.src && typeof Audio !== "undefined") {
    try { v.audio = new Audio(info.src); const p = v.audio.play(); if (p && p.catch) p.catch(() => { v.audio = null; v.start = Date.now(); }); } catch (e) { v.audio = null; }
  }
  const w = btn.parentElement, wave = w.querySelector(".wave"), tt = w.querySelector(".vtime");
  v.timer = setInterval(() => {
    const real = v.audio && v.audio.duration > 0, el = real ? v.audio.currentTime : (Date.now() - v.start) / 1000, tot = real ? v.audio.duration : v.total;
    if (wave) wave.style.setProperty("--p", Math.min(100, el / tot * 100) + "%");
    if (tt) tt.textContent = Math.floor(el / 60) + ":" + pad2(Math.floor(el % 60));
    if (el >= tot) stopVoice();
  }, 100);
}

/* ---------- Phone / FaceTime / Contacts ---------- */
const callIcon = k => k.includes("FaceTime") ? "🎥" : "↗";
function phoneView() {
  return {
    title: "Phone", q: "",
    search: (q, n) => {
      if (n.tab === "Contacts" || n.tab === "Favourites") {
        const list = D.contacts.filter(c => (n.tab === "Contacts" || c.fav) && has(q, c.name, c.sub));
        return list.length ? card(list.map(c => row(avatar(c.name, { img: c.img }), c.name, c.sub, "contact", c.name))) : empty(n.tab === "Favourites" ? "No Favourites" : "No Results", n.tab === "Favourites" ? "Add contacts to Favourites for quick access." : "");
      }
      const list = D.calls.map((c, i) => ({ c, i })).filter(x => has(q, x.c.name, x.c.kind));
      return list.length ? card(list.map(({ c, i }) => row(callIcon(c.kind), c.name, c.kind, "call", String(i), c.when, { red: c.missed }))) : empty("No Recents");
    },
    render: (v, n) => {
      if (n.tab === "Keypad") {
        const keys = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
        return `<div class="dial-display" id="dialed">${esc(n.dial || "")}</div><div class="dial">${keys.map(k => `<button data-do="dial" data-a="${k[0]}">${k[0]}${k[1] ? `<small>${k[1]}</small>` : ""}</button>`).join("")}<span></span><button class="call" data-do="dialCall" aria-label="Call">☎</button><button class="del" data-do="dialDel" aria-label="Delete">⌫</button></div>`;
      }
      if (n.tab === "Voicemail") return `<h2 class="heading">Voicemail</h2>${empty("No Voicemail")}`;
      return `<h2 class="heading">${n.tab}</h2>${sbar(v)}${listBox(v)}`;
    }
  };
}
function callView(i) {
  const c = D.calls[i];
  return { title: "Call Details", render: () => `<div class="center">${avatar(c.name, { cls: "big-avatar" })}<h2 class="note-title">${esc(c.name)}</h2></div>${kv([["Type", c.kind], ["When", c.when], ["Duration", c.duration]])}` };
}
function facetimeView() {
  return {
    title: "FaceTime",
    render: () => {
      const l = D.calls.map((c, i) => ({ c, i })).filter(x => x.c.kind.includes("FaceTime"));
      return `<h2 class="heading">FaceTime</h2><div class="eyebrow">Recents</div>${l.length ? card(l.map(({ c, i }) => row("🎥", c.name, c.kind, "call", String(i), c.when))) : empty("No Recent Calls")}`;
    }
  };
}
function contactsView() {
  return {
    title: "Contacts", q: "",
    search: q => { const l = D.contacts.filter(c => has(q, c.name, c.sub, c.phone, c.email)); return l.length ? card(l.map(c => row(avatar(c.name, { img: c.img }), c.name, c.sub, "contact", c.name))) : empty("No Results"); },
    render: v => `<h2 class="heading">Contacts</h2>${sbar(v)}${listBox(v)}`
  };
}
function contactView(name) {
  const c = D.contacts.find(x => x.name === name) || { name, sub: "" };
  return {
    title: c.name,
    render: () => `<div class="center">${avatar(c.name, { img: c.img, cls: "big-avatar" })}<h2 class="note-title">${esc(c.name)}</h2></div>
      <div class="btn-row"><button data-do="msgContact" data-a="${esc(c.name)}"><b>💬</b>message</button><button data-do="toastText" data-a="Calling ${esc(c.name)}…"><b>☎</b>call</button><button data-do="toastText" data-a="FaceTime ${esc(c.name)}…"><b>🎥</b>video</button><button data-do="toastText" data-a="No email address"><b>✉</b>mail</button></div>
      ${c.phone || c.email ? kv([["phone", c.phone || ""], ["email", c.email || ""]]) : `<p class="muted center">${esc(c.sub)}</p>`}`
  };
}

/* ---------- Photos ---------- */
const albums = () => D.photos.map(a => ({ ...a, items: a.items.map(x => typeof x === "string" ? { name: x } : x) }));
function cell(it, i, j) {
  return `<div class="photo ${it.src ? "" : "ph"}" data-do="photo" data-a="${i}|${j}">${it.src ? `<img src="${esc(it.src)}" alt="${esc(it.name)}" loading="lazy">` : ""}${it.type === "video" ? `<b class="vid">${esc(it.duration || "▶")}</b>` : ""}${it.src ? "" : `<span>${esc(it.name)}</span>`}</div>`;
}
function photosView() {
  return {
    title: "Photos", q: "",
    search: (q) => {
      if (!q) return empty("Search Photos", "Search by caption, date or place.");
      const out = []; albums().forEach((a, i) => a.items.forEach((it, j) => { if (has(q, it.name, it.date, it.loc, a.name)) out.push(cell(it, i, j)); }));
      return out.length ? `<div class="photo-grid">${out.join("")}</div>` : empty("No Results");
    },
    render: (v, n) => {
      const all = albums();
      if (n.tab === "Collections") {
        return `<h2 class="heading">Collections</h2><div class="eyebrow">Albums</div><div class="album-grid">${all.map((a, i) => { const f = a.cover || (a.items[0] && a.items[0].src); return `<div class="tile" data-do="album" data-a="${i}"><div class="cover">${f ? `<img src="${esc(f)}" alt="">` : "IMAGE<br>PLACEHOLDER"}</div><b>${esc(a.name)}</b><small>${a.count ?? a.items.length}</small></div>`; }).join("")}</div>`;
      }
      if (n.tab === "Search") return `<h2 class="heading">Search</h2>${sbar(v, "Photos, People, Places…")}${listBox(v)}`;
      const li = Math.max(0, all.findIndex(a => a.name === CONFIG.libraryAlbum)), lib = all[li];
      return `<h2 class="heading">Library</h2><div class="photo-grid">${lib.items.map((it, j) => cell(it, li, j)).join("")}</div><p class="muted center">${lib.count ?? lib.items.length} Items</p>${note("Photos are placeholders. Add src paths in data.js.")}`;
    }
  };
}
function albumView(i) {
  const a = albums()[i];
  return { title: a.name, render: () => `<div class="photo-grid">${a.items.map((it, j) => cell(it, i, j)).join("")}</div><p class="muted center">${a.count ?? a.items.length} Items</p>` };
}
function photoView(i, j) {
  const a = albums()[i], it = a.items[j];
  return {
    title: it.date || "Photo", isPhoto: true,
    render: () => `<div class="viewer">${it.src ? `<img src="${esc(it.src)}" alt="${esc(it.name)}">` : "IMAGE PLACEHOLDER"}<button class="nav l" data-do="photo" data-a="${i}|${j - 1}" ${j < 1 ? "disabled" : ""}>‹</button><button class="nav r" data-do="photo" data-a="${i}|${j + 1}" ${j >= a.items.length - 1 ? "disabled" : ""}>›</button></div>${kv([["Caption", it.name], ["Date", it.date], ["Location", it.loc], ["Album", a.name]])}`
  };
}

/* ---------- Music (iOS 26 tabs: Home, New, Radio, Library, Search) ---------- */
const allTracks = () => { const seen = new Set(), out = []; D.playlists.forEach((p, pi) => p.tracks.forEach((t, ti) => { const k = t[0] + "|" + t[1]; if (!seen.has(k)) { seen.add(k); out.push({ t, pi, ti }); } })); return out; };
const art = (src, label = "ART") => src ? `<img src="${esc(src)}" alt="">` : label;
function trackRow(t, pi, ti) {
  const on = S.playing && S.playing.t[0] === t[0] && S.playing.t[1] === t[1];
  return `<div class="track ${on ? "on" : ""}" data-do="play" data-a="${pi}|${ti}"><div class="cover">${art((D.playlists[pi] || {}).art)}</div><div style="flex:1"><b>${esc(t[0])}</b><small>${esc(t[1])}</small></div><small>${esc(t[2])}</small></div>`;
}
function plTile(p, i) { return `<div class="album" data-do="playlist" data-a="${i}"><div class="cover">${art(p.art, "ARTWORK<br>PLACEHOLDER")}</div><div><b>${esc(p.name)}</b><small>${esc(p.subtitle)}</small></div></div>`; }
function musicView() {
  return {
    title: "Music", q: "",
    search: q => {
      if (!q) return empty("Search", "Find songs and playlists in your library.");
      const pls = D.playlists.map((p, i) => has(q, p.name, p.subtitle) ? plTile(p, i) : "").join("");
      const trs = allTracks().filter(x => has(q, x.t[0], x.t[1])).map(x => trackRow(x.t, x.pi, x.ti)).join("");
      return pls + trs || empty("No Results");
    },
    render: (v, n) => {
      if (n.tab === "Home") {
        const rec = (D.recentlyPlayed || D.playlists[0].tracks.slice(0, 2)).map(t => { const f = allTracks().find(x => x.t[0] === t[0]); return trackRow(t, f ? f.pi : 0, f ? f.ti : 0); }).join("");
        return `<h2 class="heading">Home</h2><div class="eyebrow">Recently Played</div>${rec}<div class="eyebrow">Playlists</div>${D.playlists.map(plTile).join("")}${note("Listening history is placeholder — set D.recentlyPlayed in data.js.")}`;
      }
      if (n.tab === "New" || n.tab === "Radio") return `<h2 class="heading">${n.tab}</h2>${empty("Apple Music", "Streaming content isn't part of this phone.")}`;
      if (n.tab === "Search") return `<h2 class="heading">Search</h2>${sbar(v, "Your Library")}${listBox(v)}`;
      return `<h2 class="heading">Library</h2>${card([row("♫", "Playlists", "", "playlists"), row("♪", "Songs", "", "songs")])}<div class="eyebrow">Recently Added</div>${D.playlists.map(plTile).join("")}`;
    }
  };
}
function playlistsView() { return { title: "Playlists", render: () => card(D.playlists.map((p, i) => row(`<div class="row-icon">♫</div>`, p.name, p.subtitle, "playlist", String(i)))) }; }
function songsView() { return { title: "Songs", render: () => allTracks().map(x => trackRow(x.t, x.pi, x.ti)).join("") }; }
function playlistView(i) {
  const p = D.playlists[i];
  return {
    title: p.name,
    render: () => `<div class="pl-head"><div class="cover">${art(p.art, "ALBUM ART<br>PLACEHOLDER")}</div><b>${esc(p.name)}</b><small>${esc(p.subtitle)}</small></div><div class="pl-actions"><button data-do="play" data-a="${i}|0">▶ Play</button><button data-do="play" data-a="${i}|0">⤨ Shuffle</button></div>${p.tracks.map((t, ti) => trackRow(t, i, ti)).join("")}`
  };
}
function paintMini() {
  const m = $("#mini"), p = S.playing, show = S.current === "music" && p && S.screen === "app";
  m.classList.toggle("hidden", !show);
  if (show) m.innerHTML = `<div class="cover">${art((D.playlists[p.pi] || {}).art)}</div><div class="t"><b>${esc(p.t[0])}</b><small>${esc(p.t[1])}</small></div><button data-do="miniToggle" aria-label="Play or pause">${p.on ? "❚❚" : "▶"}</button>`;
}

/* ---------- Mail ---------- */
function mailboxesView() {
  return { title: "Mailboxes", render: () => `<h2 class="heading">Mailboxes</h2>${card([row("▤", "Inbox", "", "inbox", "", String(D.emails.length)), row("↗", "Sent", "", "mailbox", "Sent"), row("✎", "Drafts", "", "mailbox", "Drafts"), row("🗑", "Bin", "", "mailbox", "Bin")])}` };
}
function inboxView() {
  return {
    title: "Inbox", q: "",
    search: q => { const l = D.emails.map((e, i) => ({ e, i })).filter(x => has(q, x.e.from, x.e.subject, x.e.body)); return l.length ? card(l.map(({ e, i }) => row(e.unread ? `<div class="row-icon" style="color:#1685f8">●</div>` : `<div class="row-icon">✉</div>`, e.from, e.subject + " · " + e.preview, "email", String(i), e.date))) : empty("No Results"); },
    render: v => `<h2 class="heading">Inbox</h2>${sbar(v)}${listBox(v)}`
  };
}
function emailView(i) {
  const e = D.emails[i];
  return { title: "Message", render: () => `<div class="note"><b class="note-title">${esc(e.subject)}</b><p class="muted">From: ${esc(e.from)}<br>To: ${esc(e.to || CONFIG.owner)}<br>${esc(e.date)}</p><hr style="border:0;border-top:1px solid #eee">${esc(e.body)}</div>` };
}

/* ---------- Calendar ---------- */
function calendarView() { return { title: "Calendar", render: () => `<h2 class="heading">Calendar</h2><div class="eyebrow">Upcoming</div>${D.calendar.length ? card(D.calendar.map((e, i) => row("▦", e.title, e.place, "event", String(i), e.day))) : empty("No Events")}` }; }
function eventView(i) { const e = D.calendar[i]; return { title: "Event", render: () => `<div class="note"><b class="note-title">${esc(e.title)}</b></div><div style="height:10px"></div>${kv([["When", e.day], ["Location", e.place], ["Calendar", e.calendar || ""]])}` }; }

/* ---------- Notes (folders → list → note) ---------- */
function foldersView() {
  return { title: "Folders", render: () => { const fs = [...new Set(D.notes.map(n => n.folder))]; return `<h2 class="heading">Folders</h2><div class="eyebrow">iCloud</div>${card([row("▤", "All Notes", "", "notesAll", "", String(D.notes.length)), ...fs.map(f => row("📁", f, "", "folder", f, String(D.notes.filter(n => n.folder === f).length)))])}`; } };
}
function notesListView(folder) {
  return {
    title: folder || "All Notes", q: "",
    search: q => { const l = D.notes.filter(n => (!folder || n.folder === folder) && has(q, n.title, n.body)); return l.length ? card(l.map(n => row("▤", n.title, n.body.replace(/\n+/g, " ").slice(0, 60), "note", n.id, n.date))) : empty("No Notes"); },
    render: v => `<h2 class="heading">${esc(folder || "All Notes")}</h2>${sbar(v, "Search")}${listBox(v)}`
  };
}
function noteView(id) { const n = D.notes.find(x => x.id === id); return { title: n.title, render: () => `<div class="note"><b class="note-title">${esc(n.title)}</b>${esc(n.body)}</div><p class="muted center">${esc(n.date)}</p>` }; }

/* ---------- Wallet ---------- */
function walletCard(c, i, click = true) { return `<div class="wallet" ${click ? `data-do="wallet" data-a="${i}"` : ""}><small>${esc(c.issuer)}</small><b>${esc(c.name)}</b><small>${esc(c.number)}</small></div>`; }
function walletView() { return { title: "Wallet", render: () => `<h2 class="heading">Wallet</h2>${D.wallet.map((c, i) => walletCard(c, i)).join("")}${note("Cards and passes are placeholders — add real ones in data.js.")}` }; }
function walletCardView(i) {
  const c = D.wallet[i], tx = D.transactions.map((t, k) => ({ t, k })).filter(x => (x.t.card ?? 0) === i);
  return { title: c.name, render: () => `${walletCard(c, i, false)}${kv([["Type", c.type], ["Issuer", c.issuer], ["Number", c.number]])}${tx.length ? `<div class="eyebrow">Latest Transactions</div>${card(tx.map(({ t, k }) => row("◉", t.merchant, t.method, "txn", String(k), t.amount)))}` : ""}` };
}
function txnView(k) { const t = D.transactions[k]; return { title: t.merchant, render: () => `<div class="note center"><b class="note-title">${esc(t.amount)}</b>${esc(t.merchant)}</div><div style="height:10px"></div>${kv([["Date", t.date], ["Paid with", t.method]])}` }; }

/* ---------- Files ---------- */
const folders = () => D.files.map(f => typeof f === "string" ? { name: f, items: [] } : f);
function filesView() { return { title: "Files", render: () => `<h2 class="heading">Browse</h2>${card(folders().map((f, i) => row("📁", f.name, f.items.length + " items", "file", String(i))))}` }; }
function folderView(i) { const f = folders()[i]; return { title: f.name, render: () => f.items.length ? card(f.items.map(x => row("📄", x.name, [x.kind, x.size].filter(Boolean).join(" · "), "toastText", "Preview isn't available", x.date || "", { noChev: true }))) : empty("Folder Is Empty") }; }

/* ---------- Safari ---------- */
const hist = () => D.safari.map(h => typeof h === "string" ? { title: h } : h);
function safariView() {
  return {
    title: "Safari", q: "",
    search: q => { const l = hist().map((h, i) => ({ h, i })).filter(x => has(q, x.h.title, x.h.url)); return (l.length ? `<div class="eyebrow">History</div>${card(l.map(({ h, i }) => row(h.kind === "search" ? "⌕" : "◉", h.title, h.url || h.when || "", "site", String(i))))}` : empty("No Results")) + (!q && D.readingList && D.readingList.length ? `<div class="eyebrow">Reading List</div>${card(D.readingList.map((r, i) => row("▤", r.title, r.sub, "reading", String(i))))}` : ""); },
    render: v => `<h2 class="heading">Safari</h2>${sbar(v, "Search or enter website")}${listBox(v)}`
  };
}
function pageView(title, sub) { return { title: "Safari", render: () => `<div class="note"><b class="note-title">${esc(title)}</b>${esc(sub || "")}</div><p class="muted center">Web pages aren't loaded in this simulation.</p>` }; }

/* ---------- Find My ---------- */
function mapBlock(label) {
  return CONFIG.mapImage ? `<div class="map img" style="background-image:url('${esc(CONFIG.mapImage)}')">${esc(label)}</div>` : `<div class="map">MAP PLACEHOLDER<br>${esc(label)}</div>`;
}
function findmyView() {
  return {
    title: "Find My",
    render: (v, n) => {
      if (n.tab === "People") { const p = (D.findmy && D.findmy.people) || []; return `<h2 class="heading">People</h2>${p.length ? card(p.map((x, i) => row(avatar(x.name), x.name, x.detail || "", "toastText", x.name + " — location details aren't available", "", { noChev: true }))) : empty("Share Your Location", "Friends and family who share their location with you will appear here.")}`; }
      if (n.tab === "Items") return `<h2 class="heading">Items</h2>${empty("No Items", "Items you've added with Find My will appear here.")}`;
      if (n.tab === "Me") { const me = D.findmy || {}; return `<h2 class="heading">Me</h2>${card([row(avatar(CONFIG.owner), CONFIG.owner, "This iPhone", "", "", "", { noChev: true }), ...(typeof me.shareMyLocation === "boolean" ? [row("◎", "Share My Location", "", "", "", "", { toggle: S.toggles.shareLoc ?? me.shareMyLocation, key: "shareLoc" })] : [])])}`; }
      return `<h2 class="heading">Devices</h2>${mapBlock("Use your own map image")}<div class="eyebrow">Devices</div>${card(D.devices.map((d, i) => row("▣", d.name, d.detail, "device", String(i), d.status)))}${note("Location data is fictional. Nothing is tracked.")}`;
    }
  };
}
function deviceView(i) { const d = D.devices[i]; return { title: d.name, render: () => `<div class="note"><b class="note-title">${esc(d.name)}</b>${esc(d.detail)}</div><div style="height:10px"></div>${kv([["Status", d.status]])}` }; }

/* ---------- Settings, Apple Account, iCloud, Family Sharing ---------- */
const SET_ROOT = [["Airplane Mode", "✈", "#ed9a31", false], ["Wi-Fi", "◔", "#1685f8"], ["Bluetooth", "ᛒ", "#1685f8"], ["Mobile Service", "▥", "#32b96b"], ["Battery", "▰", "#32b96b"], ["General", "⚙", "#9297a1"], ["Accessibility", "◉", "#1685f8"], ["Camera", "◎", "#9297a1"], ["Privacy & Security", "✋", "#1685f8"], ["Apps", "▦", "#9297a1"]];
const SET_DETAIL = {
  "Wi-Fi": [{ label: "Wi-Fi", toggle: true }],
  "Bluetooth": [{ label: "Bluetooth", toggle: true }],
  "Mobile Service": [{ label: "Mobile Data", toggle: true }, { label: "Data Roaming", toggle: false }],
  "Battery": [{ label: "Low Power Mode", toggle: false }, { label: "Battery Health & Charging" }],
  "General": [{ label: "About" }, { label: "Software Update" }, { label: "iPhone Storage" }, { label: "AirDrop" }, { label: "VPN & Device Management" }],
  "Accessibility": [{ label: "Vision" }, { label: "Physical and Motor" }, { label: "Hearing" }],
  "Camera": [{ label: "Formats" }, { label: "Record Video" }],
  "Privacy & Security": [{ label: "Location Services" }, { label: "Tracking" }, { label: "Photos" }, { label: "Safety Check" }, { label: "App Privacy Report" }],
  "Apps": []
};
function settingsView() {
  return {
    title: "Settings", q: "",
    search: q => { const l = SET_ROOT.filter(s => has(q, s[0])); return card(l.map(s => { const ic = `<div class="row-icon" style="background:${s[2]};color:#fff">${s[1]}</div>`; return s[3] !== undefined ? row(ic, s[0], "", "", "", "", { toggle: S.toggles[s[0]] ?? s[3], key: s[0] }) : row(ic, s[0], "", "setting", s[0]); })) || empty("No Results"); },
    render: v => `<h2 class="heading">Settings</h2>${sbar(v)}<div class="profile" data-do="apple"><div class="avatar">${esc(initials(CONFIG.owner)[0])}</div><div><b>${esc(CONFIG.owner)}</b><small>Apple Account, iCloud, and more</small></div><span class="chev" style="margin-left:auto">›</span></div><div id="list">${v.search(v.q || "")}</div>${note("Settings are simulated; nothing changes on a real device.")}`
  };
}
function settingDetailView(name) {
  const rows = (D.settings && D.settings[name]) || SET_DETAIL[name] || [];
  return { title: name, render: () => rows.length ? card(rows.map(r => r.toggle !== undefined ? row("", r.label, "", "", "", "", { toggle: S.toggles[name + r.label] ?? r.toggle, key: name + r.label }).replace('<div class="row-icon"></div>', "") : row("", r.label, r.value || "", "leaf", r.label, "", { cls: "leaf" }).replace('<div class="row-icon"></div>', ""))) : empty("Nothing to show", "") };
}
function appleView() {
  const fam = D.family;
  return {
    title: "Apple Account",
    render: () => `<div class="center">${avatar(CONFIG.owner, { cls: "big-avatar", txt: initials(CONFIG.owner)[0] })}<h2 class="note-title">${esc(CONFIG.owner)}</h2></div>
      ${card([row("👤", "Personal Information", "", "leaf", "Personal Information"), row("🔒", "Sign-In & Security", "", "leaf", "Sign-In & Security"), row("▭", "Payment & Shipping", "", "leaf", "Payment & Shipping")])}
      <div style="height:12px"></div>${card([row("☁", "iCloud", "", "icloud"), row("A", "Media & Purchases", "", "leaf", "Media & Purchases"), row("◎", "Find My", "", "leaf", "Find My"), row("👪", "Family", "", "family", "", fam && fam.members ? fam.members.length + " Members" : "")])}
      <div class="eyebrow">Devices</div>${card(D.devices.map((d, i) => row("▣", d.name, d.detail, "device", String(i))))}
      ${note("Family Sharing and the device list are separate: sharing a subscription or iCloud+ plan never exposes another member's photos, messages, notes or passwords.")}`
  };
}
function icloudView() { return { title: "iCloud", render: () => `<div class="eyebrow">Saved to iCloud</div>${card(D.icloud.map(s => row("☁", s.name, "", "leaf", s.name, s.value)))}` }; }
function familyView() {
  const f = D.family;
  return {
    title: "Family",
    render: () => `<div class="eyebrow">Members</div>${card(f.members.map(m => row(avatar(m.name), m.name + (m.you ? " (Me)" : ""), m.role || "", "toastText", "Member details aren't available", "", { noChev: true })))}${f.features && f.features.length ? `<div class="eyebrow">Shared With Your Family</div>${card(f.features.map(x => row("✓", x.name, "", "", "", x.value || "", { noChev: true })))}` : ""}${note("Everyone uses their own Apple Account. Add roles and shared features in data.js → D.family.")}`
  };
}

/* ---------- Maps, Reminders, Voice Memos, Passwords, University, Bank, Weather ---------- */
function mapsView() {
  return { title: "Maps", q: "", search: q => { const l = D.maps.map((m, i) => ({ m, i })).filter(x => has(q, x.m.name, x.m.sub)); return l.length ? `<div class="eyebrow">Recent</div>${card(l.map(({ m, i }) => row("⌖", m.name, m.sub, "map", String(i))))}` : empty("No Results"); }, render: v => `<h2 class="heading">Maps</h2>${sbar(v, "Search Maps")}${mapBlock("Saved places and recent searches")}${listBox(v)}` };
}
function remindersView() {
  return { title: "Reminders", render: () => `<h2 class="heading">Reminders</h2>${card(D.reminders.map((r, i) => `<div class="row rem ${r.done ? "done" : ""}" data-do="rem" data-a="${i}"><span class="chk ${r.done ? "on" : ""}"></span><div class="row-main"><b>${esc(r.title)}</b></div></div>`))}` };
}
function voiceView() {
  return { title: "Voice Memos", render: () => `<h2 class="heading">All Recordings</h2>${D.voiceMemos.length ? card(D.voiceMemos.map((m, i) => `<div class="row"><div class="row-main"><b>${esc(m.title)}</b><small>${esc(m.date || "")}</small></div><div class="vm" style="display:flex;align-items:center;gap:8px;color:#d65d75"><button class="vplay" data-vid="m|${i}" style="width:30px;height:30px;border-radius:50%;border:0;background:#fbe9ed;color:#d65d75;padding:0">▶</button><div class="wave" style="width:54px;height:16px;background:repeating-linear-gradient(90deg,currentColor 0 2px,transparent 2px 5px);opacity:.5"></div><small class="vtime meta" style="min-width:28px">${esc(m.duration)}</small></div></div>`)) : empty("No Recordings")}` };
}
function passwordsView() { return { title: "Passwords", render: () => `<h2 class="heading">Passwords</h2>${card(D.passwords.map((p, i) => row("🔑", p.site, p.user || "••••••••", "password", String(i))))}${note("Placeholders only — never enter real credentials.")}` }; }
function passwordView(i) { const p = D.passwords[i]; return { title: p.site, render: () => `${kv([["Website", p.site], ["User Name", p.user || ""], ["Password", "••••••••••"]])}<p class="muted">Viewing a password requires authentication.</p>` }; }
function universityView() { return { title: "University", render: () => `<h2 class="heading">University</h2><div class="profile"><div class="avatar">U</div><div><b>Student portal</b><small>${esc(CONFIG.owner)}</small></div></div>${card([row("▦", "Timetable", "Seminars and lectures", "uni", "timetable"), row("▤", "Course materials", "Reading lists and documents", "uni", "materials"), row("✉", "Announcements", "University notices", "uni", "announcements"), row("▣", "Library account", "Loans and due dates", "uni", "library")])}` }; }
function uniDetail(k) {
  const c = { timetable: D.calendar.map(e => e.day + " — " + e.title + " · " + e.place).join("\n"), materials: "Reading list placeholder\nSeminar article placeholder\nLecture slides placeholder", announcements: "No new announcements.", library: "Borrowed items and due dates placeholder." };
  return { title: k[0].toUpperCase() + k.slice(1), render: () => `<div class="note">${esc(c[k])}</div>` };
}
function bankView() { return { title: "Banking", render: () => `<h2 class="heading">Banking</h2><div class="note"><small>Available balance</small><h2 style="margin:4px 0">£—</h2></div><div style="height:10px"></div>${card([row("↕", "Recent activity", "", "bank", "Recent activity"), row("⚙", "Cards & settings", "", "bank", "Cards & settings")])}${note("Fictional banking app. No real balance or credentials.")}` }; }
function weatherView() { const w = CONFIG.weather; return { title: "Weather", render: () => `<div class="note center"><div style="font-size:44px">☁</div><div style="font-size:36px">${esc(w.temp)}</div><b>${esc(w.cond)}</b><p>${esc(w.place)}</p></div>` }; }

/* ---------- deep links (notifications, search results) ---------- */
function openTarget(t) {
  resetApp(t.app); openApp(t.app);
  if (t.chat) openChat(t.chat);
  else if (t.note) push(noteView(t.note));
  else if (t.email != null) push(emailView(t.email));
  else if (t.event != null) push(eventView(t.event));
  else if (t.contact) push(contactView(t.contact));
  else if (t.photo) { const [i, j] = t.photo.split("|").map(Number); push(photoView(i, j)); }
  else if (t.playlist != null) push(playlistView(t.playlist));
  else if (t.site != null) push(pageView(hist()[t.site].title, hist()[t.site].url));
  else if (t.reminders) { /* just open */ }
}

/* ---------- Spotlight search ---------- */
function spotIndex(q) {
  const out = [], add = (g, t, s, go) => out.push({ g, t, s, go });
  APPS.filter(a => has(q, a.n)).forEach(a => add("Apps", a.n, "", { app: a.id }));
  if (!q) return out;
  D.contacts.forEach(c => has(q, c.name, c.phone, c.email) && add("Contacts", c.name, c.sub, { app: "contacts", contact: c.name }));
  D.chats.forEach(c => { if (has(q, c.name)) add("Messages", c.name, previewOf(c.messages.at(-1)), { app: "messages", chat: c.id }); c.messages.forEach(m => m.s && has(q, m.s) && add("Messages", c.name, m.s, { app: "messages", chat: c.id })); });
  D.notes.forEach(n => has(q, n.title, n.body) && add("Notes", n.title, n.body.replace(/\n+/g, " ").slice(0, 60), { app: "notes", note: n.id }));
  D.emails.forEach((e, i) => has(q, e.from, e.subject, e.body) && add("Mail", e.subject, e.from, { app: "mail", email: i }));
  D.calendar.forEach((e, i) => has(q, e.title, e.place) && add("Calendar", e.title, e.day, { app: "calendar", event: i }));
  hist().forEach((h, i) => has(q, h.title, h.url) && add("Safari", h.title, "History", { app: "safari", site: i }));
  albums().forEach((a, i) => a.items.forEach((it, j) => has(q, it.name, it.loc) && add("Photos", it.name, a.name, { app: "photos", photo: i + "|" + j })));
  D.playlists.forEach((p, i) => { has(q, p.name) && add("Music", p.name, p.subtitle, { app: "music", playlist: i }); p.tracks.forEach(t => has(q, t[0], t[1]) && add("Music", t[0], t[1], { app: "music", playlist: i })); });
  D.reminders.forEach(r => has(q, r.title) && add("Reminders", r.title, "", { app: "reminders" }));
  return out;
}
function paintSearch(q) {
  const res = spotIndex(q); S.spot = res; const groups = {};
  res.forEach((r, i) => { (groups[r.g] = groups[r.g] || []).push([r, i]); });
  const html = Object.entries(groups).map(([g, l]) => `<div class="group-title">${g}</div>` + l.slice(0, 5).map(([r, i]) => `<div class="result" data-sp="${i}"><b>${esc(r.t)}</b>${r.s ? `<br><small style="color:#888">${esc(r.s)}</small>` : ""}</div>`).join("")).join("");
  $("#searchResults").innerHTML = html || `<p class="muted center">No Results</p>`;
}
function openSearch() { screen("search"); $("#searchInput").value = ""; paintSearch(""); }

/* ---------- actions ---------- */
const ACTIONS = {
  chat: a => openChat(a),
  storyPick: a => {
    const st = D.story, c = chatById(st.chat), s = st.steps[S.step]; if (!s) return;
    const o = s.options[+a];
    c.messages.push({ f: "out", t: "Today " + s.t[0], s: o.me, status: "Read " + s.t[1] }, { f: "in", t: "Today " + s.t[1], s: o.them });
    const fresh = (s.clues || []).filter(addClue).length;
    S.step++;
    navOf().stack.at(-1).scroll = null; paint();
    if (fresh) toast("Investigation notebook updated");
  },
  notebook: () => push(notebookView()),
  attach: a => { const [src, label] = a.split("|"); push({ title: "Photo", render: () => `<div class="viewer">${src ? `<img src="${esc(src)}" alt="">` : esc(label)}</div>` }); },
  call: a => push(callView(+a)),
  contact: a => push(contactView(a)),
  msgContact: a => { const c = D.chats.find(x => x.name === a || a.startsWith(x.name)); if (c) { resetApp("messages"); openApp("messages"); openChat(c.id); } else toast("No conversation with " + a); },
  toastText: a => toast(a),
  leaf: () => toast("Not included in this simulation"),
  dial: a => { const n = navOf(); n.dial = (n.dial || "") + a; $("#dialed").textContent = n.dial; },
  dialDel: () => { const n = navOf(); n.dial = (n.dial || "").slice(0, -1); $("#dialed").textContent = n.dial; },
  dialCall: () => { const n = navOf(); toast(n.dial ? "Calling " + n.dial + "…" : "Enter a number"); },
  album: a => push(albumView(+a)),
  photo: a => { const [i, j] = a.split("|").map(Number), n = navOf(); (n.stack.at(-1).isPhoto ? replaceTop : push)(photoView(i, j)); },
  playlists: () => push(playlistsView()), songs: () => push(songsView()),
  playlist: a => push(playlistView(+a)),
  play: a => { const [pi, ti] = a.split("|").map(Number); S.playing = { t: D.playlists[pi].tracks[ti], pi, on: true }; saveScroll(); paint(); },
  miniToggle: () => { if (S.playing) { S.playing.on = !S.playing.on; paintMini(); } },
  inbox: () => push(inboxView()), mailbox: a => push({ title: a, render: () => `<h2 class="heading">${esc(a)}</h2>${empty("No Mail")}` }),
  email: a => push(emailView(+a)),
  event: a => push(eventView(+a)),
  notesAll: () => push(notesListView(null)), folder: a => push(notesListView(a)), note: a => push(noteView(a)),
  wallet: a => push(walletCardView(+a)), txn: a => push(txnView(+a)),
  file: a => push(folderView(+a)),
  site: a => { const h = hist()[+a]; push(pageView(h.title, h.url)); }, reading: a => { const r = D.readingList[+a]; push(pageView(r.title, r.sub)); },
  device: a => push(deviceView(+a)),
  setting: a => push(settingDetailView(a)), apple: () => push(appleView()), icloud: () => push(icloudView()), family: () => push(familyView()),
  toggle: (a, el) => { const base = el.classList.contains("on"); S.toggles[a] = !base; el.classList.toggle("on", !base); },
  map: a => toast(D.maps[+a].name),
  rem: (a, el) => { const r = D.reminders[+a]; r.done = !r.done; el.classList.toggle("done", r.done); el.querySelector(".chk").classList.toggle("on", r.done); },
  password: a => push(passwordView(+a)),
  uni: a => push(uniDetail(a)),
  bank: a => push({ title: a, render: () => `<div class="note">Nothing to show.</div>` })
};

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target;
  if (t.closest("[data-nav=homebar]")) return homebar();
  const vid = t.closest("[data-vid]"); if (vid) return toggleVoice(vid);
  const tab = t.closest("[data-tab]");
  if (tab) { const n = navOf(); n.tab = tab.dataset.tab; n.stack[0].q = ""; n.stack[0].scroll = 0; return paint(); }
  const act = t.closest("[data-do]");
  if (act && !act.disabled) { const fn = ACTIONS[act.dataset.do]; if (fn) fn(act.dataset.a, act); return; }
  const app = t.closest("[data-app]"); if (app) return openApp(app.dataset.app);
  const nt = t.closest("[data-notif]");
  if (nt) { S.pending = CONFIG.notifications[+nt.dataset.notif].open || null; return openPass(); }
  const sp = t.closest("[data-sp]"); if (sp) return openTarget(S.spot[+sp.dataset.sp].go);
  const pg = t.closest("[data-page]"); if (pg) { const el = $("#pages"); return el.scrollTo({ left: +pg.dataset.page * el.clientWidth, behavior: "smooth" }); }
  const a = t.closest("[data-action]");
  if (a) {
    const k = a.dataset.action;
    if (k === "home") goHome(); else if (k === "lock") lockPhone(); else if (k === "send") sendMessage();
    else if (k === "search") openSearch(); else if (k === "flashlight") toast("Flashlight"); else if (k === "camera") toast("Camera isn't available in this simulation");
    else if (k === "plus") toast("Attachments aren't available in this simulation");
  }
});
document.addEventListener("input", e => {
  if (e.target.matches("[data-q]")) {
    const n = navOf(), v = n.stack.at(-1), l = $("#list"); v.q = e.target.value; if (l) l.innerHTML = v.search(v.q, n);
  }
});
document.addEventListener("keydown", e => {
  if (S.screen === "passcode") { if (/^\d$/.test(e.key)) digit(e.key); if (e.key === "Backspace") digit("del"); }
  if (e.key === "Enter" && e.target.id === "messageInput") { e.preventDefault(); sendMessage(); }
  if (e.key === "Escape" && S.screen === "app") back();
  if (e.key === "Escape" && S.screen === "search") goHome();
});
$("#unlock").addEventListener("click", openPass);
$("#keypad").addEventListener("click", e => { const b = e.target.closest("[data-key]"); if (b) digit(b.dataset.key); });
$("#back").addEventListener("click", back);
$("#sideButton").addEventListener("click", () => { if (S.screen === "lock") openPass(); else lockPhone(); });
$("#searchInput").addEventListener("input", e => paintSearch(e.target.value));

/* touch gestures: swipe up on Lock Screen, swipe up from the bottom edge to go home, swipe down on Home Screen for Search */
let touch = null;
$("#screen").addEventListener("touchstart", e => { const t = e.touches[0], r = $("#screen").getBoundingClientRect(); touch = { x: t.clientX, y: t.clientY, edge: t.clientY > r.bottom - 60 }; }, { passive: true });
$("#screen").addEventListener("touchend", e => {
  if (!touch) return;
  const t = e.changedTouches[0], dy = t.clientY - touch.y, dx = t.clientX - touch.x;
  if (S.screen === "lock" && dy < -45) openPass();
  else if (touch.edge && dy < -50 && Math.abs(dx) < 90 && (S.screen === "app" || S.screen === "search")) goHome();
  else if (S.screen === "home" && dy > 90 && Math.abs(dx) < 50) openSearch();
  touch = null;
}, { passive: true });

/* ---------- init ---------- */
function fit() {
  const s = innerWidth <= 720 ? 1 : Math.min(1, (innerHeight - 24) / 844);
  $("#stage").style.setProperty("--s", s.toFixed(3));
}
function init() {
  D.reminders = D.reminders.map(r => typeof r === "string" ? { title: r, done: false } : r);
  document.body.classList.toggle("show-notes", !!CONFIG.authorNotes);
  buildLock(); buildHome(); screen("lock"); fit(); updateClueCount();
  const nb = $("#openNotebook"), rs = $("#restart");
  if (nb) nb.addEventListener("click", () => { if (S.screen === "lock" || S.screen === "passcode") { S.pending = { app: "notebook" }; openPass(); } else openTarget({ app: "notebook" }); });
  if (rs) rs.addEventListener("click", () => location.reload());
}
addEventListener("resize", fit);
init();
