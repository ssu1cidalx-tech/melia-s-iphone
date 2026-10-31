(() => {
const PASSCODE = "280108";
const $ = id => document.getElementById(id);
const lock = $("lockscreen"), pass = $("passcode"), home = $("home"), appview = $("appview");
let entered = "", currentApp = null, clues = [], step = 0, unlocked = false, history = [];
const clueData = [
 ["The locker","The underwear was left inside Melia's assigned UCL locker, not somewhere public-facing."],
 ["The stain","The blood stain was old enough to have dried. Melia recognises it as her own period blood."],
 ["Access","Melia cannot work out how anyone got access to the item or the locker."],
 ["CCTV","The corridor camera does not give them a useful view of the locker itself."],
 ["The timeline","Ezra was away at a Van Der Berg customer gathering when Melia first found it."]
];
function show(el){[lock,pass,home,appview].forEach(x=>x.classList.add("hidden"));el.classList.remove("hidden");$("statusbar").classList.toggle("dark",el===appview)}
function unlockStart(){entered="";updateDots();$("pass-error").textContent="";show(pass)}
$("unlock-hint").addEventListener("click",unlockStart);
lock.addEventListener("click",e=>{if(e.target.id!=="unlock-hint")unlockStart()});
$("pass-back").addEventListener("click",()=>show(lock));
function updateDots(){$("dots").querySelectorAll("i").forEach((d,i)=>d.classList.toggle("filled",i<entered.length))}
$("keypad").addEventListener("click",e=>{const b=e.target.closest("[data-digit]");if(!b)return;if(entered.length<6){entered+=b.dataset.digit;updateDots();if(entered.length===6)setTimeout(checkPass,160)}});
$("delete-digit").addEventListener("click",()=>{entered=entered.slice(0,-1);updateDots();$("pass-error").textContent=""});
function checkPass(){if(entered===PASSCODE){unlocked=true;show(home)}else{ $("pass-error").textContent="Incorrect Passcode";setTimeout(()=>{entered="";updateDots()},550)}}
document.querySelectorAll("[data-app]").forEach(b=>b.addEventListener("click",()=>openApp(b.dataset.app)));
function appShell(title,content,back="Home"){return `<div class="app-top"><button class="back-button" data-back>${back==="Home"?"‹": "‹ "+back}</button><h2>${title}</h2><span style="width:35px"></span></div><div class="app-content">${content}</div>`}
function openApp(name){
 currentApp=name; appview.innerHTML="";
 if(name==="messages"){renderMessages();return}
 const screens={
 settings: appShell("Settings",`<div class="list-card"><div class="list-row"><div class="row-main"><span class="row-icon" style="background:#858b94">◉</span><div>Melia Nadya<small>Apple Account</small></div></div>›</div></div><div class="section-title">Settings</div><div class="list-card">${row("✈","Airplane Mode","Off","#f3a83b")}${row("◉","Wi-Fi","University Wi-Fi","#3987d8")}${row("ᛒ","Bluetooth","On","#3987d8")}${row("▰","Mobile Service","")}${row("🔔","Notifications","")}${row("◐","Focus","")}${row("◉","General","")}${row("🔒","Privacy & Security","")}</div>`),
 notes: appShell("Notes",`<div class="section-title">iCloud</div><div class="list-card"><div class="list-row"><div>Locker incident<small>3 days ago · Edited 8:42 PM</small></div>›</div><div class="list-row"><div>Shopping list<small>Yesterday</small></div>›</div></div>`),
 findmy: appShell("Find My",`<div class="map-placeholder"><span class="map-pin">●</span></div><div class="section-title">People</div><div class="list-card"><div class="list-row"><div>Share My Location<small>Location sharing is on</small></div>›</div></div><p style="font-size:11px;color:#777">This is a fictional interface. No live location is available.</p>`),
 photos: appShell("Library",`<div class="section-title">Recent Days</div><div class="list-card"><div class="list-row">No new photos</div></div>`),
 calendar: appShell("Friday, 18 October",`<div class="section-title">Today</div><div class="list-card"><div class="list-row">No events scheduled</div></div>`),
 weather: appShell("Weather",`<div style="text-align:center;padding:35px 0"><div style="font-size:55px">☁︎</div><div style="font-size:48px">14°</div><div>London · Cloudy</div><p style="color:#888;font-size:12px">Feels like 12°</p></div>`),
 safari: appShell("Safari",`<div style="background:#e6e6eb;border-radius:12px;padding:12px;color:#777;font-size:12px">⌕ &nbsp; Search or enter website name</div><p style="text-align:center;color:#888;font-size:12px;margin-top:30px">Frequently Visited</p>`),
 mail: appShell("Mail",`<div class="list-card"><div class="list-row">No New Messages</div></div>`),
 camera: appShell("Camera",`<div style="height:300px;background:#17191d;border-radius:16px;display:grid;place-items:center;color:#aaa">Camera unavailable in this simulation</div>`),
 clock: appShell("World Clock",`<div class="list-card"><div class="list-row">London <b>9:41</b></div></div>`),
 maps: appShell("Maps",`<div class="map-placeholder"></div><p style="font-size:12px;color:#777">Search Maps</p>`),
 phone: appShell("Favourites",`<div class="list-card"><div class="list-row">No Favourites</div></div>`),
 music: appShell("Listen Now",`<div style="text-align:center;padding:45px 10px;color:#777">Your music library</div>`)
 };
 appview.innerHTML=screens[name]||appShell("App","");show(appview);
 appview.querySelector("[data-back]")?.addEventListener("click",()=>show(home));
}
function row(icon,title,sub,color){return `<div class="list-row"><div class="row-main"><span class="row-icon" style="background:${color||"#777"}">${icon}</span><div>${title}${sub?`<small>${sub}</small>`:""}</div></div>›</div>`}
const conversation = [
 {from:"them",text:"You disappeared after class. Everything alright?"},
 {from:"me",text:"yeah. just got back"},
 {from:"them",text:"That's not an answer."},
 {from:"me",text:"something weird happened at the locker a few days ago"},
 {from:"them",text:"What happened?"},
 {from:"me",text:"someone put my underwear in my locker. the one at uni."},
 {from:"me",text:"it had blood on it too. actual period blood. i don't understand how someone even got it"},
 {from:"them",text:"That's rather unpleasant, pretty. When did you find it?"},
 {from:"me",text:"monday. i've been thinking about it since"},
 {from:"them",text:"Did you tell anyone?"},
 {from:"me",text:"no. what am i even supposed to say 😭"}
];
function renderMessages(){
 appview.innerHTML=`<div class="app-top"><button class="back-button" data-back>‹</button><h2>Messages</h2><span style="width:35px"></span></div><div class="thread"><div class="thread-head"><div class="avatar">E</div><strong>Ezra</strong><small>iMessage</small></div><div id="message-scroll" class="message-scroll"></div><div id="choice-area" class="choice-area"></div></div>`;
 show(appview);appview.querySelector("[data-back]").onclick=()=>show(home);
 const scroll=$("message-scroll");
 conversation.concat(history).forEach((m,i)=>{if(i===0){const t=document.createElement("div");t.className="timestamp";t.textContent="iMessage · Today 8:37 PM";scroll.append(t)}addBubble(m.from,m.text)});
 renderChoices();
}
function addBubble(from,text){const sc=$("message-scroll");if(!sc)return;const b=document.createElement("div");b.className="bubble "+from;b.textContent=text;sc.append(b);sc.scrollTop=sc.scrollHeight}
function renderChoices(){
 const area=$("choice-area");
 const sets=[
  {prompt:"What does Melia say?",options:[
   ["i genuinely don't know how someone got it. it was in my locker when i opened it.","Could be someone messing around. Did you leave the locker unlocked?"],
   ["it's been three days and i still keep thinking about it. it's so fucking weird.","I can imagine. You shouldn't have to deal with that at university."],
   ["i just want to know how they got it. that's the part i can't figure out.","We can think through who could access the locker, if you like."]
  ]},
  {prompt:"Ezra asks if she wants him to help. How does she respond?",options:[
   ["can you? i don't even know where to start","Of course. We can start with the practical things."],
   ["maybe. i don't want to make it into a whole thing","It already is a thing, pretty. You don't have to pretend otherwise."],
   ["i was hoping you'd have some idea because you're annoyingly observant","Flattery. I'll see what I can find out."]
  ]},
  {prompt:"What does Melia want to check first?",options:[
   ["whether the corridor has cctv","I'll ask what the university can actually provide. Don't expect much."],
   ["who else can access those lockers","We can make a list of people with legitimate access."],
   ["whether someone could've got into my room","That's worth checking. Have you noticed anything missing or out of place?"]
  ]},
  {prompt:"After the checks lead nowhere, Ezra suggests somewhere safer.",options:[
   ["i don't know. staying at yours feels like a lot","You can say no. I thought it might make things easier for a few days."],
   ["maybe for a few nights. i need to think","Then a few nights. No need to decide anything else now."],
   ["would you actually mind if i stayed?","I wouldn't have offered if I minded, pretty."]
  ]}
 ];
 if(step>=sets.length){area.innerHTML=`<p class="choice-prompt">Conversation paused · You can explore the phone.</p><button class="choice" id="notebook-link">Open investigation notebook</button>`;$("notebook-link").onclick=openNotebook;return}
 const s=sets[step];area.innerHTML=`<p class="choice-prompt">${s.prompt}</p>`+s.options.map((o,i)=>`<button class="choice" data-choice="${i}">${o[0]}</button>`).join("");
 area.querySelectorAll("[data-choice]").forEach(btn=>btn.onclick=()=>{if(area.dataset.busy)return;area.dataset.busy="1";const o=s.options[+btn.dataset.choice];history.push({from:"me",text:o[0]},{from:"them",text:o[1]});addBubble("me",o[0]);setTimeout(()=>addBubble("them",o[1]),180);if(step===0)addClue(0);if(step===1)addClue(1);if(step===2){addClue(2);addClue(3)}if(step===3)addClue(4);step++;setTimeout(()=>{delete area.dataset.busy;if($("choice-area"))renderChoices()},230)});
}
function addClue(i){if(!clues.includes(i)){clues.push(i);$("clue-count").textContent=`${clues.length} / 5 clues`;}}
function openNotebook(){currentApp="notebook";appview.innerHTML=appShell("Investigation",`<div class="note-paper"><h3>Locker incident</h3><p>Notes from Melia's conversation with Ezra.</p>${clueData.map((c,i)=>`<div class="clue"><b>${clues.includes(i)?"✓":"○"} ${c[0]}</b><p>${clues.includes(i)?c[1]:"Not yet established."}</p></div>`).join("")}</div>`);show(appview);appview.querySelector("[data-back]").onclick=()=>show(unlocked?home:lock)}
$("open-notes").onclick=openNotebook;
$("reset").onclick=()=>{entered="";step=0;clues=[];history=[];unlocked=false;appview.innerHTML="";$("clue-count").textContent="0 / 5 clues";show(lock)};
$("status-time").textContent="9:41";
document.addEventListener("keydown",e=>{if(!pass.classList.contains("hidden")){if(/^[0-9]$/.test(e.key)&&entered.length<6){entered+=e.key;updateDots();if(entered.length===6)setTimeout(checkPass,160)}if(e.key==="Backspace"){entered=entered.slice(0,-1);updateDots();$("pass-error").textContent=""}}});
})();