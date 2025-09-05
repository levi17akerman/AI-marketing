# n8n 자동화 가이드

## 📚 API 기초 이해하기

### API란 무엇인가?

**API (Application Programming Interface)**는 서로 다른 애플리케이션 간에 데이터를 주고받을 수 있도록 하는 규약입니다. 마치 레스토랑에서 웨이터가 주방과 손님 사이를 연결하는 것처럼, API는 서로 다른 시스템 간의 중개자 역할을 합니다.

### n8n에서 API 연동이 필요한 경우

n8n은 수많은 서비스에 대한 전용 노드를 제공하지만, 다음과 같은 경우 직접 API 연동이 필요합니다:

- **전용 노드가 없는 서비스**: 아직 n8n이 지원하지 않는 새로운 서비스
- **회사 내부 시스템**: 자체 개발한 사내 시스템이나 커스텀 솔루션
- **특수 목적 API**: 특별한 요구사항이 있는 맞춤형 API

이런 경우 **HTTP Request 노드**를 사용하여 직접 API를 호출할 수 있습니다.

## 🔧 HTTP Request 노드 마스터하기

### HTTP Request 노드란?

HTTP Request 노드는 n8n의 가장 강력하고 유연한 노드 중 하나입니다:

- ✅ 모든 HTTP API 호출 가능
- ✅ GET, POST, PUT, DELETE 등 모든 메소드 지원
- ✅ 커스텀 헤더, 인증, 바디 설정 가능
- ✅ 테스트 및 디버깅 용이

### 주요 HTTP 메소드 이해하기

#### 📖 GET - 데이터 조회
정보를 가져올 때 사용합니다.

**사용 예시:**
- 사용자 목록 조회
- 제품 데이터 가져오기
- 상태 확인

```http
GET https://api.example.com/users
```

#### ✍️ POST - 데이터 생성
새로운 데이터를 만들 때 사용합니다.

**사용 예시:**
- 새 사용자 등록
- 댓글 작성
- 주문 생성

```http
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "홍길동",
  "email": "hong@example.com"
}
```

#### 🔄 PUT - 데이터 업데이트
기존 데이터를 수정할 때 사용합니다.

**사용 예시:**
- 사용자 정보 수정
- 제품 정보 업데이트
- 설정 변경

```http
PUT https://api.example.com/users/123
Content-Type: application/json

{
  "name": "홍길동",
  "email": "newemail@example.com"
}
```

#### 🗑️ DELETE - 데이터 삭제
데이터를 제거할 때 사용합니다.

**사용 예시:**
- 사용자 계정 삭제
- 파일 제거
- 임시 데이터 정리

```http
DELETE https://api.example.com/users/123
```

## 💡 API 연동을 위한 실전 팁

### 연동 전 준비사항

#### 1. API 문서 철저히 분석하기
- 📋 엔드포인트 URL 확인
- 🔑 필요한 인증 방식 파악
- 📊 요청/응답 형식 이해
- ⚠️ 사용량 제한 확인

> 💡 **Pro Tip**: API 문서가 어렵다면 ChatGPT와 함께 읽어보세요! API 문서 링크를 공유하고 이해가 안 되는 부분을 질문하면 쉽게 설명해줍니다.

#### 2. 샘플 요청/응답 테스트
실제 연동 전에 Postman이나 cURL로 테스트해보세요:
- 정상 응답 확인
- 에러 응답 형태 파악
- 응답 시간 측정

### 연동 시 주의사항

#### 🚦 요청 횟수 제한 (Rate Limiting)
대부분의 API는 분당/시간당 요청 횟수를 제한합니다:
- 제한 초과 시 429 에러 발생
- n8n의 Wait 노드로 속도 조절
- 배치 처리 시 특히 주의

#### 🔒 보안 관리
- **API 키 관리**: n8n의 Credentials 기능 활용
- **민감 데이터**: 로그에 노출되지 않도록 주의
- **HTTPS 사용**: 항상 보안 연결 사용

#### ⚡ 성능 최적화
- **타임아웃 설정**: 적절한 응답 시간 설정
- **재시도 로직**: 실패 시 자동 재시도 구현
- **에러 처리**: Try/Catch 노드로 에러 관리

## 🛠️ cURL로 API 연동하기

### cURL이란?

**cURL (Client URL)**은 명령줄에서 HTTP 요청을 보내는 강력한 도구입니다:

- 🌍 모든 운영체제에서 사용 가능
- 📚 거의 모든 API 문서에 예제 제공
- 🔄 n8n의 HTTP Request 노드로 쉽게 변환 가능

### cURL 주요 옵션

| 옵션 | 설명 | 예시 |
|------|------|------|
| `-X` | HTTP 메소드 지정 | `-X POST` |
| `-H` | 헤더 추가 | `-H "Content-Type: application/json"` |
| `-d` | 데이터 전송 | `-d '{"key":"value"}'` |
| `--data-raw` | Raw 데이터 전송 | `--data-raw '{"name":"test"}'` |
| `-u` | 인증 정보 | `-u username:password` |
| `--location` | 리다이렉트 따라가기 | `--location` |

### cURL을 n8n으로 변환하기

n8n은 cURL 명령을 직접 가져올 수 있는 기능을 제공합니다:

1. HTTP Request 노드 추가
2. "Import cURL" 버튼 클릭
3. cURL 명령 붙여넣기
4. 자동 변환 완료!

## 🤖 실습: ChatGPT API 연동하기

### Step 1: API Key 발급

1. [OpenAI Platform](https://platform.openai.com) 접속
2. API Keys 메뉴 선택
3. "Create new secret key" 클릭
4. 키 안전하게 보관

### Step 2: n8n에서 ChatGPT 전용 노드 사용

n8n은 OpenAI를 위한 전용 노드를 제공합니다:

1. **OpenAI 노드 추가**
2. **Credentials 설정**: API Key 입력
3. **Operation 선택**: Chat, Completion, Image 등
4. **Parameters 설정**: 
   - Model: gpt-3.5-turbo 또는 gpt-4
   - Temperature: 창의성 조절 (0-2)
   - Max Tokens: 응답 길이 제한

### Step 3: HTTP Request 노드로 직접 연동

cURL 명령을 사용한 직접 연동:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "안녕하세요!"
      }
    ],
    "temperature": 0.7
  }'
```

이 cURL 명령을 n8n의 HTTP Request 노드에서 Import cURL 기능으로 가져오면 자동으로 설정됩니다.

## 📝 워크플로우 예제

### 간단한 API 연동 워크플로우

```
[Manual Trigger] → [HTTP Request] → [Set] → [Response]
```

1. **Manual Trigger**: 수동으로 워크플로우 시작
2. **HTTP Request**: API 호출
3. **Set**: 응답 데이터 가공
4. **Response**: 결과 반환

### 에러 처리가 포함된 워크플로우

```
[Trigger] → [Try] → [HTTP Request] → [Success Path]
                 ↓
            [Catch] → [Error Handler] → [Notification]
```

## 🎯 다음 단계

API 연동의 기초를 마스터했다면:

1. **Webhook 활용하기**: 외부 서비스에서 n8n 트리거
2. **인증 방식 깊이 알기**: OAuth2, JWT 등
3. **복잡한 워크플로우 구성**: 다중 API 연동
4. **에러 처리 고도화**: 재시도, 폴백 전략

## 📚 추가 학습 자료

- [n8n 공식 문서](https://docs.n8n.io)
- [HTTP Request 노드 가이드](https://docs.n8n.io/nodes/n8n-nodes-base.httpRequest)
- [API 연동 베스트 프랙티스](https://docs.n8n.io/courses/level-two/)

---

*이 가이드는 지속적으로 업데이트됩니다. 질문이나 제안사항이 있으시면 언제든 문의해주세요!*