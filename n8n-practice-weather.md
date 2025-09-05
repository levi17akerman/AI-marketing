# 실습 #1: 자동 날씨 알림 봇 만들기

## 🎯 실습 목표

n8n의 기본 노드들을 활용하여 매일 자동으로 날씨 정보를 수집하고 Slack으로 알림을 보내는 봇을 만들어봅니다.

**학습할 내용:**
- Schedule Trigger 노드로 자동 실행 설정
- HTTP Request 노드로 외부 API 호출
- Code 노드로 데이터 가공
- Slack 노드로 메시지 전송

## 📋 사전 준비사항

### 1. 공공데이터포털 API 키 발급
1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. '기상청_단기예보 조회서비스' 검색 후 활용신청
3. API 인증키 복사 (일반적으로 즉시 발급)

### 2. Slack 봇 설정
1. [Slack API](https://api.slack.com/apps) 접속
2. "Create New App" → "From scratch" 선택
3. App Name 입력, Workspace 선택
4. OAuth & Permissions 메뉴에서 Bot Token Scopes 추가:
   - `chat:write`
   - `chat:write.public`
5. "Install to Workspace" 클릭
6. Bot User OAuth Token 복사 (xoxb-로 시작)

### 3. 지역별 격자 좌표 확인
기상청 API는 격자 좌표(nx, ny)를 사용합니다:
- 서울 강남구: nx=62, ny=125
- 서울 종로구: nx=60, ny=127
- 대전 서구: nx=67, ny=101
- 부산 해운대구: nx=99, ny=75

> 💡 [기상청 격자 좌표 조회](https://www.weather.go.kr/w/wnuri-fct/weather/sfc-land-pointname.do) 페이지에서 자세한 좌표를 확인할 수 있습니다.

## 🔧 워크플로우 구성

### 전체 워크플로우 구조

```
[Schedule Trigger] → [Date Generator] → [Weather API] → [Weather Processor] → [Send to Slack]
```

## 📝 Step 1: Schedule Trigger 노드

자동 실행 스케줄을 설정합니다.

### 노드 추가
1. n8n 워크플로우 에디터에서 "+" 버튼 클릭
2. "Schedule Trigger" 검색 후 선택

### 설정 방법
**Mode**: Interval 또는 Cron 선택

**Interval 모드 예시:**
- Hours: 1 → 매 1시간마다 실행
- Days: 1, Hour: 7 → 매일 오전 7시 실행

**Cron 모드 예시:**
```
0 7 * * *     → 매일 오전 7시
0 9,18 * * *  → 매일 오전 9시, 오후 6시
0 */3 * * *   → 3시간마다
0 7 * * 1-5   → 평일 오전 7시
```

## 📝 Step 2: Date Generator (Code 노드)

기상청 API에 필요한 날짜 형식(YYYYMMDD)을 생성합니다.

### 노드 추가
1. Schedule Trigger 노드 오른쪽 "+" 클릭
2. "Code" 노드 검색 후 선택

### 코드 입력
```javascript
// 한국 시간 기준으로 날짜 생성
const now = new Date();
const kstOffset = 9 * 60 * 60 * 1000;
const kstTime = new Date(now.getTime() + kstOffset);

const year = kstTime.getFullYear();
const month = String(kstTime.getMonth() + 1).padStart(2, '0');
const day = String(kstTime.getDate()).padStart(2, '0');
const baseDate = `${year}${month}${day}`;

// 시간대별 base_time 설정
const hour = kstTime.getHours();
let baseTime;

if (hour < 2) {
  // 전날 23시 발표 데이터 사용
  baseTime = '2300';
  // baseDate를 전날로 변경
  const yesterday = new Date(kstTime);
  yesterday.setDate(yesterday.getDate() - 1);
  baseDate = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`;
} else if (hour < 5) {
  baseTime = '0200';
} else if (hour < 8) {
  baseTime = '0500';
} else if (hour < 11) {
  baseTime = '0800';
} else if (hour < 14) {
  baseTime = '1100';
} else if (hour < 17) {
  baseTime = '1400';
} else if (hour < 20) {
  baseTime = '1700';
} else if (hour < 23) {
  baseTime = '2000';
} else {
  baseTime = '2300';
}

return [{
  json: {
    baseDate: baseDate,
    baseTime: baseTime
  }
}];
```

## 📝 Step 3: Weather API (HTTP Request 노드)

기상청 API를 호출하여 날씨 데이터를 가져옵니다.

### 노드 추가
1. Date Generator 노드 오른쪽 "+" 클릭
2. "HTTP Request" 노드 검색 후 선택

### 설정 방법

**Method**: GET

**URL**: 
```
http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst
```

**Send Query Parameters**: ON

**Query Parameters**:
| Parameter | Value | 설명 |
|-----------|-------|------|
| serviceKey | YOUR_API_KEY | 공공데이터포털 인증키 |
| numOfRows | 300 | 조회할 데이터 수 |
| pageNo | 1 | 페이지 번호 |
| dataType | JSON | 응답 데이터 타입 |
| base_date | \{\{ $json.baseDate \}\} | 발표 날짜 |
| base_time | \{\{ $json.baseTime \}\} | 발표 시각 |
| nx | 67 | X 격자 좌표 (지역별) |
| ny | 101 | Y 격자 좌표 (지역별) |

> ⚠️ **주의**: serviceKey는 실제 발급받은 API 키로 교체하세요!

## 📝 Step 4: Weather Processor (Code 노드)

API 응답을 파싱하여 읽기 쉬운 메시지로 변환합니다.

### 노드 추가
1. Weather API 노드 오른쪽 "+" 클릭
2. "Code" 노드 검색 후 선택

### 코드 입력
```javascript
// 상태 코드 매핑
const STATUS_OF_SKY = {
  '1': '맑음 ☀️',
  '3': '구름많음 🌤️',
  '4': '흐림 ☁️'
};

const STATUS_OF_PRECIPITATION = {
  '0': '없음',
  '1': '비 🌧️',
  '2': '비/눈 🌨️',
  '3': '눈 ❄️',
  '4': '소나기 🌦️'
};

// 응답 데이터 확인
const response = $json.response;
if (!response || response.header.resultCode !== '00') {
  throw new Error('API 응답 오류: ' + (response?.header?.resultMsg || 'Unknown error'));
}

const items = response.body.items.item;

// 오늘 날짜 구하기
const now = new Date();
const kstOffset = 9 * 60 * 60 * 1000;
const kstTime = new Date(now.getTime() + kstOffset);

// 가장 가까운 미래 시간 찾기
const currentHour = kstTime.getHours();
const nearestTime = String(Math.ceil(currentHour / 3) * 3 * 100).padStart(4, '0');

// 필요한 데이터 추출
const sky = items.find(item => item.category === 'SKY' && item.fcstTime === nearestTime);
const pty = items.find(item => item.category === 'PTY' && item.fcstTime === nearestTime);
const tmn = items.find(item => item.category === 'TMN');
const tmx = items.find(item => item.category === 'TMX');
const currentTmp = items.find(item => item.category === 'TMP' && item.fcstTime === nearestTime);
const humidity = items.find(item => item.category === 'REH' && item.fcstTime === nearestTime);
const windSpeed = items.find(item => item.category === 'WSD' && item.fcstTime === nearestTime);

// 날짜 포맷팅
const currentDate = kstTime.toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

// 메시지 생성
let weatherSummary = `🌈 *오늘의 날씨 정보* 🌈\n\n`;
weatherSummary += `📅 ${currentDate}\n`;
weatherSummary += `📍 위치: 대전광역시 서구\n`;
weatherSummary += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

// 날씨 정보
weatherSummary += `🌤️ 하늘 상태: ${sky ? STATUS_OF_SKY[sky.fcstValue] : '정보 없음'}\n`;
weatherSummary += `💧 강수 형태: ${pty ? STATUS_OF_PRECIPITATION[pty.fcstValue] : '강수 없음'}\n`;
weatherSummary += `🌡️ 현재 기온: ${currentTmp ? currentTmp.fcstValue : 'N/A'}°C\n`;
weatherSummary += `🔽 최저 기온: ${tmn ? tmn.fcstValue : 'N/A'}°C\n`;
weatherSummary += `🔼 최고 기온: ${tmx ? tmx.fcstValue : 'N/A'}°C\n`;
weatherSummary += `💦 습도: ${humidity ? humidity.fcstValue : 'N/A'}%\n`;
weatherSummary += `💨 풍속: ${windSpeed ? windSpeed.fcstValue : 'N/A'}m/s\n`;

// 날씨에 따른 추천 메시지
weatherSummary += `\n━━━━━━━━━━━━━━━━━━━━━\n`;

if (pty && pty.fcstValue !== '0') {
  weatherSummary += '☂️ *오늘은 우산을 꼭 챙기세요!*';
} else if (sky && sky.fcstValue === '1') {
  weatherSummary += '😎 *맑은 날씨예요! 야외 활동하기 좋아요!*';
} else if (tmx && parseInt(tmx.fcstValue) > 30) {
  weatherSummary += '🥵 *더운 날씨예요! 수분 섭취를 충분히 하세요!*';
} else if (tmn && parseInt(tmn.fcstValue) < 5) {
  weatherSummary += '🧥 *쌀쌀한 날씨예요! 따뜻하게 입으세요!*';
} else {
  weatherSummary += '😊 *좋은 하루 보내세요!*';
}

return [{
  json: {
    message: weatherSummary,
    data: {
      sky: sky?.fcstValue,
      precipitation: pty?.fcstValue,
      temperature: {
        current: currentTmp?.fcstValue,
        min: tmn?.fcstValue,
        max: tmx?.fcstValue
      },
      humidity: humidity?.fcstValue,
      windSpeed: windSpeed?.fcstValue
    }
  }
}];
```

## 📝 Step 5: Send to Slack 노드

포맷팅된 날씨 정보를 Slack 채널로 전송합니다.

### 노드 추가
1. Weather Processor 노드 오른쪽 "+" 클릭
2. "Slack" 노드 검색 후 선택

### 설정 방법

**Resource**: Message

**Operation**: Send

**Authentication**: Access Token

**Access Token**: xoxb-YOUR-BOT-TOKEN (Step 2에서 복사한 토큰)

**Select**: Channel Name

**Channel**: #weather (또는 원하는 채널명)

**Message Type**: Text

**Text**: \{\{ $json.message \}\}

**Options**:
- Send as User: OFF
- Link Names: ON
- Markdown: ON

## 🧪 테스트 및 디버깅

### 1. 단계별 테스트

각 노드를 개별적으로 실행하여 테스트:
1. 노드 선택 후 "Execute Node" 클릭
2. Output 탭에서 결과 확인
3. 에러 발생 시 Input/Output 비교

### 2. 전체 워크플로우 테스트

1. 좌측 상단 "Execute Workflow" 클릭
2. 각 노드의 초록색 체크 표시 확인
3. Slack 채널에서 메시지 확인

### 3. 일반적인 문제 해결

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| API 인증 오류 | 잘못된 API 키 | 인코딩 확인, 새 키 발급 |
| 데이터 없음 | numOfRows 부족 | 300 이상으로 설정 |
| Slack 전송 실패 | 봇 권한 부족 | OAuth Scopes 재확인 |
| 시간대 오류 | UTC/KST 차이 | KST 오프셋 적용 |
| channel_not_found | 채널명 오류 | # 포함 여부 확인 |

## 🚀 심화 학습

### 1. 조건부 알림
특정 날씨 조건일 때만 알림:
```javascript
// Weather Processor 노드 끝부분에 추가
if (pty && pty.fcstValue !== '0') {
  // 비가 올 때만 알림
  return [{
    json: {
      shouldNotify: true,
      message: weatherSummary
    }
  }];
}
```

### 2. 여러 지역 동시 조회
Loop 노드를 사용하여 여러 지역 순차 조회:
```javascript
// 지역 목록 정의
const locations = [
  { name: '서울 강남', nx: 62, ny: 125 },
  { name: '대전 서구', nx: 67, ny: 101 },
  { name: '부산 해운대', nx: 99, ny: 75 }
];
```

### 3. 시각화 추가
Chart 노드나 HTML 노드를 활용한 그래프 생성:
- 일주일 기온 변화 그래프
- 강수 확률 차트
- 날씨 아이콘 이미지 추가

### 4. AI 연동
OpenAI 노드를 추가하여 자연스러운 날씨 브리핑:
```javascript
// OpenAI 프롬프트 예시
`다음 날씨 데이터를 바탕으로 친근하고 재미있는 날씨 브리핑을 작성해주세요:
기온: ${temperature}°C
날씨: ${skyStatus}
습도: ${humidity}%`
```

## 📚 추가 자료

- [n8n 공식 문서 - Schedule Trigger](https://docs.n8n.io/nodes/n8n-nodes-base.scheduleTrigger/)
- [기상청 단기예보 API 가이드](https://www.data.go.kr/data/15084084/openapi.do)
- [Slack API - Formatting Messages](https://api.slack.com/reference/surfaces/formatting)
- [n8n Community - Weather Workflows](https://community.n8n.io/c/workflows/8)

## ✅ 체크리스트

실습을 완료했다면 다음 항목들을 확인해보세요:

- [ ] 공공데이터포털 API 키 발급 완료
- [ ] Slack 봇 생성 및 권한 설정 완료
- [ ] Schedule Trigger로 자동 실행 설정
- [ ] HTTP Request로 날씨 API 호출 성공
- [ ] Code 노드로 데이터 가공 완료
- [ ] Slack으로 메시지 전송 성공
- [ ] 전체 워크플로우 자동 실행 확인

---

*축하합니다! 첫 번째 n8n 자동화 워크플로우를 완성했습니다. 다음 실습에서는 더 복잡한 시나리오를 다뤄보겠습니다.*