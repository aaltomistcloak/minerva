/**
 * MINERVA – Modular Intelligent Neural Executive & Resource Virtual Assistant
 * Persönliches Organisationssystem (früher NERA). Gegenstück für das Zuhause: ATLAS.
 *
 * Aufbau: genau zwei Dateien im Apps-Script-Projekt.
 *   Code.gs     – alles auf dem Server (diese Datei)
 *   Index.html  – die komplette Oberfläche (Design + Module)
 * Update einspielen: beide Dateien komplett ersetzen, Strg+S, App neu laden.
 * Neue Tabellenblätter/Spalten und Daten-Updates laufen beim ersten Start einer
 * neuen Version automatisch (ensureSetup_). setup() kann zusätzlich jederzeit
 * gefahrlos von Hand laufen. Bestehende Zeilen werden nie überschrieben.
 *
 * Inhalt dieser Datei:
 *   1. App & Module          4. VESTA       7. CORE (Profil, Einstellungen, Feedback)
 *   2. Datenbank-Schicht     5. Menschen    8. Einrichtung (Migrationen, SCHEMA, Startdaten)
 *   3. JANUS                 6. CLIO        6b. ARIADNE (ADHS-Navigator, Gesundheit)
 *                                           6c. APOLLO (Filme, Serien & Spiele)
 *   9. Schnittstelle für die MINERVA-App (doPost, Schlüssel)
 */

/* =========================================================
   1. App & Module
   ========================================================= */

/** Versionsnummer – wird in CORE angezeigt. Ändert sie sich, läuft setup() einmal automatisch. */
const VERSION = '5.6';

/** Adresse des App-Icons (PNG, öffentlich erreichbar). Leer lassen = kein Favicon. */
const ICON_URL = 'https://lh3.googleusercontent.com/d/1kUGkI86wJMVYHv4-W37eGHyfqQvrAI1Q#.png';

/**
 * Die Module von MINERVA. Reihenfolge = Reihenfolge in der Navigation.
 * Neues Modul: hier eintragen, Server-Funktionen unten ergänzen, Ansichten in Index.html registrieren.
 */
const MODULES = [
  {
    id: 'janus', name: 'JANUS', desc: 'Alltag & Routinen', icon: 'janus',
    about: 'Janus ist der römische Gott der Anfänge, Übergänge und Türen. Mit zwei Gesichtern blickt er zugleich in die Vergangenheit und in die Zukunft. JANUS hilft dir, deinen Alltag zu strukturieren: Routinen, kleine Aufgaben und Packlisten für unterwegs.',
    subs: [
      { id: 'routinen', name: 'Routinen', icon: 'rout' },
      { id: 'aufgaben', name: 'Aufgaben', icon: 'tasks' },
      { id: 'packliste', name: 'Packliste', icon: 'pack' }
    ]
  },
  {
    id: 'vesta', name: 'VESTA', desc: 'Haushalt & Versorgung', icon: 'vesta',
    about: 'Vesta ist die römische Göttin des Herdfeuers, des Zuhauses und des häuslichen Lebens. Sie steht für Wärme, Beständigkeit und einen Ort, an dem alles seinen Platz hat. VESTA unterstützt dich bei der Organisation deines Haushalts – vom Einkauf und Kochen bis zur Pflege deines Zuhauses.',
    subs: [
      { id: 'einkauf', name: 'Einkaufsliste', icon: 'cart' },
      { id: 'rezepte', name: 'Rezeptbuch', icon: 'pot' },
      { id: 'wohnideen', name: 'Wohnideen', icon: 'home' },
      { id: 'pflege', name: 'Pflegeguide', icon: 'care' }
    ]
  },
  {
    id: 'ariadne', name: 'ARIADNE', desc: 'ADHS-Navigator', icon: 'ariadne',
    about: 'Ariadne ist in der griechischen Mythologie die Tochter des Königs Minos. Mit ihrem Faden half sie Theseus, den Weg aus dem Labyrinth zurückzufinden. ARIADNE ist dein Faden, wenn sich der Kopf wie ein Labyrinth anfühlt: In wenigen Schritten ordnest du ein, was gerade los ist, und bekommst zwei bis drei Techniken, die dazu passen. Jeder Schritt lässt sich überspringen, nichts wird bewertet. Unter „Gesundheit“ schaust du einmal pro Woche kurz auf Energie, Belastung und ein paar Werte deiner Uhr – ARIADNE meldet sich nur, wenn mehrere Signale zusammenkommen. Die Inhalte pflegst du weiter in deinem Sheet „ADHS Exekutivfunktionen“.',
    subs: [
      { id: 'navigator', name: 'Navigator', icon: 'ariadne' },
      { id: 'ampel', name: 'Frühwarn-Ampel', icon: 'ampel' },
      { id: 'gesundheit', name: 'Gesundheit', icon: 'pulse' },
      { id: 'werkzeug', name: 'Werkzeugkasten', icon: 'tools' }
    ]
  },
  {
    id: 'apollo', name: 'APOLLO', desc: 'Filme, Serien & Spiele', icon: 'apollo',
    about: 'Apollon ist der griechische Gott des Lichts, der Musik und der Künste – zuständig für alles, was inspiriert und Freude macht. APOLLO sammelt, was du schauen und spielen möchtest: deine Watchlist mit Postern, Bewertungen und den Diensten, auf denen ein Titel gerade läuft, deine Spiele vom Anfangen bis zum Durchspielen und deine ganze Spielesammlung – über alle Konsolen, digital, auf Disc oder als Cartridge, mit deiner eigenen Bewertung. Wenn du abends nicht weißt, was du schauen sollst, stellt dir APOLLO drei kurze Fragen und schlägt dir genau einen Titel vor.',
    subs: [
      { id: 'heute', name: 'Was schaue ich?', icon: 'sparkle' },
      { id: 'watchlist', name: 'Watchlist', icon: 'film' },
      { id: 'spiele', name: 'Spiele', icon: 'gamepad' }
    ]
  },
  {
    id: 'clio', name: 'CLIO', desc: 'Erinnerungen & Meilensteine', icon: 'clio',
    about: 'Clio, im Griechischen Kleio, ist die Muse der Geschichtsschreibung und der Erinnerung an bedeutende Taten. CLIO gibt deiner persönlichen Geschichte einen Ort: für Stationen, Reisen, Meilensteine und besondere Erinnerungen – und für das, was du noch erleben möchtest. So entsteht nach und nach ein Archiv deines Lebens. Auch die Menschen in deinem Leben haben hier ihren Platz: Profile, Geburtstage, Anlässe und Geschenkideen – damit kleine wie große Aufmerksamkeiten nicht verloren gehen.',
    subs: [
      { id: 'chronik', name: 'Lebenschronik', icon: 'clio' },
      { id: 'wuensche', name: 'Bucket List', icon: 'star' },
      { id: 'geschenke', name: 'Geschenkideen', icon: 'gift' },
      { id: 'menschen', name: 'Menschen', icon: 'users' },
      { id: 'affirmationen', name: 'Affirmationen', icon: 'sun' }
    ]
  }
];

/** MINERVA CORE: Profil & übergreifende Einstellungen (kein Modul, eigener Bereich). */
const CORE = { id: 'core', name: 'CORE', desc: 'Profil & Einstellungen', icon: 'user', subs: [{ id: 'profil', name: 'Profil', icon: 'user' }] };

/**
 * Startet die Web-App. Die Startdaten werden direkt in die Seite geschrieben,
 * damit die App nach dem Öffnen keinen zweiten Server-Aufruf braucht.
 */
/** Ist der Besucher der Besitzer des Skripts? (Schutz, sobald die App-Schnittstelle für „Jeder“ freigegeben ist.) */
function istBesitzer_() {
  try { const a = Session.getActiveUser().getEmail(), b = Session.getEffectiveUser().getEmail(); return !!a && a === b; } catch (e) { return false; }
}

function doGet() {
  if (prop_('API_KEY') && !istBesitzer_()) {
    return HtmlService.createHtmlOutput('<p style="font:16px sans-serif;padding:24px">MINERVA ist privat. Bitte die MINERVA-App benutzen.</p>').setTitle('MINERVA');
  }
  let boot = null;
  try { ensureSetup_(); boot = getBootstrap(); } catch (e) { console.error(e); }
  const json = JSON.stringify(boot).replace(/</g, '\\u003c');
  const html = HtmlService.createHtmlOutputFromFile('Index').getContent().replace('/*__BOOT__*/null', function () { return json; });
  const out = HtmlService.createHtmlOutput(html)
    .setTitle('MINERVA')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes');
  if (ICON_URL) {
    try { out.setFaviconUrl(ICON_URL); } catch (e) { console.warn('Favicon nicht gesetzt: ' + e.message); }
  }
  return out;
}

/** Alle Daten, die die App beim Start braucht (auch für „Synchronisieren“). */
function getBootstrap() {
  ensureSetup_();
  return {
    version: VERSION,
    modules: MODULES,
    core: CORE,
    settings: getSettings_(),
    janus: janusData_(),
    vesta: vestaData_(),
    clio: clioData_(),
    harmonia: harmoniaData_(),
    apollo: apolloData_(),
    gesund: gesundData_(),
    feedback: feedbackData_()
  };
}

function getSettings_() {
  const out = {};
  readTable_('Einstellungen').forEach(function (r) {
    if (r.Schluessel) out[String(r.Schluessel)] = r.Wert;
  });
  return out;
}

function setting_(key, fallback) {
  const v = getSettings_()[key];
  return (v === undefined || v === '') ? fallback : v;
}

/* =========================================================
   2. Datenbank-Schicht über Google Sheets
   Jedes Tabellenblatt ist eine Tabelle; Zeile 1 enthält die Spaltennamen.
   Gelesene Blätter werden pro Aufruf zwischengespeichert (schneller Start);
   jede Änderung an einem Blatt verwirft dessen Zwischenspeicher.
   ========================================================= */

/** Script-Property lesen; ältere Installationen speichern sie noch unter „NERA_…“. */
function prop_(key) {
  const p = PropertiesService.getScriptProperties();
  return p.getProperty('MINERVA_' + key) || p.getProperty('NERA_' + key);
}
function setProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty('MINERVA_' + key, value);
}

let SS_CACHE_ = null;
let TABLE_CACHE_ = {};

function ss_() {
  if (SS_CACHE_) return SS_CACHE_;
  const id = prop_('SHEET_ID');
  SS_CACHE_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!SS_CACHE_) throw new Error('Tabelle nicht gefunden – bitte einmal setup() im Apps-Script-Editor ausführen.');
  return SS_CACHE_;
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Tabellenblatt „' + name + '“ fehlt – bitte einmal setup() ausführen.');
  return sh;
}

function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function norm_(v) {
  if (v instanceof Date) return v.toISOString();
  return v;
}

function dirty_(name) { delete TABLE_CACHE_[name]; }

/** Liest ein Tabellenblatt als Array von Objekten. */
function readTable_(name) {
  if (!TABLE_CACHE_[name]) {
    const sh = sheet_(name);
    const last = sh.getLastRow();
    let rows = [];
    if (last >= 2) {
      const values = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
      const h = values.shift().map(String);
      rows = values
        .filter(function (r) { return r.join('') !== ''; })
        .map(function (r) {
          const o = {};
          h.forEach(function (k, i) { o[k] = norm_(r[i]); });
          return o;
        });
    }
    TABLE_CACHE_[name] = rows;
  }
  return TABLE_CACHE_[name].map(function (o) { return Object.assign({}, o); });
}

function appendRow_(name, obj) {
  const sh = sheet_(name);
  const h = headers_(sh);
  sh.appendRow(h.map(function (k) { return obj[k] === undefined ? '' : obj[k]; }));
  dirty_(name);
}

/** Ändert alle Zeilen, für die match(zeile) true liefert. Gibt die Anzahl zurück. */
function updateWhere_(name, match, patch) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const width = sh.getLastColumn();
  const values = sh.getRange(1, 1, last, width).getValues();
  const h = values[0].map(String);
  let count = 0;
  for (let r = 1; r < values.length; r++) {
    const o = {};
    h.forEach(function (k, i) { o[k] = norm_(values[r][i]); });
    if (!match(o)) continue;
    const p = typeof patch === 'function' ? patch(o) : patch;
    const row = values[r].slice();
    Object.keys(p).forEach(function (k) {
      const i = h.indexOf(k);
      if (i > -1) row[i] = p[k];
    });
    sh.getRange(r + 1, 1, 1, width).setValues([row]);
    count++;
  }
  if (count) dirty_(name);
  return count;
}

/** Löscht alle Zeilen, für die match(zeile) true liefert. */
function deleteWhere_(name, match) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const values = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
  const h = values[0].map(String);
  let count = 0;
  for (let r = values.length - 1; r >= 1; r--) {
    const o = {};
    h.forEach(function (k, i) { o[k] = norm_(values[r][i]); });
    if (match(o)) { sh.deleteRow(r + 1); count++; }
  }
  if (count) dirty_(name);
  return count;
}

function newId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function byOrder_(a, b) {
  return (Number(a.Reihenfolge) || 0) - (Number(b.Reihenfolge) || 0);
}

function nextOrder_(rows) {
  return rows.reduce(function (m, r) { return Math.max(m, Number(r.Reihenfolge) || 0); }, 0) + 1;
}

function bool_(v) {
  return v === true || String(v).toUpperCase() === 'TRUE' || v === 1 || v === '1';
}

function text_(v, max) {
  const s = String(v == null ? '' : v).trim();
  return max ? s.slice(0, max) : s;
}

/* =========================================================
   3. JANUS – Alltag & Routinen
   Untermodule: Routinen, Aufgaben, Packliste. Der Ideen-Parkplatz ist seit 5.6 ausgeblendet;
   das Blatt „Ideen“ bleibt unverändert im Sheet.
 * Häkchen werden nie automatisch zurückgesetzt – nur über packReset() / routineReset().
   ========================================================= */

function janusData_() {
  const trips = readTable_('Pack_TripTypen').sort(byOrder_);
  const tripIds = trips.map(function (t) { return String(t.ID); });
  const items = readTable_('Pack_Items').sort(byOrder_).map(function (i) {
    const raw = String(i.Tags || '').split(',').map(function (t) { return t.trim(); }).filter(String);
    const tags = raw.indexOf('alle') > -1 ? tripIds.slice() : raw;
    return { ID: String(i.ID), Name: i.Name, KategorieID: String(i.KategorieID), tags: tags, alle: raw.indexOf('alle') > -1 };
  });
  const packed = {}, skipped = {};
  readTable_('Pack_Status').forEach(function (s) {
    const t = String(s.TripID);
    const target = String(s.Status || 'gepackt') === 'skip' ? skipped : packed;
    (target[t] = target[t] || []).push(String(s.ItemID));
  });
  const done = {};
  readTable_('Routine_Status').forEach(function (s) {
    const r = String(s.RoutineID);
    (done[r] = done[r] || []).push(String(s.SchrittID));
  });
  return {
    trips: trips.map(function (t) { return { ID: String(t.ID), Name: t.Name, Kurzname: t.Kurzname || t.Name, Icon: t.Icon || 'pack' }; }),
    cats: readTable_('Pack_Kategorien').sort(byOrder_).map(cat_),
    items: items,
    packed: packed,
    skipped: skipped,
    routines: readTable_('Routine_Typen').sort(byOrder_).map(function (r) { return { ID: String(r.ID), Name: r.Name, Icon: r.Icon }; }),
    sections: readTable_('Routine_Abschnitte').sort(byOrder_).map(function (a) {
      return { ID: String(a.ID), RoutineID: String(a.RoutineID), Name: a.Name, Icon: a.Icon, Farbe: a.Farbe };
    }),
    steps: readTable_('Routine_Schritte').sort(byOrder_).map(function (s) {
      return { ID: String(s.ID), AbschnittID: String(s.AbschnittID), Schritt: s.Schritt, Hinweis: s.Hinweis || '' };
    }),
    done: done,
    aufgaben: readTable_('Aufgaben').sort(byOrder_).map(function (a) {
      return { ID: String(a.ID), Titel: String(a.Titel || ''), Faellig: hDate_(a.Faellig), Erledigt: bool_(a.Erledigt), Quelle: String(a.Quelle || ''), Erstellt: a.Erstellt };
    }).filter(function (a) { return a.Titel; }),
    ideen: ideenData_()
  };
}

function cat_(c) {
  return { ID: String(c.ID), Name: c.Name, Icon: c.Icon, Farbe: c.Farbe };
}

/* ---------- Packliste ---------- */

/** Status eines Gegenstands für einen Trip setzen: 'gepackt', 'skip' (diesmal nicht benötigt) oder '' (offen). */
function packSetStatus(tripId, itemId, status) {
  return withLock_(function () {
    const t = String(tripId), i = String(itemId), st = String(status || '');
    if (st && st !== 'gepackt' && st !== 'skip') throw new Error('Unbekannter Status: ' + st);
    deleteWhere_('Pack_Status', function (r) { return String(r.TripID) === t && String(r.ItemID) === i; });
    if (st) appendRow_('Pack_Status', { TripID: t, ItemID: i, Status: st, Zeitpunkt: new Date() });
    return janusData_();
  });
}

/** Ältere Clients: schaltet zwischen offen und gepackt um. */
function packToggle(tripId, itemId) {
  const d = janusData_();
  const on = (d.packed[String(tripId)] || []).indexOf(String(itemId)) > -1;
  return packSetStatus(tripId, itemId, on ? '' : 'gepackt');
}

function packReset(tripId) {
  return withLock_(function () {
    deleteWhere_('Pack_Status', function (r) { return String(r.TripID) === String(tripId); });
    return janusData_();
  });
}

function packAddItem(item) {
  return withLock_(function () {
    const name = text_(item && item.name, 120);
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    const kat = text_(item.kategorie, 60);
    const tags = Array.isArray(item.tags) && item.tags.length ? item.tags.join(',') : 'alle';
    const same = readTable_('Pack_Items').filter(function (r) { return String(r.KategorieID) === kat; });
    appendRow_('Pack_Items', { ID: newId_('p'), Name: name, KategorieID: kat, Tags: tags, Reihenfolge: nextOrder_(same) });
    return janusData_();
  });
}

function packUpdateItem(itemId, item) {
  return withLock_(function () {
    const name = text_(item && item.name, 120);
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    const tags = Array.isArray(item.tags) && item.tags.length ? item.tags.join(',') : 'alle';
    const n = updateWhere_('Pack_Items', function (r) { return String(r.ID) === String(itemId); },
      { Name: name, KategorieID: text_(item.kategorie, 60), Tags: tags });
    if (!n) throw new Error('Gegenstand nicht gefunden – bitte neu laden.');
    return janusData_();
  });
}

function packDeleteItem(itemId) {
  return withLock_(function () {
    const i = String(itemId);
    deleteWhere_('Pack_Items', function (r) { return String(r.ID) === i; });
    deleteWhere_('Pack_Status', function (r) { return String(r.ItemID) === i; });
    return janusData_();
  });
}

/** Reihenfolge der Gegenstände einer Kategorie setzen. ids: alle Item-IDs der Kategorie in neuer Reihenfolge. */
function packReorder(kategorieId, ids) {
  return withLock_(function () {
    const kat = String(kategorieId);
    const pos = {};
    (ids || []).forEach(function (id, i) { pos[String(id)] = i + 1; });
    updateWhere_('Pack_Items', function (r) { return String(r.KategorieID) === kat && pos[String(r.ID)] && Number(r.Reihenfolge) !== pos[String(r.ID)]; },
      function (r) { return { Reihenfolge: pos[String(r.ID)] }; });
    return janusData_();
  });
}

/* ---------- Routinen ---------- */

function routineToggle(routineId, stepId) {
  return withLock_(function () {
    const r = String(routineId), s = String(stepId);
    const removed = deleteWhere_('Routine_Status', function (x) { return String(x.RoutineID) === r && String(x.SchrittID) === s; });
    if (!removed) appendRow_('Routine_Status', { RoutineID: r, SchrittID: s, Zeitpunkt: new Date() });
    return janusData_();
  });
}

function routineReset(routineId) {
  return withLock_(function () {
    deleteWhere_('Routine_Status', function (x) { return String(x.RoutineID) === String(routineId); });
    return janusData_();
  });
}

/* ---------- Aufgaben (Braindump für kleine To-dos) ---------- */

/** Neue Aufgabe, optional mit Deadline (JJJJ-MM-TT) und Herkunft (z. B. „wi:<WohnideeID>“). */
function aufgabeAdd(titel, faellig, quelle) {
  return withLock_(function () {
    const t = text_(titel, 300);
    if (!t) throw new Error('Bitte eine Aufgabe eingeben.');
    const f = /^\d{4}-\d{2}-\d{2}$/.test(String(faellig || '')) ? "'" + faellig : '';
    appendRow_('Aufgaben', { ID: newId_('a'), Titel: t, Faellig: f, Erledigt: false, Quelle: text_(quelle, 80), Reihenfolge: nextOrder_(readTable_('Aufgaben')), Erstellt: new Date() });
    return janusData_();
  });
}

function aufgabeToggle(id) {
  return withLock_(function () {
    updateWhere_('Aufgaben', function (r) { return String(r.ID) === String(id); }, function (r) { return { Erledigt: !bool_(r.Erledigt) }; });
    return janusData_();
  });
}

function aufgabeUpdate(id, titel, faellig) {
  return withLock_(function () {
    const t = text_(titel, 300);
    if (!t) throw new Error('Bitte eine Aufgabe eingeben.');
    const f = /^\d{4}-\d{2}-\d{2}$/.test(String(faellig || '')) ? "'" + faellig : '';
    updateWhere_('Aufgaben', function (r) { return String(r.ID) === String(id); }, { Titel: t, Faellig: f });
    return janusData_();
  });
}

function aufgabeDelete(id) {
  return withLock_(function () {
    deleteWhere_('Aufgaben', function (r) { return String(r.ID) === String(id); });
    return janusData_();
  });
}

/** Erledigte Aufgaben entfernen. */
function aufgabenAufraeumen() {
  return withLock_(function () {
    deleteWhere_('Aufgaben', function (r) { return bool_(r.Erledigt); });
    return janusData_();
  });
}

/** Aufgaben mit dieser Herkunft entfernen (z. B. Wohnidee wieder abgewählt). */
function aufgabeRemoveQuelle(quelle) {
  return withLock_(function () {
    const q = String(quelle || '');
    if (q) deleteWhere_('Aufgaben', function (r) { return String(r.Quelle || '') === q; });
    return janusData_();
  });
}

/* ---------- Ideen-Parkplatz: erst ablegen, später entscheiden ----------
   Blatt „Ideen“. Stufe: idee (offen), aufgabe (wurde zur Aufgabe), wunsch (auf die Bucket List gewandert), verworfen.
   Frühere KAIROS-Projekte stehen mit ihrer alten Stufe im selben Blatt und bleiben dort unangetastet. */

function ideenData_() {
  return readTable_('Ideen').filter(function (k) { return String(k.Stufe || 'idee') === 'idee' && k.Titel; }).map(function (k) {
    return { ID: String(k.ID), Titel: String(k.Titel), Notiz: String(k.Notiz || ''), Erstellt: k.Erstellt };
  }).sort(function (a, b) { return String(b.Erstellt).localeCompare(String(a.Erstellt)); });
}

function ideeAdd(titel) {
  return withLock_(function () {
    const t = text_(titel, 300);
    if (!t) throw new Error('Bitte erst etwas aufschreiben.');
    const now = new Date();
    appendRow_('Ideen', { ID: newId_('k'), Titel: t, Typ: 'Idee', Stufe: 'idee', Erstellt: now, Geaendert: now });
    return janusData_();
  });
}

function ideeUpdate(id, titel, notiz) {
  return withLock_(function () {
    const t = text_(titel, 300);
    if (!t) throw new Error('Bitte einen Text eingeben.');
    updateWhere_('Ideen', function (k) { return String(k.ID) === String(id); }, { Titel: t, Notiz: text_(notiz, 5000), Geaendert: new Date() });
    return janusData_();
  });
}

/** Idee weiterreichen: 'aufgabe' (wird JANUS-Aufgabe), 'wunsch' (wandert auf die Bucket List) oder 'verworfen'. Die Zeile bleibt im Blatt. */
function ideeWeiter(id, ziel) {
  return withLock_(function () {
    const k = readTable_('Ideen').filter(function (x) { return String(x.ID) === String(id); })[0];
    if (!k) throw new Error('Idee nicht gefunden – bitte neu laden.');
    const z = String(ziel);
    if (['aufgabe', 'wunsch', 'verworfen', 'idee'].indexOf(z) < 0) throw new Error('Unbekanntes Ziel.');
    if (z === 'aufgabe') {
      appendRow_('Aufgaben', { ID: newId_('a'), Titel: text_(k.Titel, 300), Faellig: '', Erledigt: false, Quelle: 'id:' + k.ID, Reihenfolge: nextOrder_(readTable_('Aufgaben')), Erstellt: new Date() });
    }
    if (z === 'wunsch') {
      appendRow_('Bucket_List', { ID: newId_('bl'), Titel: text_(k.Titel, 300), Kategorie: 'Sonstiges', Horizont: 'Irgendwann', Notiz: text_(k.Notiz, 5000), Status: 'offen', Erstellt: new Date(), Geaendert: new Date() });
    }
    updateWhere_('Ideen', function (x) { return String(x.ID) === String(id); }, { Stufe: z, Geaendert: new Date() });
    return z === 'wunsch' ? { janus: janusData_(), clio: clioData_() } : janusData_();
  });
}

/* =========================================================
   4. VESTA – Haushalt & Versorgung
   Untermodule: Einkaufsliste, Rezeptbuch, Wohnideen, Pflegeguide.
   ========================================================= */

function vestaData_() {
  return {
    cats: readTable_('Einkauf_Kategorien').sort(byOrder_).map(cat_),
    items: readTable_('Einkauf').map(function (i) {
      return { ID: String(i.ID), Artikel: i.Artikel, KategorieID: String(i.KategorieID), ImWagen: bool_(i.ImWagen), Quelle: String(i.Quelle || ''), Erstellt: i.Erstellt };
    }),
    rezepte: rezepteData_(),
    wohnideen: readTable_('Wohnideen').map(function (w) {
      return { ID: String(w.ID), Titel: String(w.Titel || ''), Raum: String(w.Raum || ''), Notiz: String(w.Notiz || ''), Kosten: String(w.Kosten || ''),
        Link: String(w.Link || ''), Status: ['idee', 'geplant', 'erledigt'].indexOf(String(w.Status)) > -1 ? String(w.Status) : 'idee', Erstellt: w.Erstellt };
    }).filter(function (w) { return w.Titel; }),
    wissen: wissenData_()
  };
}

function einkaufAdd(artikel, kategorieId) {
  return withLock_(function () {
    const a = text_(artikel, 120);
    if (!a) throw new Error('Bitte einen Artikel eingeben.');
    appendRow_('Einkauf', { ID: newId_('e'), Artikel: a, KategorieID: text_(kategorieId, 60) || 'sonstiges', ImWagen: false, Erstellt: new Date() });
    return vestaData_();
  });
}

function einkaufToggle(id) {
  return withLock_(function () {
    updateWhere_('Einkauf', function (r) { return String(r.ID) === String(id); }, function (r) { return { ImWagen: !bool_(r.ImWagen) }; });
    return vestaData_();
  });
}

function einkaufDelete(id) {
  return withLock_(function () {
    deleteWhere_('Einkauf', function (r) { return String(r.ID) === String(id); });
    return vestaData_();
  });
}

/** „Einkauf abschließen“: entfernt alles, was im Wagen ist. Offenes bleibt stehen. */
function einkaufFinish() {
  return withLock_(function () {
    deleteWhere_('Einkauf', function (r) { return bool_(r.ImWagen); });
    return vestaData_();
  });
}

/** Mehrere Artikel auf einmal (z. B. fehlende Rezept-Zutaten). items: [{ artikel, kategorie, quelle }]
 *  quelle verknüpft den Eintrag mit seiner Herkunft, z. B. „rz:<RezeptID>:<Zutat-Nr.>“. */
function einkaufAddMany(items) {
  return withLock_(function () {
    const now = new Date();
    (items || []).forEach(function (it) {
      const a = text_(it && it.artikel, 120);
      if (a) appendRow_('Einkauf', { ID: newId_('e'), Artikel: a, KategorieID: text_(it.kategorie, 60) || 'sonstiges', ImWagen: false, Quelle: text_(it.quelle, 80), Erstellt: now });
    });
    return vestaData_();
  });
}

/* ---------- Rezeptbuch ---------- */

function rezepteData_() {
  return readTable_('Rezepte').map(function (r) {
    const vorb = Number(r.Vorbereitung) || 0, koch = Number(r.Kochzeit) || 0;
    return {
      ID: String(r.ID), Titel: r.Titel, Untertitel: String(r.Untertitel || ''), Kategorie: r.Kategorie || '',
      Portionen: Number(r.Portionen) || 0, Vorbereitung: vorb, Kochzeit: koch, Dauer: Number(r.Dauer) || (vorb + koch),
      Tags: String(r.Tags || '').split(',').map(function (t) { return t.trim(); }).filter(String),
      Vorrat: String(r.Vorrat || '').split(',').filter(String).map(Number),
      Zutaten: String(r.Zutaten || '').split('\n').map(function (z) { return z.trim(); }).filter(String),
      Zubereitung: String(r.Zubereitung || ''), Notizen: String(r.Notizen || ''), Naehrwerte: String(r.Naehrwerte || ''),
      Foto: String(r.Foto || ''), Erstellt: r.Erstellt
    };
  });
}

function rezeptFolder_() {
  const id = prop_('REZEPT_ORDNER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* neu anlegen */ } }
  const f = DriveApp.createFolder('MINERVA – Rezeptfotos');
  setProp_('REZEPT_ORDNER', f.getId());
  return f;
}

/** Rezeptfoto als Bild-Text laden. */
function rezeptPhoto(fileId) {
  const id = String(fileId);
  if (!readTable_('Rezepte').some(function (r) { return String(r.Foto || '') === id; })) throw new Error('Foto nicht gefunden.');
  const b = DriveApp.getFileById(id).getBlob();
  return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
}

/**
 * Rezept speichern. rezept: { id?, titel, untertitel, kategorie, tags[], portionen, vorbereitung, kochzeit,
 *   zutaten (Text, eine Zeile je Zutat; „Gruppe:“ als Zwischenüberschrift), zubereitung, notizen, naehrwerte,
 *   neuesFoto (data-URL), fotoEntfernen (true) }
 */
function rezeptSave(rezept) {
  return withLock_(function () {
    const titel = text_(rezept && rezept.titel, 200);
    if (!titel) throw new Error('Bitte einen Titel eingeben.');
    const vorb = Math.max(0, Number(rezept.vorbereitung) || 0), koch = Math.max(0, Number(rezept.kochzeit) || 0);
    const obj = {
      Titel: titel, Untertitel: text_(rezept.untertitel, 200), Kategorie: text_(rezept.kategorie, 60),
      Portionen: Math.max(0, Number(rezept.portionen) || 0), Vorbereitung: vorb, Kochzeit: koch, Dauer: vorb + koch,
      Zutaten: text_(rezept.zutaten, 5000), Zubereitung: text_(rezept.zubereitung, 20000),
      Notizen: text_(rezept.notizen, 5000), Naehrwerte: text_(rezept.naehrwerte, 300),
      Tags: (Array.isArray(rezept.tags) ? rezept.tags : []).map(function (t) { return text_(t, 40); }).filter(String).join(', '),
      Vorrat: ''
    };
    const existing = rezept.id ? readTable_('Rezepte').filter(function (r) { return String(r.ID) === String(rezept.id); })[0] : null;
    if (rezept.id && !existing) throw new Error('Rezept nicht gefunden – bitte neu laden.');
    let foto = existing ? String(existing.Foto || '') : '';
    if ((rezept.fotoEntfernen || rezept.neuesFoto) && foto) { try { DriveApp.getFileById(foto).setTrashed(true); } catch (e) { /* schon weg */ } foto = ''; }
    if (rezept.neuesFoto) {
      const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(rezept.neuesFoto));
      if (!m) throw new Error('Ungültiges Foto.');
      foto = rezeptFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(m[3]), m[1], titel.slice(0, 60) + '.jpg')).getId();
    }
    obj.Foto = foto;
    if (existing) updateWhere_('Rezepte', function (r) { return String(r.ID) === String(rezept.id); }, obj);
    else { obj.ID = newId_('rz'); obj.Erstellt = new Date(); appendRow_('Rezepte', obj); }
    return vestaData_();
  });
}

/** Einkaufseinträge mit diesen Quellen entfernen (z. B. Einkaufswagen bei einer Zutat wieder abgewählt). */
function einkaufRemoveQuelle(quellen) {
  return withLock_(function () {
    const q = (quellen || []).map(String);
    deleteWhere_('Einkauf', function (r) { return q.indexOf(String(r.Quelle || '')) > -1; });
    return vestaData_();
  });
}

/** Rezept zurücksetzen: Vorrat-Häkchen leeren und die zugehörigen Einträge von der Einkaufsliste nehmen. */
function rezeptReset(id) {
  return withLock_(function () {
    const pre = 'rz:' + String(id) + ':';
    updateWhere_('Rezepte', function (r) { return String(r.ID) === String(id); }, { Vorrat: '' });
    deleteWhere_('Einkauf', function (r) { return String(r.Quelle || '').indexOf(pre) === 0; });
    return vestaData_();
  });
}

/** Welche Zutaten (Index in der Zutatenliste) sind zuhause vorhanden? */
function rezeptSetVorrat(id, indices) {
  return withLock_(function () {
    const v = (indices || []).map(Number).filter(function (n) { return isFinite(n) && n >= 0; }).join(',');
    updateWhere_('Rezepte', function (r) { return String(r.ID) === String(id); }, { Vorrat: "'" + v });
    return vestaData_();
  });
}

function rezeptDelete(id) {
  return withLock_(function () {
    const r = readTable_('Rezepte').filter(function (x) { return String(x.ID) === String(id); })[0];
    if (r && r.Foto) { try { DriveApp.getFileById(String(r.Foto)).setTrashed(true); } catch (e) { /* schon weg */ } }
    deleteWhere_('Rezepte', function (x) { return String(x.ID) === String(id); });
    return vestaData_();
  });
}

/* ---------- Pflegeguide: eigenes Haushaltswissen ---------- */

function wissenData_() {
  return readTable_('Pflege_Wissen').sort(byOrder_).map(function (w) {
    return { ID: String(w.ID), Titel: w.Titel, Kategorie: w.Kategorie || 'Allgemein', Inhalt: String(w.Inhalt || '') };
  });
}

function wissenSave(w) {
  return withLock_(function () {
    const titel = text_(w && w.titel, 200);
    if (!titel) throw new Error('Bitte einen Titel eingeben.');
    const obj = { Titel: titel, Kategorie: text_(w.kategorie, 60) || 'Allgemein', Inhalt: text_(w.inhalt, 10000) };
    if (w.id) {
      updateWhere_('Pflege_Wissen', function (r) { return String(r.ID) === String(w.id); }, obj);
    } else {
      obj.ID = newId_('pw'); obj.Reihenfolge = nextOrder_(readTable_('Pflege_Wissen'));
      appendRow_('Pflege_Wissen', obj);
    }
    return vestaData_();
  });
}

function wissenDelete(id) {
  return withLock_(function () {
    deleteWhere_('Pflege_Wissen', function (r) { return String(r.ID) === String(id); });
    return vestaData_();
  });
}

/* ---------- Einkaufs-Kategorien in der App verwalten ---------- */

/** k: { id?, name, icon, farbe } – Umbenennen ändert nur den Namen; Einträge hängen an der ID und passen sich automatisch an. */
function einkaufKatSave(k) {
  return withLock_(function () {
    const name = text_(k && k.name, 60);
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    const farbe = ['lila', 'petrol', 'blau', 'gruen'].indexOf(k.farbe) > -1 ? k.farbe : 'lila';
    const icon = text_(k.icon, 30) || 'bag';
    const cats = readTable_('Einkauf_Kategorien');
    if (k.id) {
      const n = updateWhere_('Einkauf_Kategorien', function (r) { return String(r.ID) === String(k.id); }, { Name: name, Icon: icon, Farbe: farbe });
      if (!n) throw new Error('Kategorie nicht gefunden – bitte neu laden.');
    } else {
      appendRow_('Einkauf_Kategorien', { ID: newId_('ek'), Name: name, Icon: icon, Farbe: farbe, Reihenfolge: nextOrder_(cats) });
    }
    return vestaData_();
  });
}

/** Kategorie löschen – nur wenn keine Einträge mehr darin stehen. */
function einkaufKatDelete(id) {
  return withLock_(function () {
    if (readTable_('Einkauf').some(function (i) { return String(i.KategorieID) === String(id); })) throw new Error('In dieser Kategorie stehen noch Einträge.');
    deleteWhere_('Einkauf_Kategorien', function (r) { return String(r.ID) === String(id); });
    return vestaData_();
  });
}

/* ---------- Wohnideen: Verbesserungen fürs Zuhause, ohne gleich Aufgaben zu sein ---------- */

/** w: { id?, titel, raum, notiz, kosten, link, status ('idee' | 'geplant' | 'erledigt') } */
function wohnideeSave(w) {
  return withLock_(function () {
    const t = text_(w && w.titel, 200);
    if (!t) throw new Error('Bitte eine Idee eingeben.');
    let link = text_(w.link, 500);
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    const obj = { Titel: t, Raum: text_(w.raum, 60), Notiz: text_(w.notiz, 3000), Kosten: text_(w.kosten, 40), Link: link,
      Status: ['idee', 'geplant', 'erledigt'].indexOf(w.status) > -1 ? w.status : 'idee' };
    if (w.id) {
      const n = updateWhere_('Wohnideen', function (r) { return String(r.ID) === String(w.id); }, obj);
      if (!n) throw new Error('Idee nicht gefunden – bitte neu laden.');
    } else { obj.ID = newId_('wi'); obj.Erstellt = new Date(); appendRow_('Wohnideen', obj); }
    return vestaData_();
  });
}

function wohnideeDelete(id) {
  return withLock_(function () {
    deleteWhere_('Einkauf', function (r) { return String(r.Quelle || '') === 'wi:' + id; });
    deleteWhere_('Wohnideen', function (r) { return String(r.ID) === String(id); });
    return vestaData_();
  });
}

/** Wohnidee auf die Einkaufsliste setzen (on) oder wieder herunternehmen. */
function wohnideeEinkauf(id, on) {
  return withLock_(function () {
    const q = 'wi:' + id;
    deleteWhere_('Einkauf', function (r) { return String(r.Quelle || '') === q; });
    if (on) {
      const w = readTable_('Wohnideen').filter(function (x) { return String(x.ID) === String(id); })[0];
      if (!w) throw new Error('Wohnidee nicht gefunden.');
      const kats = readTable_('Einkauf_Kategorien').map(function (k) { return String(k.ID); });
      appendRow_('Einkauf', { ID: newId_('e'), Artikel: w.Titel + (w.Raum ? ' (' + w.Raum + ')' : ''), KategorieID: kats.indexOf('sonstiges') > -1 ? 'sonstiges' : (kats[0] || ''),
        ImWagen: false, Quelle: q, Erstellt: new Date() });
    }
    return vestaData_();
  });
}

/* =========================================================
   5. Menschen & Geschenkideen (früher HARMONIA, seit 5.4 Teil von CLIO)
   Bereiche in CLIO: Menschen (Profile, Geburtstage, Anlässe, Adressen) und Geschenkideen (inkl. „Meine Wünsche“).
   „ich“ als PersonID steht für dich selbst.
   ========================================================= */

function hDate_(v) {
  if (v === '' || v == null) return '';
  const s = String(v).trim();
  if (/^(\d{4}|--)-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d) ? s : Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
function hValidDate_(s) { return s === '' || /^(\d{4}|--)-\d{2}-\d{2}$/.test(String(s)); }

function harmoniaData_() {
  return {
    personen: readTable_('Personen').sort(function (a, b) { return String(a.Name).localeCompare(String(b.Name), 'de'); }).map(function (p) {
      return { ID: String(p.ID), Name: String(p.Name || ''), Beziehung: String(p.Beziehung || ''), Geburtstag: hDate_(p.Geburtstag),
        Adresse: String(p.Adresse || ''), Vorlieben: String(p.Vorlieben || ''), Interessen: String(p.Interessen || ''), Notizen: String(p.Notizen || '') };
    }).filter(function (p) { return p.Name; }),
    anlaesse: readTable_('Anlaesse').map(function (a) {
      return { ID: String(a.ID), PersonID: String(a.PersonID || ''), Titel: String(a.Titel || ''), Art: String(a.Art || 'Sonstiges'), Datum: hDate_(a.Datum),
        Vorlauf: Number(a.Vorlauf) || 21, InClio: a.InClio === '' ? true : bool_(a.InClio), Notiz: String(a.Notiz || '') };
    }),
    geschenke: readTable_('Geschenke').map(function (g) {
      return { ID: String(g.ID), PersonID: String(g.PersonID || ''), Typ: String(g.Typ) === 'nicht' ? 'nicht' : 'idee', Titel: String(g.Titel || ''),
        Link: String(g.Link || ''), Preis: String(g.Preis || ''), Notiz: String(g.Notiz || ''), Status: String(g.Status || 'offen'), Erstellt: g.Erstellt };
    })
  };
}

/** p: { id?, name, beziehung, geburtstag (JJJJ-MM-TT oder --MM-TT), adresse, vorlieben, interessen, notizen } */
function personSave(p) {
  return withLock_(function () {
    const name = text_(p && p.name, 120);
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    const gb = text_(p.geburtstag, 10);
    if (!hValidDate_(gb)) throw new Error('Der Geburtstag ist ungültig.');
    const obj = { Name: name, Beziehung: text_(p.beziehung, 60), Geburtstag: gb ? "'" + gb : '', Adresse: text_(p.adresse, 500),
      Vorlieben: text_(p.vorlieben, 2000), Interessen: text_(p.interessen, 2000), Notizen: text_(p.notizen, 5000) };
    if (p.id) {
      const n = updateWhere_('Personen', function (r) { return String(r.ID) === String(p.id); }, obj);
      if (!n) throw new Error('Person nicht gefunden – bitte neu laden.');
    } else {
      obj.ID = newId_('pe'); obj.Reihenfolge = nextOrder_(readTable_('Personen')); obj.Erstellt = new Date();
      appendRow_('Personen', obj);
    }
    return harmoniaData_();
  });
}

/** Person löschen – samt ihrer Anlässe und Geschenkideen. */
function personDelete(id) {
  return withLock_(function () {
    const pid = String(id);
    const gifts = readTable_('Geschenke').filter(function (g) { return String(g.PersonID) === pid; }).map(function (g) { return 'gs:' + g.ID; });
    deleteWhere_('Einkauf', function (r) { return gifts.indexOf(String(r.Quelle || '')) > -1; });
    deleteWhere_('Geschenke', function (r) { return String(r.PersonID) === pid; });
    deleteWhere_('Anlaesse', function (r) { return String(r.PersonID) === pid; });
    deleteWhere_('Personen', function (r) { return String(r.ID) === pid; });
    return harmoniaData_();
  });
}

/** a: { id?, personId, titel, art, datum (JJJJ-MM-TT oder --MM-TT), vorlauf (Tage), inClio, notiz } */
function anlassSave(a) {
  return withLock_(function () {
    const titel = text_(a && a.titel, 200);
    if (!titel) throw new Error('Bitte einen Titel eingeben.');
    const datum = text_(a.datum, 10);
    if (!datum || !hValidDate_(datum)) throw new Error('Bitte ein Datum angeben.');
    const obj = { PersonID: text_(a.personId, 40), Titel: titel, Art: text_(a.art, 40) || 'Sonstiges', Datum: "'" + datum,
      Vorlauf: Math.max(1, Math.min(120, Number(a.vorlauf) || 21)), InClio: a.inClio !== false, Notiz: text_(a.notiz, 2000) };
    if (a.id) updateWhere_('Anlaesse', function (r) { return String(r.ID) === String(a.id); }, obj);
    else { obj.ID = newId_('an'); obj.Erstellt = new Date(); appendRow_('Anlaesse', obj); }
    return harmoniaData_();
  });
}

function anlassDelete(id) {
  return withLock_(function () {
    deleteWhere_('Anlaesse', function (r) { return String(r.ID) === String(id); });
    return harmoniaData_();
  });
}

/** g: { id?, personId ('ich' = du selbst), typ ('idee' | 'nicht'), titel, link, preis, notiz } */
function geschenkSave(g) {
  return withLock_(function () {
    const titel = text_(g && g.titel, 200);
    if (!titel) throw new Error('Bitte einen Titel eingeben.');
    let link = text_(g.link, 500);
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    const obj = { PersonID: text_(g.personId, 40) || 'ich', Typ: g.typ === 'nicht' ? 'nicht' : 'idee', Titel: titel, Link: link, Preis: text_(g.preis, 40), Notiz: text_(g.notiz, 2000) };
    if (g.id) updateWhere_('Geschenke', function (r) { return String(r.ID) === String(g.id); }, obj);
    else { obj.ID = newId_('gs'); obj.Status = 'offen'; obj.Erstellt = new Date(); appendRow_('Geschenke', obj); }
    return harmoniaData_();
  });
}

function geschenkDelete(id) {
  return withLock_(function () {
    deleteWhere_('Einkauf', function (r) { return String(r.Quelle || '') === 'gs:' + id; });
    deleteWhere_('Geschenke', function (r) { return String(r.ID) === String(id); });
    return harmoniaData_();
  });
}

/** Status einer Geschenkidee: 'offen' oder 'verschenkt'. */
function geschenkStatus(id, status) {
  return withLock_(function () {
    updateWhere_('Geschenke', function (r) { return String(r.ID) === String(id); }, { Status: status === 'verschenkt' ? 'verschenkt' : 'offen' });
    return harmoniaData_();
  });
}

/** „Besorgen“: Geschenk auf die Einkaufsliste setzen (on) oder wieder herunternehmen. Liefert die VESTA-Daten. */
function geschenkBesorgen(id, on) {
  return withLock_(function () {
    const q = 'gs:' + id;
    deleteWhere_('Einkauf', function (r) { return String(r.Quelle || '') === q; });
    if (on) {
      const g = readTable_('Geschenke').filter(function (x) { return String(x.ID) === String(id); })[0];
      if (!g) throw new Error('Geschenkidee nicht gefunden.');
      const p = readTable_('Personen').filter(function (x) { return String(x.ID) === String(g.PersonID); })[0];
      const kats = readTable_('Einkauf_Kategorien').map(function (k) { return String(k.ID); });
      appendRow_('Einkauf', { ID: newId_('e'), Artikel: g.Titel + (p ? ' (für ' + p.Name + ')' : ''), KategorieID: kats.indexOf('geschenke') > -1 ? 'geschenke' : 'sonstiges',
        ImWagen: false, Quelle: q, Erstellt: new Date() });
    }
    return vestaData_();
  });
}

/* =========================================================
   6. CLIO – Erinnerungen & Meilensteine
   Lebenschronik: ein chronologisches Archiv: sechs Kategorien, Datum mit Tag, Monat oder nur Jahr,
   optional ein Zeitraum (von/bis), Ort, kategoriespezifische Details und Fotos.
   Fotos liegen im eigenen Google Drive (Ordner „MINERVA – CLIO Fotos“).
   Dazu: Bucket List (Lebensträume) und Affirmationen. Freiwillig: keine Pflichten, keine Streaks.
   ========================================================= */

/** Kategorien stehen im Blatt „Clio_Kategorien“ und lassen sich in der App ergänzen. */
function clioKats_() {
  return readTable_('Clio_Kategorien').sort(byOrder_).map(function (k) {
    const list = function (v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(String); };
    return { ID: String(k.ID), Name: String(k.Name || ''), Icon: String(k.Icon || 'clio'), Farbe: String(k.Farbe || 'lila'), OrtLabel: String(k.OrtLabel || 'Ort'), Felder: list(k.Felder), Optionen: list(k.Optionen) };
  });
}
const CLIO_MAX_FOTOS = 6;

function clioData_() {
  const kats = clioKats_(), katIds = kats.map(function (k) { return k.ID; });
  return {
    kategorien: kats,
    entries: readTable_('Clio').map(function (e) {
      let details = {};
      try { details = e.Details ? JSON.parse(String(e.Details)) : {}; } catch (x) { details = {}; }
      return {
        ID: String(e.ID), Datum: clioDate_(e.Datum), DatumBis: clioDate_(e.DatumBis), Titel: e.Titel,
        Kategorie: katIds.indexOf(String(e.Kategorie)) > -1 ? String(e.Kategorie) : (katIds[0] || ''),
        Ort: String(e.Ort || ''), Personen: String(e.Personen || '').split(',').map(function (x) { return x.trim(); }).filter(String), Beschreibung: String(e.Beschreibung || ''), Details: details,
        Fotos: String(e.Fotos || '').split(',').map(function (f) { return f.trim(); }).filter(String)
      };
    }).sort(function (a, b) { return String(b.Datum).localeCompare(String(a.Datum)); }),
    affirmationen: readTable_('Affirmationen').sort(byOrder_).map(function (a) {
      return { ID: String(a.ID), Text: String(a.Text || ''), Zeit: ['morgen', 'abend', 'immer'].indexOf(String(a.Zeit)) > -1 ? String(a.Zeit) : 'immer' };
    }).filter(function (a) { return a.Text; }),
    wuensche: bucketData_()
  };
}

/** Datum als JJJJ, JJJJ-MM oder JJJJ-MM-TT (auch wenn Google Sheets es als Datum/Zahl gespeichert hat). */
function clioDate_(v) {
  if (v === '' || v == null) return '';
  const s = String(v).trim();
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d) ? s : Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function clioValidDate_(s) { return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(s || '')); }

function clioFolder_() {
  const id = prop_('FOTO_ORDNER');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* neu anlegen */ } }
  const f = DriveApp.createFolder('MINERVA – CLIO Fotos');
  setProp_('FOTO_ORDNER', f.getId());
  return f;
}

function clioSavePhoto_(dataUrl, name) {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) throw new Error('Ungültiges Foto.');
  const blob = Utilities.newBlob(Utilities.base64Decode(m[3]), m[1], name + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]));
  return clioFolder_().createFile(blob).getId();
}

/**
 * Eintrag speichern. e: { id?, titel, kategorie, datum, datumBis, ort, beschreibung, details{}, neueFotos[dataUrl], entfernteFotos[id] }
 */
function clioSave(e) {
  return withLock_(function () {
    const titel = text_(e && e.titel, 200);
    if (!titel) throw new Error('Bitte einen Titel eingeben.');
    if (!clioValidDate_(e.datum)) throw new Error('Bitte ein Datum oder zumindest ein Jahr angeben.');
    if (e.datumBis && e.datumBis !== 'laufend' && !clioValidDate_(e.datumBis)) throw new Error('Das Bis-Datum ist ungültig.');
    const ids = clioKats_().map(function (k) { return k.ID; });
    const kat = ids.indexOf(e.kategorie) > -1 ? e.kategorie : (ids[0] || 'erinnerung');
    const details = {};
    Object.keys(e.details || {}).forEach(function (k) { const v = text_(e.details[k], 200); if (v) details[text_(k, 40)] = v; });
    const existing = e.id ? readTable_('Clio').filter(function (r) { return String(r.ID) === String(e.id); })[0] : null;
    if (e.id && !existing) throw new Error('Eintrag nicht gefunden – bitte neu laden.');
    let fotos = existing ? String(existing.Fotos || '').split(',').map(function (f) { return f.trim(); }).filter(String) : [];
    (e.entfernteFotos || []).forEach(function (id) {
      if (fotos.indexOf(String(id)) < 0) return;
      fotos = fotos.filter(function (f) { return f !== String(id); });
      try { DriveApp.getFileById(String(id)).setTrashed(true); } catch (x) { /* schon weg */ }
    });
    (e.neueFotos || []).slice(0, Math.max(0, CLIO_MAX_FOTOS - fotos.length)).forEach(function (d, i) {
      fotos.push(clioSavePhoto_(d, titel.slice(0, 40) + ' ' + (fotos.length + 1)));
    });
    const obj = {
      Datum: "'" + e.datum, DatumBis: e.datumBis ? (e.datumBis === 'laufend' ? 'laufend' : "'" + e.datumBis) : '', Titel: titel, Kategorie: kat,
      Ort: text_(e.ort, 200), Beschreibung: text_(e.beschreibung, 20000),
      Personen: (Array.isArray(e.personen) ? e.personen : []).map(function (x) { return text_(x, 40); }).filter(String).join(','),
      Details: Object.keys(details).length ? JSON.stringify(details) : '', Fotos: fotos.join(',')
    };
    if (existing) updateWhere_('Clio', function (r) { return String(r.ID) === String(e.id); }, obj);
    else { obj.ID = newId_('c'); obj.Erstellt = new Date(); appendRow_('Clio', obj); }
    return clioData_();
  });
}

/** Foto als Bild-Text laden (nur Fotos, die zu einem CLIO-Eintrag gehören). */
function clioPhoto(fileId) {
  const id = String(fileId);
  const ok = readTable_('Clio').some(function (r) { return String(r.Fotos || '').split(',').map(function (f) { return f.trim(); }).indexOf(id) > -1; });
  if (!ok) throw new Error('Foto nicht gefunden.');
  const b = DriveApp.getFileById(id).getBlob();
  return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
}

function clioDelete(id) {
  return withLock_(function () {
    const e = readTable_('Clio').filter(function (r) { return String(r.ID) === String(id); })[0];
    if (e) String(e.Fotos || '').split(',').map(function (f) { return f.trim(); }).filter(String).forEach(function (f) {
      try { DriveApp.getFileById(f).setTrashed(true); } catch (x) { /* schon weg */ }
    });
    deleteWhere_('Clio', function (r) { return String(r.ID) === String(id); });
    return clioData_();
  });
}

/* ---------- Affirmationen (Startseite: Morgen/Abend) ---------- */

/** a: { id?, text, zeit: 'morgen' | 'abend' | 'immer' } */
function affirmationSave(a) {
  return withLock_(function () {
    const t = text_(a && a.text, 500);
    if (!t) throw new Error('Bitte eine Affirmation eingeben.');
    const z = ['morgen', 'abend', 'immer'].indexOf(a.zeit) > -1 ? a.zeit : 'immer';
    if (a.id) {
      const n = updateWhere_('Affirmationen', function (r) { return String(r.ID) === String(a.id); }, { Text: t, Zeit: z });
      if (!n) throw new Error('Affirmation nicht gefunden – bitte neu laden.');
    } else {
      appendRow_('Affirmationen', { ID: newId_('af'), Text: t, Zeit: z, Reihenfolge: nextOrder_(readTable_('Affirmationen')) });
    }
    return clioData_();
  });
}

function affirmationDelete(id) {
  return withLock_(function () {
    deleteWhere_('Affirmationen', function (r) { return String(r.ID) === String(id); });
    return clioData_();
  });
}

/* ---------- Eigene CLIO-Kategorien ---------- */

/** k: { id?, name, icon, farbe, ortLabel, felder (Komma-Liste), optionen (Komma-Liste für das erste Feld) } */
function clioKatSave(k) {
  return withLock_(function () {
    const name = text_(k && k.name, 60);
    if (!name) throw new Error('Bitte einen Namen eingeben.');
    const obj = {
      Name: name, Icon: text_(k.icon, 30) || 'clio',
      Farbe: ['lila', 'petrol', 'blau', 'gruen'].indexOf(k.farbe) > -1 ? k.farbe : 'lila',
      OrtLabel: text_(k.ortLabel, 80) || 'Ort', Felder: text_(k.felder, 200), Optionen: text_(k.optionen, 500)
    };
    if (k.id) {
      const n = updateWhere_('Clio_Kategorien', function (r) { return String(r.ID) === String(k.id); }, obj);
      if (!n) throw new Error('Kategorie nicht gefunden – bitte neu laden.');
    } else {
      obj.ID = newId_('ck'); obj.Reihenfolge = nextOrder_(readTable_('Clio_Kategorien'));
      appendRow_('Clio_Kategorien', obj);
    }
    return clioData_();
  });
}

/** Kategorie löschen – nur wenn kein Eintrag sie mehr nutzt. */
function clioKatDelete(id) {
  return withLock_(function () {
    if (readTable_('Clio').some(function (e) { return String(e.Kategorie) === String(id); })) throw new Error('Diese Kategorie wird noch von Einträgen genutzt.');
    if (readTable_('Clio_Kategorien').length <= 1) throw new Error('Mindestens eine Kategorie muss bleiben.');
    deleteWhere_('Clio_Kategorien', function (r) { return String(r.ID) === String(id); });
    return clioData_();
  });
}

/* ---------- Bucket List: Lebensträume ohne Frist und ohne Druck ----------
   Blatt „Bucket_List“. Status: offen, erfuellt, entfernt (die Zeile bleibt im Blatt). */

const BUCKET_KATEGORIEN = ['Reisen & Orte', 'Erlebnisse & Abenteuer', 'Lernen & Können', 'Persönliches & Kreatives', 'Sonstiges'];
const BUCKET_HORIZONTE = ['Bald', 'In ein paar Jahren', 'Irgendwann'];

function bucketData_() {
  return readTable_('Bucket_List').filter(function (w) { return w.Titel && String(w.Status || 'offen') !== 'entfernt'; }).map(function (w) {
    return { ID: String(w.ID), Titel: String(w.Titel), Kategorie: String(w.Kategorie || 'Sonstiges'), Horizont: String(w.Horizont || 'Irgendwann'),
      Notiz: String(w.Notiz || ''), Status: String(w.Status) === 'erfuellt' ? 'erfuellt' : 'offen', Erfuellt: w.Erfuellt ? clioDate_(w.Erfuellt) : '', Erstellt: w.Erstellt };
  });
}

/** Wunsch anlegen oder bearbeiten. w: { id?, titel, kategorie, horizont, notiz } */
function bucketSave(w) {
  return withLock_(function () {
    const t = text_(w && w.titel, 300);
    if (!t) throw new Error('Bitte einen Wunsch eingeben.');
    const obj = { Titel: t, Kategorie: BUCKET_KATEGORIEN.indexOf(w.kategorie) > -1 ? w.kategorie : 'Sonstiges',
      Horizont: BUCKET_HORIZONTE.indexOf(w.horizont) > -1 ? w.horizont : 'Irgendwann', Notiz: text_(w.notiz, 5000), Geaendert: new Date() };
    if (w.id) {
      const n = updateWhere_('Bucket_List', function (r) { return String(r.ID) === String(w.id); }, obj);
      if (!n) throw new Error('Wunsch nicht gefunden – bitte neu laden.');
    } else {
      obj.ID = newId_('bl'); obj.Status = 'offen'; obj.Erstellt = new Date();
      appendRow_('Bucket_List', obj);
    }
    return clioData_();
  });
}

/** Wunsch als erfüllt markieren (on) oder zurücknehmen. */
function bucketFulfill(id, on) {
  return withLock_(function () {
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    updateWhere_('Bucket_List', function (r) { return String(r.ID) === String(id); },
      on ? { Status: 'erfuellt', Erfuellt: "'" + today, Geaendert: new Date() } : { Status: 'offen', Erfuellt: '', Geaendert: new Date() });
    return clioData_();
  });
}

/** Wunsch von der Liste nehmen. Die Zeile bleibt im Blatt (Status „entfernt“). */
function bucketRemove(id) {
  return withLock_(function () {
    updateWhere_('Bucket_List', function (r) { return String(r.ID) === String(id); }, { Status: 'entfernt', Geaendert: new Date() });
    return clioData_();
  });
}

/* =========================================================
   6b. ARIADNE – ADHS-Navigator
   Die Inhalte (Funktionen, Alltagsprobleme, Techniken, Lexikon, Ampel, Spielregeln)
   kommen live aus Davids Google Sheet „ADHS Exekutivfunktionen“ – dort werden sie
   weiter gepflegt. MINERVA liest das Sheet nur, wenn ARIADNE geöffnet wird
   (5 Minuten zwischengespeichert), damit der Start der App nicht langsamer wird.
   In dieses Sheet schreibt MINERVA nur eins: neue Alltagsprobleme aus Schritt 3,
   mit Status „neu – prüfen“. Rückmeldungen („hat geholfen?“) liegen in MINERVA
   im Blatt „Ariadne_Feedback“.
   ========================================================= */

/** ID des Sheets „ADHS Exekutivfunktionen“. Überschreibbar über die Einstellung ARIADNE_SHEET_ID. */
const ARIADNE_SHEET_ID = '1oUzumpqVd2YvL4n6huwfbTzTcWmk1_6nyqU8GCiBSDQ';
const ARIADNE_CACHE_KEY = 'MINERVA_ARIADNE_V2';
const ARIADNE_GRUPPEN = {
  A: { name: 'Starten & Planen', satz: 'Ich komme nicht ins Tun.' },
  B: { name: 'Fokus & Gedächtnis', satz: 'Ich verliere den Faden / bin abgelenkt.' },
  C: { name: 'Selbstregulation', satz: 'Ich reagiere zu schnell oder zu stark.' },
  D: { name: 'Flexibel denken & lernen', satz: 'Ich stecke fest / komme nicht weiter.' }
};
const ARIADNE_GEHOLFEN = ['ja', 'nein', 'ausgeblendet', ''];

function ariadneSheetId_() { return String(setting_('ARIADNE_SHEET_ID', ARIADNE_SHEET_ID)).trim(); }

/** Ein Blatt des ADHS-Sheets als Liste von Objekten (Zeile 1 = Spaltennamen). */
function ariadneRead_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  const h = values.shift().map(function (x) { return String(x).trim(); });
  return values.filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    const o = {};
    h.forEach(function (k, i) { o[k] = typeof r[i] === 'string' ? r[i].trim() : r[i]; });
    return o;
  });
}
/** Spalte über den Anfang ihres Namens finden (z. B. „Erkennungsfrage …“). */
function col_(o, start) {
  const k = Object.keys(o).filter(function (x) { return x.indexOf(start) === 0; })[0];
  return k ? String(o[k] == null ? '' : o[k]).trim() : '';
}
function ids_(s) { return String(s || '').split(/[,;]/).map(function (x) { return x.trim(); }).filter(String); }
function gruppeBuchstabe_(s) { const m = String(s || '').trim().match(/^([A-D])\b/); return m ? m[1] : ''; }

/** Liest und ordnet das ADHS-Sheet. Ergebnis ist reine Struktur, ohne Feedback. */
function ariadneQuelle_() {
  const ss = SpreadsheetApp.openById(ariadneSheetId_());
  const funktionen = ariadneRead_(ss, 'Exekutivfunktionen').filter(function (r) { return /^EF\d+$/.test(String(r.Nr)); }).map(function (r) {
    return { id: String(r.Nr), name: String(r.Exekutivfunktion), gruppe: gruppeBuchstabe_(r.Gruppe), worte: col_(r, 'In meinen Worten'), frage: col_(r, 'Erkennungsfrage'), eigen: /eigene/i.test(col_(r, 'Herkunft')) };
  });
  const efByName = {};
  funktionen.forEach(function (f) { efByName[f.name.toLowerCase()] = f.id; });
  const alle = ariadneRead_(ss, 'Meine Liste').filter(function (r) { return /^K\d+$/.test(String(r.ID)); });
  const probleme = alle.filter(function (r) { return String(r.Status).toLowerCase() === 'bestätigt'; }).map(function (r) {
    return {
      id: String(r.ID), ef: efByName[String(r.Exekutivfunktion).toLowerCase()] || '', gruppe: gruppeBuchstabe_(r.Gruppe),
      text: col_(r, 'Konsequenz'), kurz: col_(r, 'Kurzform'), symptom: col_(r, 'Dazugehöriges'), bereich: col_(r, 'Lebensbereich'), ausloeser: col_(r, 'Auslöser'),
      techniken: ids_(col_(r, 'Techniken'))
    };
  });
  const neu = alle.filter(function (r) { return /neu/i.test(String(r.Status)); }).length;
  const techniken = ariadneRead_(ss, 'Techniken').filter(function (r) { return /^T\d+$/.test(String(r.ID)); }).map(function (r) {
    const wann = String(r.Wann || '').toLowerCase();
    return {
      id: String(r.ID), name: String(r.Technik).replace(/\bNERA\b/g, 'MINERVA'), text: col_(r, 'Kurzbeschreibung').replace(/\bNERA\b/g, 'MINERVA'),
      efs: ids_(col_(r, 'Passt zu')), wann: wann.indexOf('akut') > -1 && wann.indexOf('vorbeug') > -1 ? 'beides' : (wann.indexOf('akut') > -1 ? 'akut' : (wann.indexOf('vorbeug') > -1 ? 'vorbeugend' : 'beides')),
      energie: (['niedrig', 'mittel', 'hoch'].indexOf(String(r['Energie nötig']).toLowerCase()) > -1) ? String(r['Energie nötig']).toLowerCase() : 'mittel',
      quelle: String(r.Quelle || '')
    };
  });
  const lexikon = ariadneRead_(ss, 'Mein Lexikon').filter(function (r) { return r['Bild / Wort'] && !/verworfen/i.test(String(r.Status)); }).map(function (r) {
    const ziel = col_(r, 'Führt zu');
    return { bild: String(r['Bild / Wort']), text: col_(r, 'Was es beschreibt'), gruppen: (ziel.match(/\b[A-D]\b/g) || []), ampel: /ampel/i.test(ziel), techniken: (ziel.match(/\bT\d+\b/g) || []) };
  }).filter(function (l) { return l.gruppen.length || l.ampel || l.techniken.length; });
  const ampel = ariadneRead_(ss, 'Frühwarn-Ampel').filter(function (r) { return r.Stufe; }).map(function (r) {
    const was = col_(r, 'Was dann');
    return { stufe: String(r.Stufe), signale: ids_(col_(r, 'Meine Signale')), massnahmen: ids_(was), techniken: (was.match(/\bT\d+\b/g) || []) };
  });
  const regeln = ariadneRead_(ss, 'Spielregeln').filter(function (r) { return r.Regel; }).map(function (r) { return String(r.Regel); });
  const gruppen = Object.keys(ARIADNE_GRUPPEN).map(function (k) { return { id: k, name: ARIADNE_GRUPPEN[k].name, satz: ARIADNE_GRUPPEN[k].satz }; });
  return { funktionen: funktionen, probleme: probleme, neu: neu, techniken: techniken, lexikon: lexikon, ampel: ampel, regeln: regeln, gruppen: gruppen, url: ss.getUrl() };
}

function ariadneFeedback_() {
  return readTable_('Ariadne_Feedback').map(function (f) {
    return { ID: String(f.ID), Datum: f.Datum, TechnikID: String(f.TechnikID || ''), Technik: String(f.Technik || ''), ProblemID: String(f.ProblemID || ''), FunktionID: String(f.FunktionID || ''), Geholfen: String(f.Geholfen || '') };
  }).sort(function (a, b) { return String(b.Datum).localeCompare(String(a.Datum)); });
}

/** Alles für ARIADNE. force = Sheet neu einlesen (nach „Synchronisieren“). */
function ariadneData(force) {
  const cache = CacheService.getScriptCache();
  let quelle = null;
  if (!force) { try { const c = cache.get(ARIADNE_CACHE_KEY); if (c) quelle = JSON.parse(c); } catch (e) { quelle = null; } }
  if (!quelle) {
    try { quelle = ariadneQuelle_(); } catch (e) {
      return { fehler: 'Das Sheet „ADHS Exekutivfunktionen“ ließ sich nicht öffnen (' + e.message + ').', feedback: ariadneFeedback_() };
    }
    try { cache.put(ARIADNE_CACHE_KEY, JSON.stringify(quelle), 300); } catch (e) { console.warn(e); }
  }
  quelle.feedback = ariadneFeedback_();
  return quelle;
}

/** „Probiere ich“: merkt sich die Technik, damit ARIADNE später fragen kann, ob sie geholfen hat.
    t: { technikId, technik, problemId, funktionId, lage, energie, antrieb } */
function ariadneTry(t) {
  return withLock_(function () {
    const id = text_(t && t.technikId, 10);
    if (!/^T\d+$/.test(id)) throw new Error('Unbekannte Technik.');
    appendRow_('Ariadne_Feedback', {
      ID: newId_('af'), Datum: new Date(), TechnikID: id, Technik: text_(t.technik, 200), ProblemID: text_(t.problemId, 10), FunktionID: text_(t.funktionId, 10),
      Lage: text_(t.lage, 20), Energie: text_(t.energie, 20), Antrieb: text_(t.antrieb, 80), Geholfen: '', Beantwortet: ''
    });
    return ariadneData(false);
  });
}

/** Antwort auf „Hat es geholfen?“: 'ja', 'nein', 'ausgeblendet' (nicht mehr fragen) oder '' (zurücknehmen). */
function ariadneAnswer(id, geholfen, technikId) {
  return withLock_(function () {
    if (ARIADNE_GEHOLFEN.indexOf(geholfen) < 0) throw new Error('Unbekannte Antwort.');
    const patch = { Geholfen: geholfen, Beantwortet: geholfen ? new Date() : '' };
    const n = updateWhere_('Ariadne_Feedback', function (r) { return String(r.ID) === String(id); }, patch);
    // Noch nicht gespeicherte Zeile (Antwort kam schneller als „Probiere ich“): jüngste offene Zeile dieser Technik nehmen.
    if (!n && technikId) {
      const offen = ariadneFeedback_().filter(function (f) { return f.TechnikID === String(technikId) && !f.Geholfen; })[0];
      if (offen) updateWhere_('Ariadne_Feedback', function (r) { return String(r.ID) === offen.ID; }, patch);
    }
    return ariadneData(false);
  });
}

/** Neues Alltagsproblem aus Schritt 3 ins ADHS-Sheet („Meine Liste“) schreiben – mit Status „neu – prüfen“. */
function ariadneProblemAdd(text, funktionId) {
  return withLock_(function () {
    const t = text_(text, 500);
    if (!t) throw new Error('Bitte kurz beschreiben, was los ist.');
    const ss = SpreadsheetApp.openById(ariadneSheetId_());
    const sh = ss.getSheetByName('Meine Liste');
    if (!sh) throw new Error('Im ADHS-Sheet fehlt das Blatt „Meine Liste“.');
    const values = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), sh.getLastColumn()).getValues();
    const h = values[0].map(function (x) { return String(x).trim(); });
    const max = values.slice(1).reduce(function (m, r) { const x = String(r[0]).match(/^K(\d+)$/); return x ? Math.max(m, Number(x[1])) : m; }, 0);
    const id = 'K' + String(max + 1).padStart(2, '0');
    const ef = ariadneQuelle_().funktionen.filter(function (f) { return f.id === funktionId; })[0];
    const g = ef && ARIADNE_GRUPPEN[ef.gruppe] ? ef.gruppe + ' · ' + ARIADNE_GRUPPEN[ef.gruppe].name : '';
    const row = h.map(function (k) {
      if (k === 'ID') return id;
      if (k === 'Exekutivfunktion') return ef ? ef.name : '';
      if (k.indexOf('Konsequenz') === 0) return t;
      if (k === 'Gruppe') return g;
      if (k === 'Status') return 'neu – prüfen';
      if (k === 'Notizen') return 'Aus MINERVA · ARIADNE, ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      return '';
    });
    let last = values.length;
    while (last > 1 && values[last - 1].join('') === '') last--;
    sh.getRange(last + 1, 1, 1, row.length).setValues([row]);
    CacheService.getScriptCache().remove(ARIADNE_CACHE_KEY);
    const out = ariadneData(true);
    out.neuId = id;
    return out;
  });
}

/* =========================================================
   6b+. ARIADNE · Gesundheit – Wochen-Check-in als Frühwarnsystem
   Einmal pro Woche ein paar Werte: die eigene Einschätzung (Energie, Belastung)
   und, wenn zur Hand, Werte aus Garmin Connect (Schlaf, HRV-Status, Body Battery,
   Ruhepuls, Stress, Gewicht). Alles ist freiwillig, Lücken sind in Ordnung.
   Die Auswertung (ruhig / achtsam / ernst nehmen) rechnet die Oberfläche; sie
   vergleicht mit deinem eigenen Normalwert der Wochen davor und warnt erst, wenn
   mehrere Signale zusammenkommen. Daten im Blatt „Gesundheit_Wochen“.
   ========================================================= */

const GESUND_HRV = ['ausgeglichen', 'unausgeglichen', 'niedrig', 'schlecht'];
/** Erlaubte Bereiche je Wert: [min, max, Nachkommastellen]. */
const GESUND_FELDER = {
  Energie: [1, 5, 0], Belastung: [1, 5, 0], Schlaf: [0, 14, 1], BodyBattery: [0, 100, 0],
  Ruhepuls: [25, 150, 0], Stress: [0, 100, 0], Gewicht: [30, 300, 1]
};

function gesundWoche_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v == null ? '' : v).trim().replace(/^'/, '');
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}
function gesundZahl_(v) {
  if (v === '' || v == null) return '';
  const n = Number(String(v).replace(',', '.'));
  return isFinite(n) ? n : '';
}

/** Alle eingetragenen Wochen, neueste zuerst. */
function gesundData_() {
  const wochen = readTable_('Gesundheit_Wochen').map(function (r) {
    const o = { ID: String(r.ID), Woche: gesundWoche_(r.Woche), HRV: String(r.HRV || '').trim().toLowerCase(), Notiz: String(r.Notiz || '') };
    Object.keys(GESUND_FELDER).forEach(function (k) { o[k] = gesundZahl_(r[k]); });
    return o;
  }).filter(function (w) { return w.Woche; });
  wochen.sort(function (a, b) { return b.Woche.localeCompare(a.Woche); });
  return { wochen: wochen };
}

/** Eine Woche speichern. Gibt es die Woche schon, werden ihre Werte ersetzt.
    w: { woche: 'JJJJ-MM-TT' (Montag), Energie, Belastung, Schlaf, HRV, BodyBattery, Ruhepuls, Stress, Gewicht, Notiz } */
function gesundSave(w) {
  return withLock_(function () {
    const woche = gesundWoche_(w && w.woche);
    if (!woche) throw new Error('Bitte eine Woche wählen.');
    const row = { Woche: "'" + woche, Notiz: text_(w.Notiz, 300), Geaendert: new Date() };
    const hrv = String(w.HRV || '').trim().toLowerCase();
    row.HRV = GESUND_HRV.indexOf(hrv) > -1 ? hrv : '';
    Object.keys(GESUND_FELDER).forEach(function (k) {
      const n = gesundZahl_(w[k]);
      if (n === '') { row[k] = ''; return; }
      const f = GESUND_FELDER[k];
      if (n < f[0] || n > f[1]) throw new Error(k + ': bitte einen Wert zwischen ' + f[0] + ' und ' + f[1] + ' eintragen.');
      row[k] = Math.round(n * Math.pow(10, f[2])) / Math.pow(10, f[2]);
    });
    const n = updateWhere_('Gesundheit_Wochen', function (r) { return gesundWoche_(r.Woche) === woche; }, row);
    if (!n) appendRow_('Gesundheit_Wochen', Object.assign({ ID: newId_('gw'), Erstellt: new Date() }, row));
    return gesundData_();
  });
}

/** Eine Woche entfernen. */
function gesundDelete(id) {
  return withLock_(function () {
    deleteWhere_('Gesundheit_Wochen', function (r) { return String(r.ID) === String(id); });
    return gesundData_();
  });
}

/* =========================================================
   6c. APOLLO – Filme, Serien & Spiele
   Watchlist: Titel kommen per IMDb-Export (CSV) oder über die Suche dazu. Poster,
   Bewertung, Laufzeit und „Wo läuft das?“ liefert TMDB (themoviedb.org), auf Wunsch
   die IMDb-Bewertung zusätzlich über OMDb. Spiele: Cover und Bewertung über RAWG.
   Die Zugangsschlüssel liegen in den Skript-Eigenschaften (nicht im Sheet) und
   werden in CORE eingetragen. Ohne Schlüssel funktionieren die Listen trotzdem,
   nur ohne Poster und Streaming-Infos.
   ========================================================= */

/** Streamingdienste, die APOLLO kennt. re = Erkennung am Anbieternamen bei TMDB (Deutschland). */
const APOLLO_DIENSTE = [
  { id: 'netflix', name: 'Netflix', re: /netflix/i },
  { id: 'disney', name: 'Disney+', re: /disney/i },
  { id: 'appletv', name: 'Apple TV+', re: /^apple tv/i },
  { id: 'hbomax', name: 'HBO Max', re: /hbo|^max$/i },
  { id: 'magenta', name: 'MagentaTV', re: /magenta/i },
  { id: 'rtl', name: 'RTL+', re: /^rtl/i },
  { id: 'ard', name: 'ARD Mediathek', re: /^ard\b/i },
  { id: 'zdf', name: 'ZDF Mediathek', re: /^zdf/i },
  { id: 'arte', name: 'Arte', re: /^arte/i },
  { id: 'prime', name: 'Prime Video', re: /amazon prime|prime video/i },
  { id: 'crunchyroll', name: 'Crunchyroll', re: /crunchyroll/i },
  { id: 'wow', name: 'WOW', re: /^wow/i },
  { id: 'paramount', name: 'Paramount+', re: /paramount/i },
  { id: 'joyn', name: 'Joyn', re: /^joyn/i }
];
const APOLLO_ABOS_START = 'magenta,netflix,disney,appletv,hbomax,rtl,ard,arte';
const APOLLO_OHNE_ABO_START = 'prime,crunchyroll';
const WATCH_STATUS = ['offen', 'angefangen']; // nur Watchlist, kein Archiv: Gesehenes wird entfernt
const SPIEL_STATUS = ['sammlung', 'spiele', 'naechstes', 'pausiert', 'durch', 'wunsch'];
const SPIEL_PLATTFORMEN = ['PS5', 'PS4', 'PS3', 'PS2', 'PS1', 'PS Vita', 'PSP', 'Switch 2', 'Switch', 'Wii U', 'Wii', 'GameCube', 'N64', '3DS', 'DS',
  'Game Boy Advance', 'Game Boy Color', 'Game Boy', 'PC – Steam', 'PC – Epic', 'PC – Ubisoft', 'PC – GOG', 'PC – EA', 'PC – andere', 'Xbox Series', 'Xbox One', 'Xbox 360', 'Andere'];
const SPIEL_FORMATE = ['Digital', 'Disc', 'Cartridge'];
const SPIEL_HERKUNFT = ['Gekauft', 'PS Plus', 'Nintendo Online', 'Geschenk', 'Gratis', 'Abo-Dienst', 'Sonstiges'];
const SPIEL_UNTERWERTUNGEN = ['BewGameplay', 'BewGrafik', 'BewStory', 'BewSound', 'BewWiederspielwert'];
const SPIEL_WERTUNGEN = ['Bewertung'].concat(SPIEL_UNTERWERTUNGEN); // Bewertung = Durchschnitt der Unterwertungen, eine Kommastelle
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const APOLLO_STAND_TAGE = 7; // so oft wird „Wo läuft das?“ neu abgefragt
const APOLLO_BATCH = 20;     // Titel pro Durchgang beim Anreichern

function apolloKey_(k) { return String(prop_(k + '_KEY') || '').trim(); }
function apolloListe_(key, start) {
  return String(setting_(key, start)).split(',').map(function (x) { return x.trim(); }).filter(String);
}

/** Alles für APOLLO (steckt auch in den Startdaten der App). */
function apolloData_() {
  const watch = readTable_('Watchlist').filter(function (w) { return !w.Status || WATCH_STATUS.indexOf(String(w.Status)) > -1; }).map(function (w) {
    return {
      ID: String(w.ID), Art: String(w.Art || 'film'), Titel: String(w.Titel || ''), Originaltitel: String(w.Originaltitel || ''), Jahr: String(w.Jahr || ''),
      ImdbID: String(w.ImdbID || ''), TmdbID: String(w.TmdbID || ''), Poster: String(w.Poster || ''), Genres: String(w.Genres || ''),
      Laufzeit: Number(w.Laufzeit) || 0, Staffeln: Number(w.Staffeln) || 0, ImdbWertung: Number(w.ImdbWertung) || 0, TmdbWertung: Number(w.TmdbWertung) || 0,
      Beschreibung: String(w.Beschreibung || ''), Anbieter: String(w.Anbieter || ''), AnbieterStand: String(w.AnbieterStand || ''),
      Status: String(w.Status) === 'angefangen' ? 'angefangen' : 'offen', Quelle: String(w.Quelle || ''), Erstellt: w.Erstellt
    };
  });
  const exemplare = readTable_('Spiele_Exemplare').map(function (e) {
    return { ID: String(e.ID), SpielID: String(e.SpielID), Plattform: String(e.Plattform || 'Andere'), Format: String(e.Format || ''), Herkunft: String(e.Herkunft || '') };
  });
  const spiele = readTable_('Spiele').map(function (s) {
    const o = {
      ID: String(s.ID), Titel: String(s.Titel || ''), Plattform: String(s.Plattform || ''), Status: SPIEL_STATUS.indexOf(String(s.Status)) > -1 ? String(s.Status) : 'sammlung',
      Cover: String(s.Cover || ''), Metacritic: Number(s.Metacritic) || 0, Wertung: Number(s.Wertung) || 0, Genres: String(s.Genres || ''), Spielzeit: Number(s.Spielzeit) || 0,
      Erschienen: String(s.Erschienen || ''), Notiz: String(s.Notiz || ''), RawgID: String(s.RawgID || ''), Reihenfolge: Number(s.Reihenfolge) || 0, Erstellt: s.Erstellt, Geaendert: s.Geaendert
    };
    SPIEL_WERTUNGEN.forEach(function (k) { o[k] = Number(s[k]) || 0; });
    o.Lieblingsspiel = bool_(s.Lieblingsspiel);
    return o;
  });
  return {
    watchlist: watch, spiele: spiele, exemplare: exemplare,
    plattformen: SPIEL_PLATTFORMEN, formate: SPIEL_FORMATE, herkunft: SPIEL_HERKUNFT,
    dienste: APOLLO_DIENSTE.map(function (d) { return { id: d.id, name: d.name }; }),
    abos: apolloListe_('STREAMING_ABOS', APOLLO_ABOS_START),
    ohneAbo: apolloListe_('STREAMING_OHNE_ABO', APOLLO_OHNE_ABO_START),
    zugang: { tmdb: !!apolloKey_('TMDB'), rawg: !!apolloKey_('RAWG'), omdb: !!apolloKey_('OMDB') }
  };
}

/* ---------- Verbindungen nach außen ---------- */

/** Baut eine TMDB-Anfrage. Akzeptiert den kurzen API-Schlüssel (v3) und das lange Lese-Token (v4). */
function tmdbReq_(path, params) {
  const key = apolloKey_('TMDB');
  if (!key) throw new Error('Für Poster und Streaming-Infos fehlt noch der TMDB-Schlüssel (CORE → APOLLO).');
  const q = Object.assign({ language: 'de-DE' }, params || {});
  const req = { muteHttpExceptions: true, headers: { accept: 'application/json' } };
  if (key.length > 60) req.headers.Authorization = 'Bearer ' + key; else q.api_key = key;
  req.url = 'https://api.themoviedb.org/3' + path + '?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
  return req;
}
function fetchJson_(reqs) {
  const res = UrlFetchApp.fetchAll(reqs);
  return res.map(function (r) {
    const code = r.getResponseCode();
    if (code === 401) throw new Error('Ein Zugangsschlüssel wurde abgelehnt. Bitte in CORE → APOLLO prüfen.');
    if (code >= 300) return null;
    try { return JSON.parse(r.getContentText()); } catch (e) { return null; }
  });
}

/** Wo läuft der Titel in Deutschland im Abo oder kostenlos? Liefert APOLLO-Dienst-IDs. */
function tmdbAnbieter_(wp) {
  const de = wp && wp.results && wp.results.DE;
  if (!de) return [];
  const out = [];
  ['flatrate', 'free', 'ads'].forEach(function (t) {
    (de[t] || []).forEach(function (p) {
      const d = APOLLO_DIENSTE.filter(function (x) { return x.re.test(String(p.provider_name || '')); })[0];
      if (d && out.indexOf(d.id) < 0) out.push(d.id);
    });
  });
  return out;
}

/** TMDB-Details in Watchlist-Spalten übersetzen. */
function tmdbFelder_(art, d) {
  const film = art === 'film';
  const datum = String((film ? d.release_date : d.first_air_date) || '');
  const lauf = film ? d.runtime : ((d.episode_run_time || [])[0] || (d.last_episode_to_air && d.last_episode_to_air.runtime) || 0);
  return {
    TmdbID: String(d.id), Titel: d.title || d.name || '', Originaltitel: d.original_title || d.original_name || '', Jahr: datum ? "'" + datum.slice(0, 4) : '',
    ImdbID: (d.external_ids && d.external_ids.imdb_id) || d.imdb_id || '', Poster: d.poster_path ? TMDB_IMG + d.poster_path : '',
    Genres: (d.genres || []).map(function (g) { return g.name; }).join(', '), Laufzeit: lauf || '', Staffeln: film ? '' : (d.number_of_seasons || ''),
    TmdbWertung: d.vote_average ? Math.round(d.vote_average * 10) / 10 : '', Beschreibung: text_(d.overview, 1200),
    Anbieter: tmdbAnbieter_(d['watch/providers']).join(','), AnbieterStand: "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
  };
}
/**
 * TMDB-Anfragen in kleinen Gruppen (TMDB bremst zu viele gleichzeitige Anfragen aus).
 * Ergebnis je Anfrage: Objekt = Antwort, null = gibt es bei TMDB nicht (404),
 * undefined = gerade nicht erreichbar (wird beim nächsten Durchgang erneut versucht).
 */
function tmdbHolen_(reqs) {
  const out = new Array(reqs.length);
  const runde = function (idx) {
    for (let i = 0; i < idx.length; i += 5) {
      const teil = idx.slice(i, i + 5);
      let res;
      try { res = UrlFetchApp.fetchAll(teil.map(function (k) { return reqs[k]; })); } catch (e) { continue; }
      res.forEach(function (r, j) {
        const code = r.getResponseCode();
        if (code === 401) throw new Error('Ein Zugangsschlüssel wurde abgelehnt. Bitte in CORE → APOLLO prüfen.');
        if (code === 404) { out[teil[j]] = null; return; }
        if (code >= 300) return;
        try { out[teil[j]] = JSON.parse(r.getContentText()); } catch (e) { /* bleibt undefined */ }
      });
      if (i + 5 < idx.length) Utilities.sleep(300);
    }
  };
  runde(reqs.map(function (r, k) { return k; }));
  const nochmal = [];
  out.forEach(function (v, k) { if (v === undefined) nochmal.push(k); });
  if (nochmal.length) { Utilities.sleep(1500); runde(nochmal); }
  return out;
}

function tmdbDetailReq_(art, id) {
  return tmdbReq_('/' + (art === 'film' ? 'movie' : 'tv') + '/' + id, { append_to_response: 'external_ids,watch/providers' });
}

/** IMDb-Bewertungen über OMDb nachladen (nur mit Schlüssel). ids: IMDb-IDs. */
function omdbWertungen_(ids) {
  const key = apolloKey_('OMDB');
  if (!key || !ids.length) return {};
  const res = fetchJson_(ids.map(function (i) { return { url: 'https://www.omdbapi.com/?i=' + encodeURIComponent(i) + '&apikey=' + encodeURIComponent(key), muteHttpExceptions: true }; }));
  const out = {};
  ids.forEach(function (i, k) { const r = res[k]; if (r && r.imdbRating && r.imdbRating !== 'N/A') out[i] = Number(r.imdbRating); });
  return out;
}

/* ---------- Watchlist ---------- */

/** Suche bei TMDB. art: 'film', 'serie' oder '' (beides). */
function apolloSuche(q, art) {
  q = text_(q, 100);
  if (!q) return [];
  const path = art === 'film' ? '/search/movie' : (art === 'serie' ? '/search/tv' : '/search/multi');
  const r = fetchJson_([tmdbReq_(path, { query: q, region: 'DE', include_adult: 'false' })])[0];
  const have = readTable_('Watchlist').map(function (w) { return String(w.TmdbID); });
  return ((r && r.results) || []).filter(function (x) {
    return art || x.media_type === 'movie' || x.media_type === 'tv';
  }).slice(0, 12).map(function (x) {
    const a = art || (x.media_type === 'movie' ? 'film' : 'serie');
    const datum = String(x.release_date || x.first_air_date || '');
    return { tmdbId: String(x.id), art: a, titel: x.title || x.name || '', jahr: datum.slice(0, 4), poster: x.poster_path ? TMDB_IMG + x.poster_path : '', drauf: have.indexOf(String(x.id)) > -1 };
  });
}

/** Titel aus der Suche auf die Watchlist setzen (mit allen Details). */
function watchAdd(tmdbId, art) {
  return withLock_(function () {
    art = art === 'serie' ? 'serie' : 'film';
    if (readTable_('Watchlist').some(function (w) { return String(w.TmdbID) === String(tmdbId); })) return apolloData_();
    const d = fetchJson_([tmdbDetailReq_(art, encodeURIComponent(String(tmdbId)))])[0];
    if (!d) throw new Error('Dieser Titel ließ sich bei TMDB nicht laden.');
    const f = tmdbFelder_(art, d);
    const r = f.ImdbID ? omdbWertungen_([f.ImdbID]) : {};
    appendRow_('Watchlist', Object.assign(f, { ID: newId_('w'), Art: art, ImdbWertung: r[f.ImdbID] || '', Status: 'offen', Quelle: 'suche', Erstellt: new Date() }));
    return apolloData_();
  });
}

/**
 * IMDb-Export übernehmen. rows: vom Browser gelesene CSV-Zeilen (Spaltennamen wie bei IMDb:
 * Const, Title, Title Type, IMDb Rating, Runtime (mins), Year, Genres). Neue Titel kommen als
 * „offen“ dazu. entfernen: IDs der Watchlist-Einträge, die nicht mehr im Export stehen und die
 * David in der Rückfrage bestätigt hat – nur Einträge aus einem früheren IMDb-Import.
 * Poster & Co. ergänzt danach apolloAnreichern().
 */
function watchImport(rows, entfernen) {
  return withLock_(function () {
    const im = {};
    (rows || []).forEach(function (r) { const id = text_(r.Const, 20); if (/^tt\d+$/.test(id)) im[id] = true; });
    if (!Object.keys(im).length) throw new Error('Im Export stehen keine IMDb-Titel.');
    const weg = {};
    (entfernen || []).forEach(function (id) { weg[String(id)] = true; });
    let raus = 0;
    if (Object.keys(weg).length) {
      raus = deleteWhere_('Watchlist', function (w) { return weg[String(w.ID)] && String(w.Quelle) === 'imdb' && !im[String(w.ImdbID)]; });
    }
    const have = {};
    readTable_('Watchlist').forEach(function (w) { if (w.ImdbID) have[String(w.ImdbID)] = true; });
    let neu = 0;
    const sh = sheet_('Watchlist'), h = headers_(sh), add = [];
    (rows || []).slice(0, 3000).forEach(function (r) {
      const id = text_(r.Const, 20);
      if (!/^tt\d+$/.test(id) || have[id]) return;
      have[id] = true;
      const typ = String(r['Title Type'] || '');
      const o = {
        ID: newId_('w'), Art: /series|serie/i.test(typ) ? 'serie' : 'film', Titel: text_(r.Title, 200), Originaltitel: text_(r['Original Title'], 200),
        Jahr: r.Year ? "'" + text_(r.Year, 4) : '', ImdbID: id, Genres: text_(r.Genres, 200), Laufzeit: Number(r['Runtime (mins)']) || '',
        ImdbWertung: Number(r['IMDb Rating']) || '', Status: 'offen', Quelle: 'imdb', Erstellt: new Date()
      };
      add.push(h.map(function (k) { return o[k] === undefined ? '' : o[k]; }));
      neu++;
    });
    if (add.length) { sh.getRange(sh.getLastRow() + 1, 1, add.length, h.length).setValues(add); dirty_('Watchlist'); }
    return { apollo: apolloData_(), neu: neu, raus: raus, rest: apolloRest_() };
  });
}

/** Wie viele Titel noch Poster/Streaming-Infos brauchen. */
function apolloRest_() {
  if (!apolloKey_('TMDB')) return 0;
  return apolloOffen_(readTable_('Watchlist')).length;
}
function apolloOffen_(rows) {
  const grenze = new Date(Date.now() - APOLLO_STAND_TAGE * 86400000);
  const g = Utilities.formatDate(grenze, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return rows.filter(function (w) {
    if (w.Status && WATCH_STATUS.indexOf(String(w.Status)) < 0) return false;
    if (String(w.TmdbID) === '-') return false; // bei TMDB nicht gefunden
    if (!w.TmdbID) return true;
    return String(w.AnbieterStand || '') < g;
  });
}

/**
 * Ergänzt Poster, Bewertung und Streaming-Infos für bis zu APOLLO_BATCH Titel und frischt
 * veraltete Streaming-Infos auf. Die App ruft das so oft auf, bis rest = 0 ist.
 */
function apolloAnreichern() {
  return withLock_(function () {
    if (!apolloKey_('TMDB')) return { apollo: apolloData_(), rest: 0 };
    const todo = apolloOffen_(readTable_('Watchlist')).slice(0, APOLLO_BATCH);
    if (!todo.length) return { apollo: apolloData_(), rest: 0 };
    // 1. Fehlende TMDB-IDs über die IMDb-ID finden
    const suchen = todo.filter(function (w) { return !w.TmdbID; });
    const gefunden = tmdbHolen_(suchen.map(function (w) { return tmdbReq_('/find/' + encodeURIComponent(String(w.ImdbID)), { external_source: 'imdb_id' }); }));
    const patch = {};
    suchen.forEach(function (w, i) {
      const f = gefunden[i];
      if (f === undefined) { w.spaeter = true; return; } // TMDB gerade nicht erreichbar: nächster Durchgang
      const m = (f.movie_results || [])[0], t = (f.tv_results || [])[0];
      const hit = w.Art === 'serie' ? (t || m) : (m || t);
      if (!hit) { patch[w.ID] = { TmdbID: '-' }; return; } // bei TMDB wirklich unbekannt
      w.TmdbID = String(hit.id); w.Art = hit === t ? 'serie' : 'film';
    });
    // 2. Details + Anbieter laden
    const mit = todo.filter(function (w) { return !w.spaeter && w.TmdbID && String(w.TmdbID) !== '-'; });
    const det = tmdbHolen_(mit.map(function (w) { return tmdbDetailReq_(w.Art, w.TmdbID); }));
    const ohneWertung = [];
    mit.forEach(function (w, i) {
      const d = det[i];
      if (d === undefined) return; // später erneut versuchen
      if (!d) { patch[w.ID] = { AnbieterStand: "'" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') }; return; }
      const f = tmdbFelder_(w.Art, d);
      if (!f.Titel) delete f.Titel; // sonst gilt der deutsche Titel von TMDB
      f.Art = w.Art;
      patch[w.ID] = f;
      const imdb = f.ImdbID || w.ImdbID;
      if (imdb && !Number(w.ImdbWertung)) ohneWertung.push([w.ID, imdb]);
    });
    const r = omdbWertungen_(ohneWertung.map(function (x) { return x[1]; }));
    ohneWertung.forEach(function (x) { if (r[x[1]]) patch[x[0]].ImdbWertung = r[x[1]]; });
    Object.keys(patch).forEach(function (id) { updateWhere_('Watchlist', function (w) { return String(w.ID) === id; }, patch[id]); });
    return { apollo: apolloData_(), rest: apolloRest_(), geschafft: Object.keys(patch).length };
  });
}

function watchStatus(id, status) {
  return withLock_(function () {
    if (WATCH_STATUS.indexOf(status) < 0) throw new Error('Unbekannter Status.');
    updateWhere_('Watchlist', function (w) { return String(w.ID) === String(id); }, { Status: status });
    return apolloData_();
  });
}

/** Gesehen oder kein Interesse mehr: Eintrag verschwindet (die Watchlist ist kein Archiv). */
function watchRemove(id) {
  return withLock_(function () {
    deleteWhere_('Watchlist', function (w) { return String(w.ID) === String(id); });
    return apolloData_();
  });
}

/* ---------- Spiele ---------- */

const RAWG_GENRES = { 'Action': 'Action', 'Adventure': 'Abenteuer', 'RPG': 'Rollenspiel', 'Shooter': 'Shooter', 'Puzzle': 'Rätsel', 'Platformer': 'Jump ’n’ Run', 'Racing': 'Rennspiel', 'Sports': 'Sport', 'Strategy': 'Strategie', 'Simulation': 'Simulation', 'Indie': 'Indie', 'Family': 'Familie', 'Fighting': 'Kampfspiel', 'Casual': 'Casual', 'Arcade': 'Arcade', 'Massively Multiplayer': 'MMO', 'Board Games': 'Brettspiel', 'Card': 'Kartenspiel', 'Educational': 'Lernspiel' };

/** Suche bei RAWG (rawg.io). */
function spielSuche(q) {
  q = text_(q, 100);
  if (!q) return [];
  const key = apolloKey_('RAWG');
  if (!key) throw new Error('Für Cover und Bewertungen fehlt noch der RAWG-Schlüssel (CORE → APOLLO). Du kannst das Spiel trotzdem ohne Suche eintragen.');
  const r = fetchJson_([{ url: 'https://api.rawg.io/api/games?key=' + encodeURIComponent(key) + '&page_size=10&search=' + encodeURIComponent(q), muteHttpExceptions: true }])[0];
  return ((r && r.results) || []).map(function (g) {
    const plats = (g.platforms || []).map(function (p) { return p.platform && p.platform.name; }).filter(String);
    return {
      rawgId: String(g.id), titel: g.name || '', cover: g.background_image || '', metacritic: g.metacritic || 0, wertung: g.rating ? Math.round(g.rating * 10) / 10 : 0,
      genres: (g.genres || []).map(function (x) { return RAWG_GENRES[x.name] || x.name; }).join(', '), spielzeit: g.playtime || 0,
      erschienen: String(g.released || '').slice(0, 4), plattformen: plats
    };
  });
}

function wert_(v) { const n = Math.round(Number(v)); return n >= 1 && n <= 10 ? n : ''; }
function exemplar_(spielId, e) {
  if (!e || !e.plattform) return;
  appendRow_('Spiele_Exemplare', {
    ID: newId_('ex'), SpielID: spielId, Plattform: SPIEL_PLATTFORMEN.indexOf(e.plattform) > -1 ? e.plattform : 'Andere',
    Format: SPIEL_FORMATE.indexOf(e.format) > -1 ? e.format : '', Herkunft: SPIEL_HERKUNFT.indexOf(e.herkunft) > -1 ? e.herkunft : '', Erstellt: new Date()
  });
}

/**
 * Spiel speichern (neu oder ändern).
 * s: { id, titel, status, notiz, wertungen: { Bewertung, BewGameplay, … }, exemplar: { plattform, format, herkunft },
 *      rawgId, cover, metacritic, wertung, genres, spielzeit, erschienen }
 * Ist ein neues Spiel schon in der Sammlung (gleiche RAWG-ID oder gleicher Name), kommt nur das Exemplar dazu.
 */
function spielSave(s) {
  return withLock_(function () {
    const titel = text_(s && s.titel, 200);
    if (!titel) throw new Error('Bitte einen Spielnamen eingeben.');
    const status = SPIEL_STATUS.indexOf(s.status) > -1 ? s.status : 'sammlung';
    const base = { Titel: titel, Status: status, Notiz: text_(s.notiz, 1000), Geaendert: new Date() };
    if ('liebling' in s) base.Lieblingsspiel = s.liebling ? true : '';
    let bewertet = false;
    if (s.wertungen) {
      const vals = [];
      SPIEL_UNTERWERTUNGEN.forEach(function (k) { const v = wert_(s.wertungen[k]); base[k] = v; if (v) vals.push(v); });
      base.Bewertung = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length * 10) / 10 : '';
      bewertet = vals.length > 0;
    }
    if (s.id && typeof s.genres === 'string') base.Genres = text_(s.genres, 200);
    if (s.exemplar && s.exemplar.plattform) base.Plattform = SPIEL_PLATTFORMEN.indexOf(s.exemplar.plattform) > -1 ? s.exemplar.plattform : 'Andere';
    let id = s.id;
    if (!id) {
      const rows = readTable_('Spiele');
      const da = rows.filter(function (r) {
        return (s.rawgId && String(r.RawgID) === String(s.rawgId)) || String(r.Titel).trim().toLowerCase() === titel.toLowerCase();
      })[0];
      if (da) {
        id = String(da.ID);
        // Von der Wunschliste gekauft: Status übernehmen; sonst bleibt der bestehende Spielstand
        if (String(da.Status) !== 'wunsch' || status === 'wunsch') delete base.Status;
        delete base.Notiz; if (!s.liebling) delete base.Lieblingsspiel; // bestehenden Spielstand nicht überschreiben
        if (!bewertet) SPIEL_WERTUNGEN.forEach(function (k) { delete base[k]; });
        updateWhere_('Spiele', function (r) { return String(r.ID) === id; }, base);
      } else {
        id = newId_('sp');
        appendRow_('Spiele', Object.assign(base, {
          ID: id, RawgID: text_(s.rawgId, 20), Cover: /^https:\/\//.test(String(s.cover || '')) ? text_(s.cover, 500) : '',
          Metacritic: Number(s.metacritic) || '', Wertung: Number(s.wertung) || '', Genres: text_(s.genres, 200), Spielzeit: Number(s.spielzeit) || '',
          Erschienen: s.erschienen ? "'" + text_(s.erschienen, 4) : '', Reihenfolge: nextOrder_(rows), Erstellt: new Date()
        }));
      }
    } else {
      updateWhere_('Spiele', function (r) { return String(r.ID) === String(id); }, base);
    }
    exemplar_(id, s.exemplar);
    return apolloData_();
  });
}

/** Weiteres Exemplar (andere Konsole, Disc + Digital …) zu einem Spiel. */
function exemplarAdd(spielId, e) {
  return withLock_(function () {
    if (!readTable_('Spiele').some(function (r) { return String(r.ID) === String(spielId); })) throw new Error('Spiel nicht gefunden – bitte neu laden.');
    exemplar_(String(spielId), e);
    return apolloData_();
  });
}

/** Exemplar korrigieren (Plattform, Format, Herkunft). */
function exemplarUpdate(id, e) {
  return withLock_(function () {
    e = e || {};
    if (SPIEL_PLATTFORMEN.indexOf(e.plattform) < 0) throw new Error('Unbekannte Plattform.');
    if (SPIEL_FORMATE.indexOf(e.format) < 0) throw new Error('Unbekanntes Format.');
    const herkunft = SPIEL_HERKUNFT.indexOf(e.herkunft) > -1 ? e.herkunft : '';
    updateWhere_('Spiele_Exemplare', function (r) { return String(r.ID) === String(id); }, { Plattform: e.plattform, Format: e.format, Herkunft: herkunft });
    return apolloData_();
  });
}

function exemplarDelete(id) {
  return withLock_(function () {
    deleteWhere_('Spiele_Exemplare', function (r) { return String(r.ID) === String(id); });
    return apolloData_();
  });
}

function spielStatus(id, status) {
  return withLock_(function () {
    if (SPIEL_STATUS.indexOf(status) < 0) throw new Error('Unbekannter Status.');
    updateWhere_('Spiele', function (r) { return String(r.ID) === String(id); }, { Status: status, Geaendert: new Date() });
    return apolloData_();
  });
}

function spielDelete(id) {
  return withLock_(function () {
    deleteWhere_('Spiele', function (r) { return String(r.ID) === String(id); });
    deleteWhere_('Spiele_Exemplare', function (r) { return String(r.SpielID) === String(id); });
    return apolloData_();
  });
}

/* ---------- Einstellungen (in CORE) ---------- */

/** p: { abos: [ids], ohneAbo: [ids], tmdb, rawg, omdb } – leere Schlüsselfelder bleiben unverändert, '-' löscht. */
function apolloEinstellungen(p) {
  return withLock_(function () {
    const valid = APOLLO_DIENSTE.map(function (d) { return d.id; });
    const clean = function (l) { return (l || []).map(String).filter(function (x, i, a) { return valid.indexOf(x) > -1 && a.indexOf(x) === i; }); };
    const abos = clean(p && p.abos), ohne = clean(p && p.ohneAbo).filter(function (x) { return abos.indexOf(x) < 0; });
    setSetting_('STREAMING_ABOS', abos.join(','), 'APOLLO: deine Streaming-Abos (IDs mit Komma)');
    setSetting_('STREAMING_OHNE_ABO', ohne.join(','), 'APOLLO: Apps auf dem Fernseher ohne aktives Abo');
    ['TMDB', 'RAWG', 'OMDB'].forEach(function (k) {
      const v = text_(p && p[k.toLowerCase()], 400);
      if (v === '-') PropertiesService.getScriptProperties().deleteProperty('MINERVA_' + k + '_KEY');
      else if (v) setProp_(k + '_KEY', v.replace(/\s+/g, ''));
    });
    return { settings: getSettings_(), apollo: apolloData_() };
  });
}

/* =========================================================
   7. MINERVA CORE – Profil, Einstellungen, Verbesserungsideen
   Alles liegt im Tabellenblatt „Einstellungen“ (Schlüssel/Wert). Das Profilbild wird
   verkleinert als Bild-Text (data:image/jpeg) gespeichert – ohne zusätzliche Drive-Rechte.
   ========================================================= */

const PROFIL_FELDER = {
  NAME: ['Dein Name für die Begrüßung', 80],
  ROLLE: ['Profil: Beruf / Rolle', 120],
  ORT: ['Profil: Wohnort', 80],
  GEBURTSTAG: ['Profil: Geburtstag (JJJJ-MM-TT)', 10],
  MOTTO: ['Profil: Leitsatz', 200],
  PROFILBILD: ['Profilbild (wird von der App gesetzt)', 49000]
};
const CORE_EINSTELLUNGEN = {
  ROUTINE_MORGEN_UHRZEIT: 'Ab dieser Stunde zeigt MINERVA die Tag-Routine',
  ROUTINE_WECHSEL_UHRZEIT: 'Ab dieser Stunde zeigt MINERVA die Abend-Routine'
};

function setSetting_(key, value, desc) {
  const sh = sheet_('Einstellungen');
  const values = sh.getDataRange().getValues();
  const v = typeof value === 'number' ? value : "'" + String(value == null ? '' : value);
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) === key) { sh.getRange(r + 1, 2).setValue(v); dirty_('Einstellungen'); return; }
  }
  sh.appendRow([key, v, desc || '']);
  dirty_('Einstellungen');
}

function profilSave(patch) {
  return withLock_(function () {
    Object.keys(patch || {}).forEach(function (k) {
      const f = PROFIL_FELDER[k];
      if (!f) return;
      let v = String(patch[k] == null ? '' : patch[k]).trim();
      if (k === 'PROFILBILD' && v && !/^data:image\/(jpeg|png|webp);base64,/.test(v)) throw new Error('Ungültiges Bild.');
      if (k === 'GEBURTSTAG' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('Geburtstag bitte als Datum wählen.');
      if (v.length > f[1]) {
        if (k === 'PROFILBILD') throw new Error('Das Bild ist zu groß. Bitte ein kleineres wählen.');
        v = v.slice(0, f[1]);
      }
      setSetting_(k, v, f[0]);
    });
    return getSettings_();
  });
}

function einstellungenSave(patch) {
  return withLock_(function () {
    Object.keys(patch || {}).forEach(function (k) {
      if (!CORE_EINSTELLUNGEN[k]) return;
      const n = Math.round(Number(patch[k]));
      if (!isFinite(n)) return;
      const ranges = { ROUTINE_MORGEN_UHRZEIT: [0, 23], ROUTINE_WECHSEL_UHRZEIT: [0, 23] }[k];
      setSetting_(k, Math.max(ranges[0], Math.min(ranges[1], n)), CORE_EINSTELLUNGEN[k]);
    });
    return getSettings_();
  });
}

/** Module ein- oder ausblenden. Gespeichert als Liste in MODULE_AUS. */
function moduleSet(id, active) {
  return withLock_(function () {
    const valid = MODULES.map(function (m) { return m.id; });
    if (valid.indexOf(String(id)) < 0) throw new Error('Unbekanntes Modul.');
    let off = String(setting_('MODULE_AUS', '')).split(',').map(function (x) { return x.trim(); }).filter(String);
    off = off.filter(function (x) { return x !== String(id); });
    if (!active) off.push(String(id));
    if (off.length >= valid.length) throw new Error('Mindestens ein Modul muss aktiv bleiben.');
    setSetting_('MODULE_AUS', off.join(','), 'Ausgeblendete Module (wird in CORE gesetzt)');
    return getSettings_();
  });
}

/* Verbesserungsideen, Fehlerhinweise und Funktionswünsche – aus jedem Bereich der App.
   Gesammelt im Tabellenblatt „Feedback“ zur späteren Prüfung und Priorisierung. */

const FEEDBACK_KATEGORIEN = ['Verbesserungsidee', 'Fehler', 'Funktionswunsch'];
const FEEDBACK_STATUS = ['neu', 'geplant', 'erledigt', 'verworfen'];

function feedbackData_() {
  return readTable_('Feedback').map(function (f) {
    return { ID: String(f.ID), Titel: f.Titel, Kategorie: f.Kategorie, Beschreibung: String(f.Beschreibung || ''), Kontext: String(f.Kontext || ''), Status: String(f.Status || 'neu'), Erstellt: f.Erstellt };
  }).sort(function (a, b) { return String(b.Erstellt).localeCompare(String(a.Erstellt)); });
}

function feedbackSave(f) {
  return withLock_(function () {
    const titel = text_(f && f.titel, 200);
    if (!titel) throw new Error('Bitte eine kurze Zusammenfassung eingeben.');
    appendRow_('Feedback', {
      ID: newId_('fb'), Titel: titel,
      Kategorie: FEEDBACK_KATEGORIEN.indexOf(f.kategorie) > -1 ? f.kategorie : 'Verbesserungsidee',
      Beschreibung: text_(f.beschreibung, 10000), Kontext: text_(f.kontext, 60), Status: 'neu', Erstellt: new Date()
    });
    return feedbackData_();
  });
}

function feedbackStatus(id, status) {
  return withLock_(function () {
    if (FEEDBACK_STATUS.indexOf(status) < 0) throw new Error('Unbekannter Status.');
    updateWhere_('Feedback', function (r) { return String(r.ID) === String(id); }, { Status: status });
    return feedbackData_();
  });
}

/* =========================================================
   8. Einrichtung & Aktualisierung
   Legt fehlende Tabellenblätter und Spalten an, füllt leere Blätter mit Startdaten
   und führt Daten-Updates einmalig aus. Bestehende Inhalte werden nie gelöscht.
   Läuft automatisch beim ersten Start einer neuen Version; von Hand: Funktion „setup“ ausführen.
   ========================================================= */

/** Führt setup() einmal pro Version aus (geschützt durch eine Sperre). */
function ensureSetup_() {
  if (prop_('SETUP_VERSION') === VERSION) return;
  withLock_(function () { if (prop_('SETUP_VERSION') !== VERSION) setup(); });
}

function setup() {
  const ss = ss_();
  setProp_('SHEET_ID', ss.getId());
  renameSheets_(ss);
  const now = new Date();
  Object.keys(SCHEMA).forEach(function (name) {
    const cols = SCHEMA[name];
    let sh = ss.getSheetByName(name);
    const fresh = !sh;
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    } else {
      const have = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
      cols.forEach(function (c) { if (have.indexOf(c) < 0) sh.getRange(1, sh.getLastColumn() + 1).setValue(c); });
    }
    const rows = (SEED[name] || []).map(function (r) { return r.map(function (v) { return v === '__NOW__' ? now : v; }); });
    if (sh.getLastRow() < 2 && rows.length) sh.getRange(2, 1, rows.length, cols.length).setValues(rows);
    if (fresh) {
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#E9EBF5').setFontColor('#1C1F2A');
    }
    dirty_(name);
  });
  ['Tabellenblatt1', 'Sheet1'].forEach(function (n) {
    const sh = ss.getSheetByName(n);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  });
  migrate_();
  setProp_('SETUP_VERSION', VERSION);
  return 'MINERVA ' + VERSION + ' ist eingerichtet.';
}

/** Umbenannte Tabellenblätter (vor dem Anlegen fehlender Blätter, damit nichts doppelt entsteht). */
function renameSheets_(ss) {
  // 5.0: KAIROS aufgelöst – Ideen bleiben im selben Blatt, die alten Projektschritte werden zum Archiv.
  [['Kairos', 'Ideen'], ['Kairos_Schritte', 'Archiv_Projektschritte']].forEach(function (p) {
    const from = ss.getSheetByName(p[0]);
    if (from && !ss.getSheetByName(p[1])) { from.setName(p[1]); dirty_(p[0]); }
  });
}

/** Einmalige Daten-Updates für bestehende Installationen. Jeder Schritt ist wiederholbar, ohne Schaden anzurichten. */
function migrate_() {
  migrate52_();
  migrate53_();
  migrate55_();
  if (prop_('MIGRATION_5_0')) return;

  // Wünsche aus dem früheren KAIROS-Blatt auf die Bucket List (CLIO) umziehen: erst kopieren, prüfen, dann aus „Ideen“ entfernen.
  const istWunsch = function (k) {
    const st = String(k.Stufe || '');
    return st === 'wunsch' || st === 'erfuellt' || (st === 'verworfen' && String(k.Typ) === 'Wunsch');
  };
  const wuensche = readTable_('Ideen').filter(istWunsch);
  if (wuensche.length) {
    const vorhanden = readTable_('Bucket_List').map(function (w) { return String(w.ID); });
    wuensche.forEach(function (k) {
      if (vorhanden.indexOf(String(k.ID)) > -1) return;
      const st = String(k.Stufe);
      appendRow_('Bucket_List', {
        ID: String(k.ID), Titel: k.Titel, Kategorie: k.Kategorie || 'Sonstiges', Horizont: k.Horizont || 'Irgendwann', Notiz: k.Notiz || '',
        Status: st === 'erfuellt' ? 'erfuellt' : (st === 'verworfen' ? 'entfernt' : 'offen'),
        Erfuellt: k.Erfuellt ? "'" + String(k.Erfuellt).slice(0, 10) : '', Erstellt: k.Erstellt || '', Geaendert: k.Geaendert || ''
      });
    });
    const kopiert = readTable_('Bucket_List').map(function (w) { return String(w.ID); });
    deleteWhere_('Ideen', function (k) { return istWunsch(k) && kopiert.indexOf(String(k.ID)) > -1; });
  }

  // Packlisten-Kategorie „Sportzubehör“ heißt jetzt „Zubehör“
  updateWhere_('Pack_Kategorien', function (c) { return String(c.Name) === 'Sportzubehör'; }, { Name: 'Zubehör' });

  // Einstellungen: KAIROS-Limits werden nicht mehr gebraucht, Texte nennen MINERVA
  deleteWhere_('Einstellungen', function (r) { return ['MAX_AKTIV', 'MAX_PRUEFEN'].indexOf(String(r.Schluessel)) > -1; });
  updateWhere_('Einstellungen', function (r) { return String(r.Beschreibung || '').indexOf('NERA') > -1; },
    function (r) { return { Beschreibung: String(r.Beschreibung).replace(/NERA/g, 'MINERVA') }; });

  // Umgesetzte Verbesserungsideen abhaken
  updateWhere_('Feedback', function (f) { return String(f.Status) === 'neu' && /Sportzubeh|Verschiebe/i.test(String(f.Titel)); }, { Status: 'erledigt' });

  // Namen in Google Drive: Tabelle und Fotoordner heißen jetzt MINERVA
  try { const ss = ss_(); if (ss.getName() === 'NERA_Datenbank') ss.rename('MINERVA_Datenbank'); } catch (e) { console.warn(e); }
  ['FOTO_ORDNER', 'REZEPT_ORDNER'].forEach(function (k) {
    const id = prop_(k); if (!id) return;
    try { const f = DriveApp.getFolderById(id); f.setName(f.getName().replace('NERA', 'MINERVA')); setProp_(k, id); } catch (e) { console.warn(e); }
  });

  // Blatt „Anleitung“ (noch von NERA 3.2, mit veralteten Hinweisen) durch die aktuelle Kurzanleitung ersetzen
  const an = ss_().getSheetByName('Anleitung');
  if (an && String(an.getRange(1, 1).getValues()[0][0]).indexOf('NERA') === 0) {
    an.clear();
    an.getRange(1, 1, ANLEITUNG.length, 1).setValues(ANLEITUNG.map(function (t) { return [t]; }));
  }

  setProp_('MIGRATION_5_0', 'ok');
}

/** 5.2: Kurzanleitung um APOLLO ergänzen (das Blatt „Anleitung“ schreibt nur MINERVA selbst). */
function migrate52_() {
  if (prop_('MIGRATION_5_2')) return;
  const an = ss_().getSheetByName('Anleitung');
  if (an && String(an.getRange(1, 1).getValues()[0][0]).indexOf('MINERVA') === 0) {
    an.clear();
    an.getRange(1, 1, ANLEITUNG.length, 1).setValues(ANLEITUNG.map(function (t) { return [t]; }));
  }
  setProp_('MIGRATION_5_2', 'ok');
}

/** 5.3: Kurzanleitung um „Gesundheit_Wochen“ ergänzen. */
function migrate53_() {
  if (prop_('MIGRATION_5_3')) return;
  const an = ss_().getSheetByName('Anleitung');
  if (an && String(an.getRange(1, 1).getValues()[0][0]).indexOf('MINERVA') === 0) {
    an.clear();
    an.getRange(1, 1, ANLEITUNG.length, 1).setValues(ANLEITUNG.map(function (t) { return [t]; }));
  }
  setProp_('MIGRATION_5_3', 'ok');
}

/** 5.5: Titel, die wegen ausgelasteter TMDB-Abfragen als „nicht gefunden“ markiert wurden, noch einmal suchen. */
function migrate55_() {
  if (prop_('MIGRATION_5_5')) return;
  updateWhere_('Watchlist', function (w) { return String(w.TmdbID) === '-'; }, { TmdbID: '' });
  setProp_('MIGRATION_5_5', 'ok');
}

/* =========================================================
   9. Schnittstelle für die MINERVA-App (seit 5.6)
   Die App (eigene Web-App auf GitHub Pages) ruft dieselben Funktionen auf wie
   die Oberfläche hier – aber über doPost, geschützt mit einem geheimen Schlüssel.
   Einrichten: einmal die Funktion appEinrichten() im Editor ausführen und den
   Schlüssel aus dem Protokoll in die App kopieren. Nur wer den Schlüssel kennt,
   kommt an die Daten. Neuer Schlüssel: appSchluesselErneuern() (alte Geräte
   müssen sich dann neu verbinden).
   ========================================================= */

/** Funktionen, die die App nie aufrufen darf (Einrichtung, Webseite, Schlüssel). */
const API_GESPERRT = ['doGet', 'doPost', 'setup', 'appEinrichten', 'appSchluesselErneuern'];

function doPost(e) {
  let out;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const soll = prop_('API_KEY');
    if (!soll || String(req.key || '') !== soll) throw new Error('Kein Zugriff: Der Schlüssel passt nicht. Bitte die App neu verbinden.');
    const fn = String(req.fn || '');
    const f = /^[a-z][A-Za-z0-9]*$/.test(fn) && API_GESPERRT.indexOf(fn) < 0 ? globalThis[fn] : null;
    if (typeof f !== 'function') throw new Error('Unbekannte Funktion: ' + fn);
    ensureSetup_();
    const data = f.apply(null, Array.isArray(req.args) ? req.args : []);
    out = { ok: true, data: data === undefined ? null : data };
  } catch (err) {
    out = { ok: false, error: err && err.message ? err.message : String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Einmal im Editor ausführen: legt den Schlüssel für die App an und zeigt ihn im Protokoll. */
function appEinrichten() {
  let key = prop_('API_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); setProp_('API_KEY', key); }
  console.log('Schlüssel für die MINERVA-App (geheim halten):\n' + key);
  return key;
}

/** Neuen Schlüssel erzeugen. Alle verbundenen Geräte müssen sich danach neu verbinden. */
function appSchluesselErneuern() {
  setProp_('API_KEY', '');
  return appEinrichten();
}

const ANLEITUNG = [
  'MINERVA – Datenbank (ab Version 5.0)',
  '',
  'Dieses Google Sheet ist die Datenbank von MINERVA. Du kannst alles direkt hier pflegen; die App liest es beim nächsten Öffnen oder über „Synchronisieren“ neu ein.',
  'Updates: Im Apps-Script-Editor nur die beiden Dateien „Code“ und „Index“ ersetzen, speichern, App neu laden. Neue Blätter und Spalten legt MINERVA beim ersten Start selbst an.',
  'Bitte nie „Datei → Importieren → Tabellen ersetzen“ benutzen – das würde deine Einträge überschreiben.',
  '',
  'Regeln für eigene Änderungen',
  '• Zeile 1 jedes Blatts enthält die Spaltennamen. Bitte nicht umbenennen; neue Spalten hinten anfügen ist in Ordnung.',
  '• ID-Spalten: eindeutiger Text ohne Leerzeichen (z. B. p042).',
  '• Datumsangaben als Text: JJJJ-MM-TT, JJJJ-MM oder JJJJ (Geburtstag ohne Jahr: --MM-TT).',
  '• Pack_Items.Tags: Trip-IDs mit Komma (sport, business, wochenende, strand, aktiv) oder „alle“. Reihenfolge: Zahl innerhalb der Kategorie.',
  '• Rezepte.Zutaten: eine Zutat pro Zeile (Zeilenumbruch in der Zelle mit Strg+Enter). Zwischenüberschriften enden mit Doppelpunkt, z. B. „Suppe:“.',
  '• Affirmationen.Zeit: morgen, abend oder immer.',
  '• Farbe: lila, petrol, blau oder gruen.',
  '• Ideen.Stufe: idee (liegt auf dem Parkplatz), aufgabe, wunsch oder verworfen. Frühere KAIROS-Projekte stehen mit ihrer alten Stufe im selben Blatt und werden in der App nicht mehr gezeigt.',
  '• Bucket_List.Status: offen, erfuellt oder entfernt.',
  '• Archiv_Projektschritte: die Schritte der früheren KAIROS-Projekte, nur zum Nachlesen.',
  '• Ariadne_Feedback: welche ARIADNE-Technik du ausprobiert hast und ob sie geholfen hat (ja / nein / ausgeblendet). Die Inhalte von ARIADNE selbst stehen im Sheet „ADHS Exekutivfunktionen“.',
  '• Gesundheit_Wochen (ARIADNE): eine Zeile je Woche, Woche = Montag als JJJJ-MM-TT. Energie und Belastung 1–5 (deine Einschätzung), Schlaf in Stunden (Ø), HRV = ausgeglichen, unausgeglichen, niedrig oder schlecht, BodyBattery = Ø morgens (0–100), Ruhepuls in bpm (Ø), Stress = Ø (0–100), Gewicht in kg. Alles freiwillig, leere Felder sind in Ordnung.',
  '• Watchlist (APOLLO): Art = film oder serie; Status = offen oder angefangen. Die Watchlist ist kein Archiv: Gesehenes wird entfernt, und beim IMDb-Import verschwinden (nach Rückfrage) Titel, die nicht mehr auf der IMDb-Watchlist stehen. Anbieter = Dienste mit Komma (z. B. netflix,disney), die MINERVA etwa einmal pro Woche bei TMDB neu abfragt. TmdbID „-“ heißt: bei TMDB nicht gefunden.',
  '• Spiele (APOLLO): eine Zeile je Spiel. Status = sammlung (nur im Regal), spiele, naechstes, pausiert, durch oder wunsch (Wunschliste, noch nicht gekauft – ohne Exemplar). Notiz = „Wo war ich?“. Lieblingsspiel = TRUE für deine Lieblingsspiele (ändert die Wertung nicht). Bew…-Spalten: deine Wertungen 1–10 (leer = nicht bewertet); Bewertung = deren Durchschnitt mit einer Kommastelle, rechnet MINERVA selbst. Spielzeit = Durchschnitt laut RAWG.',
  '• Spiele_Exemplare (APOLLO): eine Zeile je Exemplar (SpielID aus „Spiele“). Plattform z. B. PS5, 3DS, PC – Steam; Format = Digital, Disc oder Cartridge; Herkunft z. B. Gekauft oder PS Plus.',
  '• *_Status-Blätter speichern Häkchen. Sie werden nur über die Reset-Knöpfe in der App geleert.'
];

const SCHEMA = {
  "Einstellungen": ["Schluessel", "Wert", "Beschreibung"],
  "Routine_Typen": ["ID", "Name", "Icon", "Reihenfolge"],
  "Routine_Abschnitte": ["ID", "RoutineID", "Name", "Icon", "Farbe", "Reihenfolge"],
  "Routine_Schritte": ["ID", "AbschnittID", "Schritt", "Hinweis", "Reihenfolge"],
  "Routine_Status": ["RoutineID", "SchrittID", "Zeitpunkt"],
  "Aufgaben": ["ID", "Titel", "Faellig", "Erledigt", "Quelle", "Reihenfolge", "Erstellt"],
  "Ideen": ["ID", "Titel", "Typ", "Stufe", "Notiz", "Nutzen", "Aufwand", "Kategorie", "Horizont", "Erfuellt", "Erstellt", "Geaendert"],
  "Pack_TripTypen": ["ID", "Name", "Kurzname", "Icon", "Reihenfolge"],
  "Pack_Kategorien": ["ID", "Name", "Icon", "Farbe", "Reihenfolge"],
  "Pack_Items": ["ID", "Name", "KategorieID", "Tags", "Reihenfolge"],
  "Pack_Status": ["TripID", "ItemID", "Status", "Zeitpunkt"],
  "Einkauf_Kategorien": ["ID", "Name", "Icon", "Farbe", "Reihenfolge"],
  "Einkauf": ["ID", "Artikel", "KategorieID", "ImWagen", "Quelle", "Erstellt"],
  "Rezepte": ["ID", "Titel", "Untertitel", "Kategorie", "Tags", "Portionen", "Vorbereitung", "Kochzeit", "Dauer", "Zutaten", "Zubereitung", "Notizen", "Naehrwerte", "Foto", "Vorrat", "Erstellt"],
  "Wohnideen": ["ID", "Titel", "Raum", "Notiz", "Kosten", "Link", "Status", "Erstellt"],
  "Pflege_Wissen": ["ID", "Titel", "Kategorie", "Inhalt", "Reihenfolge"],
  "Personen": ["ID", "Name", "Beziehung", "Geburtstag", "Adresse", "Vorlieben", "Interessen", "Notizen", "Reihenfolge", "Erstellt"],
  "Anlaesse": ["ID", "PersonID", "Titel", "Art", "Datum", "Vorlauf", "InClio", "Notiz", "Erstellt"],
  "Geschenke": ["ID", "PersonID", "Typ", "Titel", "Link", "Preis", "Notiz", "Status", "Erstellt"],
  "Clio": ["ID", "Datum", "DatumBis", "Titel", "Kategorie", "Ort", "Personen", "Beschreibung", "Details", "Fotos", "Typ", "Erstellt"],
  "Clio_Kategorien": ["ID", "Name", "Icon", "Farbe", "OrtLabel", "Felder", "Optionen", "Reihenfolge"],
  "Bucket_List": ["ID", "Titel", "Kategorie", "Horizont", "Notiz", "Status", "Erfuellt", "Erstellt", "Geaendert"],
  "Affirmationen": ["ID", "Text", "Zeit", "Reihenfolge"],
  "Feedback": ["ID", "Titel", "Kategorie", "Beschreibung", "Kontext", "Status", "Erstellt"],
  "Gesundheit_Wochen": ["ID", "Woche", "Energie", "Belastung", "Schlaf", "HRV", "BodyBattery", "Ruhepuls", "Stress", "Gewicht", "Notiz", "Erstellt", "Geaendert"],
  "Ariadne_Feedback": ["ID", "Datum", "TechnikID", "Technik", "ProblemID", "FunktionID", "Lage", "Energie", "Antrieb", "Geholfen", "Beantwortet"],
  "Watchlist": ["ID", "Art", "Titel", "Originaltitel", "Jahr", "ImdbID", "TmdbID", "Poster", "Genres", "Laufzeit", "Staffeln", "ImdbWertung", "TmdbWertung", "Beschreibung", "Anbieter", "AnbieterStand", "Status", "Quelle", "Erstellt"],
  "Spiele": ["ID", "Titel", "Plattform", "Status", "Cover", "Metacritic", "Wertung", "Genres", "Spielzeit", "Erschienen", "Notiz", "Bewertung", "BewGameplay", "BewGrafik", "BewStory", "BewSound", "BewWiederspielwert", "Lieblingsspiel", "RawgID", "Reihenfolge", "Erstellt", "Geaendert"],
  "Spiele_Exemplare": ["ID", "SpielID", "Plattform", "Format", "Herkunft", "Erstellt"]
};

/** Startdaten für eine neue, leere Tabelle (eine Zeile je Eintrag, Spalten wie in SCHEMA). */
const SEED = {
  "Einstellungen": [
    ["NAME", "", "Dein Name für die Begrüßung"],
    ["ROUTINE_MORGEN_UHRZEIT", "4", "Ab dieser Stunde zeigt MINERVA die Tag-Routine"],
    ["ROUTINE_WECHSEL_UHRZEIT", "16", "Ab dieser Stunde zeigt MINERVA die Abend-Routine"]
  ],
  "Routine_Typen": [
    ["tag", "Tag", "sun", 1],
    ["abend", "Abend", "moon", 2]
  ],
  "Routine_Abschnitte": [
    ["vor", "tag", "Vor dem Duschen", "sparkle", "lila", 1],
    ["dusche", "tag", "Duschen", "shower", "blau", 2],
    ["nach", "tag", "Nach dem Duschen", "shirt", "petrol", 3],
    ["becken", "abend", "Waschbecken", "sink", "gruen", 1]
  ],
  "Routine_Schritte": [
    ["r001", "vor", "Musik an", "", 1],
    ["r002", "vor", "Toilette", "", 2],
    ["r003", "vor", "Zähne putzen, Mundspülung", "", 3],
    ["r004", "vor", "Gesicht / Körper rasieren", "", 4],
    ["r005", "dusche", "Haare waschen → ausspülen", "", 1],
    ["r006", "dusche", "Conditioner → drin lassen", "", 2],
    ["r007", "dusche", "Körper waschen (oben → unten)", "", 3],
    ["r008", "dusche", "Conditioner ausspülen", "", 4],
    ["r009", "dusche", "Gesicht mit lauwarmem Wasser waschen", "", 5],
    ["r010", "nach", "Abtrocknen", "", 1],
    ["r011", "nach", "Body Lotion", "", 2],
    ["r012", "nach", "Liquid Balancer (& Serum)", "", 3],
    ["r013", "nach", "Feuchtigkeitscreme", "", 4],
    ["r014", "nach", "Haare kämmen, föhnen, stylen", "", 5],
    ["r015", "nach", "Deodorant", "", 6],
    ["r016", "nach", "Anziehen", "", 7],
    ["r017", "nach", "Sonnenschutz", "", 8],
    ["r018", "nach", "Großes Glas Wasser trinken", "", 9],
    ["r019", "nach", "Medikamente bzw. Vitamine", "", 10],
    ["r020", "becken", "Toilette", "", 1],
    ["r021", "becken", "Zähne putzen, Zahnseide (& Zunge)", "", 2],
    ["r022", "becken", "Re-Balance Cream Cleanser", "", 3],
    ["r023", "becken", "AHA/PHA Peeling", "Wöchentlich", 4],
    ["r024", "becken", "Serum", "", 5],
    ["r025", "becken", "Nachtcreme (& Augencreme)", "", 6],
    ["r026", "becken", "Schlafkleidung anziehen", "", 7],
    ["r027", "becken", "Medikamente bzw. Vitamine", "", 8]
  ],
  "Pack_TripTypen": [
    ["sport", "Sport", "Sport", "dumbbell", 1],
    ["business", "Geschäftsreise", "Business", "briefcase", 2],
    ["wochenende", "Kurzreise", "Kurzreise", "suitcase", 3],
    ["strand", "Strandurlaub", "Strand", "beach", 4],
    ["aktiv", "Aktivurlaub", "Aktiv", "boot", 5]
  ],
  "Pack_Kategorien": [
    ["bad", "Badartikel", "drop", "lila", 1],
    ["kleidung", "Kleidung", "shirt", "petrol", 2],
    ["entertainment", "Entertainment", "gamepad", "blau", 3],
    ["dokumente", "Dokumente & Technik", "idcard", "gruen", 4],
    ["sportzubehoer", "Zubehör", "dumbbell", "blau", 5]
  ],
  "Pack_Items": [
    ["p001", "Zahnbürste & Zahnpasta", "bad", "strand,wochenende,business,aktiv", 1],
    ["p002", "Zahnseide & Mundspülung", "bad", "strand,wochenende,business,aktiv", 2],
    ["p003", "Deodorant", "bad", "strand,wochenende,business,aktiv", 3],
    ["p004", "Rasierer", "bad", "strand,wochenende,business,aktiv", 4],
    ["p005", "Haarprodukte & Kamm", "bad", "strand,wochenende,business,aktiv", 5],
    ["p006", "Gesichtspflege (Cleanser, Serum, Cremes)", "bad", "strand,wochenende,business,aktiv", 6],
    ["p007", "Sonnencreme", "bad", "strand", 7],
    ["p008", "Aftersun", "bad", "strand", 8],
    ["p009", "Medikamente bzw. Vitamine", "bad", "strand,wochenende,business,aktiv", 9],
    ["p010", "Unterwäsche & Socken", "kleidung", "strand,wochenende,business,aktiv", 1],
    ["p011", "T-Shirts", "kleidung", "strand,wochenende,business,aktiv", 2],
    ["p012", "Schlafkleidung", "kleidung", "strand,wochenende,business,aktiv", 3],
    ["p013", "Badehose", "kleidung", "strand", 4],
    ["p014", "Flip-Flops", "kleidung", "strand", 5],
    ["p015", "Leinenhemd", "kleidung", "strand,wochenende", 6],
    ["p016", "Sonnenbrille", "kleidung", "strand,wochenende", 7],
    ["p017", "Hemd & Anzug", "kleidung", "business", 8],
    ["p018", "Nintendo Switch 2", "entertainment", "strand,wochenende", 1],
    ["p019", "Switch-Ladegerät", "entertainment", "strand,wochenende", 2],
    ["p020", "Kopfhörer", "entertainment", "strand,wochenende,business,aktiv", 3],
    ["p021", "Buch / E-Reader", "entertainment", "strand", 4],
    ["p022", "Personalausweis", "dokumente", "strand,wochenende,business,aktiv", 1],
    ["p023", "Handy-Ladegerät", "dokumente", "strand,wochenende,business,aktiv", 2],
    ["p024", "Powerbank", "dokumente", "strand,wochenende,business,aktiv", 3],
    ["p025", "Laptop & Netzteil", "dokumente", "business", 4],
    ["ps01", "Sportkleidung", "kleidung", "sport", 20],
    ["ps02", "Sportschuhe", "kleidung", "sport", 21],
    ["ps03", "Handtuch", "bad", "sport", 20],
    ["ps04", "Duschgel & Shampoo", "bad", "sport", 21],
    ["ps05", "Trinkflasche", "sportzubehoer", "sport,aktiv", 1],
    ["ps06", "Spindschloss", "sportzubehoer", "sport", 2],
    ["pa01", "Wanderschuhe", "kleidung", "aktiv", 30],
    ["pa02", "Regenjacke", "kleidung", "aktiv", 31],
    ["pa03", "Funktionsshirts", "kleidung", "aktiv", 32],
    ["pa04", "Tagesrucksack", "sportzubehoer", "aktiv", 10],
    ["pa05", "Erste-Hilfe-Set & Blasenpflaster", "bad", "aktiv", 30]
  ],
  "Einkauf_Kategorien": [
    ["obst", "Obst & Gemüse", "leaf", "gruen", 1],
    ["kuehl", "Kühlregal", "snow", "blau", 2],
    ["vorrat", "Vorrat", "jar", "petrol", 3],
    ["drogerie", "Drogerie", "drop", "lila", 4],
    ["sonstiges", "Sonstiges", "bag", "lila", 5],
    ["geschenke", "Geschenke", "gift", "lila", 6]
  ],
  "Rezepte": [
    ["rz10", "Rote-Bete-Suppe", "mit weißem Schokoladen-Cappuccino", "Suppe", "Vegetarisch", 6, 30, 45, 75, "Suppe:\n500 g Rote Bete\n500 g Möhren\n1 L Gemüsebrühe\n2 rote Zwiebeln\n2 EL Walnussöl\n1/2 TL Kümmel, gemahlen\n100 g kalte Butter\nSalz, Pfeffer\nEtwas Kresse zum Garnieren\nCappuccino:\n100 ml Sahne\n20 g weiße Kuvertüre\n3 EL (Kräuter) Crème Fraîche\nSalz, Pfeffer", "Die frischen roten Bete schälen und würfeln, die Zwiebeln ebenso. Die Zwiebeln mit den roten Beten in Walnussöl glasig dünsten. Gemüsebrühe oder Geflügelfond angießen und aufkochen. Köcheln lassen, bis die roten Bete weich sind.\nDie Suppe mit einem Stabmixer pürieren. Die kalte Butter portionsweise mit dem Stabmixer einarbeiten und aufmontieren. Mit Kümmel, Salz und Pfeffer abschmecken.\nDie Sahne mit der Crème Fraîche vermischen und in einer Kasserolle erhitzen. Die weiße Couvertüre hacken und portionsweise unterrühren, bis sie sich aufgelöst hat. Whisky zugeben und mit einem Stabmixer aufschäumen, mit Salz und Pfeffer abschmecken.\nDie Suppe auf Suppenteller verteilen. Etwas Schokoladen-Cappuchino mit der Rückseite eines Löffels in die Suppe ziehen, die Kresse auf den Spuren anrichten. Den Cappuchino zur Suppe servieren. Den Gästen bleibt es selbst überlassen, ob sie den Cappuchino unter die Suppe rühren.", "Passendes Brot dazu, z.B. Walnussbrot", "", "", "", "__NOW__"],
    ["rz11", "Kalte Gurken-Avocado-Suppe", "mit gerösteten Kichererbsen", "Suppe", "Vegetarisch", 2, 30, 45, 75, "Suppe:\n2 Gurken\n2 Avocados\n125 ml Tahini\n1 Zitrone (Saft)\n2 Knoblauchzehen\n15 g Basilikum\n2 EL Natur-Joghurt\n0.5 TL Paprikapulv.\n0.5 TL Pfeffer\n1 TL Salz\nKichererbsen:\n400 g Kichererbsen\n1 TL Salz\n0.5 TL Pfeffer\n0.5 TL Cayenne\n1 TL Paprikapulver\n2 EL pflanzl. Öl", "Den Ofen auf 220°C vorheizen.\nDie Kichererbsen abtropfen lassen, mit den Gewürzen und dem Öl in einer Schüssel vermengen und auf einem Backblech verteilen.\nDie Kichererbsen im Ofen für 20 Minuten backen, bis sie schön knusprig und braun sind. Zwischendurch mal wenden.\nIn der Zwischenzeit alle Suppenzutaten in einen Mixer geben und zu einer glatten Masse pürieren. Wasser und pflanzlichen Joghurt nach Bedarf hinzugeben und abschmecken.\nDie kalte Suppe mit den gerösteten Kichererbsen, pflanzlichem Joghurt, Öl und frischen Kräutern toppen.", "mit pflanzlichem Naturjoghurt auch vegan", "", "", "", "__NOW__"],
    ["rz12", "Sommersalat", "mit gegrillten Aprikosen", "Salat", "", 4, 25, 0, 25, "Salat:\n8 Apricots\n8 branches thyme\n½ Red Onion\n1 hand-full of salads\n4 slices prosciutto\n125g mozzarella\n1 citrus\nDressing:\n1 EL Olive oil\nWeißweinessig\nPink Pepper\nSide:\nCiabatta or baguette", "Cut the apricots in half and toss in olive oil and thyme. Then grill in a grill pan, cut side down, until well browned. Turn the apricots once in between.\nTo make the dressing, mix the olive oil and white wine vinegar and crumble the pink peppercorns into it.\nSlice the red onion into thin rings and marinate in the dressing.\nWash the lettuce leaves and chop into bite-sized pieces. Mix the salad leaves with the dressing.\nTear the dried ham into pieces and scatter over the salad.\nShred the mozzarella, season with sea salt, pepper, a little lemon zest and a little olive oil.\nSprinkle the mozzarella, grilled apricots and thyme over the salad.", "Doesn’t matter with salad is taken, most work very well. You can easily mix 3 or more salad types.", "144 kcal, 13g Kohlenhydrate, 9g Eiweiß, 7g Fett", "", "", "__NOW__"]
  ],
  "Pflege_Wissen": [
    ["pw01", "Wäsche sortieren", "Wäsche", "Nach Farbe (hell, dunkel, bunt) und nach der niedrigsten erlaubten Temperatur auf den Etiketten sortieren.", 1],
    ["pw02", "Neue farbige Kleidung", "Wäsche", "Die ersten Wäschen separat oder mit ähnlichen Farben waschen – sie können anfangs abfärben.", 2],
    ["pw03", "Eiweißflecken (z. B. Blut)", "Flecken", "Mit kaltem Wasser vorbehandeln. Heißes Wasser lässt Eiweiß gerinnen und fixiert den Fleck.", 3],
    ["pw04", "Wolle & Feines", "Wäsche", "Wollprogramm oder Handwäsche, wenig schleudern und liegend trocknen, damit nichts ausleiert.", 4]
  ],
  "Clio_Kategorien": [
    ["beruf", "Beruf & Karriere", "briefcase", "blau", "Ort oder Organisation", "Arbeitgeber, Position", "", 1],
    ["bildung", "Bildung & Entwicklung", "grad", "petrol", "Hochschule / Institution", "Abschluss", "", 2],
    ["meilenstein", "Meilensteine", "flag", "lila", "Ort", "", "", 3],
    ["reise", "Reisen & Ausflüge", "plane", "blau", "Unterkunft / Hotel", "Reiseziel, Begleitung", "", 4],
    ["events", "Events", "ticket", "lila", "Location (z. B. Semperoper, UFA Kino Dresden)", "Art, Mit wem", "Konzert, Kino, Theater, Ballett, Oper, Musical, Museum, Ausstellung, Festival, Feier, Party, Sport", 5],
    ["erinnerung", "Erinnerungen & besondere Momente", "heart", "gruen", "Ort", "Mit wem", "", 6]
  ],
  "Affirmationen": [
    ["af01", "Ich darf heute klein anfangen – ein Schritt reicht.", "morgen", 1],
    ["af02", "Ich muss nicht alles schaffen. Ich mache das, was jetzt dran ist.", "morgen", 2],
    ["af03", "Mein Kopf ist voller Ideen – heute wähle ich bewusst eine aus.", "morgen", 3],
    ["af04", "Ich vertraue meinen Listen. Was abgehakt ist, ist erledigt.", "morgen", 4],
    ["af05", "Ich begegne dem Tag mit Neugier statt mit Druck.", "morgen", 5],
    ["af06", "Ich bin gut vorbereitet – den Rest finde ich unterwegs heraus.", "morgen", 6],
    ["af07", "Pausen gehören zu meinem Plan.", "morgen", 7],
    ["af08", "Ich habe heute genug getan. Der Rest darf bis morgen warten.", "abend", 8],
    ["af09", "Ich darf loslassen, was ich heute nicht beeinflussen konnte.", "abend", 9],
    ["af10", "Auch kleine Schritte waren heute Fortschritt.", "abend", 10],
    ["af11", "Nicht alles musste perfekt sein – es war gut so.", "abend", 11],
    ["af12", "Mein Kopf darf jetzt zur Ruhe kommen. Meine Gedanken liegen sicher auf dem Ideen-Parkplatz.", "abend", 12],
    ["af13", "Ich bin dankbar für einen Moment von heute.", "abend", 13],
    ["af14", "Ich bin genug, so wie ich bin.", "immer", 14],
    ["af15", "Ich entscheide, was jetzt wichtig ist.", "immer", 15]
  ]
};
