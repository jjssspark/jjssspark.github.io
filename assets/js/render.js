import { profile, projects, skills, principles } from './content.js';

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

function renderHero() {
  document.querySelector('[data-hero="name"]').textContent = profile.name;
  document.querySelector('[data-hero="tagline"]').textContent = profile.tagline;
  document.querySelector('[data-hero="github"]').href = profile.links.github;

  const statLine = document.getElementById('hero-stats');
  statLine.innerHTML = profile.stats
    .map(
      (stat) => `
    <div>
      <dt>${escapeHtml(stat.label)}</dt>
      <dd data-countup="${stat.value}">0</dd>
    </div>
  `
    )
    .join('');

  const grid = document.getElementById('hero-grid');
  grid.innerHTML = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const diagonal = row + col;
    return `<span class="strike-grid__cell" style="--delay:${diagonal * 90}ms"></span>`;
  }).join('');
}

/**
 * @param {import('./content.js').Project} project
 * @param {number} index
 * @returns {string}
 */
function projectCardHtml(project, index) {
  const tagsHtml = project.stack.length
    ? `<ul class="tag-list" aria-label="사용 기술">${project.stack
        .map((tag) => `<li><button type="button" class="tag" data-stack="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(tag)}</button></li>`)
        .join('')}</ul>`
    : '';
  const vizHtml = project.viz
    ? `<canvas class="viz-canvas" data-viz="${project.viz}" aria-hidden="true"></canvas>`
    : '';
  const imgHtml = project.image
    ? `<img class="project-thumb" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)} 스크린샷" loading="lazy" />`
    : '';
  const linkHtml = project.links.repo
    ? `<a class="project-link" href="${escapeHtml(project.links.repo)}" target="_blank" rel="noopener noreferrer">Repository <span aria-hidden="true">↗</span></a>`
    : `<span class="project-link">비공개 저장소</span>`;
  const demoHtml = project.links.demo
    ? ` · <a class="project-link" href="${escapeHtml(project.links.demo)}" target="_blank" rel="noopener noreferrer">Demo <span aria-hidden="true">↗</span></a>`
    : '';
  const notionHtml = project.links.notion
    ? ` · <a class="project-link" href="${escapeHtml(project.links.notion)}" target="_blank" rel="noopener noreferrer">Notion <span aria-hidden="true">↗</span></a>`
    : '';
  const videoHtml = project.links.video
    ? ` · <a class="project-link" href="${escapeHtml(project.links.video)}" target="_blank" rel="noopener noreferrer">시연 영상 <span aria-hidden="true">↗</span></a>`
    : '';
  const statusHtml =
    project.status === 'in-play'
      ? '<span class="status-badge">IN PLAY</span>'
      : project.status === 'coming-soon'
        ? '<span class="status-badge">COMING SOON</span>'
        : '';
  const roleHtml = project.role
    ? `<p class="project-desc"><strong>담당:</strong> ${escapeHtml(project.role)}</p>`
    : '';
  const tierClass =
    (project.tier === 'featured' ? ' project-card--featured' : project.tier === 'coming-soon' ? ' project-card--soon' : '') +
    (project.image ? ' project-card--media' : '');

  // 야구공 실밥. rx로 카드 모서리를 따라 돌고, hover 시 stroke-dashoffset이 흐른다.
  const seamHtml = `
      <svg class="card-seam" aria-hidden="true" preserveAspectRatio="none">
        <rect class="card-seam__path" x="6" y="6" rx="14" />
      </svg>`;

  if (project.image) {
    return `
      <article class="project-card${tierClass} reveal" style="--delay:${(index % 6) * 60}ms" data-stack-list="${project.stack.map(escapeHtml).join(',')}">
        ${seamHtml}
        ${seamHtml}
      <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
        ${statusHtml}
        <h3 class="project-name">${escapeHtml(project.name)}</h3>
        <p class="project-desc">${escapeHtml(project.summary)}</p>
        ${imgHtml}
        <div class="project-more">
          ${roleHtml}
          ${tagsHtml}
          ${linkHtml}${demoHtml}${videoHtml}${notionHtml}
        </div>
      </article>
    `;
  }

  return `
    <article class="project-card${tierClass} reveal" style="--delay:${(index % 6) * 60}ms" data-stack-list="${project.stack.map(escapeHtml).join(',')}">
      ${seamHtml}
      <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
      ${statusHtml}
      <h3 class="project-name">${escapeHtml(project.name)}</h3>
      <p class="project-desc">${escapeHtml(project.summary)}</p>
      ${roleHtml}
      ${vizHtml}
      ${tagsHtml}
      ${linkHtml}${demoHtml}${videoHtml}${notionHtml}
    </article>
  `;
}

function renderProjects() {
  const featured = projects.filter((p) => p.tier === 'featured');
  const shipped = projects.filter((p) => p.tier === 'shipped');

  document.getElementById('featured-grid').innerHTML = featured.map((p, i) => projectCardHtml(p, i)).join('');
  document.getElementById('shipped-grid').innerHTML = shipped.map((p, i) => projectCardHtml(p, i)).join('');
}

function renderSkills() {
  document.getElementById('skill-list').innerHTML = skills
    .map(
      (group, index) => `
    <div class="skill-row reveal" style="--delay:${index * 60}ms">
      <dt class="skill-group">${escapeHtml(group.group)}</dt>
      <dd class="skill-items">
        ${group.items.map((item) => `<span class="skill-chip">${escapeHtml(item)}</span>`).join('')}
      </dd>
    </div>
  `
    )
    .join('');
}

function renderPrinciples() {
  document.getElementById('principle-list').innerHTML = principles
    .map(
      (item, index) => `
    <article class="principle-item reveal" style="--delay:${index * 80}ms">
      <span class="principle-index">${String(index + 1).padStart(2, '0')}</span>
      <h3 class="principle-title">${escapeHtml(item.title)}</h3>
      <p class="principle-body">${escapeHtml(item.body)}</p>
    </article>
  `
    )
    .join('');
}

function renderContact() {
  const list = document.getElementById('contact-list');
  list.innerHTML = `
    <li><span class="contact-label">Email</span><a href="mailto:${escapeHtml(profile.links.email)}">${escapeHtml(profile.links.email)}</a></li>
    <li><span class="contact-label">GitHub</span><a href="${escapeHtml(profile.links.github)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.links.github.replace('https://', ''))}</a></li>
    <li><span class="contact-label">Blog</span><a href="${escapeHtml(profile.links.blog)}" target="_blank" rel="noopener noreferrer">${escapeHtml(profile.links.blog.replace('https://', ''))}</a></li>
  `;
}

renderHero();
renderProjects();
renderSkills();
renderPrinciples();
renderContact();
