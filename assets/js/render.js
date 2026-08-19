import { profile, projects, skills, principles } from './content.js';
import { onScrollFrame, ownsWheel, scrollToY } from './scroll-engine.js';

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
    <div class="scoreboard__cell">
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
      </svg>
      `;

  // 링크 줄을 따로 감싼다 — 내용 길이가 달라도 하단선이 맞는다(.project-foot { margin-top: auto })
  const footHtml = `<div class="project-foot"><span class="project-foot__links">${linkHtml}${demoHtml}${notionHtml}</span></div>`;

  if (project.image) {
    return `
      <article class="project-card${tierClass} reveal" style="--delay:${(index % 6) * 60}ms" data-stack-list="${project.stack.map(escapeHtml).join(',')}">
        ${seamHtml}
        <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
        ${statusHtml}
        <h3 class="project-name">${escapeHtml(project.name)}</h3>
        <p class="project-desc">${escapeHtml(project.summary)}</p>
        ${imgHtml}
        <div class="project-more">
          ${roleHtml}
          ${tagsHtml}
        </div>
        ${footHtml}
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
      ${footHtml}
    </article>
  `;
}

function renderProjects() {
  const featured = projects.filter((p) => p.tier === 'featured');
  const shipped = projects.filter((p) => p.tier === 'shipped');

  document.getElementById('featured-grid').innerHTML = featured.map((p, i) => projectCardHtml(p, i)).join('');
  // 타순은 필름 띠라 칸(.lineup__frame)으로 한 겹 감싼다.
  // 원근 휨을 칸에 걸어야 카드 자체의 hover 틸트(interactions.js)와 transform이 부딪히지 않는다.
  document.getElementById('shipped-grid').innerHTML = shipped
    .map((p, i) => `<div class="lineup__frame">${projectCardHtml(p, i)}</div>`)
    .join('');
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
    <li><span class="contact-label">Notion</span><a href="${escapeHtml(profile.links.notion)}" target="_blank" rel="noopener noreferrer">프로젝트 문서 모음</a></li>
  `;
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 필름 띠의 원근 휨. 트랙 중앙을 정면으로 두고, 좌우로 멀어질수록 안쪽으로 접힌다.
 *
 * 페이지 스크롤이 아니라 트랙 자신의 가로 스크롤이라 IntersectionObserver로는 잡을 수 없다.
 * passive 리스너로 받되 rAF 한 프레임에 한 번만 계산하도록 합쳐 잔업을 없앤다.
 *
 * @param {HTMLElement} track
 * @param {HTMLElement[]} frames
 */
function setupLineupWarp(track, frames) {
  if (prefersReducedMotion) return null;

  const maxDeg = 18;
  const maxDepth = 90;
  let queued = false;

  /**
   * @param {number} [skewDeg] 스크롤 속도에서 온 기울임. 빠르게 굴릴수록 칸이 눕는다
   */
  function apply(skewDeg = 0) {
    queued = false;
    // 칸마다 getBoundingClientRect를 부르고 바로 transform을 쓰면 읽기·쓰기가
    // 번갈아 들어가 칸 수만큼 레이아웃을 다시 계산한다. 루프로 칸이 세 배가
    // 되면서 이게 그대로 세 배가 됐다. 칸 폭이 균일하니 위치는 산술로 낸다
    const width = track.clientWidth;
    if (!width) return;
    const cardW = frames[0].offsetWidth;
    const stride = cardW + 24;
    const left = track.scrollLeft;
    const half = width / 2;

    frames.forEach((frame, index) => {
      // 스크롤포트 가운데를 0으로 두고 -1(왼쪽 끝) ~ 1(오른쪽 끝)
      const offset = Math.max(-1, Math.min(1, (index * stride + cardW / 2 - left - half) / half));
      const distance = Math.abs(offset);
      frame.style.transform =
        `rotateY(${(-offset * maxDeg).toFixed(2)}deg)` +
        ` translateZ(${(-distance * maxDepth).toFixed(1)}px)` +
        ` skewY(${skewDeg.toFixed(2)}deg)`;
      frame.style.opacity = (1 - distance * 0.4).toFixed(3);
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => apply());
  }

  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  // 초기 1회는 동기로 건다. rAF에 맡기면 탭이 백그라운드일 때 첫 배치가 영영 안 걸린다
  apply();
  // 스크롤 구동 쪽에서 같은 프레임 안에 직접 부르기 위해 넘긴다.
  // 트랙의 scroll 이벤트를 기다리면 휨이 한 프레임 늦어 띠가 따로 논다
  return apply;
}

/**
 * 타순이 한 바퀴 돈 자리에 세우는 빈 칸.
 *
 * 무한 루프라 07 다음이 곧바로 01이다. 사이를 한 칸 비워두면 어디서 한 바퀴가
 * 끝났는지가 눈으로 보인다. 그림을 넣으면 그것도 카드처럼 읽혀서 비워둔다.
 *
 * 폭은 카드와 같게 둔다 — 원근 휨과 루프 계산이 둘 다 칸 폭이 균일하다고 보고
 * 산술로 자리를 낸다. 여기만 좁으면 그 뒤로 전부 어긋난다.
 */
function makeLineupTurn() {
  const frame = document.createElement('div');
  frame.className = 'lineup__frame lineup__turn';
  frame.dataset.turn = '';
  frame.setAttribute('aria-hidden', 'true');
  return frame;
}

/**
 * 트랙을 끝없이 돌게 만든다.
 *
 * 같은 카드 묶음을 앞뒤로 한 벌씩 더 붙여 세 벌로 만들고, 가운데 벌에서
 * 반 벌 이상 벗어나면 정확히 한 벌만큼 scrollLeft를 옮긴다. 내용이 한 벌
 * 주기로 똑같이 반복되므로 화면에는 아무 변화가 없고, 사용자는 끝을 못 만난다.
 *
 * 복제본은 스크린리더와 탭 순서에서 뺀다 — 안 그러면 같은 프로젝트를 세 번씩
 * 읽고 지나간다. 마우스 클릭은 살려둔다(보이는데 안 눌리면 그게 더 이상하다).
 *
 * @param {HTMLElement} track
 * @param {number} count 원본 칸 수
 * @param {{pitch: () => number, centerFor: (i: number) => number}} geom
 *   칸 간격과 "칸 i가 한가운데 올 때의 scrollLeft". 둘 다 요소의 실제 배치에서
 *   읽는다 — 폭을 손으로 더해 만들면 스냅 착지점과 어긋나 번호가 튄다
 */
function setupLineupLoop(track, count, geom) {
  const copies = () =>
    Array.from(track.children).map((frame) => {
      const copy = frame.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.dataset.clone = '';
      copy.querySelectorAll('a, button, [tabindex]').forEach((el) => {
        el.tabIndex = -1;
      });
      return copy;
    });

  const head = copies();
  const tail = copies();
  track.prepend(...head);
  track.append(...tail);

  const unit = () => count * geom.pitch();
  /** 가운데 벌의 첫 칸이 화면 한가운데 올 때의 scrollLeft */
  const base = () => geom.centerFor(count);

  let wrapping = false;
  let idle = 0;

  function wrap() {
    // scroll 안에서 scrollLeft를 쓰면 그 자리에서 scroll이 또 걸린다.
    // 조건이 계속 참인 상황(스냅이 되돌리는 등)에서는 이게 안 끝난다
    if (wrapping) return;
    const span = unit();
    if (span <= 0) return;
    const rel = track.scrollLeft - base();
    const shift = rel > span * 0.5 ? -span : rel < span * -0.5 ? span : 0;
    if (!shift) return;
    // 옮긴 자리가 스크롤 범위를 벗어나면 브라우저가 잘라서 되돌리고,
    // 그러면 다음 scroll에서 반대로 튀어 앞뒤로 진동한다. 범위 안일 때만 옮긴다
    const target = track.scrollLeft + shift;
    if (target < 0 || target > track.scrollWidth - track.clientWidth) return;
    wrapping = true;
    track.scrollLeft = target;
    // rAF는 백그라운드 탭에서 안 돌아 플래그가 영영 안 풀린다
    setTimeout(() => {
      wrapping = false;
    }, 0);
  }

  const reset = () => {
    track.scrollLeft = base();
  };

  reset();
  // 스크롤이 멎은 뒤에만 옮긴다. 굴러가는 중에 자리를 바꾸면 관성이 끊기고,
  // 매 프레임 쓰기가 들어가 카운터의 배치 읽기와 번갈아 부딪힌다.
  // 세 벌이라 한 벌치 여유가 있어 늦게 옮겨도 끝에 닿지 않는다
  track.addEventListener(
    'scroll',
    () => {
      clearTimeout(idle);
      idle = setTimeout(wrap, 120);
    },
    { passive: true }
  );
  window.addEventListener('resize', reset);

  return { base, unit, wrap };
}

/** 클릭이 아니라 끌기로 볼 최소 이동 거리(px) */
const DRAG_INTENT = 12;

/**
 * 마우스로 트랙을 끌어 넘긴다.
 *
 * 네이티브 가로 스크롤 컨테이너는 마우스로 끌리지 않는다. 터치는 브라우저가
 * 알아서 밀어주지만 데스크톱에는 가로 휠조차 없는 입력이 흔해서, 버튼 말고는
 * 넘길 방법이 없었다.
 *
 * @param {HTMLElement} track
 */
function setupLineupDrag(track) {
  let active = null;
  let startX = 0;
  let startLeft = 0;
  let dragging = false;
  // 끌고 놓은 직후의 click 한 번만 막는다. dragging을 그대로 쓰면
  // 다음 클릭까지 계속 막혀서 카드 링크가 죽는다
  let swallowClick = false;
  // 끌린 거리. 링크를 누르다 손이 조금 밀린 것과 진짜로 민 것을 가른다
  let movedX = 0;

  track.addEventListener('pointerdown', (event) => {
    // 터치는 브라우저의 관성 패닝이 이미 더 낫다. 겹치면 두 배로 움직인다
    if (event.pointerType === 'touch' || event.button !== 0) return;
    // 링크·버튼 위에서 누른 건 넘기려는 게 아니라 그걸 누르려는 것이다.
    // 여기서 끌기를 걸면 손이 조금만 밀려도 그 클릭이 취소된다
    if (event.target.closest?.('a, button')) return;
    active = event.pointerId;
    startX = event.clientX;
    startLeft = track.scrollLeft;
    dragging = false;
    swallowClick = false;
    movedX = 0;
  });

  track.addEventListener('pointermove', (event) => {
    if (event.pointerId !== active) return;
    const dx = event.clientX - startX;
    movedX = Math.max(movedX, Math.abs(dx));
    if (!dragging) {
      // 클릭과 구분되는 문턱. 이게 없으면 링크를 누를 때마다 끌린 것으로 친다
      if (Math.abs(dx) < 6) return;
      dragging = true;
      // 포인터가 이미 놓였거나 캡처를 못 잡는 상황에서 던진다.
      // 여기서 예외가 나면 이 핸들러가 통째로 멈춰 드래그가 안 된다
      try {
        track.setPointerCapture(active);
      } catch {
        /* 캡처 없이도 트랙 위에서는 끌린다 */
      }
      // 스냅이 켜져 있으면 매 프레임 착지점으로 되돌려 끌리지 않는다
      track.classList.add('is-dragging');
    }
    track.scrollLeft = startLeft - dx;
  });

  const release = (event) => {
    if (event.pointerId !== active) return;
    try {
      if (track.hasPointerCapture(active)) track.releasePointerCapture(active);
    } catch {
      /* 이미 풀렸다 */
    }
    track.classList.remove('is-dragging');
    // 6px는 끌기를 시작하는 문턱일 뿐이다. 이 값으로 클릭까지 막으면
    // 링크를 누를 때 손이 조금만 밀려도 아무 일도 일어나지 않는다.
    // 실제로 민 거리가 DRAG_INTENT를 넘었을 때만 클릭을 취소한다
    swallowClick = dragging && movedX >= DRAG_INTENT;
    dragging = false;
    active = null;
  };
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', release);

  // 끌고 놓은 자리에서 링크가 열리면 안 된다. 캡처 단계에서 먼저 자른다
  track.addEventListener(
    'click',
    (event) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}

/**
 * 타순 캐러셀. 스크롤 스냅이 이동을 담당하고 버튼은 scrollBy만 호출한다 —
 * 터치 스와이프·키보드 스크롤이 공짜로 따라온다.
 */
function setupLineup() {
  const track = document.getElementById('shipped-grid');
  const counter = document.getElementById('lineup-count');
  if (!track || !counter) return;

  const cards = Array.from(track.children);
  if (!cards.length) return;

  // 세로 구동(film.html)은 무대 진행률을 그대로 가로 위치로 쓴다. 복제하면 어긋난다
  const stage = document.getElementById('lineup-stage');
  const scrollDriven = Boolean(stage) && !prefersReducedMotion;
  const looping = !scrollDriven && cards.length >= 3;

  // 마지막 카드 뒤에 세운다. 루프에서 07 다음이 01이 되는 그 자리다
  const turn = looping ? makeLineupTurn() : null;
  if (turn) track.append(turn);

  // 칸(slot)에는 구분 칸도 들어간다. 폭·루프 계산은 이걸 기준으로 한다
  const slots = Array.from(track.children);

  // 자리 계산은 전부 요소의 실제 배치(offsetLeft/offsetWidth)에서 읽는다.
  // getBoundingClientRect()는 원근 휨(rotateY)이 적용된 값이라 카드가 기울수록
  // 줄어들고, 폭에 gap을 손으로 더하면 스냅 착지점과 몇 px씩 어긋나 번호가 튄다
  const pitch = () => {
    const [a, b] = track.children;
    return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
  };
  /** 칸 i가 화면 한가운데 올 때의 scrollLeft */
  const centerFor = (i) => {
    const el = track.children[Math.max(0, Math.min(track.children.length - 1, i))];
    return el ? el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2 : 0;
  };
  /** 지금 한가운데 있는 칸 (복제본 포함 전체 기준) */
  const centerIndex = () => {
    const first = track.children[0];
    if (!first) return 0;
    const mid = track.scrollLeft + track.clientWidth / 2;
    return Math.round((mid - first.offsetLeft - first.offsetWidth / 2) / pitch());
  };
  const loop = looping ? setupLineupLoop(track, slots.length, { pitch, centerFor }) : null;

  // 원근 휨은 복제본에도 걸려야 한다 — 안 그러면 이어지는 자리에서 툭 끊긴다
  const frames = loop ? Array.from(track.children) : slots;

  // 가로 캐러셀 안의 카드는 뷰포트와 교차하지 않아 IntersectionObserver가 영영 안 깨운다.
  // 트랙이 화면에 들어오는 시점에 전부 한 번에 드러낸다.
  const wake = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      cards.forEach((frame) => frame.querySelector('.project-card')?.classList.add('is-visible'));
      wake.disconnect();
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  wake.observe(track);

  const warp = setupLineupWarp(track, frames);

  // Chrome은 가로로만 스크롤되는 요소 위의 세로 휠을 가로 스크롤로 돌려쓴다.
  // 그 이동량이 카드 절반에 못 미치면 mandatory 스냅이 원위치시켜, 세로도 가로도 안 움직인다.
  // 세로가 우세한 휠은 트랙이 삼키지 않고 페이지로 넘긴다.
  track.addEventListener(
    'wheel',
    (event) => {
      // 관성 엔진이 휠을 통째로 가로채는 환경에서는 브라우저의 기본 동작 자체가
      // 일어나지 않으므로 여기서 손댈 게 없다. 두 번 처리하면 두 배로 움직인다
      if (ownsWheel) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      // behavior를 명시하지 않으면 html의 scroll-behavior:smooth를 타서 휠마다 보간이 끼어 끈적해진다
      window.scrollBy({ top: event.deltaY, behavior: 'auto' });
    },
    { passive: false }
  );

  const total = String(cards.length).padStart(2, '0');

  /** 지금 가운데 있는 칸 번호. 복제본 위에 있어도 원본 자리로 되돌린다 */
  const currentIndex = () => {
    const n = slots.length;
    const i = centerIndex();
    return loop ? ((i % n) + n) % n : Math.min(Math.max(i, 0), n - 1);
  };

  const syncCounter = () => {
    const index = currentIndex();
    // 구분 칸은 프로젝트가 아니라 타순이 넘어가는 자리다
    counter.textContent =
      slots[index] === turn ? '타순 교대' : `${String(index + 1).padStart(2, '0')} / ${total}`;
  };

  // ── 스크롤 구동 ──────────────────────────────────────────────
  // film.html에서는 화살표가 아니라 세로 스크롤이 띠를 좌우로 흘린다.
  // 무대를 지나는 진행률(0~1)을 트랙의 가로 위치로 그대로 옮긴다.
  if (stage) stage.style.setProperty('--stage-steps', String(frames.length));

  /**
   * 무대를 지나는 진행률. 0 = 무대 진입, 1 = 무대 이탈
   *
   * 실제 스크롤 위치(rect.top)가 아니라 관성 엔진이 넘겨준 뒤따라오는 값을 쓴다.
   * 그래서 띠가 손끝보다 반 박자 늦게 미끄러지고, 손을 떼면 스르르 안착한다.
   *
   * @param {number} y 보간된 세로 위치
   */
  const stageProgress = (y) => {
    const rect = stage.getBoundingClientRect();
    // rect.top은 스크롤에 따라 변하므로 문서 기준 절대 위치로 되돌린다
    const stageTop = window.scrollY + rect.top;
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) return 0;
    return Math.min(Math.max((y - stageTop) / travel, 0), 1);
  };

  if (scrollDriven) {
    document.documentElement.classList.add('js-scroll-driven');

    let lastIndex = -1;
    // 자체 rAF 루프를 돌리지 않는다. 관성 엔진의 프레임에 얹어야
    // 띠 이동과 원근 휨이 같은 프레임에서 계산돼 서로 어긋나지 않는다
    onScrollFrame((y, velocity) => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;

      const progress = stageProgress(y);
      track.scrollLeft = progress * max;

      const index = Math.min(Math.round(progress * (frames.length - 1)), frames.length - 1);
      // 매 프레임 텍스트를 다시 쓰면 aria-live가 쉴 새 없이 읽는다. 바뀔 때만 갱신
      if (index !== lastIndex) {
        lastIndex = index;
        counter.textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
      }

      warp?.(Math.max(-4, Math.min(4, velocity * 0.05)));
    });
  }

  document.querySelectorAll('[data-lineup]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.lineup === 'next' ? 1 : -1;

      if (scrollDriven) {
        // 위치를 지시하는 주체가 페이지 스크롤이므로, 버튼도 페이지를 움직여야 한다.
        // 트랙을 직접 밀면 다음 스크롤 프레임에 곧바로 되돌아간다.
        const rect = stage.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const stageTop = window.scrollY + rect.top;
        const next = Math.min(Math.max(currentIndex() + dir, 0), frames.length - 1);
        // 엔진을 거쳐야 휠로 굴릴 때와 같은 관성으로 이동한다
        scrollToY(stageTop + (next / (frames.length - 1)) * travel);
        return;
      }

      // 옆 칸을 정확히 가운데로 데려간다. scrollLeft에 폭을 더하는 식으로 하면
      // 스냅이 매번 조금씩 되돌려서 몇 번 누르면 한 칸씩 밀린다
      track.scrollLeft = centerFor(centerIndex() + dir);
      syncCounter();
    });
  });

  if (!scrollDriven) {
    setupLineupDrag(track);
    track.addEventListener('scroll', syncCounter, { passive: true });
    syncCounter();
  }
}

renderHero();
renderProjects();
setupLineup();
renderSkills();
renderPrinciples();
renderContact();
