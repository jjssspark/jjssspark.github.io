/**
 * @typedef {Object} ProjectLinks
 * @property {string|null} repo
 * @property {string|null} demo
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {'featured'|'shipped'|'coming-soon'} tier
 * @property {'in-play'|'shipped'|'coming-soon'} status
 * @property {string} summary
 * @property {string|null} role
 * @property {string[]} stack
 * @property {'trajectory'|'heatmap'|null} viz
 * @property {ProjectLinks} links
 */

export const profile = {
  name: 'JISU PARK',
  role: 'ML Engineer / Full-stack',
  tagline: '사용자 편의를 고민하는 서비스 개발자',
  stats: [
    { label: 'PROJECTS', value: 11 },
    { label: 'TEAM COMMITS', value: 359 },
    { label: 'STACKS', value: 22 },
  ],
  links: {
    email: 'hsyoun585@gmail.com',
    github: 'https://github.com/jjssspark',
    blog: 'https://qkrwltn.tistory.com',
  },
};

/** @type {Project[]} */
export const projects = [
  {
    id: 'workflow-ai',
    name: 'WorkFlow AI',
    tier: 'featured',
    status: 'in-play',
    summary:
      '팀 프로젝트의 회의·업무·개발 기록·산출물·평가 근거를 AI로 하나의 흐름으로 연결하는 협업·평가 보조 웹 플랫폼. 10인 팀, 441커밋 중 359커밋으로 2위 기여자.',
    role: 'AI 어시스턴트(RAG 챗봇), 대시보드 지연위험도 분석, CI/CD 배포 게이트',
    stack: ['React', 'TypeScript', 'Spring Boot', 'FastAPI', 'LangGraph', 'Redis'],
    viz: null,
    links: { repo: 'https://github.com/rhantj/work-flow', demo: null },
  },
  {
    id: 'jivis',
    name: 'JIVIS',
    tier: 'featured',
    status: 'shipped',
    summary:
      '카카오톡 스타일 UI로 대화하는 Claude 기반 개인 AI 비서. 이름과 말투를 기억하고, 대화를 이어받는다.',
    role: '기획부터 구현까지 단독 완결',
    stack: ['Python', 'Streamlit', 'Claude API'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/JIVIS', demo: null },
  },
  {
    id: 'pitchiq',
    name: 'PitchIQ',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '이전 투구 패턴과 경기 상황을 분석해 다음 구종을 예측하고, 실제 중계 영상과 연동해 투구 타이밍까지 자동 감지하는 MLB 투구 분석 서비스.',
    role: null,
    stack: ['Python', 'TensorFlow', 'YOLOv8', 'Streamlit'],
    viz: 'trajectory',
    links: { repo: 'https://github.com/jjssspark/DL_Pitcher', demo: null },
  },
  {
    id: 'stovelens-ai',
    name: 'StoveLens AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      'KBO FA 선수의 최근 성적 데이터를 기반으로 예상 연봉을 예측하고 구단별 적정 제시가를 추천하는 XGBoost 기반 예측 서비스.',
    role: null,
    stack: ['Python', 'XGBoost', 'Streamlit'],
    viz: 'heatmap',
    links: { repo: 'https://github.com/jjssspark/SalaryCast_AI', demo: 'https://stovelens-ai.streamlit.app/' },
  },
  {
    id: 'truthlens',
    name: 'TruthLens',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '영상·이미지·뉴스·논문의 AI 생성 여부를 판별하고 신뢰 지표와 판별 근거를 시각화하는 AI 생성 콘텐츠 판별 서비스.',
    role: null,
    stack: ['Python', 'Flask', 'MariaDB', 'Redis', 'Celery'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/TruthLens', demo: null },
  },
  {
    id: 'tripmate',
    name: 'TripMate AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '여행지·일정·예산·동행 유형과 선호 스타일을 입력하면 AI가 동선과 식사 시간대까지 고려한 여행 일정을 생성해주는 AI 여행 플래너.',
    role: null,
    stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'Gemini API'],
    viz: null,
    links: { repo: 'https://github.com/jjssspark/TripMate', demo: 'https://tripgather.netlify.app' },
  },
  {
    id: 'diamondscout-ai',
    name: 'DiamondScout AI',
    tier: 'shipped',
    status: 'shipped',
    summary: 'Gradio 기반 UI로 야구 선수 스카우팅 데이터를 분석하는 도구.',
    role: null,
    stack: ['Python', 'Gradio'],
    viz: null,
    links: { repo: null, demo: null },
  },
  {
    id: 'perjury',
    name: '위증 (PERJURY)',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '클루의 추리 룰 위에서 LLM 에이전트 5명을 거짓 반증과 1:1 밀담으로 교란·교섭하는 싱글플레이 웹 추리게임. NHN Game×AI 해커톤 사전 과제.',
    role: null,
    stack: ['React', 'TypeScript', 'Claude API'],
    viz: null,
    links: { repo: 'https://github.com/rhantj/perjury', demo: null },
  },
  {
    id: 'univ',
    name: 'UniRoad',
    tier: 'shipped',
    status: 'shipped',
    summary: '대학생 인증 기반으로 커뮤니티·채팅·중고거래를 한 앱에서 제공하는 대학생 전용 모바일 서비스.',
    role: null,
    stack: ['React Native', 'Expo', 'TypeScript', 'Firebase'],
    viz: null,
    links: { repo: 'https://github.com/UNIROAD-KR/Frontend', demo: null },
  },
  {
    id: 'onque',
    name: 'OnQue',
    tier: 'coming-soon',
    status: 'coming-soon',
    summary: 'FastAPI와 Gemini API를 연동한 서비스. 준비 중입니다.',
    role: null,
    stack: [],
    viz: null,
    links: { repo: null, demo: null },
  },
  {
    id: 'zoner',
    name: 'Zoner',
    tier: 'coming-soon',
    status: 'coming-soon',
    summary: 'React 기반 서비스. 준비 중입니다.',
    role: null,
    stack: [],
    viz: null,
    links: { repo: null, demo: null },
  },
];

export const engineering = [
  {
    title: 'RAG 임베딩 LoRA 파인튜닝',
    problem:
      'HF Inference API는 서버리스라 커스텀(파인튜닝) 임베딩 모델을 서빙하지 못해, RAG 검색이 쿼리 노이즈에 취약한 상태로 원격 API에 묶여 있었다.',
    solution:
      'BAAI/bge-m3에 쿼리 노이즈 강건성 실험을 담은 LoRA 파인튜닝을 적용해 병합한 모델을 HF Hub에 올리고, 컨테이너 내부 로컬 추론(sentence-transformers)으로 전환했다.',
    commits: ['d12dd8f0'],
    repo: 'https://github.com/rhantj/work-flow',
  },
  {
    title: 'Isolation Forest 3축 독립 판정 구조',
    problem: '이상치 탐지 로직이 축마다 제각각 구현되어 있어 판정 기준을 한 곳에서 검증하기 어려웠다.',
    solution: 'Isolation Forest 판정 경로를 compute_axis_results 기반 3축 독립 판정 구조로 통일했다.',
    commits: ['2468029e'],
    repo: 'https://github.com/rhantj/work-flow',
  },
  {
    title: 'RAG·대시보드 비동기 처리 Redis Queue 전환',
    problem:
      'RAG 챗봇 응답과 대시보드 지연위험도·업무편중 재분석이 요청 스레드에서 동기 처리되어, 처리 시간이 길어질수록 API가 그대로 블로킹됐다.',
    solution:
      'RagQueueWorker/DashboardAiQueueWorker가 Redis Stream을 컨슈머 그룹으로 소비하도록 분리하고, 큐 포화·타임아웃 전용 에러를 추가했다. 동시 재분석 요청은 in-flight 마커로 병합하고, 완료 시 SSE로 알린다.',
    commits: ['da307984', '09f390b9'],
    repo: 'https://github.com/rhantj/work-flow',
  },
  {
    title: 'CI 배포 게이트',
    problem:
      'FastAPI 테스트 워크플로가 배포 잡의 needs에 없어 테스트가 깨져도 배포가 나갈 수 있었고(2026-08-01 실제 발생), 마이그레이션 버전 중복도 PR 단위로는 보이지 않아 dev/main이 배포 불가 상태가 된 적이 있다(2026-07-27).',
    solution:
      'FastAPI 테스트를 workflow_call로 배포 게이트에 편입하고, 마이그레이션 버전 중복 검사를 스크립트 하나로 통일해 deploy 잡의 test 단계에 물렸다.',
    commits: ['db8fd9bc', 'c6f5b5b2'],
    repo: 'https://github.com/rhantj/work-flow',
  },
];
