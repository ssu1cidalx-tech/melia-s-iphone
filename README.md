# Melia's iPhone — Interactive Story Prototype

A browser-based, fictional iPhone-style simulation (plain HTML, CSS and JavaScript — no build step).
It is a storytelling prototype, not real iOS, and it reads no real phone data.

## Run it
1. Keep all files in one folder: `index.html`, `style.css`, `data.js`, `app.js`.
2. Open `index.html` in a modern browser.
3. Click **Swipe up to unlock** (or swipe up on a touch screen). Passcode: `280108` (`CONFIG.passcode` in `data.js`).

## Using the phone
- **Home:** click the bar at the bottom of the screen (or swipe up from it). **Lock:** the side button on the right edge. **Back:** the `‹` button, or Esc.
- Apps remember where you were: leave Messages inside a conversation, open Notes, come back, and you are still in the conversation.
- Swipe/scroll sideways on the Home Screen for page 2; swipe down (or tap **Search**) for Spotlight search.
- Tapping a Lock Screen notification asks for the passcode, then opens the right conversation.

## Where to edit things
**Everything the reader can discover is in `data.js`.** `app.js` is only the engine.

| You want to change | Edit in `data.js` |
|---|---|
| Phone clock, date, weather, passcode | `CONFIG` |
| Lock Screen notifications (and where they open) | `CONFIG.notifications` |
| Conversations, voice notes, photo/video attachments, delivery status | `D.chats` |
| Calls and FaceTime history | `D.calls` |
| Contacts | `D.contacts` |
| Photo albums and photos | `D.photos` |
| Notes, Mail, Calendar, Reminders | `D.notes`, `D.emails`, `D.calendar`, `D.reminders` |
| Music playlists / listening history | `D.playlists`, `D.recentlyPlayed` |
| Wallet cards, passes, transactions | `D.wallet`, `D.transactions` |
| Apple Account devices, iCloud, Family Sharing | `D.devices`, `D.icloud`, `D.family` |
| Safari history, Files, Voice Memos, Passwords, Maps | `D.safari`, `D.files`, `D.voiceMemos`, `D.passwords`, `D.maps` |
| App names and icon colours | `APPS` |

The field list for messages, photos, etc. is written at the top of `data.js`.

### Your own images and audio
Put files in an `assets/` folder and reference them by relative path, e.g. `"assets/melia-selfie.jpg"`. Supported:
wallpapers (`CONFIG.wallpaper`), map (`CONFIG.mapImage`), avatars (`img`), message photos/videos, album covers, photo `src`,
playlist `art`, and voice notes (`src` on a voice message or voice memo — real audio plays; without `src` playback is a timed simulation).
Anything left blank shows a neutral placeholder.

`CONFIG.authorNotes: true` shows small editor notes inside the apps; leave it `false` for an immersive phone.

## What was fixed in this version
- Home indicator was displaced on the Lock and Home screens; it now sits at the bottom and works as the Home button.
- Status bar was invisible (white on white) inside apps; it now adapts and shows signal and battery.
- No way to get home or lock the phone; no memory of where you were in an app — all added.
- Settings rows looped forever; Phone, Photos, Music and Find My tab bars did nothing; most search fields did nothing; calendar and lock widgets contradicted the Calendar app; phone clock (9:41) was earlier than "today" messages — all fixed.
- Messages: grouped timestamps, "Delivered"/"Read" status, working voice-note playback, photo/video attachments, SMS (green) option, search through message text, sent messages persist while the page is open.
- Spotlight now searches content (messages, notes, mail, contacts, calendar, history, photos, music) and opens the exact item.
- Layout uses flex instead of fixed heights; the phone scales down on short laptop screens; 21 apps fit on two Home Screen pages.

## Accuracy notes (verified against Apple's published behaviour)
- Music tabs are Home / New / Radio / Library / Search; Photos tabs are Library / Collections / Search.
- Family Sharing lives at Settings → [name] → Family. Each member keeps their own Apple Account; iCloud+ storage sharing does not share anyone's photos or files. Location sharing is a separate, opt-in feature. The stalkerware in your story is not simulated or represented as a Family Sharing feature.
- Mail and Notes open to a list with a `‹` back button to Mailboxes / Folders, as on iOS.

## Still placeholders / decisions for you
- `D.family`: roles (Organizer / Adult…) and shared features are blank until you decide them.
- `D.devices` includes the original placeholder "Unrecognised device — Review". Real iOS does not label devices that way, so consider replacing it with a plausible device name.
- Find My → People is empty until you add `D.findmy.people`.
- Wallet, Music, Photos, voice notes and message content are the original placeholders; nothing was invented as plot.

## Limits
- No malware, tracking, microphone, camera or real accounts are involved. Do not enter real passwords or personal data.
- Sent messages live only in the open page (a refresh resets them).
- Hosting: upload the four files (plus `assets/`) to a GitHub Pages repository (Settings → Pages → `main` / root).

## Locker story + investigation notebook (added in this version)
- **Ezra chat:** open Messages → Ezra. The seeded half of the locker conversation is in `D.chats` (Ezra); the interactive half is `D.story` in `data.js` (4 steps, 3 replies each). Reply choices replace the keyboard until the story is used up, then the normal composer returns with a "Conversation paused" note.
- **Notebook:** `D.clues` holds the 5 clues; each story step lists which ones it unlocks (`clues:[…]`). Open it from the button at the end of the chat, from the **Investigation** icon on Home Screen page 2 (delete its line in `APPS` to hide it), or from the side panel on desktop (asks for the passcode first if the phone is locked). A toast says "Investigation notebook updated" when a clue unlocks.
- Times for the story messages are 10:22–10:39, so they sit before the phone clock (`CONFIG.time` 10:41). If you change the clock, keep it later than the newest "Today" message.
- Refresh the page (or the side-panel **Restart phone** button) to replay.
