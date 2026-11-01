"use strict";
/* ==========================================================================
   MELIA'S iPHONE — interface engine (fixed)
   Requires CONFIG, D, APPS from data.js to be loaded BEFORE this file.
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
const S = { screen: "lock", pass: "", current: null, pending: null, nav: {}, voice: null, playing: null, toggles: {}, toastTimer: null, step: 0, clues: [] };
const navOf = () => S.nav[S.current];

/* ---------- screens ---------- */
function screen(id) {
  S.screen = id;
  ["lock", "passcode", "home", "app", "search"].forEach(x => {
    const el = $("#" + x);
    if (el) el.classList.toggle("hidden", x !== id);
  });
  const hw = $("#hardware");
  if (hw) hw.classList.toggle("on-light", ["passcode", "app", "search"].includes(id));
}
function toast(s) {
  const old = $(".toast"); if (old) old.remove();
  const d = document.createElement("div"); d.className = "toast"; d.textContent = s;
  ($("#screen") || document.body).append(d);
  clearTimeout(S.toastTimer); S.toastTimer = setTimeout(() => d.remove(), 1700);
}

/* ---------- lock screen, passcode, home ---------- */
function appIcon(a) {
  const glyph = a.id === "calendar" ? CONFIG.dayNumber : a.g;
  return `<button class="app-icon" data-app="${a.id}"><span class="art" style="background:${a.c};color:${a.fg || "white"}">${glyph}</span><span>${esc(a.n)}</span></button>`;
}
function buildLock() {
  const ld = $("#lockDate"), lt = $("#lockTime"), cl = $("#clock");
  if (ld) ld.textContent = CONFIG.date;
  if (lt) lt.textContent = clockText();
  if (cl) cl.textContent = clockText();
  const ev = D.calendar[0], w = CONFIG.weather;
  const lw = $("#lockWidgets");
  if (lw) {
    lw.innerHTML =
      `<div><small>WEATHER</small><b>${esc(w.temp)}</b><span>${esc(w.cond)}</span></div>` +
      `<div><small>CALENDAR</small><b>${ev ? esc(ev.title) : "Today"}</b><span>${ev ? esc(ev.day.split("·").pop().trim()) : "Nothing scheduled"}</span></div>`;
  }
  const notifs = $("#notifications");
  if (notifs) {
    notifs.innerHTML = CONFIG.notifications.map((n, i) =>
      `<div class="notification" data-notif="${i}"><small>${esc(n.app)} · ${esc(n.title)} · ${esc(n.time)}</small><p>${esc(n.body)}</p></div>`).join("");
  }
  const wp = CONFIG.wallpaper || {};
  const lockEl = $("#lock"), homeEl = $("#home");
  if (wp.lock && lockEl) { lockEl.classList.add("wp"); lockEl.style.backgroundImage = `url("${wp.lock}")`; }
  if (wp.home && homeEl) { homeEl.classList.add("wp"); homeEl.style.backgroundImage = `url("${wp.home}")`; }
}
function buildHome() {
  const hd = $("#homeDate"); if (hd) hd.textContent = CONFIG.date;
  const w = CONFIG.weather, ev = D.calendar[0];
  const widgets = `<div class="widgets"><button data-app="weather"><b>☁ ${esc(w.temp)}</b><small>${esc(w.cond)} · ${esc(w.place)}</small></button>` +
    `<button data-app="calendar"><small>UP NEXT</small><b>${ev ? esc(ev.title) : "No events"}</b><small>${ev ? esc(ev.day + " · " + ev.place) : "Tap to open Calendar"}</small></button></div>`;
  const list = APPS.filter(a => !a.dock), pages = [];
  for (let i = 0; i < list.length; i += 16) pages.push(list.slice(i, i + 16));
  const pEl = $("#pages"), dEl = $("#dock"), pdEl = $("#pageDots");
  if (pEl) pEl.innerHTML = pages.map((p, i) => `<div class="page ${i === 0 ? "first" : ""}">${i === 0 ? widgets : ""}<div class="apps">${p.map(appIcon).join("")}</div></div>`).join("");
  if (dEl) dEl.innerHTML = APPS.filter(a => a.dock).map(appIcon).join("");
  if (pdEl) pdEl.innerHTML = pages.length > 1 ? pages.map((_, i) => `<i data-page="${i}" class="${i === 0 ? "on" : ""}"></i>`).join("") : "";
  if (pEl) {
    pEl.addEventListener("scroll", () => {
      const i = Math.round(pEl.scrollLeft / pEl.clientWidth);
      $$("#pageDots i").forEach((d, k) => d.classList.toggle("on", k === i));
    });
  }
}
function openPass() { S.pass = ""; paintDots(); const err = $("#error"); if (err) err.textContent = ""; screen("passcode"); }
function paintDots() { $$("#dots i").forEach((x, i) => x.classList.toggle("filled", i < S.pass.length)); }
function digit(k) {
  if (k === "del" || k === "⌫") { S.pass = S.pass.slice(0, -1); paintDots(); return; }
  if (S.pass.length >= 6) return;
  S.pass += k; paintDots();
  if (S.pass.length === 6) {
    if (S.pass === CONFIG.passcode) setTimeout(unlockPhone, 120);
    else {
      const err = $("#error"); if (err) err.textContent = "Incorrect Passcode";
      setTimeout(() => { S.pass = ""; paintDots(); if (err) err.textContent = ""; }, 650);
    }
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
/* FIX: notifications can now open a specific chat (S.activeChat was set but never used) */
function openTarget(t) {
  const app = typeof t === "string" ? t : t.app || "messages";
  openApp(app);
  if (typeof t === "object" && t.chat && app === "messages") openChat(t.chat);
}

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
  findmy: () => [findmyView()], settings: () => [settingsView()], contacts: () => [contactsView()],
  reminders: () => [remindersView()], voice: () => [voiceView()], passwords: () => [passwordsView()],
  university: () => [universityView()], bank: () => [bankView()], weather: () => [weatherView()], notebook: () => [notebookView()]
};
function openApp(id) {
  if (!S.nav[id]) S.nav[id] = { stack: (ROOTS[id] || (() => [genericView(id)]))(), tab: DEFAULT_TAB[id] || null };
  S.current = id; screen("app"); paint();
}
function scrollEl() { const n = navOf(); if (!n) return null; return n.stack.at(-1).fixed ? $(".thread") : $("#content"); }
function saveScroll() { const n = navOf(), el = scrollEl(); if (n && el) n.stack.at(-1).scroll = el.scrollTop; }
function push(v) { saveScroll(); navOf().stack.push(v); paint(); }
/* FIX: in-place re-render that keeps scroll position (play / toggle used to jump to top) */
function repaint() { saveScroll(); paint(); }
function back() { const n = navOf(); if (S.screen === "app" && n && n.stack.length > 1) { n.stack.pop(); paint(); } }
function paint() {
  stopVoice();
  const n = navOf(), v = n.stack.at(-1), root = n.stack.length === 1, app = APPS.find(a => a.id === S.current);
  const backBtn = $("#back"), backLbl = $("#backLabel"), titleEl = $("#title");
  if (backBtn) backBtn.style.visibility = root ? "hidden" : "visible";
  if (backLbl) backLbl.textContent = root ? "" : (n.stack.at(-2).title || (app ? app.n : "Back"));
  if (titleEl) titleEl.textContent = root ? "" : v.title;
  const defs = TABS[S.current], showTabs = !!defs && root, c = $("#content");
  if (c) {
    c.className = "content" + (v.fixed ? " fixed" : "") + (showTabs ? "" : " no-tabs");
    c.innerHTML = v.render(v, n);
    const sc = v.fixed ? $(".thread") : c;
    if (sc) sc.scrollTop = v.scroll != null ? v.scroll : (v.fixed ? sc.scrollHeight : 0);
  }
  const tabsEl = $("#tabs");
  if (tabsEl) tabsEl.innerHTML = showTabs ? defs.map(t => `<button class="tab ${t[0] === n.tab ? "active" : ""}" data-tab="${t[0]}"><b>${t[1]}</b>${t[0]}</button>`).join("") : "";
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
        return row(avatar(c.name, { img: c.img, txt: c.avatar }), c.name, pv, "chat", c.id, listStamp(l ? l.t : ""));
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
    html += `<div class="${cls} media"><div class="attach" data-do="attach" data-a="${esc(m.img || m.video || "")}|${esc(m.imgLabel || (m.video ? "Video" : "Photo"))}">${inner}${m.video ? `<span class="play">▶</span><span class="dur">${esc(m.duration || "")}</span>` : ""}</div></div>`;
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
  const top = navOf().stack.at(-1);
  if (top && top.chatId === id) return;          // FIX: don't stack the same chat twice
  push({ title: c.name, fixed: true, chatId: id, render: () => threadHtml(c) });
}
function sendMessage() {
  const n = navOf(), v = n && n.stack.at(-1), inp = $("#messageInput");
  if (!v || !v.chatId || !inp || !inp.value.trim()) return;
  const c = chatById(v.chatId);
  c.messages.push({ f: "out", t: "Today " + CONFIG.time, s: inp.value.trim(), status: "Delivered" });
  const th = $(".thread");
  if (th) { th.innerHTML = threadInner(c); th.scrollTop = th.scrollHeight; }
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

/* ---------- Voice playback ---------- */
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
  return `<div class="photo ${it.src ? "" : "ph"}" data-do="photo" data-a="${i}|${j}">${it.src ? `<img src="${esc(it.src)}" alt="${esc(it.name)}" loading="lazy">` : ""}${it.type === "video" || it.video ? `<b class="vid">${esc(it.duration || "▶")}</b>` : ""}${it.src ? "" : `<span>${esc(it.name)}</span>`}</div>`;
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
      const li = Math.max(0, all.findIndex(a => a.name === CONFIG.libraryAlbum)), lib = all[li] || all[0];
      return `<h2 class="heading">Library</h2><div class="photo-grid">${lib ? lib.items.map((it, j) => cell(it, li, j)).join("") : ""}</div><p class="muted center">${lib ? (lib.count ?? lib.items.length) : 0} Items</p>${note("Photos are placeholders. Add src paths in data.js.")}`;
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
    render: () => `<div class="viewer">${it.src ? `<img src="${esc(it.src)}" alt="${esc(it.name)}">` : (it.video ? `<video src="${esc(it.video)}" controls autoplay style="max-width:100%;max-height:100%"></video>` : "IMAGE PLACEHOLDER")}<button class="nav l" data-do="photo" data-a="${i}|${j - 1}" ${j < 1 ? "disabled" : ""}>‹</button><button class="nav r" data-do="photo" data-a="${i}|${j + 1}" ${j >= a.items.length - 1 ? "disabled" : ""}>›</button></div>${kv([["Caption", it.name], ["Date", it.date], ["Location", it.loc], ["Album", a.name]])}`
  };
}

/* ---------- Music ---------- */
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
  if (!m) return;
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

/* ---------- Notes ---------- */
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
    search: q => { const l = hist().map((h, i) => ({ h, i })).filter(x => has(q, x.h.title, x.h.url)); return l.length ? card(l.map(({ h, i }) => row("🌐", h.title, h.url || "history", "safariItem", String(i), "", { noChev: true }))) : empty("No Results"); },
    render: v => `<h2 class="heading">Safari</h2>${sbar(v, "Search or website name")}${listBox(v)}${note("History items are placeholders — set D.safari in data.js.")}`
  };
}

/* ---------- Find My ---------- */
function findmyView() {
  return {
    title: "Find My",
    render: (v, n) => {
      const tab = n.tab || "Devices";
      if (tab === "People") return `<h2 class="heading">People</h2>${D.findmy.people.length ? card(D.findmy.people.map(p => row("👤", p.name, p.loc, "toastText", p.loc, p.dist || ""))) : empty("No People Sharing Location")}`;
      if (tab === "Devices") return `<h2 class="heading">Devices</h2>${card(D.devices.map(d => row("💻", d.name, d.detail, "toastText", d.detail, d.status || "")))}`;
      if (tab === "Items") return `<h2 class="heading">Items</h2>${empty("No Items")}`;
      return `<h2 class="heading">Me</h2>${card([row("☺", CONFIG.owner, "Sharing My Location", "toastText", "Location is sharing"), row("🔋", "Battery", "100%", "toastText", "Fully charged")])}`;
    }
  };
}

/* ---------- Settings ---------- */
function settingsView() {
  return {
    title: "Settings",
    render: () => `<h2 class="heading">Settings</h2>${card([
      row(avatar(CONFIG.owner, { cls: "mini-avatar" }), CONFIG.owner, "Apple Account, iCloud and more", "toastText", CONFIG.owner),
      row("✈", "Airplane Mode", "", "", "", "", { toggle: !!S.toggles.airplane, key: "airplane" }),
      row("📶", "Wi-Fi", S.toggles.airplane ? "Off" : "Connected", "toastText", S.toggles.airplane ? "Wi-Fi is off" : "Wi-Fi is on"),
      row("🔵", "Bluetooth", S.toggles.airplane ? "Off" : "On", "toastText", S.toggles.airplane ? "Bluetooth is off" : "Bluetooth is on"),
      row("🔋", "Battery", "100%", "toastText", "Battery Health is normal")
    ])}${card([
      row("⚙", "General", "", "toastText", "General Settings"),
      row("🎛", "Control Centre", "", "toastText", "Control Centre settings"),
      row("🔆", "Display & Brightness", "", "toastText", "Display settings"),
      row("🔊", "Sounds & Haptics", "", "toastText", "Sound settings")
    ])}`
  };
}

/* ---------- Reminders ---------- */
function remindersView() {
  return {
    title: "Reminders", q: "",
    search: q => { const l = D.reminders.map((r, i) => ({ r, i })).filter(x => has(q, typeof x.r === "string" ? x.r : x.r.title)); return l.length ? card(l.map(({ r }) => row("📋", typeof r === "string" ? r : r.title, typeof r === "string" ? "" : r.sub || "", "toastText", "Reminder checked", "", { noChev: true }))) : empty("No Reminders"); },
    render: v => `<h2 class="heading">Reminders</h2>${sbar(v)}${listBox(v)}`
  };
}

/* ---------- Voice Memos ---------- */
function voiceView() {
  return {
    title: "Voice Memos",
    render: () => `<h2 class="heading">Voice Memos</h2>${D.voiceMemos.length ? card(D.voiceMemos.map((m, i) =>
      `<div class="row"><button class="vplay" data-vid="v|${i}" aria-label="Play recording">▶</button><div class="row-main"><b>${esc(m.title)}</b><small>${esc(m.date || "Yesterday")} · ${esc(m.duration || "0:10")}</small></div></div>`)) : empty("No Recordings")}`
  };
}

/* ---------- Passwords ---------- */
function passwordsView() {
  return {
    title: "Passwords",
    render: () => `<h2 class="heading">Passwords</h2>${card(D.passwords.map(p => row("🔑", p.site, p.user || "••••••••", "toastText", "Protected password")))}`
  };
}

/* ---------- University & Banking & Weather ---------- */
function universityView() {
  return {
    title: "University",
    render: () => `<h2 class="heading">University</h2>${card([
      row("🏫", "Student Portal", "UCL Student Portal", "toastText", "Opening Portal"),
      row("📚", "Library Account", "Books borrowed and due dates", "toastText", "Opening Library"),
      row("📅", "Timetable", "Current semester schedule", "toastText", "Opening Timetable")
    ])}`
  };
}
function bankView() {
  return {
    title: "Banking",
    render: () => `<h2 class="heading">Banking</h2>${card([
      row("£", "Everyday Account", "•••• 4821", "toastText", "Balance: £1,240.50"),
      row("💷", "Savings", "•••• 9102", "toastText", "Balance: £3,410.00")
    ])}`
  };
}
function weatherView() {
  const w = CONFIG.weather;
  return {
    title: "Weather",
    render: () => `<div class="center" style="padding:30px 0"><b>${esc(w.place)}</b><h1 style="font-size:64px;margin:10px 0">${esc(w.temp)}</h1><p>${esc(w.cond)}</p></div>`
  };
}

/* ---------- Media Modal ---------- */
function viewMedia(src, title) {
  if (!src) { toast(title || "No preview available"); return; }   // FIX: label-only attachments have no src
  const modal = document.createElement("div");
  modal.className = "media-modal";
  modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:9999;color:#fff;";
  const isVid = /\.(mp4|mov|webm)$/i.test(String(src)) || title === "Video";
  modal.innerHTML = `<button style="position:absolute;top:20px;right:20px;background:none;border:none;color:#fff;font-size:24px;cursor:pointer">✕</button>
    ${isVid ? `<video src="${esc(src)}" controls autoplay style="max-width:90%;max-height:80%"></video>` : `<img src="${esc(src)}" style="max-width:90%;max-height:80%;object-fit:contain;" alt="">`}
    <p style="margin-top:10px">${esc(title)}</p>`;
  modal.querySelector("button").onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  document.body.append(modal);
}

/* ---------- Passcode key reader ---------- */
/* The passcode pad's markup lives in your HTML, so this accepts any of:
   data-key / data-k / data-digit, an aria-label of Delete, or the button's first character. */
function passKey(btn) {
  const d = btn.dataset, label = (btn.getAttribute("aria-label") || btn.textContent || "").trim();
  const k = d.key ?? d.k ?? d.digit ?? d.v;
  if (k !== undefined) return k;
  if (/cancel/i.test(label)) return "cancel";
  if (/delete|⌫/i.test(label)) return "del";
  return /^\d/.test(label) ? label[0] : null;
}

/* ---------- Event Delegation (one listener each) ---------- */
function bindEvents() {
  document.addEventListener("click", e => {
    /* FIX: passcode pad had no handler at all after the "duplicate listener" removal */
    if (S.screen === "passcode") {
      const pb = e.target.closest("#passcode button");
      if (pb && !pb.closest("#hardware")) {
        const k = passKey(pb);
        if (k === "cancel") { S.pass = ""; paintDots(); screen("lock"); }
        else if (k === "del" || k === "⌫" || /^\d$/.test(k || "")) digit(k);
        return;
      }
    }

    const btn = e.target.closest("[data-do], [data-action], [data-app], [data-tab], [data-page], [data-notif], .app-icon, .vplay");
    if (!btn) return;

    /* FIX: composer buttons use data-action, which was never matched, so Send did nothing */
    if (btn.dataset.action === "send") { sendMessage(); return; }
    if (btn.dataset.action === "plus") { toast("Attachments aren't available"); return; }

    if (btn.classList.contains("vplay") || btn.dataset.vid) { toggleVoice(btn); return; }
    if (btn.dataset.page !== undefined && !btn.dataset.app) {
      const p = $("#pages"); if (p) p.scrollTo({ left: +btn.dataset.page * p.clientWidth, behavior: "smooth" });
      return;
    }
    if (btn.classList.contains("app-icon") || btn.dataset.app) {
      const appId = btn.dataset.app;
      if (S.screen === "lock") { S.pending = appId; openPass(); }
      else openApp(appId);
      return;
    }
    if (btn.dataset.tab) {
      const n = navOf();
      if (n) { n.tab = btn.dataset.tab; n.stack = [(ROOTS[S.current] || (() => [genericView(S.current)]))()[0]]; paint(); }
      return;
    }
    if (btn.dataset.notif !== undefined) {
      const notif = CONFIG.notifications[+btn.dataset.notif];
      if (notif && notif.open) { S.pending = notif.open; openPass(); }   // FIX: keep the whole target so the chat opens too
      return;
    }

    const action = btn.dataset.do, arg = btn.dataset.a;
    switch (action) {
      case "toggle": S.toggles[arg] = !S.toggles[arg]; repaint(); return;
      case "chat": openChat(arg); return;
      case "storyPick": {
        const st = D.story, step = st.steps[S.step], opt = step && step.options[+arg], chat = chatById(st.chat);
        if (!opt) return;
        if (chat) {
          chat.messages.push({ f: "out", t: step.t[0], s: opt.me });
          chat.messages.push({ f: "in", t: step.t[1], s: opt.them });
        }
        if (step.clues) step.clues.forEach(addClue);
        S.step++;
        const top = navOf().stack.at(-1); top.scroll = null;   // FIX: snap to newest message
        paint();
        return;
      }
      case "notebook": openApp("notebook"); return;
      case "attach": { const i = arg.lastIndexOf("|"); viewMedia(arg.slice(0, i), arg.slice(i + 1)); return; }
      case "dial": { const n = navOf(); if (n) { n.dial = (n.dial || "") + arg; const d = $("#dialed"); if (d) d.textContent = n.dial; } return; }
      case "dialDel": { const n = navOf(); if (n && n.dial) { n.dial = n.dial.slice(0, -1); const d = $("#dialed"); if (d) d.textContent = n.dial; } return; }
      case "dialCall": toast("Calling…"); return;
      case "call": push(callView(+arg)); return;                 // FIX: handler was missing
      case "contact": push(contactView(arg)); return;
      case "msgContact": { const c = chatById("ezra"); openApp("messages"); openChat(c ? c.id : "ezra"); return; }
      case "toastText": toast(arg); return;
      case "photo": {
        const [i, j] = arg.split("|").map(Number), n = navOf(), v = photoView(i, j);
        if (n.stack.at(-1).isPhoto) { n.stack[n.stack.length - 1] = v; paint(); }   // FIX: prev/next replaces instead of stacking
        else push(v);
        return;
      }
      case "album": push(albumView(+arg)); return;
      case "playlists": push(playlistsView()); return;
      case "songs": push(songsView()); return;
      case "playlist": push(playlistView(+arg)); return;
      case "play": {
        const [pi, ti] = arg.split("|").map(Number), t = D.playlists[pi].tracks[ti];
        S.playing = { pi, ti, t, on: true };
        repaint();                                                // FIX: no more jumping to top
        return;
      }
      case "miniToggle": if (S.playing) { S.playing.on = !S.playing.on; paintMini(); } return;
      case "inbox": push(inboxView()); return;
      case "mailbox": push({ title: arg, render: () => empty(arg + " is empty") }); return;
      case "email": push(emailView(+arg)); return;
      case "event": push(eventView(+arg)); return;
      case "notesAll": push(notesListView(null)); return;
      case "folder": push(notesListView(arg)); return;
      case "note": push(noteView(arg)); return;
      case "wallet": push(walletCardView(+arg)); return;
      case "txn": push(txnView(+arg)); return;
      case "file": push(folderView(+arg)); return;
      case "safariItem": { const h = hist()[+arg]; if (h && h.url) toast("Opening " + h.url); return; }
    }
  });

  /* FIX: search used n.search / n.q (the nav object) — those live on the VIEW, so typing threw a TypeError */
  document.addEventListener("input", e => {
    const q = e.target.closest("[data-q]");
    if (!q) return;
    const n = navOf(), v = n && n.stack.at(-1), l = $("#list");
    if (v && v.search) { v.q = q.value; if (l) l.innerHTML = v.search(v.q, n); }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.closest("#messageInput")) { sendMessage(); e.preventDefault(); }
    if (S.screen === "passcode") {                                // bonus: physical keyboard works on passcode
      if (/^\d$/.test(e.key)) digit(e.key);
      else if (e.key === "Backspace") digit("del");
    }
  });

  const hook = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };
  hook("#back", back);
  hook("#homebar", homebar);
  hook("#lockBtn", lockPhone);
  hook("#unlockBtn", openPass);
}

/* FIX: if the script loads after DOMContentLoaded (defer / bottom of body), init never ran */
function init() {
  buildLock();
  buildHome();
  updateClueCount();
  bindEvents();
  screen("lock");
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
