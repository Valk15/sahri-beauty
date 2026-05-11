// ================================================================
// SAHRI BEAUTY — Google Sheets Setup + Order Webhook
// ================================================================
// HOW TO USE:
//   1. Open your Google Sheet → Extensions → Apps Script
//   2. Delete any existing code, paste this entire file
//   3. Run setupSahriSheet() once (click ▶ Run)
//   4. Deploy as Web App for the webhook (doPost)
//
// SHEETS CREATED:
//   • Orders   — every order logged from the landing page
//   • Dashboard — live KPIs, city breakdown, bundle breakdown
// ================================================================

// ── BRAND COLOURS ───────────────────────────────────────────────
const NAVY  = '#1C2855';
const GOLD  = '#C4932A';
const CREAM = '#F5EDD6';
const LIGHT = '#F9F4E8';

const ORDERS_SHEET    = 'Orders';
const DASHBOARD_SHEET = 'Dashboard';

// ================================================================
// 1. MAIN SETUP — run this once manually
// ================================================================
function setupSahriSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetName('SAHRI BEAUTY — Orders & Dashboard');

  buildOrdersSheet(ss);
  buildDashboardSheet(ss);

  // Move Dashboard to front
  const dash = ss.getSheetByName(DASHBOARD_SHEET);
  ss.setActiveSheet(dash);
  ss.moveActiveSheet(1);

  SpreadsheetApp.getUi().alert('✅ SAHRI BEAUTY dashboard ready!');
}

// ================================================================
// 2. WEBHOOK — receives orders from landing page (doPost)
// ================================================================
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) {
    buildOrdersSheet(ss);
    sheet = ss.getSheetByName(ORDERS_SHEET);
  }

  const data    = JSON.parse(e.postData.contents);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const orderNo = '#' + String(lastRow).padStart(4, '0');
  const newRow  = lastRow + 1;

  sheet.appendRow([
    new Date(),          // A — Timestamp
    orderNo,             // B — Order #
    data.bundle,         // C — Bundle
    Number(data.price),  // D — Price MAD
    data.name,           // E — Customer
    data.phone,          // F — Phone
    data.city,           // G — City
    data.notes || '—',  // H — Notes
    'New'                // I — Status
  ]);

  // Format the new row
  styleDataRow(sheet, newRow, newRow % 2 === 0);
  sheet.getRange(newRow, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange(newRow, 4).setNumberFormat('#,##0 "MAD"');

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', order: orderNo }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// 3. ORDERS SHEET
// ================================================================
function buildOrdersSheet(ss) {
  let sheet = ss.getSheetByName(ORDERS_SHEET);
  if (!sheet) sheet = ss.insertSheet(ORDERS_SHEET);
  else sheet.clear();

  sheet.clearConditionalFormatRules();

  // ── Headers ────────────────────────────────────────────────
  const headers = [
    'Timestamp', 'Order #', 'Bundle', 'Price (MAD)',
    'Customer', 'Phone', 'City', 'Notes', 'Status'
  ];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setValues([headers])
    .setBackground(NAVY)
    .setFontColor(GOLD)
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Arial')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(false, false, true, false, false, false, GOLD, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // ── Column widths ──────────────────────────────────────────
  const colWidths = [155, 80, 195, 110, 155, 135, 125, 195, 110];
  colWidths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // ── Status dropdown ────────────────────────────────────────
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'])
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 9, 998, 1).setDataValidation(statusRule);

  // ── Conditional formatting: Status column ──────────────────
  const statusRange = sheet.getRange('I2:I1000');
  const statusStyles = {
    'New':       { bg: '#DBEAFE', fg: '#1D4ED8' },
    'Confirmed': { bg: '#DCFCE7', fg: '#166534' },
    'Shipped':   { bg: '#FEF9C3', fg: '#854D0E' },
    'Delivered': { bg: '#D1FAE5', fg: '#065F46' },
    'Returned':  { bg: '#FEE2E2', fg: '#991B1B' },
    'Cancelled': { bg: '#F3F4F6', fg: '#6B7280' },
  };
  const cfRules = Object.entries(statusStyles).map(([status, colors]) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(status)
      .setBackground(colors.bg)
      .setFontColor(colors.fg)
      .setBold(true)
      .setRanges([statusRange])
      .build()
  );
  sheet.setConditionalFormatRules(cfRules);

  // ── Timestamp column format ────────────────────────────────
  sheet.getRange('A2:A1000').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange('D2:D1000').setNumberFormat('#,##0 "MAD"');

  // ── Sample rows (shows formatting, delete after testing) ───
  const sample = [
    [new Date('2026-05-10T10:32:00'), '#0001', 'Hammam Bundle (3 jars)', 449, 'Fatima Zahra', '+212612345678', 'Casablanca', '—', 'Delivered'],
    [new Date('2026-05-10T14:17:00'), '#0002', 'Nila Powder (1 jar)',    249, 'Khadija M.',   '+212655544433', 'Rabat',       'Cadeau stp', 'New'],
    [new Date('2026-05-11T09:05:00'), '#0003', 'Bundle 2 jars',          349, 'Meriem B.',    '+212677889900', 'Marrakech',   '—', 'Shipped'],
  ];
  sheet.getRange(2, 1, sample.length, sample[0].length).setValues(sample);
  sample.forEach((_, i) => {
    styleDataRow(sheet, i + 2, i % 2 === 0);
    sheet.getRange(i + 2, 1).setNumberFormat('dd/MM/yyyy HH:mm');
    sheet.getRange(i + 2, 4).setNumberFormat('#,##0 "MAD"');
  });

  Logger.log('Orders sheet ✓');
}

// Helper: style a data row (alternating bg)
function styleDataRow(sheet, row, isAlt) {
  sheet.getRange(row, 1, 1, 9)
    .setBackground(isAlt ? LIGHT : '#FFFFFF')
    .setFontSize(10)
    .setFontFamily('Arial')
    .setVerticalAlignment('middle')
    .setFontColor('#1A1A1A');
  sheet.setRowHeight(row, 30);
}

// ================================================================
// 4. DASHBOARD SHEET
// ================================================================
function buildDashboardSheet(ss) {
  let dash = ss.getSheetByName(DASHBOARD_SHEET);
  if (!dash) dash = ss.insertSheet(DASHBOARD_SHEET);
  else dash.clear();

  dash.clearConditionalFormatRules();
  dash.setHiddenGridlines(true);

  // ── Column widths ──────────────────────────────────────────
  [20, 145, 90, 145, 90, 180, 80, 100, 80, 20].forEach((w, i) =>
    dash.setColumnWidth(i + 1, w)
  );

  // ── Title bar ─────────────────────────────────────────────
  dash.setRowHeight(1, 12);
  dash.setRowHeight(2, 58);
  dash.setRowHeight(3, 8);

  dash.getRange('A1:J1').merge().setBackground(NAVY);
  dash.getRange('A2:J2').merge()
    .setValue('SAHRI BEAUTY  ·  Orders Dashboard')
    .setBackground(NAVY)
    .setFontColor(GOLD)
    .setFontSize(22)
    .setFontWeight('bold')
    .setFontFamily('Georgia')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  dash.getRange('A3:J3').merge().setBackground(GOLD);

  // ── KPI Cards ─────────────────────────────────────────────
  dash.setRowHeight(4, 14);
  dash.setRowHeight(5, 72);
  dash.setRowHeight(6, 28);
  dash.setRowHeight(7, 14);

  const kpis = [
    {
      col: 2, label: '📦  Total Orders',
      formula: '=COUNTA(Orders!B2:B)',
      format: '0'
    },
    {
      col: 4, label: '💰  Revenue (MAD)',
      formula: '=SUMIF(Orders!I2:I,"Delivered",Orders!D2:D)',
      format: '#,##0 "MAD"'
    },
    {
      col: 6, label: '✅  Delivery Rate',
      formula: '=IFERROR(COUNTIF(Orders!I2:I,"Delivered")/COUNTA(Orders!I2:I),0)',
      format: '0.0%'
    },
    {
      col: 8, label: '↩  Return Rate',
      formula: '=IFERROR(COUNTIF(Orders!I2:I,"Returned")/COUNTA(Orders!I2:I),0)',
      format: '0.0%'
    },
  ];

  kpis.forEach(kpi => {
    dash.getRange(5, kpi.col)
      .setFormula(kpi.formula)
      .setNumberFormat(kpi.format)
      .setBackground(NAVY)
      .setFontColor(GOLD)
      .setFontSize(28)
      .setFontWeight('bold')
      .setFontFamily('Georgia')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    dash.getRange(6, kpi.col)
      .setValue(kpi.label)
      .setBackground(GOLD)
      .setFontColor(NAVY)
      .setFontSize(10)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  });

  // ── Section row ───────────────────────────────────────────
  dash.setRowHeight(8, 14);
  dash.setRowHeight(9, 30);

  // City header
  dash.getRange('B9:C9').merge()
    .setValue('🏙  Orders by City')
    .setBackground(NAVY).setFontColor(GOLD)
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Bundle header
  dash.getRange('F9:G9').merge()
    .setValue('📦  Orders by Bundle')
    .setBackground(NAVY).setFontColor(GOLD)
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Status header
  dash.getRange('H9:I9').merge()
    .setValue('🔖  By Status')
    .setBackground(NAVY).setFontColor(GOLD)
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // ── City rows ─────────────────────────────────────────────
  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Agadir', 'Fes', 'Autre'];
  cities.forEach((city, i) => {
    const r = 10 + i;
    dash.setRowHeight(r, 28);
    const isAlt = i % 2 === 0;
    const bg = isAlt ? LIGHT : '#FFFFFF';
    dash.getRange(r, 2)
      .setValue(city).setBackground(bg)
      .setFontSize(10).setHorizontalAlignment('left').setVerticalAlignment('middle');
    dash.getRange(r, 3)
      .setFormula(`=COUNTIF(Orders!G2:G,"${city}")`)
      .setBackground(bg).setFontWeight('bold')
      .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  // ── Bundle rows ───────────────────────────────────────────
  const bundles = [
    ['Hammam Bundle (3 jars)', 'Hammam Bundle*'],
    ['Bundle 2 jars',           'Bundle 2 jars'],
    ['Nila Powder (1 jar)',     'Nila Powder*'],
  ];
  bundles.forEach(([bundleName, searchPattern], i) => {
    const r = 10 + i;
    const isAlt = i % 2 === 0;
    const bg = isAlt ? LIGHT : '#FFFFFF';
    dash.getRange(r, 6)
      .setValue(bundleName).setBackground(bg)
      .setFontSize(10).setHorizontalAlignment('left').setVerticalAlignment('middle');
    dash.getRange(r, 7)
      .setFormula(`=COUNTIF(Orders!C2:C,"*${bundleName.split('(')[0].trim()}*")`)
      .setBackground(bg).setFontWeight('bold')
      .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  // ── Status rows ───────────────────────────────────────────
  const statusData = [
    { label: 'New',       bg: '#DBEAFE' },
    { label: 'Confirmed', bg: '#DCFCE7' },
    { label: 'Shipped',   bg: '#FEF9C3' },
    { label: 'Delivered', bg: '#D1FAE5' },
    { label: 'Returned',  bg: '#FEE2E2' },
    { label: 'Cancelled', bg: '#F3F4F6' },
  ];
  statusData.forEach((s, i) => {
    const r = 10 + i;
    dash.setRowHeight(r, 28);
    dash.getRange(r, 8)
      .setValue(s.label).setBackground(s.bg)
      .setFontSize(10).setHorizontalAlignment('left').setVerticalAlignment('middle');
    dash.getRange(r, 9)
      .setFormula(`=COUNTIF(Orders!I2:I,"${s.label}")`)
      .setBackground(s.bg).setFontWeight('bold')
      .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
  });

  // ── Recent Orders section ──────────────────────────────────
  dash.setRowHeight(17, 14);
  dash.setRowHeight(18, 30);

  dash.getRange('B18:I18').merge()
    .setValue('🕐  Recent Orders')
    .setBackground(NAVY).setFontColor(GOLD)
    .setFontWeight('bold').setFontSize(11)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Column headers for recent orders
  const recentCols = ['Date', 'Order #', 'Bundle', 'MAD', 'Customer', 'Phone', 'City', 'Status'];
  dash.setRowHeight(19, 26);
  dash.getRange(19, 2, 1, recentCols.length)
    .setValues([recentCols])
    .setBackground(GOLD)
    .setFontColor(NAVY)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // QUERY: last 10 orders, newest first
  dash.setRowHeight(20, 28);
  dash.getRange('B20').setFormula(
    '=IFERROR(QUERY(Orders!A2:I,"SELECT A,B,C,D,E,F,G,I ORDER BY A DESC LIMIT 10",0),{"No orders yet","","","","","","",""})'
  );

  // Style recent orders rows
  for (let r = 20; r <= 29; r++) {
    dash.setRowHeight(r, 28);
    dash.getRange(r, 2, 1, 8)
      .setBackground(r % 2 === 0 ? LIGHT : '#FFFFFF')
      .setFontSize(10).setFontFamily('Arial')
      .setVerticalAlignment('middle');
  }
  // Format date + price columns in the recent block
  dash.getRange('B20:B29').setNumberFormat('dd/MM/yyyy');
  dash.getRange('E20:E29').setNumberFormat('#,##0 "MAD"');

  // ── Footer ────────────────────────────────────────────────
  dash.setRowHeight(31, 10);
  dash.setRowHeight(32, 28);
  dash.getRange('A32:J32').merge()
    .setValue('SAHRI BEAUTY  ·  sahribeauty.com  ·  Data updates live from Orders sheet')
    .setBackground(NAVY)
    .setFontColor(GOLD)
    .setFontSize(9)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  Logger.log('Dashboard sheet ✓');
}
