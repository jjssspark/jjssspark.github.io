/**
 * @typedef {Object} ProjectLinks
 * @property {string|null} repo
 * @property {string|null} demo
 * @property {string|null} [notion]
 * @property {string|null} [video] - 시연 영상 URL
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
 * @property {string|null} [image] - 실제 스크린샷 썸네일 경로. 있으면 카드가 호버 시 확장되는 미디어 카드로 렌더링됨
 * @property {ProjectLinks} links
 */

export const profile = {
  name: 'JISU PARK',
  role: 'Full-stack Developer',
  tagline: '쓰는 사람 입장에서 편한 서비스를 만들고, 필요한 곳에 AI를 붙입니다',
  stats: [
    { label: 'PROJECTS', value: 10 },
    { label: 'STACKS', value: 28 },
  ],
  links: {
    email: 'hsyoun585@gmail.com',
    github: 'https://github.com/jjssspark',
    // 티스토리에서 옮겼다. 공개 글이 1개뿐이고 그마저 보호글이라
    // 방문자에게는 빈 블로그로 보였다. 노션에는 프로젝트 문서가 실제로 쌓여 있다
    notion:
      'https://app.notion.com/p/868f6f1e619a83718b4c811fd433b5ae?v=2aaf6f1e619a82bf9e0e08e665859a6a&source=copy_link',
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
      '팀 프로젝트의 회의록·업무·평가 근거를 AI로 하나의 흐름으로 연결하는 협업·평가 보조 웹 플랫폼. 회의록을 올리면 To-Do가 자동으로 뽑혀 업무 보드에 꽂히고, 그 기록이 그대로 기여도 평가 근거가 된다. 6인 팀에서 부팀장을 맡았다.',
    role:
      '실시간 알림(SSE)·회의록 AI 분석 파이프라인·심사자 기여도 평가·마이페이지·CI/CD 배포 게이트. 개인 커밋 356개',
    stack: ['React', 'TypeScript', 'Spring Boot', 'FastAPI', 'LangGraph', 'PostgreSQL', 'Redis', 'Docker'],
    viz: null,
    image: 'assets/img/workflow-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/WorkFlow_AI',
      demo: 'https://t3-workflow-ai.site',
      video: 'https://youtu.be/D5jy2qbKh7g',
      notion:
        'https://app.notion.com/p/WorkFlow_AI-3b1f6f1e619a803a9e5cf884f8d23c05?source=copy_link',
    },
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
    name: 'SalaryCast_AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      'KBO FA 선수의 최근 성적 데이터를 기반으로 예상 연봉을 예측하고 구단별 적정 제시가를 추천하는 XGBoost·LightGBM 앙상블 기반 예측 서비스.',
    role: null,
    stack: ['Python', 'XGBoost', 'LightGBM', 'Streamlit'],
    viz: null,
    image: 'assets/img/salarycast-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/SalaryCast_AI',
      demo: null,
      notion: 'https://app.notion.com/p/SalaryCast_AI-00af6f1e619a82c4b882016d34088dd1?source=copy_link',
    },
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
    image: 'assets/img/truthlens-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/TruthLens',
      demo: null,
      notion: 'https://app.notion.com/p/3b1f6f1e619a80ef90fce2a31236b1d7?source=copy_link',
    },
  },
  {
    id: 'tripmate',
    name: 'TripMate AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      'AI가 목적지·날짜·예산·동행 유형·선호 스타일을 입력받아 Day별 여행 일정(동선·식사시간 고려)을 생성해주는 서비스.',
    role: '팀 프로젝트 종료 후 개인 저장소로 이전 — 인증·AI 파이프라인·배포 전 영역 단독 고도화',
    stack: ['React', 'TypeScript', 'Vite', 'Supabase', 'Gemini API'],
    viz: null,
    image: 'assets/img/tripmate-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/TripMate',
      demo: 'https://tripgather.netlify.app',
      notion: 'https://app.notion.com/p/3b1f6f1e619a80aeb0a8fbc1532d0f73?source=copy_link',
    },
  },
  {
    id: 'diamondscout-ai',
    name: 'DiamondScout AI',
    tier: 'shipped',
    status: 'shipped',
    summary:
      'Statcast 데이터로 다음 구종을 예측하고, RAG+로컬 LLM으로 투수·타자 관점 코칭 리포트와 즉석 Q&A를 제공하는 야구 전력분석 도구.',
    role: '데이터 전처리부터 모델링(RandomForest/LSTM), FAISS RAG·로컬 LLM 연동, Gradio UI까지 전 과정 단독 개발',
    stack: ['Python', 'scikit-learn', 'FAISS', 'Ollama', 'Gradio'],
    viz: null,
    image: 'assets/img/diamondscout-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/DiamondScout-AI',
      demo: 'https://diamondscout-ai.onrender.com',
      notion:
        'https://app.notion.com/p/DiamondScout_AI-3b1f6f1e619a80e887d5ce471c3c972d?source=copy_link',
    },
  },
  {
    id: 'perjury',
    name: '위증 (PERJURY)',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '클루의 추리 룰 위에서 LLM 에이전트 5명을 거짓 반증과 1:1 밀담으로 교란·교섭하는 싱글플레이 웹 추리게임. 설치·로그인·API 키 없이 링크만으로 플레이. NHN Game×AI 해커톤 사전 과제.',
    role: '2인 팀 — UI 전체 설계·구현(화면 14개), CSS 변수 기반 디자인 시스템 직접 구축, 시나리오 4종·직업 10종 콘텐츠와 밸런싱 데이터 작성',
    stack: ['React', 'TypeScript', 'Zustand', 'Cloudflare Workers', 'Claude API'],
    viz: null,
    image: 'assets/img/perjury-home.jpg',
    links: {
      repo: 'https://github.com/rhantj/perjury',
      demo: 'https://rhantj.github.io/perjury/',
      notion:
        'https://app.notion.com/p/Perjury_game-3b1f6f1e619a8065b49aedb4f9872502?source=copy_link',
    },
  },
  {
    id: 'onque',
    name: 'OnQue',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '회의록을 LLM으로 요약하고, 오간 대화에서 「누가 언제까지 무엇을」에 해당하는 약속을 뽑아 추적하는 팀 협업 워크스페이스. @비서 봇에게 물으면 그동안의 기록을 근거로 답한다.',
    role: '컴퓨터공학 캡스톤디자인 3인 팀 — FastAPI 백엔드와 Next.js 프론트 전 구간, JWT 인증·권한, Render/Vercel 배포',
    stack: ['Next.js', 'React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Gemini API'],
    viz: null,
    links: {
      repo: 'https://github.com/jjssspark/OnQue',
      demo: 'https://onque-frontend.vercel.app',
    },
  },
  {
    id: 'zoner',
    name: 'Zoner',
    tier: 'shipped',
    status: 'shipped',
    summary:
      '웹캠으로 학습 집중도를 5초마다 판정하고, 세션이 끝나면 언제 무너졌는지·무엇이 방해했는지를 근거와 함께 리포트로 돌려주는 웹앱. 영상은 서버로 보내지 않고 브라우저 안에서만 추론한다.',
    role: '컴퓨터공학 캡스톤디자인 팀 프로젝트에서 기획 공동 참여·프론트엔드 담당 (우수작품 선정) — 이후 팀 동의를 얻어 단독 고도화. 브라우저 내 비전 추론, RLS 17개 정책 기반 권한 설계, Edge Function 2개, 테스트 276개',
    stack: ['React', 'MediaPipe', 'Supabase', 'PostgreSQL', 'Vercel'],
    viz: null,
    image: 'assets/img/zoner-home.jpg',
    links: {
      repo: 'https://github.com/jjssspark/Zoner',
      demo: 'https://zoner-one.vercel.app',
      notion:
        'https://app.notion.com/p/Zoner-3b1f6f1e619a8022a0edf01e27643063?source=copy_link',
    },
  },
];

/** 기술 스택 — 각 프로젝트의 실제 의존성에서 확인된 것만 */
export const skills = [
  { group: 'Language', items: ['Python', 'TypeScript', 'JavaScript', 'Java'] },
  { group: 'Backend', items: ['FastAPI', 'Spring Boot', 'Flask', 'Celery'] },
  { group: 'Frontend', items: ['React', 'Next.js', 'Tailwind', 'Streamlit', 'Gradio'] },
  { group: 'Data · Infra', items: ['PostgreSQL', 'Redis', 'Supabase', 'Docker', 'GitHub Actions'] },
  { group: 'ML · DL', items: ['PyTorch', 'TensorFlow', 'scikit-learn', 'XGBoost', 'LightGBM', 'YOLOv8', 'MediaPipe'] },
  { group: 'LLM · RAG', items: ['Claude API', 'Gemini API', 'Hugging Face', 'FAISS', 'LangGraph'] },
];

/** 일하는 방식 — 실제 작업에서 반복된 패턴 */
export const principles = [
  {
    title: '증상이 아니라 원인을 찾는다',
    body: '「AI 추천 품질이 나쁘다」의 실제 원인이 AI가 호출조차 되지 않은 것이었던 적이 있다. 화면에 보이는 문구를 코드에서 grep 하는 것부터 시작해, 가설이 틀리면 틀렸다고 기록하고 다음으로 넘어간다.',
  },
  {
    title: '조용히 실패하게 두지 않는다',
    body: '폴백이 정상 응답과 구분되지 않으면 버그가 품질 문제로 위장된다. 부가 기능의 실패가 핵심 API를 죽이지 않도록 경계를 나누고, 폴백은 폴백임이 드러나게 만든다.',
  },
  {
    title: '푼 문제는 기록으로 남긴다',
    body: '원인과 함께 실패한 시도까지 적어둔다. 같은 원인의 문제를 다른 프로젝트에서 처음부터 다시 조사하지 않기 위해서다. 지금까지 24건을 누적했다.',
  },
];

