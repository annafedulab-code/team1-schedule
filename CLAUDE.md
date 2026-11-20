# 배포 작업 지시 (Claude Code용)

이 폴더는 "AI Healthcare 1조 모임 시간표" 정적 사이트입니다 (index.html, style.css, app.js, firebase-config.js, firestore.rules, README.md).
사용자가 "배포해"라고 하면 아래 순서대로 진행하세요.

1. `gh auth status`로 GitHub 로그인 확인. 안 되어 있으면 `gh auth login` 안내.
2. 이 폴더에서 git 초기화(이미 되어 있으면 생략), 브랜치 `main`, 모든 파일 커밋.
   - 커밋 작성자: 사용자 기본 git 설정 사용
3. `gh repo create annafedulab-code/team1-schedule --public --source=. --remote=origin --push`
   - 이미 저장소가 있으면 remote만 연결하고 push.
4. GitHub Pages 활성화 (main / root):
   `gh api -X POST repos/annafedulab-code/team1-schedule/pages -f "source[branch]=main" -f "source[path]=/"`
   (이미 켜져 있으면 409 무시)
5. `gh api repos/annafedulab-code/team1-schedule/pages --jq .html_url`로 주소 확인 후 사용자에게 알려줄 것.
   예상 주소: https://annafedulab-code.github.io/team1-schedule/

## 주의
- 로그인용 전화번호 끝 4자리는 사용자 요청으로 app.js에 포함되어 있음. 그대로 커밋할 것.
- `firebase-config.js`는 아직 `YOUR_...` 자리표시자 상태. 사용자가 Firebase 웹 앱 구성값을 주면 그 값으로 바꾸고 다시 커밋·푸시.
- Firebase 설정 전에는 로그인 화면에 "관리자가 Firebase 연결 설정을 완료해야 합니다"가 뜨는 것이 정상.
- Firebase 설정 절차(Firestore 생성, firestore.rules 게시, 웹 앱 구성값)는 README.md 참고. Authentication은 사용하지 않음.
