// ============================================================================
// 구글 광고비 자동 입력 — 2단계 (매일 트래커로 자동 전송)  작성 2026-09-21
// ----------------------------------------------------------------------------
// 어디에: 구글 광고(Google Ads) → 도구 → 일괄 작업 → 스크립트 → + → 이 코드 붙여넣기
//         (1단계 스크립트는 그대로 두거나 지워도 됨 — 서로 무관)
// 순서:   이름 "2단계 광고비 자동전송 (트래커)" → 아래 SECRET 채우기 → 저장 → 인증 → 미리보기(로그에 "응답 200" 확인)
//         → 실행 1회 → 스크립트 목록에서 빈도 "매일" 06:00 예약
// 하는 일: 어제까지 최근 7일의 캠페인 유형별 일별 비용을 트래커 /api/adcosts/sync-google 로 POST.
//         트래커 쪽 규칙: 빈 칸만 채움(손으로 넣은 값은 절대 안 덮음), 오늘 제외. 광고 계정은 아무것도 바꾸지 않음.
// 매핑:   SEARCH(검색광고)→구글광고 칸, MULTI_CHANNEL(앱프로모션)→구글 앱광고 칸 (1단계 대조로 확정, 부가세 환산 없음)
// ============================================================================
var TRACKER_URL = 'https://ganpoom-tracker-htkz.vercel.app/api/adcosts/sync-google';
var SECRET = '여기에_CRON_SECRET';   // 트래커 Vercel 환경변수 CRON_SECRET 과 같은 값 (남에게 공유 금지)
var DAYS = 7;                        // 어제부터 거슬러 며칠치를 보낼지 (실패한 날이 있어도 다음 날 메꿔짐)

function main() {
  var tz = AdsApp.currentAccount().getTimeZone();   // 광고 계정 시간대(Asia/Seoul) 기준으로 '어제' 계산
  var now = new Date();
  var until = new Date(now.getTime() - 1 * 86400000);
  var since = new Date(now.getTime() - DAYS * 86400000);
  var SINCE = Utilities.formatDate(since, tz, 'yyyy-MM-dd');
  var UNTIL = Utilities.formatDate(until, tz, 'yyyy-MM-dd');

  var query =
    "SELECT segments.date, campaign.advertising_channel_type, metrics.cost_micros " +
    "FROM campaign " +
    "WHERE segments.date BETWEEN '" + SINCE + "' AND '" + UNTIL + "' " +
    "AND metrics.cost_micros > 0";

  // 구글 쪽 일시 오류("Could not read from Google Ads" — 2026-10-02 05:49 실제 발생) 대비: 30초 간격 최대 3회 재시도
  var report = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    try { report = AdsApp.report(query).rows(); break; }
    catch (e) {
      Logger.log('구글 광고 읽기 실패 ' + attempt + '/3 : ' + e);
      if (attempt === 3) throw e;
      Utilities.sleep(30000);
    }
  }
  var byKey = {};   // "날짜|유형" → 비용(원)
  while (report.hasNext()) {
    var row = report.next();
    var key = row['segments.date'] + '|' + row['campaign.advertising_channel_type'];
    byKey[key] = (byKey[key] || 0) + Number(row['metrics.cost_micros']) / 1000000;
  }

  var rows = [];
  for (var k in byKey) {
    var p = k.split('|');
    rows.push({ date: p[0], type: p[1], cost: Math.round(byKey[k]) });
  }
  rows.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  Logger.log('보낼 범위 ' + SINCE + ' ~ ' + UNTIL + ' (' + rows.length + '행)');
  for (var i = 0; i < rows.length; i++) Logger.log('  ' + rows[i].date + ' ' + rows[i].type + ' = ' + rows[i].cost.toLocaleString());

  if (rows.length === 0) { Logger.log('보낼 비용이 없어 전송 생략'); return; }
  if (SECRET === '여기에_CRON_SECRET') { Logger.log('⚠️ SECRET 을 채우지 않아 전송 생략'); return; }

  var res = UrlFetchApp.fetch(TRACKER_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + SECRET },
    payload: JSON.stringify({ rows: rows }),
    muteHttpExceptions: true,   // 4xx/5xx 여도 예외 대신 응답을 받아 로그로 남김
  });
  var code = res.getResponseCode();
  Logger.log('응답 ' + code + ' : ' + res.getContentText());
  if (code !== 200) throw new Error('트래커 전송 실패 (' + code + ')');   // 실패면 스크립트 이력에 오류로 표시돼 눈에 띔
}
