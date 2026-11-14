/* ===== Station pages (docs/station_screens.md s3): what each F-key screen shows inside the frame of web/station_screens.js.
 * Each page: { tabs: [[id, label]], render(tab, ctx) -> html, soft(tab, ctx) -> softkeys, act(action, arg) }. Inlined after station_screens.js.
 */
(() => {
  if (typeof SCREENS === 'undefined' || !SCREENS.on) return;
  const { PAGES, VIEWS } = SCREENS;
  // interim: the call deck's flat panels inside the frame (replaced station by station)
  const interim = v => ({ tabs: [['main', VIEWS[v].name]], render: () => `<div class="ss-int">${DECK.panelHtml(v)}</div>`, soft: () => [] });
  ['sen', 'fc', 'wpn', 'eng', 'dmg', 'com'].forEach(v => { PAGES[v] = interim(v); });
  PAGES.str = { tabs: [['plan', 'ROUTE']], render: () => '<div class="ss-mapgap"></div>', soft: () => [] };
})();
