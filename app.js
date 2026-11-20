import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// 로그인: 이름 + 전화번호 끝 4자리 (간이 본인 확인용)
const MEMBERS = [
  { id: 'm1', name: '김경록', pin: '5552' },
  { id: 'm2', name: '서연우', pin: '3422' },
  { id: 'm3', name: '이광민', pin: '6653' },
  { id: 'm4', name: '최수연', pin: '8298' },
  { id: 'm5', name: '한강민', pin: '7536' },
  { id: 'm6', name: '함명자', pin: '6603' }
];
const COL = 'team1_nov2026';
const YEAR = 2026, START = [11, 21], DAYS = 6, H0 = 9, H1 = 23, LAST_END = 14; // 11/21(토)~11/26(목) 14:00 마감, 09~23시
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const dates = [...Array(DAYS)].map((_, i) => { const d = new Date(YEAR, START[0] - 1, START[1] + i); return { k: `d${i}`, label: `${d.getMonth() + 1}/${d.getDate()}`, wd: WD[d.getDay()], end: i === DAYS - 1 ? LAST_END : H1 }; });
const hours = [...Array(H1 - H0)].map((_, i) => H0 + i);
const open = (d, h) => h < d.end; // 마감 이후 칸은 선택 불가
const OFF = '<td class="off" aria-hidden="true"></td>';
const $ = s => document.querySelector(s);

let me = null, pen = 'g', mine = {}, all = {}, db = null, saveTimer = null, painting = false, dirty = false, view = 'edit', unsub = null;

$('#selName').innerHTML += MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
try { const last = localStorage.getItem('t1-me'); if (last) $('#selName').value = last; } catch (e) {}

const setStatus = t => { $('#status').textContent = t; };
const loginErr = t => { $('#loginErr').textContent = t; };
const key = (d, h) => `${d}h${h}`;

function header() { return `<thead><tr><th class="t">시간</th>${dates.map(d => `<th>${d.label}<small>(${d.wd})</small></th>`).join('')}</tr></thead>`; }
function renderEdit() {
  $('#gridEdit').innerHTML = header() + '<tbody>' + hours.map(h => `<tr><th class="t">${h}:00</th>${dates.map(d => { if (!open(d, h)) return OFF; const k = key(d.k, h); return `<td class="c ${mine[k] || ''}" data-k="${k}" tabindex="0" aria-label="${d.label} ${h}시"></td>`; }).join('')}</tr>`).join('') + '</tbody>';
}
function counts(k) { const g = [], y = []; for (const m of MEMBERS) { const v = (all[m.id] || {})[k]; if (v === 'g') g.push(m.name); else if (v === 'y') y.push(m.name); } return { g, y }; }
function renderSum() {
  const n = MEMBERS.length;
  $('#gridSum').innerHTML = header() + '<tbody>' + hours.map(h => `<tr><th class="t">${h}:00</th>${dates.map(d => {
    if (!open(d, h)) return OFF;
    const k = key(d.k, h), c = counts(k), t = c.g.length + c.y.length;
    const col = c.y.length && !c.g.length ? '242,194,48' : '63,174,90';
    return `<td class="c ${t === n ? 'full' : ''}" data-k="${k}" tabindex="0" style="background:${t ? `rgba(${col},${(.15 + .75 * t / n).toFixed(2)})` : 'transparent'}">${t || ''}</td>`;
  }).join('')}</tr>`).join('') + '</tbody>';
  $('#memberState').innerHTML = MEMBERS.map(m => { const has = all[m.id] && Object.keys(all[m.id]).length; return `<span class="chip ${has ? 'g' : ''}">${m.name} ${has ? '입력완료' : '미입력'}</span>`; }).join('');
  renderBest();
}
function bestSlots() {
  const r = [];
  for (const d of dates) for (const h of hours) { if (!open(d, h)) continue; const c = counts(key(d.k, h)); const t = c.g.length + c.y.length; if (t) r.push({ d, h, t, g: c.g.length, c }); }
  return r.sort((a, b) => b.t - a.t || b.g - a.g);
}
function renderBest() {
  const b = bestSlots().slice(0, 5);
  $('#bestList').innerHTML = b.length ? b.map(s => `<li><b>${s.d.label}(${s.d.wd}) ${s.h}:00</b> · ${s.t}명 가능 (대면 ${s.g}명)</li>`).join('') : '<li>아직 입력된 시간이 없어요.</li>';
}
function showCell(k) {
  const [dk, h] = k.split('h'), d = dates.find(x => x.k === dk), c = counts(k);
  const none = MEMBERS.filter(m => !c.g.includes(m.name) && !c.y.includes(m.name)).map(m => m.name);
  $('#cellInfo').innerHTML = `<h3>${d.label}(${d.wd}) ${h}:00</h3><div class="chips">${c.g.map(x => `<span class="chip g">${x} 온·오프</span>`).join('')}${c.y.map(x => `<span class="chip y">${x} 온라인</span>`).join('')}${none.map(x => `<span class="chip">${x} 불가·미응답</span>`).join('')}</div>`;
}

function setCell(td, v) { const k = td.dataset.k; if (v) mine[k] = v; else delete mine[k]; td.className = 'c ' + (v || ''); queueSave(); }
function queueSave() { dirty = true; setStatus('저장 중…'); clearTimeout(saveTimer); saveTimer = setTimeout(save, 700); }
async function save() {
  if (!me || !db) return;
  const snapshot = { ...mine };
  try { await setDoc(doc(db, COL, me.id), { cells: snapshot }); dirty = false; setStatus('저장됨 ✓'); }
  catch (e) { setStatus(e.code === 'permission-denied' ? '저장 권한 없음' : '저장 실패 — 연결 확인'); }
}

const ge = $('#gridEdit');
ge.addEventListener('pointerdown', e => {
  const td = e.target.closest('td.c'); if (!td) return;
  if (pen && mine[td.dataset.k] === pen) { setCell(td, ''); return; } // 같은 색 다시 누르면 지우기
  painting = e.pointerType === 'mouse'; setCell(td, pen);
});
ge.addEventListener('pointerover', e => { if (painting) { const td = e.target.closest('td.c'); if (td) setCell(td, pen); } });
window.addEventListener('pointerup', () => { painting = false; });
ge.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('td.c')) { e.preventDefault(); setCell(e.target, pen); } });
$('#gridSum').addEventListener('click', e => { const td = e.target.closest('td.c'); if (td) showCell(td.dataset.k); });

document.querySelectorAll('.pen').forEach(b => b.addEventListener('click', () => {
  pen = b.dataset.pen; document.querySelectorAll('.pen').forEach(x => x.setAttribute('aria-pressed', x === b));
}));
function setView(v) {
  view = v;
  $('#editView').classList.toggle('hidden', v !== 'edit'); $('#sumView').classList.toggle('hidden', v !== 'sum');
  $('#tabEdit').setAttribute('aria-pressed', v === 'edit'); $('#tabSum').setAttribute('aria-pressed', v === 'sum');
  if (v === 'sum') renderSum();
}
$('#tabEdit').addEventListener('click', () => setView('edit'));
$('#tabSum').addEventListener('click', () => setView('sum'));

function login() {
  if (!db) return;
  const m = MEMBERS.find(x => x.id === $('#selName').value), pin = $('#inpPin').value.trim();
  if (!m) { loginErr('이름을 선택해 주세요.'); return; }
  if (pin !== m.pin) { loginErr('끝번호 4자리가 맞지 않아요.'); return; }
  loginErr(''); $('#inpPin').value = '';
  try { localStorage.setItem('t1-me', m.id); sessionStorage.setItem('t1-session', m.id); } catch (e) {}
  enter(m);
}
function logout() {
  if (unsub) { unsub(); unsub = null; }
  me = null; try { sessionStorage.removeItem('t1-session'); } catch (e) {}
  $('#appView').classList.add('hidden'); $('#loginView').classList.remove('hidden');
}
function enter(m) {
  me = m;
  $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden');
  $('#whoName').textContent = me.name + ' 님';
  all = {}; mine = {}; dirty = false; renderEdit(); setView('edit'); setStatus('불러오는 중…');
  let first = true;
  if (unsub) unsub();
  unsub = onSnapshot(collection(db, COL), snap => {
    const next = {}; snap.forEach(d => { next[d.id] = d.data().cells || {}; });
    all = next;
    if (!dirty && !painting) { mine = { ...(all[me.id] || {}) }; if (view === 'edit') renderEdit(); }
    if (view === 'sum') renderSum();
    if (first) { setStatus('연결됨'); first = false; }
  }, err => setStatus(err.code === 'permission-denied' ? '접근 권한 설정 필요' : '연결 확인 필요'));
}
$('#btnLogin').addEventListener('click', login);
$('#inpPin').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('#btnLogout').addEventListener('click', logout);

$('#btnCopy').addEventListener('click', async () => {
  const b = bestSlots().slice(0, 5);
  const txt = '[1조 모임 시간 취합]\n' + (b.length ? b.map((s, i) => `${i + 1}. ${s.d.label}(${s.d.wd}) ${s.h}:00 — ${s.t}명 (대면 ${s.g}명) / 대면: ${s.c.g.join(', ') || '-'} / 온라인: ${s.c.y.join(', ') || '-'}`).join('\n') : '입력 없음')
    + '\n미입력: ' + (MEMBERS.filter(m => !all[m.id] || !Object.keys(all[m.id]).length).map(m => m.name).join(', ') || '없음');
  try { await navigator.clipboard.writeText(txt); $('#copyMsg').textContent = ' 복사됨'; } catch (e) { $('#copyMsg').textContent = ' 복사 실패'; }
});

const cfg = window.FIREBASE_CONFIG;
if (!cfg?.apiKey || !cfg?.appId || !cfg?.projectId || Object.values(cfg).some(v => typeof v === 'string' && v.includes('YOUR_'))) {
  loginErr('관리자가 Firebase 연결 설정을 완료해야 합니다.');
  $('#btnLogin').disabled = true;
} else {
  try {
    db = getFirestore(initializeApp(cfg));
    let back = null; try { back = sessionStorage.getItem('t1-session'); } catch (e) {}
    const m = MEMBERS.find(x => x.id === back); if (m) enter(m);
  } catch (e) { loginErr('연결 설정을 확인하세요.'); }
}
