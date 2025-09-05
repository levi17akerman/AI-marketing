주제: n8n 기본 노드 활용법
목표: 기본 노드를 사용해서 자동 일기예보 알림을 슬랙 채널에 구성한다
- 트리거 노드
- http 노드
- code 노드
- API 개념
- slack 노드

<artifacts>
<artifact id="n8n-weather-bot-guide" type="text/markdown" title="n8n 날씨 알림 자동화 구축 가이드">
# n8n을 활용한 날씨 알림 자동화 구축 가이드
n8n 워크플로우 구성
워크플로우 구조
[Schedule Trigger] → [Date Generator] → [Weather API] → [Weather Processor] → [Send to Slack]
1. Schedule Trigger 노드
목적: 워크플로우 자동 실행 스케줄링
json{
  "parameters": {
    "rule": {
      "interval": [{
        "field": "hours",
        "hoursInterval": 1
      }]
    }
  },
  "type": "n8n-nodes-base.scheduleTrigger",
  "typeVersion": 1.2,
  "id": "59579f4c-4d2e-40ba-a915-71f742819c54",
  "name": "Schedule Trigger"
}
Cron 표현식 예시:

0 7 * * *: 매일 오전 7시
0 */3 * * *: 3시간마다
0 9,18 * * 1-5: 평일 오전 9시, 오후 6시

2. Date Generator (Code 노드)
목적: 기상청 API에 필요한 날짜 포맷 생성 (YYYYMMDD)
javascript// 한국 시간 기준으로 날짜 생성
const now = new Date();
const kstOffset = 9 * 60 * 60 * 1000;
const kstTime = new Date(now.getTime() + kstOffset);

const year = kstTime.getFullYear();
const month = String(kstTime.getMonth() + 1).padStart(2, '0');
const day = String(kstTime.getDate()).padStart(2, '0');
const baseDate = `${year}${month}${day}`;

return [{
  json: {
    baseDate: baseDate  // 출력: 20250905
  }
}];
3. Weather API (HTTP Request 노드)
목적: 기상청 API 호출하여 날씨 데이터 수집
json{
  "parameters": {
    "url": "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {"name": "serviceKey", "value": "YOUR_API_KEY"},
        {"name": "numOfRows", "value": "300"},
        {"name": "pageNo", "value": "1"},
        {"name": "dataType", "value": "JSON"},
        {"name": "base_date", "value": "={{ $json.baseDate }}"},
        {"name": "base_time", "value": "0200"},
        {"name": "nx", "value": "67"},
        {"name": "ny", "value": "101"}
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2
}
주요 파라미터 설명:

serviceKey: 공공데이터포털에서 발급받은 인증키
numOfRows: 한 번에 조회할 데이터 수 (300 이상 권장)
nx, ny: 격자 좌표 (지역별로 다름)

서울 강남: nx=62, ny=125
대전 서구: nx=67, ny=101


base_time: 예보 발표 시각 (0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)

4. Weather Processor (Code 노드)
목적: API 응답 데이터 파싱 및 메시지 포맷팅
javascript// 상수 정의
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

// 입력 데이터 파싱
const response = $json.response;
if (!response || response.header.resultCode !== '00') {
  throw new Error('API 응답 오류: ' + (response?.header?.resultMsg || 'Unknown error'));
}

const items = response.body.items.item;

// 필요한 데이터 추출
const sky = items.find(item => item.category === 'SKY' && item.fcstTime === '0600');
const pty = items.find(item => item.category === 'PTY' && item.fcstTime === '0600');
const tmn = items.find(item => item.category === 'TMN');
const tmx = items.find(item => item.category === 'TMX');
const currentTmp = items.find(item => item.category === 'TMP' && item.fcstTime === '0600');
const humidity = items.find(item => item.category === 'REH' && item.fcstTime === '0600');
const windSpeed = items.find(item => item.category === 'WSD' && item.fcstTime === '0600');
const precipitation = items.find(item => item.category === 'PCP' && item.fcstTime === '0600');

// 날짜 포맷팅
const now = new Date();
const kstOffset = 9 * 60 * 60 * 1000;
const kstTime = new Date(now.getTime() + kstOffset);
const currentDate = kstTime.toLocaleDateString('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long'
});

// 메시지 생성
let weatherSummary = `📅 ${currentDate}\n\n`;
weatherSummary += `📍 위치: 대전광역시 서구 월평3동\n`;
weatherSummary += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
weatherSummary += `🌈 하늘 상태: ${sky ? STATUS_OF_SKY[sky.fcstValue] : '정보 없음'}\n`;
weatherSummary += `💧 강수 형태: ${pty ? STATUS_OF_PRECIPITATION[pty.fcstValue] : '강수 없음'}\n`;
weatherSummary += `🌡️ 현재 기온: ${currentTmp ? currentTmp.fcstValue : 'N/A'}°C\n`;
weatherSummary += `🔽 최저 기온: ${tmn ? tmn.fcstValue : 'N/A'}°C\n`;
weatherSummary += `🔼 최고 기온: ${tmx ? tmx.fcstValue : 'N/A'}°C\n`;
weatherSummary += `💦 습도: ${humidity ? humidity.fcstValue : 'N/A'}%\n`;
weatherSummary += `💨 풍속: ${windSpeed ? windSpeed.fcstValue : 'N/A'}m/s\n`;

// 날씨 추천 메시지
let recommendation = '\n━━━━━━━━━━━━━━━━━━━━━\n';
if (pty && pty.fcstValue !== '0') {
  recommendation += '☂️ 오늘은 우산을 챙기세요!';
} else if (sky && sky.fcstValue === '1') {
  recommendation += '😎 맑은 날씨예요! 야외 활동 좋아요!';
} else if (tmx && parseInt(tmx.fcstValue) > 30) {
  recommendation += '🥵 더운 날씨예요! 수분 섭취를 충분히 하세요!';
} else if (tmn && parseInt(tmn.fcstValue) < 5) {
  recommendation += '🧥 쌀쌀한 날씨예요! 따뜻하게 입으세요!';
} else {
  recommendation += '😊 좋은 하루 보내세요!';
}

return [{
  json: {
    fullMessage: weatherSummary + recommendation,
    // 추가 데이터
    metadata: {
      totalCount: response.body.totalCount,
      receivedCount: items.length,
      hasAllData: !!(sky && pty && tmn && tmx)
    }
  }
}];
5. Send to Slack 노드
목적: 포맷팅된 날씨 정보를 Slack 채널에 전송
Slack 앱 설정

api.slack.com/apps에서 새 앱 생성
OAuth & Permissions에서 Scopes 추가:

chat:write
chat:write.public


Install to Workspace 클릭
Bot User OAuth Token 복사 (xoxb-로 시작)

n8n Slack 노드 설정
json{
  "parameters": {
    "authentication": "accessToken",
    "token": "xoxb-YOUR-BOT-TOKEN",
    "select": "channel",
    "channelId": {
      "__rl": true,
      "value": "#weather",
      "mode": "name"
    },
    "messageType": "text",
    "text": "={{ $json.fullMessage }}",
    "otherOptions": {
      "mrkdwn": true
    }
  },
  "type": "n8n-nodes-base.slack",
  "typeVersion": 2.3
}
완전한 워크플로우 JSON
json{
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 1}]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [1408, 16],
      "id": "59579f4c-4d2e-40ba-a915-71f742819c54",
      "name": "Schedule Trigger"
    },
    {
      "parameters": {
        "jsCode": "[Date Generator Code]"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1616, 16],
      "id": "d05910a5-83d2-4d55-90ec-2fd97fe8dc76",
      "name": "Date Generator"
    },
    {
      "parameters": {
        "url": "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst",
        "sendQuery": true,
        "queryParameters": "[API Parameters]"
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1824, 16],
      "id": "fbaca86c-ab1a-46bb-ab23-2abfa3fd7818",
      "name": "Weather API"
    },
    {
      "parameters": {
        "jsCode": "[Weather Processor Code]"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2032, 16],
      "id": "ff037b4a-fe82-4c10-a189-731b04d70356",
      "name": "Weather Processor"
    },
    {
      "parameters": {
        "authentication": "accessToken",
        "token": "xoxb-YOUR-TOKEN",
        "channel": "#weather",
        "text": "={{ $json.fullMessage }}"
      },
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2.3,
      "position": [2240, 16],
      "id": "900f53f9-950e-47ee-aad3-54306278000f",
      "name": "Send to Slack"
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{"node": "Date Generator", "type": "main", "index": 0}]]
    },
    "Date Generator": {
      "main": [[{"node": "Weather API", "type": "main", "index": 0}]]
    },
    "Weather API": {
      "main": [[{"node": "Weather Processor", "type": "main", "index": 0}]]
    },
    "Weather Processor": {
      "main": [[{"node": "Send to Slack", "type": "main", "index": 0}]]
    }
  }
}
문제 해결 가이드
일반적인 오류 및 해결 방법
오류 유형원인해결 방법SERVICE_KEY_IS_NOT_REGISTERED_ERRORAPI 키 문제인코딩/디코딩 확인, 새 키 발급Cannot find name '$node'Code 노드 참조 오류$json 사용 또는 Merge 노드 활용channel_not_foundSlack 채널 미존재채널명에 # 포함 확인not_in_channel봇이 채널에 없음/invite @bot-name 실행데이터 없음numOfRows 부족300 이상으로 설정시간대 오류UTC/KST 차이KST 오프셋 적용
디버깅 팁

Manual Trigger 사용: Schedule 대신 수동 실행으로 테스트
Console.log 활용: Code 노드에서 중간 결과 확인
단계별 실행: 각 노드를 개별적으로 테스트
Expression Editor: {{ }} 문법으로 데이터 참조 테스트

향후 개선 사항
1. OpenAI 연동

자연스러운 날씨 안내 메시지 생성
날씨 기반 맞춤 추천

2. 다중 지역 지원

여러 지역 동시 조회
사용자별 맞춤 지역 설정

3. 조건부 알림

특정 날씨 조건에만 알림
주말/평일 구분 알림

4. 데이터 시각화

Chart.js 연동으로 그래프 생성
주간 날씨 트렌드 분석

참고 자료

n8n 공식 문서
공공데이터포털 API
기상청 격자 좌표
Slack API 문서
JavaScript MDN

프로젝트 메타 정보

작성일: 2025년 9월 5일
n8n 버전: 1.105.4
사용 API: 기상청 단기예보 조회서비스
대상 지역: 대전광역시 서구 월평3동
</artifact>


</artifacts>