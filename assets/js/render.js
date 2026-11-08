import { profile, projects, skills, principles } from './content.js';

/**
 * content.js → DOM. 카드 위치는 여기서 계산하지 않는다 —
 * scene/main.js가 진행도로 placeCards()를 부르고, 실제 이동은 CSS 변수 --t로 한다.
 */

/** @param {string} str */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function renderHero() {
  document.querySelector('[data-hero="name"]').textContent = profile.name;
  document.querySelector('[data-hero="tagline"]').textContent = profile.tagline;
  document.querySelector('[data-hero="github"]').href = profile.links.github;
  document.getElementById('hero-stats').innerHTML = profile.stats
    .map((stat) => `<div class="stat"><dt>${escapeHtml(stat.label)}</dt><dd data-countup="${stat.value}">0</dd></div>`)
    .join('');
}

/**
 * @param {import('./content.js').Project} project
 * @param {number} index
 */
function cardHtml(project, index) {
  const tags = project.stack.length
    ? `<ul class="tag-list" aria-label="사용 기술">${project.stack
        .map((t) => `<li><button type="button" class="tag" data-stack="${escapeHtml(t)}" aria-pressed="false">${escapeHtml(t)}</button></li>`)
        .join('')}</ul>`
    : '';
  const img = project.image
    ? `<img class="card__thumb" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)} 스크린샷" loading="lazy" width="640" height="400" />`
    : '';
  const link = (href, label) =>
    `<a class="card__link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span></a>`;
  const links = [
    project.links.repo ? link(project.links.repo, 'Repository') : '<span class="card__link">비공개 저장소</span>',
    project.links.demo ? link(project.links.demo, 'Demo') : '',
    project.links.notion ? link(project.links.notion, 'Notion') : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const status =
    project.status === 'in-play' ? '<span class="badge">IN PLAY</span>' : project.status === 'coming-soon' ? '<span class="badge">COMING SOON</span>' : '';
  const role = project.role ? `<p class="card__desc"><strong>담당:</strong> ${escapeHtml(project.role)}</p>` : '';
  const tier = project.tier === 'featured' ? ' card--featured' : project.tier === 'coming-soon' ? ' card--soon' : '';

  return `
    <article class="card${tier}" data-card-index="${index}" data-stack-list="${project.stack.map(escapeHtml).join(',')}">
      <header class="card__head">
        <span class="card__index">${String(index + 1).padStart(2, '0')}</span>${status}
        <h3 class="card__name">${escapeHtml(project.name)}</h3>
      </header>
      <p class="card__desc">${escapeHtml(project.summary)}</p>
      ${img}
      ${role}
      ${tags}
      <footer class="card__foot">${links}</footer>
    </article>`;
}

/** @returns {HTMLElement[]} */
function renderFeatured() {
  const el = document.getElementById('featured-grid');
  el.innerHTML = projects.filter((p) => p.tier === 'featured').map(cardHtml).join('');
  return [...el.children];
}

/** @returns {HTMLElement[]} shipped + coming-soon, 궤적 순서대로 */
function renderProjects() {
  const el = document.getElementById('shipped-grid');
  el.innerHTML = projects.filter((p) => p.tier !== 'featured').map(cardHtml).join('');
  return [...el.children];
}

function renderSkills() {
  document.getElementById('skill-list').innerHTML = skills
    .map(
      (g) => `<div class="skill-row"><dt class="skill-group">${escapeHtml(g.group)}</dt><dd class="skill-items">${g.items
        .map((i) => `<span class="skill-chip">${escapeHtml(i)}</span>`)
        .join('')}</dd></div>`,
    )
    .join('');
}

function renderPrinciples() {
  document.getElementById('principle-list').innerHTML = principles
    .map(
      (item, i) => `<article class="principle reveal" style="--delay:${i * 80}ms"><span class="principle__index">${String(i + 1).padStart(2, '0')}</span><h3 class="principle__title">${escapeHtml(item.title)}</h3><p class="principle__body">${escapeHtml(item.body)}</p></article>`,
    )
    .join('');
}

function renderContact() {
  document.getElementById('contact-list').innerHTML = `
    <li><span class="contact-label">Email</span><a href="mailto:${escapeHtml(profile.links.email)}">${escapeHtml(profile.links.email)}</a></li>
    <li><span class="contact-label">GitHub</span><a href="${escapeHtml(profile.links.github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.links.github.replace('https://', ''))}</a></li>
    <li><span class="contact-label">Notion</span><a href="${escapeHtml(profile.links.notion)}" target="_blank" rel="noopener noreferrer">프로젝트 문서 모음</a></li>`;
}

/**
 * 카드마다 --t(-1~1)만 준다. 이동·투명도 계산은 CSS가 한다.
 * @param {HTMLElement[]} cards
 * @param {number[]} cardT
 */
export function placeCards(cards, cardT) {
  cards.forEach((card, i) => {
    const t = cardT[i] ?? 1;
    card.style.setProperty('--t', t.toFixed(4));
    card.inert = Math.abs(t) > 0.6;
  });
}

/**
 * 화살표·카운터. 어디로 갈지는 호출자(scene/main.js)가 안다.
 * @param {{ count: number, current(): number, goTo(index: number): void }} api
 */
export function setupCardNav(api) {
  const counter = document.getElementById('lineup-count');
  const sync = () => {
    if (counter) counter.textContent = `${String(api.current() + 1).padStart(2, '0')} / ${String(api.count).padStart(2, '0')}`;
  };
  document.querySelectorAll('[data-lineup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.lineup === 'next' ? 1 : -1;
      api.goTo(Math.min(api.count - 1, Math.max(0, api.current() + dir)));
    });
  });
  return sync;
}

renderHero();
export const featuredCards = renderFeatured();
export const projectCards = renderProjects();
renderSkills();
renderPrinciples();
renderContact();
