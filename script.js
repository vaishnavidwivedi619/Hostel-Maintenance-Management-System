(function(){
"use strict";

/* ---------- constants ---------- */
const STAGES = ["Registered","Assigned","In Progress","Resolved"];
const CATEGORIES = ["Electrical","Plumbing","Furniture","Wi-Fi"];
const STAGE_INFO = {
  "Registered":"The complaint has been submitted and is awaiting assignment.",
  "Assigned":"A maintenance staff member is responsible for fixing it.",
  "In Progress":"The assigned staff member has started work on the issue.",
  "Resolved":"The issue has been fixed and the ticket is closed."
};
const USERS = [
  {id:"s1",role:"student",name:"Aarav Sharma",room:"A-204",username:"aarav",password:"student123"},
  {id:"s2",role:"student",name:"Priya Verma",room:"B-112",username:"priya",password:"student123"},
  {id:"s3",role:"student",name:"Rohan Mehta",room:"C-310",username:"rohan",password:"student123"},
  {id:"s4",role:"student",name:"Ananya Iyer",room:"A-118",username:"ananya",password:"student123"},
  {id:"s5",role:"student",name:"Kabir Khan",room:"D-005",username:"kabir",password:"student123"},
  {id:"s6",role:"student",name:"Neha Joshi",room:"B-221",fresh:true,username:"neha",password:"student123"},
  {id:"a1",role:"admin",name:"Kavita Rao",title:"Chief Warden",username:"warden",password:"warden123"},
  {id:"m1",role:"staff",name:"Ramesh Yadav",skill:"Electrical",username:"ramesh",password:"staff123"},
  {id:"m2",role:"staff",name:"Suresh Pal",skill:"Plumbing",username:"suresh",password:"staff123"},
  {id:"m3",role:"staff",name:"Mohan Lal",skill:"Furniture",username:"mohan",password:"staff123"},
  {id:"m4",role:"staff",name:"Imran Siddiqui",skill:"Wi-Fi",username:"imran",password:"staff123"}
];
const KEY = "hmms.data.v1";
const SESSION_KEY = "hmms.session.v1";

/* ---------- storage (with in-memory fallback) ---------- */
const memStore = {};
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return memStore[k] ?? null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ memStore[k]=v; } }
};
const session = {
  get(){ try{ return sessionStorage.getItem(SESSION_KEY); }catch(e){ return memStore[SESSION_KEY] ?? null; } },
  set(v){ try{ sessionStorage.setItem(SESSION_KEY,v); }catch(e){ memStore[SESSION_KEY]=v; } },
  clear(){ try{ sessionStorage.removeItem(SESSION_KEY); }catch(e){ delete memStore[SESSION_KEY]; } }
};

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = s => String(s).toLowerCase().replace(/\s+/g,"-");
const user = id => USERS.find(u => u.id === id);
const first = n => n.split(" ")[0];
const fmt = ts => new Date(ts).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"});
const fmtShort = ts => new Date(ts).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
function ago(ts){
  const m = (Date.now()-ts)/60000;
  if(m < 1) return "just now";
  if(m < 60) return Math.floor(m)+" min ago";
  const h = m/60; if(h < 24) return Math.floor(h)+" h ago";
  const d = Math.floor(h/24); if(d < 7) return d+(d===1?" day ago":" days ago");
  return fmtShort(ts);
}
function dur(ms){
  const m = Math.round(ms/60000); if(m < 60) return m+" min";
  const h = Math.floor(m/60); if(h < 24) return h+" h"+(m%60?" "+(m%60)+" min":"");
  const d = Math.floor(h/24); return d+(d===1?" day":" days")+(h%24?" "+(h%24)+" h":"");
}
const svg = (p,s=18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  wrench: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',18),
  bell: svg('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',20),
  check: svg('<path d="M20 6 9 17l-5-5"/>',20),
  plus: svg('<path d="M12 5v14M5 12h14"/>',18),
  back: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>',18),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',18),
  inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',24),
  key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',16),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',16)
};
const CAT_ICON = {
  "Electrical": svg('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',13),
  "Plumbing": svg('<path d="M12 2.7S6 9.3 6 14a6 6 0 0 0 12 0c0-4.7-6-11.3-6-11.3z"/>',13),
  "Furniture": svg('<path d="M7 3v9h10V3M5 12h14v3H5zM7 15v6M17 15v6"/>',13),
  "Wi-Fi": svg('<path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0"/><path d="M12 20h.01"/>',13)
};

/* ---------- data ---------- */
let db;
function load(){
  const raw = store.get(KEY);
  if(raw){ try{ db = JSON.parse(raw); if(db && Array.isArray(db.tickets) && Array.isArray(db.notifications)) return; }catch(e){} }
  db = seed(); save();
}
function save(){ store.set(KEY, JSON.stringify(db)); }

function notifyEvent(t, e, actorId, read, target){
  const d = target || db;
  const staffName = t.assignedTo ? user(t.assignedTo).name : "";
  const admins = USERS.filter(u => u.role==="admin").map(u => u.id);
  const msgs = [];
  if(e.status==="Registered"){
    msgs.push([t.studentId, `Complaint ${t.id} registered. The warden will assign it to maintenance staff.`]);
    admins.forEach(a => msgs.push([a, `New ${t.category} complaint ${t.id} from Room ${t.room}.`]));
  } else if(e.status==="Assigned"){
    msgs.push([t.studentId, `${t.id} has been assigned to ${staffName}.`]);
    msgs.push([t.assignedTo, `New task: ${t.id}, ${t.category} issue in Room ${t.room}.`]);
    admins.forEach(a => msgs.push([a, `${t.id} assigned to ${staffName}.`]));
  } else if(e.status==="In Progress"){
    msgs.push([t.studentId, `Work has started on ${t.id}. ${staffName} is on it.`]);
    admins.forEach(a => msgs.push([a, `${staffName} started work on ${t.id}.`]));
    msgs.push([t.assignedTo, `${t.id} moved to In Progress.`]);
  } else if(e.status==="Resolved"){
    msgs.push([t.studentId, `${t.id} is resolved. Open the ticket to see what was fixed.`]);
    admins.forEach(a => msgs.push([a, `${t.id} resolved by ${user(e.by).name}.`]));
    msgs.push([t.assignedTo, `${t.id} marked as resolved.`]);
  }
  const seen = new Set();
  msgs.forEach(([to,text]) => {
    if(!to || to===actorId || seen.has(to)) return;
    seen.add(to);
    d.notifications.push({id:"n"+(++d.nseq), to, ticketId:t.id, status:e.status, text, at:e.at, read:!!read});
  });
  if(d.notifications.length > 400) d.notifications = d.notifications.slice(-400);
}

function seed(){
  const now = Date.now(), H = 36e5, D = 24*H;
  const spec = [
    ["s1","Electrical","Ceiling fan grinds loudly and stops completely on speed 3 and above.",12,"Resolved","m1","Replaced the fan capacitor and the faulty regulator. Tested at all speeds."],
    ["s2","Plumbing","Bathroom tap leaks all the time and water collects near the drain.",10.5,"Resolved","m2","Replaced the tap washer and spindle. No more leakage."],
    ["s3","Wi-Fi","Wi-Fi disconnects every 10 to 15 minutes on the third floor of C block.",9.2,"Resolved","m4","Reset and moved access point C3-AP2 to the corridor centre. Signal is stable now."],
    ["s4","Furniture","Study table drawer rail is broken, so the drawer won’t close.",8,"Resolved","m3","Fitted new drawer rails and tightened the table joints."],
    ["s5","Electrical","Tube light flickers and the switchboard sparks when it is turned on.",6,"In Progress","m1"],
    ["s1","Plumbing","Flush in the attached washroom has not worked since this morning.",5,"In Progress","m2"],
    ["s2","Furniture","Bed frame slat is cracked and the mattress sags in the middle.",4.3,"Assigned","m3"],
    ["s3","Electrical","Power socket next to the bed is dead; chargers don’t work there.",3.8,"Assigned","m1"],
    ["s4","Wi-Fi","Can’t log in to the hostel Wi-Fi portal. It shows an authentication error.",3,"In Progress","m4"],
    ["s5","Plumbing","Geyser water stays cold even after it has been on for 30 minutes.",2.1,"Registered"],
    ["s1","Wi-Fi","Internet is very slow in the A block common room every evening.",1.8,"Registered"],
    ["s2","Electrical","Washroom exhaust fan does not run at all.",1.2,"Registered"],
    ["s3","Furniture","Wardrobe door hinge is loose and the door hangs at an angle.",1,"Assigned","m3"],
    ["s4","Plumbing","Wash basin drain is blocked and water drains very slowly.",0.4,"Registered"],
    ["s5","Furniture","Chair backrest is missing two screws and the chair wobbles.",0.15,"Registered"]
  ];
  const d = {seq:1000, nseq:0, tickets:[], notifications:[]};
  spec.forEach((s,i) => {
    const [sid,cat,desc,days,status,staff,res] = s;
    const st = user(sid);
    const created = Math.round(now - days*D);
    const id = "HMT-" + (++d.seq);
    const gaps = [2+(i%4), 4+((i*7)%15), 6+((i*5)%24)];
    const target = STAGES.indexOf(status);
    const t = {id, room:st.room, category:cat, description:desc, studentId:sid, createdAt:created, status:"Registered", assignedTo:null, resolution:"", updatedAt:created, history:[]};
    const push = (stage, at, by, note) => {
      const e = {status:stage, at:Math.min(at, now - 5*60000), by, note};
      t.history.push(e); t.status = stage; t.updatedAt = e.at;
      notifyEvent(t, e, by, now - e.at > 30*H, d);
    };
    push("Registered", created, sid, "Complaint submitted by student.");
    let at = created;
    if(target >= 1){ at += gaps[0]*H; t.assignedTo = staff; push("Assigned", at, "a1", `Assigned to ${user(staff).name} by the warden.`); }
    if(target >= 2){ at += gaps[1]*H; push("In Progress", at, staff, "Work started on site."); }
    if(target >= 3){ at += gaps[2]*H; t.resolution = res; push("Resolved", at, staff, res); }
    d.tickets.push(t);
  });
  return d;
}

/* ---------- state ---------- */
const state = {
  user:null, view:"dashboard", prevView:null, ticketId:null,
  filter:{status:"All", category:"All", q:""},
  notifOpen:false, lastCreated:null, focusSel:null, pendingRefresh:false
};
const NAV = {
  student:[["dashboard","Dashboard"],["new","New complaint"],["list","My complaints"]],
  admin:[["dashboard","Dashboard"],["list","All tickets"]],
  staff:[["dashboard","Dashboard"],["list","My tasks"]]
};

const findTicket = id => db.tickets.find(t => t.id === id);
const sorted = list => [...list].sort((a,b) => b.createdAt - a.createdAt);
function scoped(){
  const u = state.user;
  if(u.role==="student") return db.tickets.filter(t => t.studentId === u.id);
  if(u.role==="staff") return db.tickets.filter(t => t.assignedTo === u.id);
  return db.tickets;
}
function counts(list){
  const c = {total:list.length}; STAGES.forEach(s => c[s] = list.filter(t => t.status===s).length); return c;
}
function canView(t){
  const u = state.user;
  return u.role==="admin" || (u.role==="student" && t.studentId===u.id) || (u.role==="staff" && t.assignedTo===u.id);
}
function canUpdate(t){
  const u = state.user;
  return u.role==="admin" || (u.role==="staff" && t.assignedTo===u.id);
}
const myNotifs = () => db.notifications.filter(n => n.to === state.user.id).sort((a,b) => b.at - a.at);
const unreadCount = () => state.user ? myNotifs().filter(n => !n.read).length : 0;
const openLoad = id => db.tickets.filter(t => t.assignedTo===id && t.status!=="Resolved").length;
function roleLabel(u){
  if(u.role==="student") return "Student, Room " + u.room;
  if(u.role==="admin") return u.title + " (admin)";
  return "Maintenance staff, " + u.skill;
}

/* ---------- workflow ---------- */
function createTicket({room, category, description}){
  load();
  let n = (db.seq || 1000) + 1;
  while(findTicket("HMT-"+n)) n++;
  db.seq = n;
  const now = Date.now();
  const t = {id:"HMT-"+n, room, category, description, studentId:state.user.id, createdAt:now, status:"Registered", assignedTo:null, resolution:"", updatedAt:now, history:[]};
  const e = {status:"Registered", at:now, by:state.user.id, note:"Complaint submitted by student."};
  t.history.push(e);
  db.tickets.push(t);
  notifyEvent(t, e, state.user.id, false);
  save();
  return t;
}

function transition(id, to, opts = {}){
  load();
  const t = findTicket(id), u = state.user;
  if(!t){ toast("That ticket no longer exists. It may have been removed by a data reset.","error"); return false; }
  const cur = STAGES.indexOf(t.status), nxt = STAGES.indexOf(to);
  if(nxt !== cur + 1){
    toast(cur === 3 ? `${t.id} is already resolved and closed.` : `${t.id} is “${t.status}”. It can only move to “${STAGES[cur+1]}” next.`, "error");
    render(); return false;
  }
  let note = (opts.note || "").trim();
  if(to === "Assigned"){
    if(u.role !== "admin"){ toast("Only the warden can assign complaints to staff.","error"); return false; }
    const staff = user(opts.staffId);
    if(!staff || staff.role !== "staff"){ toast("Choose a staff member to assign this ticket to.","error"); return false; }
    t.assignedTo = staff.id;
    note = `Assigned to ${staff.name} by the warden.` + (note ? " " + note : "");
  } else {
    if(!canUpdate(t)){ toast("Only the assigned staff member or the warden can update this ticket.","error"); return false; }
    if(to === "In Progress") note = note || "Work started on site.";
    if(to === "Resolved"){
      if(note.length < 5){ toast("Add a resolution note that says what was fixed.","error"); return false; }
      t.resolution = note;
    }
  }
  const e = {status:to, at:Date.now(), by:u.id, note};
  t.history.push(e); t.status = to; t.updatedAt = e.at;
  notifyEvent(t, e, u.id, false);
  save();
  const who = to === "Assigned" ? `${user(t.assignedTo).name} and the student have been notified.` : "The student has been notified.";
  toast(`${t.id} moved to ${to}. ${who}`, "success");
  render();
  return true;
}

/* ---------- toasts ---------- */
function toast(msg, type = "info"){
  const box = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `<span class="ti">${type==="success" ? svg('<path d="M20 6 9 17l-5-5"/>',18) : ICON.info}</span><span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), type === "error" ? 6000 : 4500);
}

/* ---------- small components ---------- */
const pill = (s, size = "") => `<span class="pill s-${slug(s)} ${size}">${esc(s)}</span>`;
const catChip = c => `<span class="cat">${CAT_ICON[c] || ""}${esc(c)}</span>`;
function miniProgress(t){
  const cur = STAGES.indexOf(t.status);
  return `<span class="mini s-${slug(t.status)}" aria-hidden="true">${STAGES.map((s,i) => `<span class="${i<=cur?"on":""}"></span>`).join("")}</span>`;
}
function empty(title, text, action = "", icon = ICON.inbox){
  return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
}
function statStrip(items){
  return `<div class="stats" style="--n:${items.length}" data-n="${items.length}">${items.map(it =>
    `<button class="stat s-${slug(it.status)}" data-action="stat" data-status="${esc(it.status)}" aria-label="${esc(it.label)}: ${it.value}. Show these tickets">
      <span class="stat-value">${it.value}</span><span class="stat-label">${esc(it.label)}</span></button>`).join("")}</div>`;
}
function ticketRow(t){
  const staff = t.assignedTo ? user(t.assignedTo) : null;
  const meta = state.user.role === "student"
    ? `Submitted ${ago(t.createdAt)}${staff ? `, handled by ${esc(staff.name)}` : ""}`
    : `${esc(user(t.studentId).name)}, submitted ${ago(t.createdAt)}${staff && state.user.role==="admin" ? `, assigned to ${esc(staff.name)}` : ""}`;
  return `<button class="trow" data-action="open" data-id="${t.id}">
    <span class="trow-main">
      <span class="trow-top"><span class="tid">${t.id}</span>${catChip(t.category)}<span class="muted small">Room ${esc(t.room)}</span></span>
      <span class="trow-desc">${esc(t.description)}</span>
      <span class="trow-meta">${meta}</span>
    </span>
    <span class="trow-side">${pill(t.status)}${miniProgress(t)}</span>
  </button>`;
}
function staffOptions(category){
  const staff = USERS.filter(u => u.role==="staff").sort((a,b) => (b.skill===category) - (a.skill===category));
  return staff.map(s => `<option value="${s.id}" ${s.skill===category?"selected":""}>${esc(s.name)} (${esc(s.skill)}, ${openLoad(s.id)} open)</option>`).join("");
}
function assignControl(t){
  return `<div class="assign"><label class="sr-only" for="as-${t.id}">Assign ${t.id} to</label>
    <select id="as-${t.id}">${staffOptions(t.category)}</select>
    <button class="btn btn-primary btn-sm" data-action="assign" data-id="${t.id}">Assign</button></div>`;
}
function adminTable(list){
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>Ticket</th><th>Room</th><th>Category</th><th>Issue</th><th>Submitted</th><th>Status</th><th>Assigned to</th></tr></thead>
    <tbody>${list.map(t => `<tr>
      <td data-label="Ticket"><button class="tid-link" data-action="open" data-id="${t.id}">${t.id}</button></td>
      <td class="nowrap" data-label="Room">${esc(t.room)}</td>
      <td data-label="Category">${catChip(t.category)}</td>
      <td class="issue" data-label="Issue" title="${esc(t.description)}">${esc(t.description)}</td>
      <td class="nowrap muted" data-label="Submitted">${fmtShort(t.createdAt)}</td>
      <td data-label="Status">${pill(t.status)}</td>
      <td data-label="Assigned to">${t.status==="Registered" ? assignControl(t) : `<span class="nowrap">${esc(user(t.assignedTo).name)}</span>`}</td>
    </tr>`).join("")}</tbody></table></div>`;
}
function taskCard(t){
  const action = t.status==="Assigned"
    ? `<button class="btn btn-primary btn-sm" data-action="start" data-id="${t.id}">Start work</button>`
    : t.status==="In Progress" ? `<button class="btn btn-success btn-sm" data-action="open" data-id="${t.id}">Add resolution</button>` : "";
  const since = t.history[t.history.length-1].at;
  return `<div class="task">
    <div class="trow-main">
      <span class="trow-top"><button class="tid-link" data-action="open" data-id="${t.id}">${t.id}</button>${catChip(t.category)}<span class="muted small">Room ${esc(t.room)}</span></span>
      <span class="trow-desc">${esc(t.description)}</span>
      <span class="trow-meta">${t.status==="Assigned" ? "Assigned" : "Started"} ${ago(since)}, reported by ${esc(user(t.studentId).name)}</span>
    </div>
    <div class="task-actions">${pill(t.status)}${action}</div>
  </div>`;
}
function stepper(t){
  const cur = STAGES.indexOf(t.status);
  return `<ol class="stepper" aria-label="Ticket progress">${STAGES.map((s,i) => {
    const h = t.history.find(e => e.status === s);
    let cls, label;
    if(i < cur){ cls = "done"; label = "Completed"; }
    else if(i === cur){ cls = "current" + (s==="Resolved" ? " final" : ""); label = s==="Resolved" ? "Closed" : "Current stage"; }
    else { cls = "pending"; label = "Pending"; }
    const node = (i < cur || (i===cur && s==="Resolved")) ? svg('<path d="M20 6 9 17l-5-5"/>',20) : (i+1);
    return `<li class="step ${cls} ${i<=cur?"reached":""}" ${i===cur?'aria-current="step"':""}>
      <span class="step-node">${node}</span>
      <span class="step-title">${s}</span>
      <span class="step-state">${label}</span>
      <span class="step-time">${h ? fmtShort(h.at) : "Not yet"}</span>
    </li>`;
  }).join("")}</ol>`;
}

/* ---------- filters ---------- */
function applyFilter(list){
  const f = state.filter, q = f.q.trim().toLowerCase();
  return list.filter(t =>
    (f.status==="All" || t.status===f.status) &&
    (f.category==="All" || t.category===f.category) &&
    (!q || [t.id, t.room, t.description, t.category, user(t.studentId).name, t.assignedTo ? user(t.assignedTo).name : ""].join(" ").toLowerCase().includes(q))
  );
}
function results(){
  const base = scoped();
  const role = state.user.role;
  if(!base.length){
    if(role==="student") return `<div class="panel">${empty("No complaints yet","When something in your room needs fixing, report it here and follow it until it’s resolved.",`<button class="btn btn-primary" data-action="nav" data-view="new">${ICON.plus}Report an issue</button>`)}</div>`;
    if(role==="staff") return `<div class="panel">${empty("No tasks assigned to you","When the warden assigns you a complaint, it will appear here.")}</div>`;
    return `<div class="panel">${empty("No tickets yet","Complaints submitted by students will appear here.")}</div>`;
  }
  const list = applyFilter(sorted(base));
  if(!list.length) return `<div class="panel">${empty("No tickets match these filters","Try another status or category, or clear the search.",`<button class="btn btn-ghost" data-action="clear-filters">Clear filters</button>`)}</div>`;
  if(role==="admin") return adminTable(list);
  return `<div class="panel list-panel">${list.map(ticketRow).join("")}</div>`;
}
function updateResults(){ const r = $("#results"); if(r) r.innerHTML = results(); }

/* ---------- views ---------- */
function loginView(){
  const groups = [["student","Students"],["admin","Warden (admin)"],["staff","Maintenance staff"]];
  const extra = u => u.role==="student" ? `Room ${esc(u.room)}${u.fresh ? ", no complaints yet" : ""}` : u.role==="admin" ? esc(u.title) : esc(u.skill);
  return `<div class="login">
    <div class="creds-wrap">
      <button type="button" class="creds-btn" id="credsBtn" data-action="toggle-creds" aria-expanded="false" aria-controls="credsPanel">${ICON.key}Demo accounts</button>
      <div class="creds-panel" id="credsPanel" role="region" aria-label="Demo account details" hidden>
        <div class="creds-head"><strong>Demo accounts</strong><p>Type a username and password into the login form.</p></div>
        <div class="creds-body">${groups.map(([r,l]) => `<h3>${l}</h3>
          <table class="creds-tbl"><thead><tr><th>Name</th><th>Username</th><th>Password</th></tr></thead><tbody>
          ${USERS.filter(u => u.role===r).map(u => `<tr><td>${esc(u.name)}<span>${extra(u)}</span></td><td><code>${esc(u.username)}</code></td><td><code>${esc(u.password)}</code></td></tr>`).join("")}
          </tbody></table>`).join("")}</div>
      </div>
    </div>
    <div class="login-card">
      <div class="brand"><span class="brand-mark">${ICON.wrench}</span><span>Hostel Maintenance Management System</span></div>
      <h1>Log in</h1>
      <p class="sub">Report room repairs, assign them to maintenance staff, and follow each one until it’s fixed.</p>
      <form id="loginForm" class="login-form" novalidate>
        <div class="field" id="fld-user">
          <label for="username">Username</label>
          <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false">
        </div>
        <div class="field" id="fld-pass">
          <label for="password">Password</label>
          <div class="pw">
            <input id="password" name="password" type="password" autocomplete="current-password">
            <button type="button" class="pw-toggle" data-action="toggle-pw" aria-label="Show password" aria-pressed="false">Show</button>
          </div>
        </div>
        <p class="err login-err" id="loginErr" role="alert"></p>
        <button type="submit" class="btn btn-primary btn-block">Log in</button>
      </form>
      <p class="hint">Need login details? Open Demo accounts at the top right. To watch updates travel between roles, open this file in a second tab and log in as someone else.</p>
    </div>
    <aside class="login-side">
      <h2>How a complaint moves</h2>
      <ol class="pipe">${STAGES.map((s,i) => `<li class="s-${slug(s)}"><span class="pipe-n">${i+1}</span><div><strong>${s}</strong><p>${STAGE_INFO[s]}</p></div></li>`).join("")}</ol>
    </aside>
  </div>`;
}

function shell(content){
  const u = state.user;
  const active = v => state.view===v || (state.view==="ticket" && state.prevView===v);
  return `<header class="topbar"><div class="topbar-inner">
      <button class="brand" data-action="nav" data-view="dashboard"><span class="brand-mark">${ICON.wrench}</span><span>Hostel Maintenance Management System</span></button>
      <nav class="mainnav" aria-label="Main">${NAV[u.role].map(([v,l]) => `<button class="navlink ${active(v)?"active":""}" data-action="nav" data-view="${v}" ${active(v)?'aria-current="page"':""}>${l}</button>`).join("")}</nav>
      <div class="topbar-right">
        <div class="notif-wrap">
          <button class="icon-btn" id="bell" data-action="toggle-notifs" aria-expanded="${state.notifOpen}">${bellInner()}</button>
          ${state.notifOpen ? notifPanel() : ""}
        </div>
        <div class="who"><span class="who-name">${esc(u.name)}</span><span class="who-role">${esc(roleLabel(u))}</span></div>
        <button class="btn btn-ghost btn-sm" data-action="logout">Switch user</button>
      </div>
    </div></header>
    <main class="main">${content}</main>
    <footer class="foot"><span>${db.tickets.length} tickets saved in this browser. Changes sync across open tabs.</span><button class="linklike" data-action="reset">Reset demo data</button></footer>`;
}
function bellInner(){
  const n = unreadCount();
  return `${ICON.bell}<span class="sr-only">Notifications, ${n} unread</span>${n ? `<span class="badge" aria-hidden="true">${n>9?"9+":n}</span>` : ""}`;
}
function notifPanel(){
  const list = myNotifs().slice(0,30);
  return `<div class="notif-panel" role="region" aria-label="Notifications">
    <div class="np-head"><strong>Notifications</strong>${list.some(n=>!n.read) ? `<button class="linklike small" data-action="read-all">Mark all as read</button>` : ""}</div>
    ${list.length ? `<ul class="np-list">${list.map(n => `<li><button class="np-item ${n.read?"":"unread"}" data-action="notif" data-nid="${n.id}" data-id="${n.ticketId}">
        <span class="np-dot s-${slug(n.status)}"></span><span><span class="np-text">${esc(n.text)}</span><span class="np-time">${ago(n.at)}</span></span></button></li>`).join("")}</ul>`
      : `<p class="np-empty">You’re all caught up. Updates about your tickets will appear here.</p>`}
  </div>`;
}

function mainView(){
  const r = state.user.role;
  if(state.view==="ticket") return ticketView();
  if(state.view==="new" && r==="student") return newView();
  if(state.view==="list") return listView();
  return r==="student" ? studentDash() : r==="admin" ? adminDash() : staffDash();
}

function studentDash(){
  const u = state.user, mine = sorted(scoped()), c = counts(mine);
  return `<div class="page-head">
      <div><h1>Hello, ${esc(first(u.name))}</h1><p class="sub">Room ${esc(u.room)}. Track every issue you’ve reported, from registration to repair.</p></div>
      <button class="btn btn-primary" data-action="nav" data-view="new">${ICON.plus}Report an issue</button>
    </div>
    ${statStrip([
      {label:"Total complaints",value:c.total,status:"All"},
      {label:"Registered",value:c["Registered"],status:"Registered"},
      {label:"Assigned",value:c["Assigned"],status:"Assigned"},
      {label:"In progress",value:c["In Progress"],status:"In Progress"},
      {label:"Resolved",value:c["Resolved"],status:"Resolved"}])}
    <section class="panel">
      <div class="panel-head"><h2>Recent complaints</h2>${mine.length > 5 ? `<button class="btn btn-ghost btn-sm" data-action="nav" data-view="list">See all ${mine.length}</button>` : ""}</div>
      ${mine.length ? `<div class="rows">${mine.slice(0,5).map(ticketRow).join("")}</div>`
        : empty("No complaints yet","When something in your room needs fixing, report it here and follow it until it’s resolved.",`<button class="btn btn-primary" data-action="nav" data-view="new">${ICON.plus}Report an issue</button>`)}
    </section>`;
}

function adminDash(){
  const all = sorted(db.tickets), c = counts(all);
  const maxCat = Math.max(1, ...CATEGORIES.map(cat => all.filter(t => t.category===cat).length));
  const dist = CATEGORIES.map(cat => {
    const ts = all.filter(t => t.category===cat), n = ts.length, open = ts.filter(t => t.status!=="Resolved").length;
    const pct = all.length ? Math.round(n/all.length*100) : 0;
    return `<div>
      <div class="dist-label"><strong>${CAT_ICON[cat]}${cat}</strong><span class="muted small">${n} ${n===1?"ticket":"tickets"}, ${open} open, ${pct}%</span></div>
      <div class="dist-track"><div class="dist-bar" style="width:${n/maxCat*100}%">${STAGES.map(s => {
        const k = ts.filter(t => t.status===s).length;
        return k ? `<div class="dist-seg s-${slug(s)}" style="width:${k/n*100}%" title="${s}: ${k}"></div>` : "";
      }).join("")}</div></div></div>`;
  }).join("");
  const events = db.tickets.flatMap(t => t.history.map(e => ({t,e}))).sort((a,b) => b.e.at - a.e.at).slice(0,8);
  const actText = ({t,e}) => {
    if(e.status==="Registered") return `registered by ${esc(user(t.studentId).name)}, ${esc(t.category)} in Room ${esc(t.room)}`;
    if(e.status==="Assigned") return `assigned to ${esc(user(t.assignedTo).name)}`;
    if(e.status==="In Progress") return `work started by ${esc(user(e.by).name)}`;
    return `resolved by ${esc(user(e.by).name)}`;
  };
  const waiting = all.filter(t => t.status==="Registered");
  return `<div class="page-head">
      <div><h1>Maintenance overview</h1><p class="sub">Every complaint in the hostel, updated as students report issues and staff report progress.</p></div>
      <button class="btn btn-ghost" data-action="nav" data-view="list">View all tickets</button>
    </div>
    ${statStrip([
      {label:"Total tickets",value:c.total,status:"All"},
      {label:"Awaiting assignment",value:c["Registered"],status:"Registered"},
      {label:"Assigned to staff",value:c["Assigned"],status:"Assigned"},
      {label:"In progress",value:c["In Progress"],status:"In Progress"},
      {label:"Resolved",value:c["Resolved"],status:"Resolved"}])}
    <section class="panel">
      <div class="panel-head"><h2>Awaiting assignment (${waiting.length})</h2></div>
      ${waiting.length ? adminTable(waiting) : empty("Every ticket has been assigned","New complaints from students will show up here for you to assign.", "", ICON.check)}
    </section>
    <div class="dash-grid">
      <section class="panel"><div class="panel-head"><h2>Complaints by category</h2></div>
        <div class="dist">${dist}</div>
        <div class="legend">${STAGES.map(s => `<span class="s-${slug(s)}">${s}</span>`).join("")}</div>
      </section>
      <section class="panel"><div class="panel-head"><h2>Recent activity</h2></div>
        ${events.length ? `<ul class="activity">${events.map(ev => `<li><span class="act-dot s-${slug(ev.e.status)}"></span><div>
          <button class="tid-link" data-action="open" data-id="${ev.t.id}">${ev.t.id}</button> ${actText(ev)}
          <div class="muted small">${ago(ev.e.at)}</div></div></li>`).join("")}</ul>` : empty("No activity yet","Ticket updates will appear here.")}
      </section>
    </div>`;
}

function staffDash(){
  const u = state.user, mine = sorted(scoped()), c = counts(mine);
  const fresh = mine.filter(t => t.status==="Assigned");
  const active = mine.filter(t => t.status==="In Progress");
  return `<div class="page-head">
      <div><h1>Hello, ${esc(first(u.name))}</h1><p class="sub">Your ${esc(u.skill.toLowerCase())} tasks. Start work when you reach the room, then mark the ticket resolved once it’s fixed.</p></div>
    </div>
    ${statStrip([
      {label:"Total assigned",value:c.total,status:"All"},
      {label:"New assignments",value:c["Assigned"],status:"Assigned"},
      {label:"Active tasks",value:c["In Progress"],status:"In Progress"},
      {label:"Resolved",value:c["Resolved"],status:"Resolved"}])}
    <div class="dash-grid">
      <section class="panel"><div class="panel-head"><h2>New assignments</h2></div>
        ${fresh.length ? `<div class="rows">${fresh.map(taskCard).join("")}</div>` : empty("No new assignments","Tickets the warden assigns to you will appear here.")}
      </section>
      <section class="panel"><div class="panel-head"><h2>In progress</h2></div>
        ${active.length ? `<div class="rows">${active.map(taskCard).join("")}</div>` : empty("Nothing in progress","Start work on a new assignment and it will move here.")}
      </section>
    </div>`;
}

function listView(){
  const r = state.user.role, base = scoped();
  const title = r==="admin" ? "All tickets" : r==="staff" ? "My tasks" : "My complaints";
  const sub = r==="admin" ? "Assign new complaints and open any ticket to update its status."
    : r==="staff" ? "Every ticket assigned to you, newest first."
    : "Every issue you’ve reported, newest first. Open one to see its full timeline.";
  const f = state.filter;
  const chips = ["All", ...STAGES].map(s => {
    const n = s==="All" ? base.length : base.filter(t => t.status===s).length;
    return `<button class="chip" data-action="filter-status" data-status="${s}" aria-pressed="${f.status===s}">${s}<span class="n">${n}</span></button>`;
  }).join("");
  return `<div class="page-head"><div><h1>${title}</h1><p class="sub">${sub}</p></div>
      ${r==="student" ? `<button class="btn btn-primary" data-action="nav" data-view="new">${ICON.plus}Report an issue</button>` : ""}</div>
    <div class="toolbar">
      <div class="chips" role="group" aria-label="Filter by status">${chips}</div>
      <label class="sr-only" for="catFilter">Category</label>
      <select id="catFilter"><option value="All">All categories</option>${CATEGORIES.map(c => `<option ${f.category===c?"selected":""}>${c}</option>`).join("")}</select>
      <label class="sr-only" for="q">Search tickets</label>
      <input type="search" id="q" placeholder="Search by ticket ID, room or issue" value="${esc(f.q)}">
    </div>
    <div id="results">${results()}</div>`;
}

function newView(){
  const u = state.user;
  if(state.lastCreated){
    const t = findTicket(state.lastCreated);
    if(t) return `<section class="panel success" role="status">
      <div class="success-mark">${ICON.check}</div>
      <h1>Complaint registered</h1>
      <p class="lead">Your ticket ID is <strong class="tid">${t.id}</strong>, submitted on ${fmt(t.createdAt)}. The warden will assign it to a maintenance staff member, and you’ll get a notification at every step.</p>
      ${stepper(t)}
      <div class="form-actions">
        <button class="btn btn-primary" data-action="open" data-id="${t.id}">View ticket</button>
        <button class="btn btn-ghost" data-action="new-another">Report another issue</button>
      </div></section>`;
  }
  return `<div class="page-head"><div><h1>Report a maintenance issue</h1><p class="sub">All three fields are required. You’ll get a ticket ID to track the repair.</p></div></div>
    <form id="complaintForm" class="panel form" novalidate>
      <div class="field" id="fld-room">
        <label for="f-room">Room number</label>
        <input id="f-room" name="room" value="${esc(u.room)}" autocomplete="off" placeholder="For example, A-204" aria-describedby="e-room">
        <p class="err" id="e-room"></p>
      </div>
      <div class="field" id="fld-cat">
        <label for="f-cat">Category</label>
        <select id="f-cat" name="category" aria-describedby="e-cat"><option value="">Choose a category</option>${CATEGORIES.map(c => `<option>${c}</option>`).join("")}</select>
        <p class="err" id="e-cat"></p>
      </div>
      <div class="field" id="fld-desc">
        <label for="f-desc">Issue description</label>
        <textarea id="f-desc" name="description" rows="5" maxlength="500" placeholder="What’s wrong, where exactly, and since when?" aria-describedby="e-desc"></textarea>
        <div class="field-foot"><p class="err" id="e-desc"></p><span class="count" id="descCount">0 / 500</span></div>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Submit complaint</button>
        <button type="button" class="btn btn-ghost" data-action="nav" data-view="dashboard">Cancel</button>
      </div>
    </form>`;
}

function ticketView(){
  const t = findTicket(state.ticketId);
  const backBtn = `<button class="back" data-action="back">${ICON.back}Back</button>`;
  if(!t || !canView(t)) return backBtn + `<div class="panel">${empty("Ticket not found","It may have been removed by a data reset, or it isn’t assigned to you.")}</div>`;
  const student = user(t.studentId), staff = t.assignedTo ? user(t.assignedTo) : null;
  const resolvedEntry = t.history.find(e => e.status==="Resolved");
  return `${backBtn}
    <section class="panel">
      <div class="th-top">
        <div><p class="muted">${esc(t.category)} complaint, Room ${esc(t.room)}</p><h1 class="tid-xl">${t.id}</h1></div>
        <div class="th-status"><span class="muted small">Current status</span>${pill(t.status,"lg")}</div>
      </div>
      ${stepper(t)}
    </section>
    <div class="detail-grid">
      <div>
        ${resolvedEntry ? `<section class="panel resolution"><h2>Resolution</h2><p>${esc(t.resolution)}</p>
          <p class="muted small">Resolved by ${esc(user(resolvedEntry.by).name)} on ${fmt(resolvedEntry.at)}, ${dur(resolvedEntry.at - t.createdAt)} after it was reported.</p></section>` : ""}
        <section class="panel">
          <h2>Issue</h2>
          <p class="desc">${esc(t.description)}</p>
          <dl class="facts">
            <div><dt>Room</dt><dd>${esc(t.room)}</dd></div>
            <div><dt>Category</dt><dd>${esc(t.category)}</dd></div>
            <div><dt>Reported by</dt><dd>${esc(student.name)}</dd></div>
            <div><dt>Submitted</dt><dd>${fmt(t.createdAt)}</dd></div>
            <div><dt>Assigned to</dt><dd>${staff ? `${esc(staff.name)} (${esc(staff.skill)})` : "Not assigned yet"}</dd></div>
            <div><dt>Last updated</dt><dd>${fmt(t.updatedAt)}</dd></div>
          </dl>
        </section>
        <section class="panel">
          <h2>Status history</h2>
          <ol class="timeline">${t.history.map(e => `<li class="s-${slug(e.status)}"><span class="tl-dot"></span>
            <div class="tl-head">${pill(e.status)}<span class="small muted">${fmt(e.at)}</span></div>
            <p class="tl-note">${esc(e.note)} <span class="small">(${esc(user(e.by).name)})</span></p></li>`).join("")}</ol>
        </section>
      </div>
      <aside>${actionPanel(t)}</aside>
    </div>`;
}

function actionPanel(t){
  const r = state.user.role, cur = STAGES.indexOf(t.status), next = STAGES[cur+1];
  const nextLine = next ? `<p class="nextstep">${ICON.lock}Next allowed step: ${next}. Stages can’t be skipped.</p>` : "";
  if(t.status==="Resolved"){
    return `<section class="panel action-panel"><h2>Ticket closed</h2><p class="sub">This issue has been fixed. No further status changes are possible.</p></section>`;
  }
  if(r==="admin" && t.status==="Registered"){
    return `<section class="panel action-panel"><h2>Assign to staff</h2>
      <p class="sub">Staff whose skill matches the category are listed first. The ticket moves to Assigned and both the staff member and the student are notified.</p>
      <div class="field"><label for="as-${t.id}">Staff member</label><select id="as-${t.id}">${staffOptions(t.category)}</select></div>
      <button class="btn btn-primary btn-block" data-action="assign" data-id="${t.id}">Assign ticket</button>${nextLine}</section>`;
  }
  if(canUpdate(t) && t.status==="Assigned"){
    return `<section class="panel action-panel"><h2>Start work</h2>
      <p class="sub">Use this when you begin the repair. The student will see the ticket move to In Progress.</p>
      <div class="field"><label for="note-start">Note for the student (optional)</label><textarea id="note-start" rows="3" placeholder="For example, visiting at 4 pm with a replacement part"></textarea></div>
      <button class="btn btn-primary btn-block" data-action="start" data-id="${t.id}">Start work</button>${nextLine}</section>`;
  }
  if(canUpdate(t) && t.status==="In Progress"){
    return `<section class="panel action-panel"><h2>Mark as resolved</h2>
      <p class="sub">Describe what was fixed. This note is shown to the student and closes the ticket.</p>
      <div class="field" id="fld-resolve"><label for="note-resolve">Resolution details</label><textarea id="note-resolve" rows="4" placeholder="For example, replaced the tap washer and tested for leaks"></textarea></div>
      <button class="btn btn-success btn-block" data-action="resolve" data-id="${t.id}">Mark resolved</button>${nextLine}</section>`;
  }
  const waitText = {
    "Registered":"The warden will assign this complaint to a maintenance staff member.",
    "Assigned": `${t.assignedTo ? esc(user(t.assignedTo).name) : "The assigned staff member"} will start work and update the status.`,
    "In Progress":"Once the repair is finished, the ticket will be marked resolved with details of the fix."
  }[t.status];
  return `<section class="panel action-panel"><h2>What happens next</h2><p class="sub">${waitText}</p>
    <p class="small muted">You’ll get a notification as soon as the status changes.</p></section>`;
}

/* ---------- render ---------- */
function render(){
  const app = $("#app");
  if(!state.user){ app.innerHTML = loginView(); document.title = "Log in | Hostel Maintenance Management System"; return; }
  app.innerHTML = shell(mainView());
  document.title = (state.view==="ticket" && state.ticketId ? state.ticketId + " | " : "") + "Hostel Maintenance Management System";
  if(state.focusSel){ const el = $(state.focusSel); if(el) el.focus(); state.focusSel = null; }
  state.pendingRefresh = false;
}
function go(view, extra = {}){
  state.view = view; state.ticketId = null; state.notifOpen = false;
  state.filter = {status:"All", category:"All", q:"", ...(extra.filter || {})};
  if(view === "new") state.lastCreated = null;
  render(); window.scrollTo(0,0);
}
function openTicket(id){
  if(state.view !== "ticket") state.prevView = state.view;
  state.view = "ticket"; state.ticketId = id; state.notifOpen = false;
  render(); window.scrollTo(0,0);
}

/* ---------- events ---------- */
function closeCreds(){
  const p = $("#credsPanel"); if(p) p.hidden = true;
  $("#credsBtn")?.setAttribute("aria-expanded","false");
}
document.addEventListener("click", e => {
  const a = e.target.closest("[data-action]");
  if(state.notifOpen && !e.target.closest(".notif-wrap")){
    state.notifOpen = false;
    if(!a){ render(); return; }
  }
  const cp = $("#credsPanel");
  if(cp && !cp.hidden && !e.target.closest(".creds-wrap")) closeCreds();
  if(!a) return;
  const act = a.dataset.action, id = a.dataset.id;
  switch(act){
    case "toggle-creds": { const p = $("#credsPanel"); if(p.hidden){ p.hidden = false; a.setAttribute("aria-expanded","true"); } else closeCreds(); break; }
    case "toggle-pw": {
      const i = $("#password"), show = i.type === "password";
      i.type = show ? "text" : "password";
      a.textContent = show ? "Hide" : "Show";
      a.setAttribute("aria-pressed", String(show));
      a.setAttribute("aria-label", show ? "Hide password" : "Show password");
      break;
    }
    case "logout": session.clear(); state.user = null; state.notifOpen = false; render(); break;
    case "nav": e.preventDefault(); go(a.dataset.view); break;
    case "stat": go("list", {filter:{status:a.dataset.status}}); break;
    case "open": openTicket(id); break;
    case "back": go(state.prevView || "dashboard"); break;
    case "filter-status": state.filter.status = a.dataset.status; render(); break;
    case "clear-filters": state.filter = {status:"All",category:"All",q:""}; render(); break;
    case "assign": { const sel = document.getElementById("as-"+id); transition(id, "Assigned", {staffId: sel && sel.value}); break; }
    case "start": transition(id, "In Progress", {note: $("#note-start")?.value || ""}); break;
    case "resolve": {
      const ok = transition(id, "Resolved", {note: $("#note-resolve")?.value || ""});
      if(!ok){ $("#fld-resolve")?.classList.add("invalid"); $("#note-resolve")?.focus(); }
      break;
    }
    case "toggle-notifs": state.notifOpen = !state.notifOpen; state.focusSel = "#bell"; render(); break;
    case "read-all": load(); db.notifications.forEach(n => { if(n.to===state.user.id) n.read = true; }); save(); state.notifOpen = true; render(); break;
    case "notif": {
      load(); const n = db.notifications.find(x => x.id === a.dataset.nid); if(n){ n.read = true; save(); }
      if(findTicket(id) && canView(findTicket(id))) openTicket(id); else { state.notifOpen = false; render(); toast("That ticket is no longer available.","error"); }
      break;
    }
    case "new-another": state.lastCreated = null; render(); $("#f-room")?.focus(); break;
    case "reset": $("#resetDialog").showModal(); break;
    case "reset-cancel": $("#resetDialog").close(); break;
    case "reset-confirm":
      db = seed(); save(); $("#resetDialog").close();
      state.lastCreated = null;
      if(state.user) go("dashboard");
      toast("Demo data restored: 15 sample tickets.","success");
      break;
  }
});

document.addEventListener("submit", e => {
  if(e.target.id === "loginForm"){
    e.preventDefault();
    const f = {username: $("#username"), password: $("#password")}, un = f.username.value.trim().toLowerCase(), pw = f.password.value;
    const err = $("#loginErr"), fu = $("#fld-user"), fp = $("#fld-pass");
    fu.classList.remove("invalid"); fp.classList.remove("invalid");
    if(!un || !pw){
      err.textContent = !un && !pw ? "Enter your username and password." : !un ? "Enter your username." : "Enter your password.";
      (!un ? fu : fp).classList.add("invalid");
      (!un ? f.username : f.password).focus();
      return;
    }
    const u = USERS.find(x => x.username === un && x.password === pw);
    if(!u){
      err.textContent = "Incorrect username or password. Check Demo accounts at the top right.";
      fu.classList.add("invalid"); fp.classList.add("invalid");
      f.password.value = ""; f.password.focus();
      return;
    }
    state.user = u; session.set(u.id); state.prevView = null;
    go("dashboard");
    const n = unreadCount();
    if(n) toast(`Welcome back, ${first(u.name)}. You have ${n} unread ${n===1?"notification":"notifications"}.`);
  }
  if(e.target.id === "complaintForm"){
    e.preventDefault();
    const f = {room: $("#f-room"), category: $("#f-cat"), description: $("#f-desc")};
    const room = f.room.value.trim().toUpperCase(), category = f.category.value, description = f.description.value.trim();
    const errs = {};
    if(!room) errs.room = "Enter your room number.";
    else if(!/^[A-Z]{1,2}-?\d{2,4}$/.test(room)) errs.room = "Use a room number like A-204.";
    if(!CATEGORIES.includes(category)) errs.cat = "Choose the category that best fits the issue.";
    if(!description) errs.desc = "Describe the issue so staff know what to fix.";
    else if(description.length < 15) errs.desc = `Add a little more detail: at least 15 characters (you have ${description.length}).`;
    [["room","fld-room","e-room"],["cat","fld-cat","e-cat"],["desc","fld-desc","e-desc"]].forEach(([k,fld,err]) => {
      document.getElementById(fld).classList.toggle("invalid", !!errs[k]);
      document.getElementById(err).textContent = errs[k] || "";
    });
    const firstErr = ["room","cat","desc"].find(k => errs[k]);
    if(firstErr){ ({room:f.room, cat:f.category, desc:f.description})[firstErr].focus(); return; }
    const t = createTicket({room: room.includes("-") ? room : room.replace(/^([A-Z]+)/,"$1-"), category, description});
    state.lastCreated = t.id;
    render(); window.scrollTo(0,0);
    toast(`Complaint registered. Your ticket ID is ${t.id}.`, "success");
  }
});

document.addEventListener("input", e => {
  if(e.target.closest("#loginForm")){ const le = $("#loginErr"); if(le) le.textContent = ""; }
  if(e.target.id === "f-desc"){ $("#descCount").textContent = `${e.target.value.length} / 500`; }
  if(e.target.id === "q"){ state.filter.q = e.target.value; updateResults(); }
  const fld = e.target.closest(".field.invalid"); if(fld) fld.classList.remove("invalid");
});
document.addEventListener("change", e => {
  if(e.target.id === "catFilter"){ state.filter.category = e.target.value; updateResults(); }
});
document.addEventListener("keydown", e => {
  const cp = $("#credsPanel");
  if(e.key === "Escape" && cp && !cp.hidden){ closeCreds(); $("#credsBtn")?.focus(); return; }
  if(e.key === "Escape" && state.notifOpen){ state.notifOpen = false; state.focusSel = "#bell"; render(); }
});

/* live sync between tabs */
const isEditing = () => { const ae = document.activeElement; return ae && ["INPUT","TEXTAREA","SELECT"].includes(ae.tagName); };
window.addEventListener("storage", e => {
  if(e.key !== KEY) return;
  const before = unreadCount();
  load();
  if(!state.user){ return; }
  const after = unreadCount();
  if(after > before){ const latest = myNotifs().find(n => !n.read); if(latest) toast(latest.text); }
  if(isEditing()){
    const b = $("#bell"); if(b) b.innerHTML = bellInner();
    if(state.view === "list") updateResults();
    state.pendingRefresh = true;
  } else render();
});
document.addEventListener("focusout", () => {
  setTimeout(() => { if(state.pendingRefresh && !isEditing()) render(); }, 0);
});

/* ---------- boot ---------- */
load();
const sid = session.get();
if(sid && user(sid)) state.user = user(sid);
render();
})();
