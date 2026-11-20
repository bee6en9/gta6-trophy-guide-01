import { trophyData } from './data/trophies.js';
import { loadProgress, saveProgress, validateProgress, exportProgress, loadSpoilerSetting, saveSpoilerSetting } from './progress.js';
import { drawViceCitySkyline } from './skyline.js';

const trophies = trophyData.trophies;
const $ = id => document.getElementById(id);
const stages = [
  { title: 'Follow the story', subtitle: 'Chapters 1–4 + finale', plan: 'Finish Gone Fishing, Chapters 1–4 and the final mission. Keep separate saves before major transitions; named missions have no confirmed chapter placement.' },
  { title: 'Meet the locals', subtitle: 'Strands & side missions', plan: 'Finish Andy, Kenton, Billy, Randy and Tyrone’s strands. Track eight stranger strands. Try Cal’s fishing challenge and Bret’s hunt when available.' },
  { title: 'Make some noise', subtitle: 'Challenges & activities', plan: 'Work toward 250 stunts, 20 different race wins and 50 challenges. Gold the Shooting Range. Group partner escapes and robberies into focused sessions.' },
  { title: 'Leave no trace', subtitle: 'Collect, explore & spend', plan: 'Complete 3 card sets and 100 WAiNK locations; discover 100 vehicles. Explore Leonida, buy garages and work on the money and registration totals.' },
  { title: 'Become a legend', subtitle: '100% → platinum', plan: 'Audit the game’s own 100% checklist; its full contents are unconfirmed. Resolve outstanding trophies. Earn the other 54 to claim Vice Got a Price!.' }
];
const preset = new URLSearchParams(location.search).get('shot');
const isPreset = ['cover', 'roadmap', 'detail', 'filters'].includes(preset);
let earned = isPreset ? new Set([2,3,4,5,6,8,9,10,11,12,13,21,33,41]) : loadProgress(trophies);
let hideSpoilers = preset === 'detail' || (!isPreset && loadSpoilerSetting());
let kind = preset === 'filters' ? 'missable' : 'all';
let selectedId = preset === 'detail' ? 7 : 36;
let stageFilter = null;
let roadmapOpen = preset === 'roadmap';
let noticeTimer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function trophyIcon(grade) {
  const box = element('span', 'trophy-icon ' + grade);
  box.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', 'M6 3h12v3h3v3c0 3-2 5-5 5-.8 1-1.7 1.6-3 1.9V19h4v2H7v-2h4v-3.1C9.7 15.6 8.8 15 8 14c-3 0-5-2-5-5V6h3V3zm0 5H5v1c0 1.4.7 2.4 2 2.8C6.3 10.7 6 9.4 6 8zm12 0c0 1.4-.3 2.7-1 3.8 1.3-.4 2-1.4 2-2.8V8h-1z');
  svg.append(path); box.append(svg); return box;
}

function isConcealed(trophy) { return hideSpoilers && trophy.kind === 'story' && !earned.has(trophy.id); }

function announce(message) {
  $('notice').textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { $('notice').textContent = ''; }, 4200);
}

function persistProgress() {
  if (isPreset) { announce('Sample progress updated. Open the normal URL for your personal checklist.'); return; }
  if (!saveProgress(earned)) { $('save-state').textContent = 'Session only — export a backup'; announce('Storage unavailable. Export to keep a backup.'); }
}

function toggleEarned(id, checked) {
  if (checked) earned.add(id); else earned.delete(id);
  persistProgress();
  renderAll();
}

function renderProgress() {
  $('earned-count').replaceChildren(document.createTextNode(String(earned.size)), element('span', '', '/55'));
  const percent = Math.round(earned.size / 55 * 100);
  $('percent').textContent = percent + '%';
  $('progress-fill').style.width = percent + '%';
  document.querySelector('[role=progressbar]').setAttribute('aria-valuenow', earned.size);
  $('remaining').textContent = (55 - earned.size) + ' trophies to go';
  if (isPreset) $('save-state').textContent = 'Sample progress · local preview';
}

function renderRoadmap() {
  $('steps').replaceChildren();
  stages.forEach((stage, index) => {
    const group = trophies.filter(t => t.stage === index + 1);
    const complete = group.filter(t => earned.has(t.id)).length;
    const step = element('button', 'step' + (complete === group.length ? ' complete' : '') + (stageFilter === index + 1 || (!stageFilter && index === 2 && earned.size > 0) ? ' active' : ''));
    step.setAttribute('aria-pressed', String(stageFilter === index + 1));
    step.append(element('span', 'step-number', complete === group.length ? '✓' : String(index + 1).padStart(2, '0')));
    const copy = element('span');
    copy.append(element('strong', '', stage.title), element('small', '', stage.subtitle));
    step.append(copy);
    step.addEventListener('click', () => {
      stageFilter = stageFilter === index + 1 ? null : index + 1;
      kind = 'all'; $('search').value = ''; $('grade').value = 'all';
      renderAll();
    });
    $('steps').append(step);
  });
  $('roadmap-plan').hidden = !roadmapOpen;
  $('roadmap-toggle').setAttribute('aria-expanded', String(roadmapOpen));
  $('roadmap-toggle').textContent = roadmapOpen ? 'Close the plan ↗' : 'View the plan ↗';
  document.body.classList.toggle('roadmap-view', roadmapOpen);
}

function buildRoadmapPlan() {
  $('roadmap-plan').append(element('p', '', 'A practical earning order, built from the supplied descriptions. Explore side content as it becomes available; post-story access is unconfirmed. No permanent missables are confirmed. Select a stage above to narrow your checklist.'));
  const grid = element('div', 'plan-grid');
  stages.forEach((stage, index) => {
    const card = element('article', 'plan-card');
    card.append(element('b', '', 'STAGE 0' + (index + 1)), element('h3', '', stage.title), element('p', '', stage.plan));
    grid.append(card);
  });
  $('roadmap-plan').append(grid);
}

function renderKindFilters() {
  $('kinds').replaceChildren();
  for (const value of ['all', 'story', 'missable', 'collectibles', 'activities', 'online']) {
    const count = trophies.filter(t => value === 'all' || (value === 'missable' ? t.missable : t.kind === value)).length;
    const button = element('button', '', value.charAt(0).toUpperCase() + value.slice(1));
    button.dataset.kind = value;
    button.setAttribute('aria-pressed', String(kind === value));
    button.append(element('span', '', count));
    button.addEventListener('click', () => { kind = value; stageFilter = null; renderAll(); });
    $('kinds').append(button);
  }
}

function visibleTrophies() {
  const query = $('search').value.trim().toLocaleLowerCase();
  return trophies.filter(t => {
    const searchText = isConcealed(t) ? 'hidden trophy story' : t.name + ' ' + t.description;
    return (kind === 'all' || (kind === 'missable' ? t.missable : t.kind === kind)) &&
      ($('grade').value === 'all' || t.grade === $('grade').value) &&
      (!$('hide-earned').checked || !earned.has(t.id)) &&
      (!stageFilter || t.stage === stageFilter) && searchText.toLocaleLowerCase().includes(query);
  });
}

function resetFilters() {
  kind = 'all'; stageFilter = null; $('search').value = ''; $('grade').value = 'all'; $('hide-earned').checked = false;
  renderAll();
}

function renderTrophyList() {
  const scroll = $('trophies').scrollTop;
  $('trophies').replaceChildren();
  const visible = visibleTrophies();
  $('result-count').textContent = visible.length + ' / 55' + (stageFilter ? ' · Stage ' + stageFilter : ' trophies');
  if (!visible.length) {
    const empty = element('div', 'empty-state');
    empty.append(element('span', 'eyebrow', kind === 'missable' ? 'EVIDENCE BEFORE ASSUMPTION' : 'NO MATCHES'));
    empty.append(element('h3', '', kind === 'missable' ? 'No confirmed permanent missables.' : kind === 'online' ? 'No online trophies in this list.' : 'No trophies match these filters.'));
    empty.append(element('p', '', kind === 'missable' ? 'None of the 55 supplied descriptions explicitly confirms a permanent miss. All missable flags are false. This does not guarantee replayability: keep separate saves before major transitions.' : 'Try another kind, grade or search. With spoiler protection on, hidden story names are excluded from search.'));
    const reset = element('button', '', 'Reset filters ↗'); reset.addEventListener('click', resetFilters); empty.append(reset); $('trophies').append(empty);
  }
  for (const t of visible) {
    const concealed = isConcealed(t);
    const name = concealed ? 'Hidden trophy — earn it to reveal' : t.name;
    const row = element('article', 'trophy-row' + (selectedId === t.id ? ' selected' : '') + (earned.has(t.id) ? ' earned' : ''));
    row.dataset.id = t.id;
    row.id = 'trophy-' + t.id;
    row.append(trophyIcon(t.grade));
    const open = element('button', 'trophy-open');
    open.setAttribute('aria-expanded', String(selectedId === t.id));
    open.append(element('h3', '', name), element('p', '', concealed ? 'Story details are protected until this trophy is earned.' : t.description));
    const meta = element('div', 'row-meta');
    meta.append(element('span', 'grade-chip ' + t.grade, t.grade), element('span', 'kind-tag', t.kind), element('span', 'missable-tag', t.missable ? 'Missable' : 'No miss confirmed'));
    open.append(meta);
    open.addEventListener('click', () => { selectedId = t.id; renderTrophyList(); renderGuide(); });
    row.append(open);
    const box = element('input', 'earned-box'); box.type = 'checkbox'; box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + name);
    box.addEventListener('change', () => toggleEarned(t.id, box.checked));
    row.append(box); $('trophies').append(row);
  }
  $('trophies').scrollTop = scroll;
}

function renderGuide() {
  const t = trophies.find(t => t.id === selectedId);
  const concealed = isConcealed(t);
  const guide = $('guide'); guide.replaceChildren();
  const kicker = element('div', 'guide-kicker');
  kicker.append(element('span', '', 'FIELD GUIDE / ' + String(t.id).padStart(2, '0')), element('span', '', t.grade.toUpperCase()));
  guide.append(kicker);
  const title = element('div', 'guide-title');
  title.append(trophyIcon(t.grade), element('h2', '', concealed ? 'Hidden trophy — earn it to reveal' : t.name)); guide.append(title);
  guide.append(element('p', 'guide-description', concealed ? 'Story requirement concealed. Earn this trophy to reveal its name, description and guide.' : t.description));
  guide.append(element('div', 'guide-divider'));
  guide.append(element('p', 'guide-label', concealed ? 'SPOILER PROTECTION IS ON' : 'THE APPROACH'));
  guide.append(element('p', 'guide-body', concealed ? 'Your next chapter stays yours. This guide and its story details remain covered until you mark the trophy earned, or switch off Hide story spoilers.' : t.guide));
  if (!concealed && t.count !== null && t.id !== 1) {
    guide.append(element('p', 'guide-label', 'TARGET / ' + t.count.toLocaleString() + (t.sources.length > 1 ? ' · STARTER HINT, UNVERIFIED' : ' · SUPPLIED REQUIREMENT')));
  }
  const sources = element('div', 'guide-sources'); sources.append(element('p', 'guide-label', 'SOURCES & EVIDENCE'));
  if (concealed) sources.append(element('p', 'guide-description', 'Supplied official trophy description · link concealed to prevent a spoiler.'));
  else t.sources.forEach(source => {
    const link = element('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener';
    link.append(element('span', 'source-arrow', '↗'), document.createTextNode(source.name)); sources.append(link);
  });
  guide.append(sources);
  const status = element('div', 'guide-status');
  status.append(element('strong', '', t.missable ? 'Missable warning' : 'No permanent miss confirmed'), document.createTextNode(' · No cutoff is stated. Keep a separate save as a precaution.'));
  guide.append(status);
  const foot = element('div', 'guide-foot');
  foot.append(element('span', '', 'STAGE 0' + t.stage + ' / ' + (concealed ? 'STORY' : stages[t.stage - 1].title.toUpperCase())));
  const mark = element('button', '', earned.has(t.id) ? '✓ Earned · undo' : 'Mark earned +');
  mark.addEventListener('click', () => toggleEarned(t.id, !earned.has(t.id))); foot.append(mark); guide.append(foot);
  if (t.hidden) guide.append(element('p', 'guide-description', 'Hidden on PSN: provisional editorial flag.'));
}

function renderAll() { renderProgress(); renderRoadmap(); renderKindFilters(); renderTrophyList(); renderGuide(); }

$('search').addEventListener('input', renderTrophyList);
$('grade').addEventListener('change', renderTrophyList);
$('hide-earned').addEventListener('change', renderTrophyList);
$('spoilers').checked = hideSpoilers;
$('spoilers').addEventListener('change', () => { hideSpoilers = $('spoilers').checked; if (!isPreset) saveSpoilerSetting(hideSpoilers); renderAll(); });
$('roadmap-toggle').addEventListener('click', () => { roadmapOpen = !roadmapOpen; renderRoadmap(); });
$('notes-toggle').addEventListener('click', () => { $('notes').hidden = !$('notes').hidden; $('notes-toggle').setAttribute('aria-expanded', String(!$('notes').hidden)); });
$('export').addEventListener('click', () => { exportProgress(earned); announce('Progress exported. Keep this file as your backup.'); });
$('import').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error('This file is too large for a trophy checklist.');
    const data = JSON.parse(await file.text());
    if (data.format && data.format !== 'leonida-progress-v1') throw new Error('Unsupported progress format.');
    earned = validateProgress(data, trophies); persistProgress(); renderAll(); announce('Progress imported: ' + earned.size + ' trophies earned.');
  } catch (error) { announce('Import failed. ' + error.message); }
  finally { event.target.value = ''; }
});

drawViceCitySkyline($('skyline'));
buildRoadmapPlan();
renderAll();
if (preset === 'cover') $('trophies').scrollTop = $('trophy-33').offsetTop - $('trophies').offsetTop;
if (preset === 'detail') $('trophies').scrollTop = $('trophy-7').offsetTop - $('trophies').offsetTop;
window.scrollTo(0, 0);
