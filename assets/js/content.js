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
      '팀 프로젝트의 회의록·업무·평가 근거를 AI로 하나의 흐름으로 연결하는 협업·평가 보조 웹 플랫폼. 회의록을 올리면 To-Do가 자동으로 뽑혀 업무 보드에 꽂히고, 그 기록이 그대로 기여도 평가 근거가 된다. 6인 팀에서 부팀장을 맡았다.',
    role:
      '실시간 알림(SSE)·회의록 AI 분석 파이프라인·심사자 기여도 평가·마이페이지·CI/CD 배포 게이트. 개인 커밋 357개',
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

export const engineering = [
  {
    title: '실시간 알림이 13곳에서 통째로 발송되지 않던 문제',
    problem:
      '업무 배정·댓글·완료 승인 알림이 실시간으로 뜨지 않았다. DB에는 쌓여서 새로고침하면 보였기 때문에 닷새 동안 아무도 문제로 인식하지 않았다.',
    solution:
      'NotificationService에 이름이 비슷한 메서드가 둘 있었다 — notify()는 DB 저장만, notifyAfterCommit()이 SSE 발송까지 담당한다. 호출부 13곳이 전부 앞쪽을 쓰고 있어 실시간 경로를 타는 곳이 사실상 없었다. 13곳을 교체하면서, SSE의 비동기 재처리(ASYNC dispatch) 때 JwtAuthenticationFilter가 기본 스킵돼 SecurityContext가 비던 문제도 shouldNotFilterAsyncDispatch()로 함께 잡았다.',
    commits: ['982edb83'],
    repo: 'https://github.com/jjssspark/WorkFlow_AI',
  },
  {
    title: '부수 작업이 본 작업의 트랜잭션을 무너뜨리던 문제',
    problem:
      '심사자 활동 로그 저장이 실패하면 평가 확정·점수 저장 API 전체가 500으로 죽었다. 곁다리 기록이 본 작업을 되돌리면 안 되는데 되돌리고 있었다.',
    solution:
      'try/catch로 감싸는 것만으로는 통하지 않는다 — JPA save()의 예외가 트랜잭션 경계를 빠져나가는 순간 rollback-only로 마킹돼 커밋이 이미 실패로 예정된다. REQUIRES_NEW도 커밋이 AOP 프록시에서 메서드 반환 뒤에 일어나 메서드 안 try/catch의 사정권 밖이다. TransactionTemplate.executeWithoutResult()로 커밋을 같은 메서드 안으로 가져와 격리했다.',
    commits: ['7aab8dd7'],
    repo: 'https://github.com/jjssspark/WorkFlow_AI',
  },
  {
    title: '내부 AI 엔드포인트가 게이트웨이를 우회해 직접 호출되던 문제',
    problem:
      '서비스 간 공유 시크릿(X-Internal-Api-Key) 검증이 RAG·Assistant 엔드포인트에만 걸려 있었다. docker-compose로 노출된 FastAPI 8000 포트를 통해 Spring 게이트웨이를 건너뛴 직접 호출이 가능한 상태였다.',
    solution:
      '나머지 엔드포인트(delay·workload·checklist·contribution·meeting) 전체에 같은 검증을 적용하고, verify_internal_api_key를 core/security.py로 옮겨 공용화했다. Spring 쪽 FastAPI 클라이언트 6개에도 헤더를 추가하고, 헤더 전송 검증 테스트와 회귀 테스트를 함께 갱신했다.',
    commits: ['003a4a0c'],
    repo: 'https://github.com/jjssspark/WorkFlow_AI',
  },
  {
    title: '테스트에서만 안 잡히던 401 — Spring Security와 /error forward',
    problem:
      '컨트롤러에서 처리되지 않은 예외에 500이 아니라 401이 반환됐다. MockMvc 기반 테스트로는 재현되지 않아 원인이 오래 드러나지 않았다.',
    solution:
      'ErrorPageFilter가 /error로 내부 forward를 하는데 /error가 SecurityConfig의 permitAll 목록에 없어 그 재요청이 인증에 걸리고 있었다. MockMvc는 이 forward를 시뮬레이션하지 않는다. mock 없이 호출하면 정상(200/400), mock이 예외를 던지면 401이 재현되는 것으로 원인을 확정하고 /error를 permitAll에 추가했다. 같은 PR에서 상태값 불일치("완료" vs "done")와 4xx까지 재시도하던 @Retryable도 함께 잡았다.',
    commits: ['84a9b03b'],
    repo: 'https://github.com/jjssspark/WorkFlow_AI',
  },
  {
    title: '프로젝트 전환 시 이전 요청이 화면을 덮어쓰던 경쟁 조건',
    problem:
      '프로젝트를 전환·생성한 직후 다른 프로젝트의 회의록이 화면에 보였다. 이전 프로젝트로 나간 조회 요청이 뒤늦게 응답하면, 그 응답이 이미 바뀐 현재 화면을 무조건 덮어썼다.',
    solution:
      '응답 시점에 요청 당시의 projectId와 어긋나면 그 응답을 버리도록 currentProjectIdRef 가드를 적용했다. 알림 목록에서 이미 쓰던 패턴과 통일해, 같은 종류의 레이스가 화면마다 제각각 처리되지 않게 했다.',
    commits: ['3caf32f7'],
    repo: 'https://github.com/jjssspark/WorkFlow_AI',
  },
  {
    title: '「AI 추천이 나쁘다」의 정체 — AI가 호출조차 안 되고 있었다',
    problem:
      'AI가 만든 여행 일정의 장소 이름이 전부 「제주도 인기 명소 3」 같은 일반명사로 나왔다. 사용자 눈에는 추천 품질 문제로 보였다.',
    solution:
      '로딩 30초를 맞추려 27초 예산을 주 모델 18초 + 재시도로 나눈 게 화근이었다. 타임아웃으로 실패하면 재시도에 남는 시간이 없어 둘 다 죽고 폴백 목업이 반환됐고, 응답에 표시가 없어 정상 응답과 구분되지 않았다. 프롬프트를 고치던 첫 가설은 틀렸다 — Gemini가 애초에 호출되지 않아 프롬프트는 폴백에 닿지 않는다. 재시도는 빠른 실패(503 등)에만 의미가 있으므로 주 모델에 예산 대부분을 넘기고, 응답에 isFallback을 실어 사용자가 임시 일정임을 알게 했다. 폴백 경로는 API 키를 비운 인스턴스를 별도 포트로 띄워 요금 0으로 검증했다.',
    commits: ['7454238'],
    repo: 'https://github.com/jjssspark/TripMate',
  },
];
