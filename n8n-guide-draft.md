1. api란 무엇인가?

API
- Application Programming Interface
- 애플리케이션 간 데이터를 주고 받는 규약

n8n 에서 API 연동이 필요한 경우
- 전용 노드가 없는 서비스
- 회사 내부 시스템
- 특수 목적 API
-> HTTP Request 노드로 직접 연동

2. HTTP Request 노드

HTTP Request 노드
- 모든 HTTP API 호출 가능
- GET, POST, PUT, DELETE 모든 메소드 지원
- 커스텀 연동, 테스트, 디버깅 용

주요 HTTP 메소드 [GET]
- GET : 데이터 조회
- 정보를 가져올 때
- 사용자 목록 조회
- 제품 데이터 조회

주요 HTTP 메소드 [POST]
- POST : 데이터 생성
- 새로운 데이터를 만들 때
- 댓글 작성
- 새 사용자 등록

주요 HTTP 메소드 [PUT]
- PUT : 기존 데이터 업데이트
- 사용자 정보 수정
- 제품 정보 업데이트

주요 HTTP 메소드 [DELETE]
- DELETE : 데이터 삭제
- 데이터를 제거할 때
- 사용자 계정 삭제
- 파일 제거

3. API 연동을 위한 팁

연동 전 준비사항
- API 문서 꼼꼼히 읽기
- 어렵다면 GPT랑 같이 읽기
- 샘플 요청 / 응답 확인하기
- 사용량 제한 체크

연동 주의 사항
- 요청 횟수 제한 준수
- 민감한 데이터 로그 주의
- API KEY 보안 관리
- 에러 처리 로직
- 응답 시간 고려

[cURL로 API 연동하기]

1. cURL란 무엇인가?

cURL
- Client URL
- 명령줄에서 HTTP 요청을 보내는 도구
- API 테스트, 데이터 다운로드, 서버 통신
- 모든 운영체제 지원

cURL
- 거의 모든 API DOCS에 설명 존재
- HTTP 노드에서 손쉬운 사용 가능

cURL 옵션
''' 추가 정리 필요 '''

2. CURL 간단 실습

ChatGPT 연동하기
1. chat GPT API Key 발급하기

2. n8n 에서 chat GPT 사용하기
(chat GPT 전용 노드)

3. n8n 에서 chat GPT 사용하기
(import curl)