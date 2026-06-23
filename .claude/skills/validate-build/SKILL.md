---
name: validate-build
description: "점심 처방전 산출물이 엔진과 정확히 맞물리는지 검증하는 체크리스트. 필수 DOM ID, js/data.js 모듈 무결성, fallback 존재, 처방 필드, 태그 교집합 매핑을 점검한다. 데이터/카피 수정 후 정합성 점검, 결과 풀 확장 후 확인 시 사용."
---

# Validate Build — 산출물 정합성 검증 체크리스트

데이터·엔진·DOM이 한 줄로 꿰어지는지 교차 검증한다. 읽기로 끝내지 말고 `node`로 실행해 증명한다. 결과는 항목별 `text`/`passed`/`evidence`로 기록해 `_workspace/02_validator_report.md`에 쓴다.

> 단일 서비스 구조. 멀티샵의 `data-shop` ↔ 파일명 경계면 검증은 없다. 대신 **ES Module 계약**(export/import)과 **DOM ID**를 본다.

## 1. 필수 DOM ID (index.html)

엔진/UI가 `getElementById`로 찾는 ID가 `index.html`에 전부 있어야 한다. `js/ui.js`와 `js/app.js`가 의존하는 18개:

```
landing-screen, quiz-screen, loading-screen, result-screen,
start-btn, progress-text, progress-dots, question-text, options, loading-msg,
result-menu, result-message, rx-dosage, rx-sideeffect, rx-combo,
share-kakao, share-insta, retry-btn
```

검증:
```bash
for id in landing-screen quiz-screen loading-screen result-screen start-btn progress-text progress-dots question-text options loading-msg result-menu result-message rx-dosage rx-sideeffect rx-combo share-kakao share-insta retry-btn; do
  grep -q "id=\"$id\"" index.html && echo "OK $id" || echo "MISSING $id";
done
```

## 2. 모듈 계약 (ES Module)

- `js/data.js`가 `DATA`와 `LOADING_MESSAGES`를 export 하는가.
- `js/engine.js`가 `getResult`를 export 하는가.
- `js/app.js`의 import 경로가 실제 파일과 일치하는가 (`./data.js`, `./engine.js`, `./ui.js`, `./share.js`, `./analytics.js`).

```bash
node -e "
Promise.all([import('./js/data.js'),import('./js/engine.js')]).then(([d,e])=>{
  console.log('DATA export:', !!d.DATA, '| LOADING_MESSAGES:', Array.isArray(d.LOADING_MESSAGES));
  console.log('getResult export:', typeof e.getResult==='function');
}).catch(err=>{console.error('IMPORT FAIL:',err.message);process.exit(1);});
"
```

## 3. 데이터 구조 (DATA)

- `quiz` 배열 길이 3
- 각 `quiz[].options[].tags` 비어있지 않음
- `results`에 `fallback: true` 항목 **정확히 1개**
- 각 비-fallback 결과에 필수 필드: `tags`(비어있지 않음), `menu`, `message`, `dosage`, `sideEffect`, `combo`, `share`

```bash
node -e "
import('./js/data.js').then(({DATA})=>{
  const fb=DATA.results.filter(r=>r.fallback);
  console.log('quiz len:',DATA.quiz.length,DATA.quiz.length===3?'OK':'FAIL');
  console.log('fallback count:',fb.length,fb.length===1?'OK':'FAIL');
  const req=['tags','menu','message','dosage','sideEffect','combo','share'];
  DATA.results.filter(r=>!r.fallback).forEach((r,i)=>{const miss=req.filter(f=>!(f in r)||(f==='tags'&&r.tags.length===0));if(miss.length)console.log('result',i,'MISSING',miss);});
  console.log('field check done');
});
"
```

## 4. 태그 교집합 시뮬레이션 (실제 엔진 import)

가능한 모든 답변 경로를 **실제 `getResult`로** 돌려 분포와 fallback 비율을 본다.

```bash
node -e "
Promise.all([import('./js/data.js'),import('./js/engine.js')]).then(([d,e])=>{
  const {DATA}=d,{getResult}=e;
  const o=DATA.quiz.map(q=>q.options);
  function* P(i,a){if(i===o.length){yield a;return;}for(const x of o[i])yield* P(i+1,a.concat(x.tags));}
  let t=0,f=0;const tally={};
  for(const p of P(0,[])){t++;const r=getResult(p,DATA.results);if(r.fallback)f++;tally[r.menu]=(tally[r.menu]||0)+1;}
  console.log('paths:',t,'fallback:',f,'ratio:',(f/t).toFixed(2));
  console.log('distribution:',JSON.stringify(tally));
});
"
```

**현재 기준선:** 18경로 / fallback 0 / {평양냉면:6, 매운갈비찜:7, 치즈돈까스:5}. fallback 0은 정상(현 데이터 특성, design-menu-data 참고). 특정 메뉴로 과반 쏠리면 WARN → 태그 재조정 검토.

## 5. 카드 이미지화 계약 (Phase 1)

공유율 핵심 기능. 캡처 대상과 공유 진입점이 존재하는지 확인한다.

- `index.html`에 캡처 대상 `.rx-card`가 있는가.
- `js/share.js`가 `shareImage`를 export 하고, `js/app.js`가 `share-insta` 클릭에서 `shareImage(document.querySelector('.rx-card'), ...)`를 호출하는가.
- 결과에 안정 `id`가 있어 공유 URL(`?rx=<id>`) 복원이 가능한가.

```bash
grep -q 'class="rx-card' index.html && echo "OK .rx-card" || echo "MISSING .rx-card"
grep -q 'export async function shareImage' js/share.js && echo "OK shareImage" || echo "MISSING shareImage"
node -e "import('./js/data.js').then(({DATA})=>{const noId=DATA.results.filter(r=>!r.id);console.log('results without id:',noId.length,'(0이면 OK)');})"
```

> 실제 PNG 렌더·Web Share·다운로드는 브라우저에서만 검증 가능 (정적 서버 띄워 결과 화면 → 스토리 공유 버튼). node 검증은 계약(존재 여부)까지다.

## 6. 트래킹 이벤트 계약 (North Star)

공유율을 측정하려면 필수 이벤트가 코드에서 호출돼야 한다. 6종이 `js/` 소스에 존재하는지 확인한다:

```
quiz_start, question_answered, result_view, share_click, image_save, retry
```

```bash
for ev in quiz_start question_answered result_view share_click image_save retry; do
  grep -rq "'$ev'" js/ && echo "OK $ev" || echo "MISSING $ev";
done
```

> `js/analytics.js`의 `track()`이 gtag/dataLayer로 전송한다. GA4 미연결 시 개발 콘솔로만 떨어지므로, 측정 ID 연결 여부도 함께 확인한다 (index.html gtag 스니펫).

## 판정 및 보고

- 1~3 중 하나라도 FAIL → 전체 FAIL. 책임 위치 명시 (DOM=index.html, 모듈 계약=js/*.js, 데이터 구조/태그=js/data.js).
- 4의 분포가 과도하게 쏠리면 WARN → content-designer 재검토 권고.
- 보고서 형식:

```markdown
# Validation Report — 점심 처방전
| 항목 | passed | evidence |
|------|--------|----------|
| 필수 DOM ID 18개 | true | 모두 grep 확인 |
| 모듈 export/import | true | DATA·LOADING_MESSAGES·getResult import 성공 |
| fallback 1개 | true | results에 fallback:true 1건 |
| 태그 매핑 | true | paths 18, fallback 0, 분포 균형 |

판정: PASS
```
