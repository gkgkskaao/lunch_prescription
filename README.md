# 점심 처방전

> "결정장애는 질병입니다. 약은 약사에게, 점심은 점심 처방전에!"

## 로컬 실행

ES Module(`type="module"`)을 사용하므로 **정적 서버**가 필요합니다. `file://`로 직접 열면 CORS 오류가 발생합니다.

```bash
# 방법 1 — npx serve (Node.js 설치된 경우)
npx serve .

# 방법 2 — Python 3
python -m http.server 8080

# 방법 3 — VS Code Live Server 확장
# index.html 우클릭 → "Open with Live Server"
```

서버 실행 후 브라우저에서 `http://localhost:3000`(또는 해당 포트) 접속.

## 파일 구조

```
lunch_prescription/
├── index.html          # 마크업 진입점 (163줄)
├── css/
│   └── style.css       # 처방전 커스텀 CSS (절취선·바코드·스피너·토스트)
└── js/
    ├── data.js         # 퀴즈·결과 데이터 (콘텐츠 수정 시 여기만)
    ├── engine.js       # 태그 매칭 순수 함수 (getResult)
    ├── ui.js           # DOM 조작 (show·showQuestion·renderResult·toast)
    ├── share.js        # 공유 로직 (카드 PNG 이미지화 + 카카오)
    ├── url.js          # 공유 URL 인코딩/복원 (?rx=<id>)
    ├── analytics.js    # 이벤트 트래킹 (gtag/dataLayer 래퍼)
    └── app.js          # 진입점: 상태 + 이벤트 바인딩 + URL 복원
```

개발 가이드·엔진 계약·작업 도구는 [CLAUDE.md](CLAUDE.md) 참고.

## 콘텐츠 수정

메뉴·질문·카피를 바꾸려면 [js/data.js](js/data.js)만 편집하면 됩니다. 코드 로직은 건드릴 필요 없습니다.

## 개발 로드맵

자세한 계획은 [plan.md](plan.md) 참고.

- **Phase 0** ✅ 코드 분리 리팩토링 (완료)
- **Phase 1** 🚧 카드 이미지화·트래킹·공유 URL 코드완료 / 외부 키·에셋 연결 잔여
- **Phase 2** 추천 품질·콘텐츠 확장
- **Phase 3** 데이터 외부화·배포 기반
