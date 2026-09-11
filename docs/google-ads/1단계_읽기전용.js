// ============================================================================
// 구글 광고비 자동 입력 — 1단계 (읽기 전용 검증)  작성 2026-09-11
// ----------------------------------------------------------------------------
// 어디에: 구글 광고(Google Ads) → 도구 → 일괄 작업 → 스크립트 → + → 이 코드 붙여넣기
// 순서:   이름 입력 → 저장 → 인증(Authorize, 본인 확인 1회) → 미리보기 → "로그" 탭 복사
// 하는 일: 9/1~9/10 캠페인 유형별 일별 비용을 로그로만 출력. 아무것도 바꾸지 않고 어디로도 보내지 않음.
// 목적:   로그를 광고비 페이지 수기값과 대조해 ① 숫자 일치 ② 부가세 기준 ③ 유형→칸 매핑을 확정
//         (예상 매핑: SEARCH=검색 캠페인→구글광고 칸, MULTI_CHANNEL=앱 캠페인→구글 앱광고 칸 — 로그로 확인)
// 주의:   인증하는 구글 계정의 권한으로 계속 돌아감. 장기적으로는 운영자 본인 계정(hyukjune.gp)으로 인증 권장.
//         2026-09-11 기준 그 계정은 새 패스키 보안 지연(6일)으로 인증 불가 → 9/17 이후 재시도.
// ============================================================================
function main() {
  var SINCE = '2026-09-01';
  var UNTIL = '2026-09-10';

  var query =
    "SELECT segments.date, campaign.name, campaign.advertising_channel_type, metrics.cost_micros " +
    "FROM campaign " +
    "WHERE segments.date BETWEEN '" + SINCE + "' AND '" + UNTIL + "' " +
    "AND metrics.cost_micros > 0";

  var rows = AdsApp.report(query).rows();

  var byDate = {};      // 날짜 → { 유형코드 → 비용(원) }
  var namesByType = {}; // 유형코드 → 캠페인 이름들

  while (rows.hasNext()) {
    var row = rows.next();
    var date = row['segments.date'];
    var type = row['campaign.advertising_channel_type'];
    var name = row['campaign.name'];
    var cost = Number(row['metrics.cost_micros']) / 1000000;  // micros → 원

    if (!namesByType[type]) namesByType[type] = {};
    namesByType[type][name] = true;

    if (!byDate[date]) byDate[date] = {};
    byDate[date][type] = (byDate[date][type] || 0) + cost;
  }

  Logger.log('=== 캠페인 유형 코드 → 실제 캠페인 이름 ===');
  for (var t in namesByType) {
    Logger.log('  ' + t + ' : ' + Object.keys(namesByType[t]).join(' / '));
  }

  Logger.log('');
  Logger.log('=== 날짜 | 유형코드=비용(원) ===');
  var dates = Object.keys(byDate).sort();
  for (var i = 0; i < dates.length; i++) {
    var d = dates[i];
    var parts = [];
    for (var ty in byDate[d]) parts.push(ty + '=' + Math.round(byDate[d][ty]).toLocaleString());
    Logger.log(d + ' | ' + parts.join(' , '));
  }
  Logger.log('');
  Logger.log('※ 이 로그 전체를 복사해서 보내주세요.');
}
