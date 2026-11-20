# 1조 모임 시간표 (GitHub Pages + Firebase)

AI Healthcare 1조 6명의 모임 가능 시간을 함께 칠하고 취합하는 일정표입니다.

- 기간: 2026년 11월 21일(토) – 26일(목) 14:00 마감, 09:00–23:00, 1시간 단위 (26일은 13:00 칸까지)
- 칠하기: **녹색(온·오프라인 가능)** / **노란색(온라인만)** / **지우기**. 같은 색으로 다시 누르면 지워집니다.
- 취합 결과: 칸별 가능 인원, 전원 가능 칸 표시, 칸을 누르면 명단, 추천 시간대 TOP 5, 결과 텍스트 복사
- 로그인: 이름 선택 + 전화번호 끝 4자리 (`app.js`의 MEMBERS에 등록)
- 데이터는 Firebase Cloud Firestore에 저장·실시간 동기화

## 1. Firebase 설정 (관리자 1회, 약 5분)

1. https://console.firebase.google.com 에서 프로젝트 생성 (Google 애널리틱스는 꺼도 됨)
2. **Firestore Database > 데이터베이스 만들기** → 프로덕션 모드 → 위치 `asia-northeast3 (서울)`
3. **규칙** 탭에 `firestore.rules` 내용을 붙여넣고 **게시**
4. **프로젝트 설정 > 내 앱 > 웹(</>)** 앱 추가 → 나오는 구성값을 `firebase-config.js`에 입력

Authentication 설정은 필요 없습니다.

## 2. GitHub Pages

저장소 **Settings > Pages > Deploy from a branch > `main` / `(root)`** 선택 후
`https://annafedulab-code.github.io/team1-schedule/` 을 팀 채널에 공유합니다.

## 참고

- 끝번호 4자리는 공개 저장소의 `app.js`에 그대로 보입니다. 간이 본인 확인일 뿐 보안 수단이 아니므로, 일정 조율 용도로만 사용하세요.
- 서버 규칙상 링크를 아는 사람은 누구나 기록할 수 있습니다. 모임 확정 후에는 Firestore 규칙의 `create, update`를 `if false`로 바꿔 잠그세요.
- 빈칸은 '불가'와 '미응답'을 구분하지 않습니다.
- 화면 상단에 **저장됨 ✓** 이 보이면 저장이 끝난 것입니다.
