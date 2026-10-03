/* My Trip — renders everything from window.TRIP (js/data.js). Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var T = window.TRIP;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  if (!T) {
    var m = $('#main');
    if (m) m.textContent = 'Trip data failed to load (js/data.js).';
    return;
  }

  /* ---------------- storage (always guarded) ---------------- */
  var KEY = 'tc.v1';
  var mem = {};
  function loadState() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : {};
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return mem; }
  }
  function saveState() {
    mem = state;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode etc. */ }
  }
  var state = loadState();
  state.food = state.food || {};
  state.pack = state.pack || {};
  state.opt = state.opt || {};
  var lang = (state.lang === 'zh' || state.lang === 'en') ? state.lang : 'en';

  var reduceMotion = false, finePointer = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
  try { finePointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 860px)').matches; } catch (e) { /* ignore */ }

  /* ---------------- i18n ---------------- */
  var S = {
    skip: { en: 'Skip to content', zh: '跳到正文' },
    langLabel: { en: 'Language', zh: '语言' },
    brand: { en: 'My Trip', zh: '我的旅程' },
    brandSub: { en: 'a love letter on the road', zh: '旅途中的一封情书' },
    navLabel: { en: 'Sections', zh: '分区导航' },
    navDays: { en: 'Days', zh: '行程' },
    navMap: { en: 'Map', zh: '地图' },
    navFood: { en: 'Food', zh: '美食' },
    navInfo: { en: 'Info', zh: '资讯' },
    chipsLabel: { en: 'Jump to day', zh: '跳到某一天' },
    daysHead: { en: 'Day by day', zh: '每日行程' },
    kicker: { en: 'A postcard from the road', zh: '旅途明信片' },
    scroll: { en: 'Scroll', zh: '下滑' },
    heroCredit: { en: 'Photo: Wikimedia Commons', zh: '图片：Wikimedia Commons' },
    cdUnsetT: { en: 'Departure date not set', zh: '尚未设置出发日期' },
    cdUnsetS: { en: 'Set it once and the countdown runs on this phone.', zh: '设置一次，倒数就会在这部手机上运行。' },
    setDate: { en: 'Set departure date', zh: '设置出发日期' },
    changeDate: { en: 'Change date', zh: '修改日期' },
    save: { en: 'Save', zh: '保存' },
    clear: { en: 'Clear', zh: '清除' },
    cancel: { en: 'Cancel', zh: '取消' },
    close: { en: 'Close', zh: '关闭' },
    dateLabel: { en: 'Departure date', zh: '出发日期' },
    departing: { en: 'Departing', zh: '出发日' },
    tomorrow: { en: 'Departing tomorrow!', zh: '明天出发！' },
    fDays: { en: 'Days', zh: '天' },
    fHrs: { en: 'Hrs', zh: '时' },
    fMin: { en: 'Min', zh: '分' },
    jumpToday: { en: 'Jump to today', zh: '跳到今天' },
    welcomeHome: { en: 'Welcome home', zh: '欢迎回家' },
    welcomeHomeS: { en: 'What a trip. Keep the stamps.', zh: '好一趟旅程，把印章留着吧。' },
    flightsHead: { en: 'Boarding passes', zh: '登机牌' },
    flight: { en: 'Flight', zh: '航班' },
    baggage: { en: 'Baggage', zh: '行李' },
    dayN: { en: function (n) { return 'Day ' + n; }, zh: function (n) { return '第 ' + n + ' 天'; } },
    today: { en: 'Today', zh: '今天' },
    mB: { en: 'Breakfast', zh: '早餐' },
    mL: { en: 'Lunch', zh: '午餐' },
    mD: { en: 'Dinner', zh: '晚餐' },
    mIn: { en: 'Included', zh: '包含' },
    mOwn: { en: 'On your own', zh: '自理' },
    mAir: { en: 'On the flight', zh: '机上用餐' },
    mNone: { en: 'None', zh: '无' },
    meals: { en: 'Meals', zh: '用餐' },
    stops: { en: 'Stops', zh: '行程' },
    tagSight: { en: 'Sight', zh: '景点' },
    tagFood: { en: 'Food', zh: '美食' },
    tagFilm: { en: 'Film location', zh: '电影取景地' },
    tagShop: { en: 'Shopping', zh: '购物' },
    tagTravel: { en: 'Travel', zh: '交通' },
    openMap: { en: 'Open in map', zh: '在地图打开' },
    pinLabel: { en: function (n) { return 'Open ' + n + ' in a map app'; }, zh: function (n) { return '在地图应用中打开' + n; } },
    amap: { en: 'Amap 高德', zh: '高德地图' },
    amapNote: { en: 'Best inside mainland China', zh: '中国大陆境内首选' },
    gmaps: { en: 'Google Maps', zh: '谷歌地图' },
    gmapsNote: { en: 'Needs VPN in mainland China', zh: '中国大陆需要 VPN' },
    vibeFuture: { en: 'Future city', zh: '未来之城' },
    vibeOld: { en: 'Old streets', zh: '老街烟火' },
    vibeFilm: { en: 'Film trail', zh: '电影之旅' },
    vibeCity: { en: 'City lights', zh: '都市光影' },
    optTour: { en: 'Optional tour', zh: '自费项目' },
    optJoin: { en: "I'm joining this one", zh: '我要参加' },
    optJoined: { en: "I'm joining ✓", zh: '已决定参加 ✓' },
    hotel: { en: 'Tonight I sleep at', zh: '今晚住宿' },
    homeTonight: { en: 'Home tonight', zh: '今晚回到家' },
    mapHead: { en: 'Route map', zh: '路线图' },
    mapLede: { en: 'Tap a city to jump to that day. Numbers are overnight stops.', zh: '点击城市跳到当天，数字是过夜的天数。' },
    mapAria: { en: 'Hand-drawn route map from Shenzhen through Chaoshan and the Pearl River Delta and back', zh: '手绘路线图：从深圳经潮汕、珠三角再回到深圳' },
    legOver: { en: 'Overnight (day number)', zh: '过夜（第几天）' },
    legFuture: { en: 'Shenzhen', zh: '深圳' },
    legPass: { en: 'Passing through', zh: '途经' },
    legToday: { en: 'Today', zh: '今天' },
    sea: { en: 'South China Sea', zh: '南海' },
    foodHead: { en: 'Food passport', zh: '美食护照' },
    foodLede: { en: 'Tap a dish to stamp it once you have tried it.', zh: '尝过之后，点一下盖个章。' },
    tried: { en: function (a, b) { return a + ' / ' + b + ' tried'; }, zh: function (a, b) { return '已尝 ' + a + ' / ' + b; } },
    passT: { en: 'My food passport', zh: '我的美食护照' },
    stamp: { en: 'TRIED', zh: '已尝' },
    complete: { en: 'Complete', zh: '全部集齐' },
    chaoshan: { en: 'Chaoshan', zh: '潮汕' },
    cantonese: { en: 'Cantonese', zh: '粤菜' },
    packHead: { en: 'Before I go', zh: '出发前清单' },
    packLede: { en: 'My own prep list. Ticks are saved on this phone.', zh: '我自己的准备清单，勾选记录保存在这部手机上。' },
    ready: { en: function (a, b) { return a + ' / ' + b + ' ready'; }, zh: function (a, b) { return '已完成 ' + a + ' / ' + b; } },
    infoHead: { en: 'Trip info', zh: '行程资讯' },
    highlights: { en: 'Highlights', zh: '行程亮点' },
    includes: { en: 'Included', zh: '包含' },
    excludes: { en: 'Not included', zh: '不包含' },
    remarks: { en: 'Remarks from the brochure', zh: '小册子备注' },
    contacts: { en: 'Contacts', zh: '联络方式' },
    call: { en: 'Call', zh: '拨打' },
    whatsapp: { en: 'WhatsApp', zh: 'WhatsApp' },
    callName: { en: function (n) { return 'Call ' + n; }, zh: function (n) { return '致电 ' + n; } },
    waName: { en: function (n) { return 'WhatsApp ' + n; }, zh: function (n) { return 'WhatsApp ' + n; } },
    notes: { en: 'Notes to self', zh: '给自己的提醒' },
    offlineNote: { en: 'Open this page once on Wi-Fi before the trip so it works offline.', zh: '出发前请先用 Wi-Fi 打开一次本页面，之后离线也能使用。' },
    pinNote: { en: 'Map pins are approximate. Confirm exact meeting points with the guide.', zh: '地图标记仅为大概位置，具体集合点请以导游通知为准。' },
    footPhotos: { en: 'Photos: Wikimedia Commons', zh: '图片：Wikimedia Commons' },
    footItin: { en: 'Itinerary: Brighton Travel & Tour (prepared by Amy)', zh: '行程：Brighton Travel & Tour（Amy 编制）' },
    footMine: { en: 'Made for my own trip. Not an official booking page.', zh: '为我自己的旅程而做，并非官方订购页面。' },
    title: { en: 'My trip — ', zh: '我的旅程 — ' }
  };
  function sl(l, key) {
    var v = S[key] && S[key][l];
    if (typeof v === 'function') return v.apply(null, Array.prototype.slice.call(arguments, 2));
    return v == null ? key : v;
  }
  function s(key) {
    var a = Array.prototype.slice.call(arguments, 1);
    return sl.apply(null, [lang, key].concat(a));
  }
  function other() { return lang === 'zh' ? 'en' : 'zh'; }
  function t(o) { return o ? (o[lang] || o.en || o.zh || '') : ''; }
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- helpers ---------------- */
  var TAG_ICON = { sight: '🏛️', food: '🍽️', film: '🎬', shop: '🛍️', travel: '✈️' };
  var TAG_KEY = { sight: 'tagSight', food: 'tagFood', film: 'tagFilm', shop: 'tagShop', travel: 'tagTravel' };
  var VIBE_KEY = { future: 'vibeFuture', old: 'vibeOld', film: 'vibeFilm', city: 'vibeCity' };
  var VIBE_EMOJI = { future: '🌃', old: '🏮', film: '🎬', city: '🌆' };
  var N = T.days.length;

  /* ruyi-cloud / wave ornament inspired by Chaozhou woodcarving (line art, currentColor) */
  var ORN = '<svg class="orn" viewBox="0 0 210 24" aria-hidden="true">' +
    '<path d="M4 12 H70 M140 12 H206"/>' +
    '<path d="M70 12 q6 -9 13 -3 q3 -7 11 -4 q4 -5 11 0 q8 -3 11 4 q7 -6 13 3"/>' +
    '<path d="M80 12 q5 8 12 4 q4 6 13 4 q9 2 13 -4 q7 4 12 -4"/>' +
    '<circle cx="105" cy="11" r="2.4" class="fillc"/>' +
    '<path d="M24 12 q5 -6 10 0 t10 0" opacity=".6"/><path d="M166 12 q5 6 10 0 t10 0" opacity=".6"/></svg>';

  function secHead(key, id, lede) {
    var small = sl(other(), key);
    return '<div class="sec-head reveal"><p class="sh-small' + (other() === 'en' ? ' up' : '') + '" lang="' + (other() === 'zh' ? 'zh-CN' : 'en') + '">' + esc(small) + '</p>' +
      '<h2 id="' + id + '">' + esc(s(key)) + '</h2>' + ORN + (lede ? '<p class="lede">' + esc(lede) + '</p>' : '') + '</div>';
  }

  function photo(src, alt, credit, fbEmoji, fbLabel, cls) {
    var img = src
      ? '<img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' + (/^https?:/.test(src) ? ' crossorigin="anonymous"' : '') + '>'
      : '';
    return '<figure class="ph ' + (cls || '') + (src ? '' : ' failed') + '">' +
      '<span class="ph-fb" aria-hidden="true"><span class="e">' + fbEmoji + '</span><span>' + esc(fbLabel || '') + '</span></span>' +
      img +
      (credit && src ? '<figcaption class="credit">📷 ' + esc(credit) + '</figcaption>' : '') +
      '</figure>';
  }

  function stamp(n) {
    if (lang === 'zh') return '<span class="stamp zh"><small>第</small><b>' + n + '</b><small>天</small></span>';
    return '<span class="stamp"><small>DAY</small><b>' + n + '</b></span>';
  }

  /* title split into words -> per-character spans (staggered reveal) */
  function splitChars(text, startIdx) {
    var i = startIdx || 0;
    var words = String(text).match(/[^ ，]+[ ，]?/g) || [];
    return words.map(function (w) {
      var trail = /\s$/.test(w) ? ' ' : '';
      var core = w.replace(/\s$/, '');
      return '<span class="w">' + Array.from(core).map(function (c) {
        return '<span class="ch" aria-hidden="true" style="--i:' + (i++) + '">' + esc(c) + '</span>';
      }).join('') + '</span>' + trail;
    }).join('');
  }

  function dayForCity(c) {
    if (c.nights && c.nights.length) return c.nights[0];
    for (var i = 0; i < T.days.length; i++) {
      if (T.days[i].route.en.indexOf(c.en) !== -1) return T.days[i].n;
    }
    return null;
  }

  /* ---------------- trip status / countdown ---------------- */
  function parseDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function depString() { return state.departure || T.departureDate || ''; }
  function tripStatus() {
    var dep = parseDate(depString());
    if (!dep) return { kind: 'unset' };
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var since = Math.round((today - dep) / 864e5);
    if (since < 0) return { kind: 'before', left: -since, dep: dep };
    if (since < N) return { kind: 'during', day: since + 1, dep: dep };
    return { kind: 'after', dep: dep };
  }
  var status = tripStatus();
  var editingDate = false;

  function fmtDate(d) {
    try { return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d.toDateString(); }
  }
  function monthShort(d) {
    try { return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-GB', { month: 'short' }); } catch (e) { return ''; }
  }
  function remaining() {
    var dep = parseDate(depString());
    if (!dep) return null;
    var ms = Math.max(0, dep - new Date());
    return { d: Math.floor(ms / 864e5), h: Math.floor(ms % 864e5 / 36e5), m: Math.floor(ms % 36e5 / 6e4) };
  }
  function flipHTML() {
    var r = remaining();
    if (!r) return '';
    function u(id, v, label) {
      return '<div class="fu"><div class="fcard" id="fc-' + id + '"><span class="fnum" id="fl-' + id + '">' + pad(v) + '</span></div><small>' + label + '</small></div>';
    }
    return '<div class="flips" role="timer" aria-label="' + esc(s('departing')) + '">' + u('d', r.d, s('fDays')) + u('h', r.h, s('fHrs')) + u('m', r.m, s('fMin')) + '</div>';
  }
  function tickCountdown() {
    var r = remaining();
    if (!r || status.kind !== 'before') return;
    [['d', r.d], ['h', r.h], ['m', r.m]].forEach(function (p) {
      var num = document.getElementById('fl-' + p[0]), card = document.getElementById('fc-' + p[0]);
      if (!num) return;
      var v = pad(p[1]);
      if (num.textContent !== v) {
        num.textContent = v;
        if (card && !reduceMotion) { card.classList.remove('tick'); void card.offsetWidth; card.classList.add('tick'); }
      }
    });
  }

  function countdownHTML() {
    var pm, title, sub = '', actions = '', extra = '';
    var st = status;
    var dayData = st.kind === 'during' ? T.days[st.day - 1] : null;
    if (st.kind === 'before') {
      pm = '<b>' + st.dep.getDate() + '</b><small>' + esc(monthShort(st.dep)) + '</small>';
      title = st.left === 1 ? s('tomorrow') : (lang === 'zh' ? '还有 ' + st.left + ' 天出发' : st.left + ' days to go');
      sub = s('departing') + ': ' + fmtDate(st.dep);
      extra = flipHTML();
    } else if (st.kind === 'during') {
      pm = lang === 'zh' ? '<small>第</small><b>' + st.day + '</b><small>天</small>' : '<small>DAY</small><b>' + st.day + '</b>';
      title = lang === 'zh' ? '今天是第 ' + st.day + ' 天' : 'Today is Day ' + st.day;
      sub = t(dayData.route);
      actions = '<button type="button" class="btn primary" data-act="jumptoday">' + s('jumpToday') + '</button>';
    } else if (st.kind === 'after') {
      pm = '<span class="em">🏠</span>';
      title = s('welcomeHome');
      sub = s('welcomeHomeS');
    } else {
      pm = '<span class="em">✉️</span>';
      title = s('cdUnsetT');
      sub = s('cdUnsetS');
    }
    var form = '';
    if (editingDate) {
      form = '<form data-form="date"><label class="sr-only" for="dep-input">' + s('dateLabel') + '</label>' +
        '<input type="date" id="dep-input" value="' + esc(depString()) + '" required>' +
        '<button type="submit" class="btn primary">' + s('save') + '</button>' +
        (state.departure ? '<button type="button" class="btn ghost" data-act="cleardate">' + s('clear') + '</button>' : '') +
        '<button type="button" class="btn ghost" data-act="canceldate">' + s('cancel') + '</button></form>';
    } else {
      actions += '<button type="button" class="btn' + (st.kind === 'unset' ? ' primary' : ' ghost') + '" data-act="editdate">' +
        (st.kind === 'unset' ? s('setDate') : s('changeDate')) + '</button>';
    }
    return '<div class="cd" role="status" aria-live="polite"><div class="postmark" aria-hidden="true"><div>' + pm + '</div></div>' +
      '<div class="cd-text"><p class="cd-title">' + esc(title) + '</p>' +
      (sub ? '<p class="cd-sub">' + esc(sub) + '</p>' : '') + extra +
      (actions ? '<div class="cd-actions">' + actions + '</div>' : '') + form + '</div></div>';
  }
  function renderCountdown() {
    var el = $('#cd-slot');
    if (el) el.innerHTML = countdownHTML();
    if (editingDate) { var i = $('#dep-input'); if (i) i.focus(); }
  }

  /* ---------------- renderers ---------------- */
  function heroHTML() {
    var zhTitle = (T.title && T.title.zh) || '';
    return '<section class="hero' + (firstRender ? '' : ' noanim') + '" aria-labelledby="h-title">' +
      photo(T.heroImage, t(T.title), '', '🏮', t(T.title), '') +
      '<div class="hero-shade"></div><div class="grain" aria-hidden="true"></div>' +
      '<div class="hero-vert" aria-hidden="true" lang="zh-CN">' + Array.from(zhTitle).map(function (c, i) { return '<span class="ch" style="--i:' + i + '">' + esc(c) + '</span>'; }).join('') + '</div>' +
      '<div class="hero-in">' +
      '<p class="kicker">' + s('kicker') + '</p>' +
      '<h1 id="h-title" aria-label="' + esc(t(T.title)) + '">' + splitChars(t(T.title), 2) + '</h1>' +
      '<p class="sub">' + esc(t(T.subtitle)) + '</p>' +
      '<p class="dur">✈ ' + esc(t(T.duration)) + '</p></div>' +
      '<span class="seal" aria-hidden="true">信</span>' +
      '<span class="hero-credit">' + s('heroCredit') + '</span>' +
      '<div class="scroll-cue" aria-hidden="true"><span>' + s('scroll') + '</span><i></i></div>' +
      '<div class="airmail" aria-hidden="true"></div></section>' +
      '<div class="cd-wrap"><div id="cd-slot">' + countdownHTML() + '</div></div>';
  }

  function flightsHTML() {
    if (!T.flights || !T.flights.length) return '';
    var cards = T.flights.map(function (f) {
      return '<div class="pass-wrap reveal"><article class="pass" aria-label="' + esc(f.no) + '">' +
        '<div class="airmail" aria-hidden="true"></div>' +
        '<div class="pass-main">' +
        '<div class="pass-top"><span class="airline">' + esc(t(f.airline)) + '</span><span class="fno"><span class="sr-only">' + s('flight') + ' </span>' + esc(f.no) + '</span></div>' +
        '<div class="pass-route">' +
        '<div class="pt"><span class="code">' + esc(f.from.code) + '</span><span class="cty">' + esc(t(f.from.city)) + '</span><time>' + esc(f.from.time) + '</time></div>' +
        '<div class="mid" aria-hidden="true"><span>✈</span><i></i></div>' +
        '<div class="pt r"><span class="code">' + esc(f.to.code) + '</span><span class="cty">' + esc(t(f.to.city)) + '</span><time>' + esc(f.to.time) + '</time></div>' +
        '</div>' +
        '<button type="button" class="btn ghost pass-day" data-act="goday" data-n="' + f.day + '">' + esc(s('dayN', f.day)) + ' →</button>' +
        '</div>' +
        '<div class="pass-stub"><div class="bag"><span aria-hidden="true">🧳</span><span><small>' + s('baggage') + '</small>' + esc(t(T.baggage)) + '</span></div><span class="barcode" aria-hidden="true"></span></div>' +
        '</article></div>';
    }).join('');
    return secHead('flightsHead', 'h-flights') + '<div class="passes">' + cards + '</div>';
  }

  function chipsHTML() {
    return T.days.map(function (d) {
      var isToday = status.kind === 'during' && status.day === d.n;
      return '<button type="button" class="chip' + (isToday ? ' today' : '') + '" data-act="goday" data-n="' + d.n + '" data-vibe="' + esc(d.vibe) + '" aria-label="' + esc(s('dayN', d.n) + (isToday ? ' — ' + s('today') : '')) + '">' +
        '<span class="stamp-wrap">' + stamp(d.n) + '</span></button>';
    }).join('');
  }

  function mealHTML(code, letterKey, icon) {
    var cls = code === 'in' ? 'in' : code === 'own' ? 'own' : code === 'air' ? 'air' : 'none';
    var ico = code === 'in' ? icon : code === 'own' ? '🥡' : code === 'air' ? '✈️' : '—';
    var txt = code === 'in' ? s('mIn') : code === 'own' ? s('mOwn') : code === 'air' ? s('mAir') : s('mNone');
    return '<li class="meal ' + cls + '"><span class="mi" aria-hidden="true">' + ico + '</span><span class="mn">' + s(letterKey) + '</span><span class="ms">' + txt + '</span></li>';
  }

  function stopHTML(d, di, st, si) {
    var name = t(st.name);
    var tag = st.tag in TAG_KEY ? st.tag : 'sight';
    var film = tag === 'film';
    return '<li class="stop ' + tag + '"><span class="node" aria-hidden="true">' + TAG_ICON[tag] + '</span>' +
      '<div class="stop-body">' +
      (film ? '<span class="ribbon"><b lang="zh-CN">取景地</b>Film location</span>' : '') +
      '<div class="stop-head"><div class="stop-t"><h4>' + esc(name) + '</h4>' + (film ? '' : '<span class="tagpill">' + s(TAG_KEY[tag]) + '</span>') + '</div>' +
      '<button type="button" class="pin" data-act="pin" data-d="' + di + '" data-i="' + si + '" aria-haspopup="dialog" aria-label="' + esc(s('pinLabel', name)) + '"><span aria-hidden="true">📍</span></button></div>' +
      (st.desc ? '<p>' + esc(t(st.desc)) + '</p>' : '') +
      (st.image ? photo(st.image, name, st.imageCredit, TAG_ICON[tag], name, '') : '') +
      '</div></li>';
  }

  function optionalHTML(d) {
    if (!d.optional || !T.optionalTours || !T.optionalTours[d.optional]) return '';
    var o = T.optionalTours[d.optional];
    var on = !!state.opt[d.optional];
    return '<div class="opt" data-on="' + on + '"><span class="opt-tag">🎭 ' + s('optTour') + ' ' + esc(d.optional) + '</span>' +
      '<h4>' + esc(t(o.name)) + '</h4>' +
      '<p class="price">' + esc(o.currency) + ' ' + esc(o.price) + '</p>' +
      (T.optionalTours.note ? '<p class="opt-note">' + esc(t(T.optionalTours.note)) + '</p>' : '') +
      '<button type="button" class="btn check-btn" data-act="opt" data-k="' + esc(d.optional) + '" aria-pressed="' + on + '">' + (on ? s('optJoined') : s('optJoin')) + '</button></div>';
  }

  function dayHTML(d, di) {
    var isToday = status.kind === 'during' && status.day === d.n;
    var alt = s('dayN', d.n) + ': ' + t(d.route);
    return '<article class="day reveal' + (isToday ? ' today' : '') + '" id="day-' + d.n + '" data-n="' + d.n + '" data-vibe="' + esc(d.vibe) + '" aria-labelledby="dh-' + d.n + '">' +
      '<div class="day-left"><div class="day-media">' +
      photo(d.image, alt, d.imageCredit, VIBE_EMOJI[d.vibe] || '🏮', t(d.route)) +
      '<span class="stamp-wrap foil">' + stamp(d.n) + '</span>' +
      (isToday ? '<span class="today-flag">' + s('today') + '</span>' : '') +
      '<div class="day-over"><p class="vibe">' + s(VIBE_KEY[d.vibe] || 'vibeOld') + '</p>' +
      '<h3 id="dh-' + d.n + '"><span class="sr-only">' + esc(s('dayN', d.n)) + ': </span>' + esc(t(d.route)) + '</h3>' +
      (d.drive ? '<p class="drive"><span aria-hidden="true">🚌</span><span>' + esc(t(d.drive)) + '</span></p>' : '') +
      '</div></div>' +
      '<p class="tagline">' + esc(t(d.tagline)) + '</p></div>' +
      '<div class="day-main">' +
      '<div><h4 class="sub-h">' + s('meals') + '</h4><ul class="meals">' +
      mealHTML(d.meals.b, 'mB', '🥐') + mealHTML(d.meals.l, 'mL', '🍜') + mealHTML(d.meals.d, 'mD', '🍽️') + '</ul></div>' +
      (d.mealNote ? '<p class="meal-note">🍴 ' + esc(t(d.mealNote)) + '</p>' : '') +
      '<div><h4 class="sub-h">' + s('stops') + '</h4><ol class="timeline">' + d.stops.map(function (st, si) { return stopHTML(d, di, st, si); }).join('') + '</ol></div>' +
      optionalHTML(d) +
      '<div class="hotel"><span class="hi" aria-hidden="true">' + (d.hotel ? '🛏️' : '🏠') + '</span><div><small>' + (d.hotel ? s('hotel') : s('homeTonight')) + '</small>' + (d.hotel ? esc(t(d.hotel)) : '') + '</div></div>' +
      '</div><div class="airmail" aria-hidden="true"></div></article>';
  }

  /* --- map --- */
  function todayCityIndex() {
    if (status.kind !== 'during') return -1;
    for (var i = 0; i < T.cities.length; i++) {
      if ((T.cities[i].nights || []).indexOf(status.day) !== -1) return i;
    }
    var ro = T.routeOrder || [];
    return ro.length ? ro[ro.length - 1] : -1;
  }
  function mapHTML() {
    var W = 400, H = 420, P = 42;
    var cs = T.cities;
    var lats = cs.map(function (c) { return c.lat; }), lngs = cs.map(function (c) { return c.lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var sx = (W - 2 * P) / ((maxLng - minLng) || 1);
    var sy = Math.min((H - 2 * P) / ((maxLat - minLat) || 1), sx * 2.4);
    var yOff = (H - (maxLat - minLat) * sy) / 2;
    var pts = cs.map(function (c) { return { x: P + (c.lng - minLng) * sx, y: yOff + (maxLat - c.lat) * sy }; });
    var order = (T.routeOrder || cs.map(function (_, i) { return i; })).map(function (i) { return pts[i]; });
    var d = 'M' + order[0].x.toFixed(1) + ' ' + order[0].y.toFixed(1);
    for (var i = 0; i < order.length - 1; i++) {
      var p0 = order[i - 1] || order[i], p1 = order[i], p2 = order[i + 1], p3 = order[i + 2] || p2;
      d += ' C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) + ' ' +
        (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    var DIR = { Shenzhen: 'e', Shanwei: 's', Chaozhou: 'n', Jieyang: 's', Huizhou: 'n', Guangzhou: 'n', Foshan: 's', Zhongshan: 's' };
    var grid = '';
    for (var gx = 60; gx < W; gx += 80) grid += '<line class="grid" x1="' + gx + '" y1="10" x2="' + gx + '" y2="' + (H - 10) + '"/>';
    for (var gy = 50; gy < H; gy += 80) grid += '<line class="grid" x1="10" y1="' + gy + '" x2="' + (W - 10) + '" y2="' + gy + '"/>';
    var waves = '';
    [[300, 335], [335, 318], [262, 362], [330, 375]].forEach(function (w) {
      waves += '<path class="wave" d="M' + w[0] + ' ' + w[1] + ' q5 -5 10 0 t10 0 t10 0"/>';
    });
    var todayIdx = todayCityIndex();
    var markers = cs.map(function (c, idx) {
      var p = pts[idx];
      var day = dayForCity(c);
      var night = c.nights && c.nights.length;
      var dd = night ? T.days[c.nights[0] - 1] : null;
      var dir = DIR[c.en] || 'n';
      var ly = dir === 'n' ? p.y - 18 : dir === 'e' ? p.y + 5 : p.y + 25;
      var lx = dir === 'e' ? p.x + 16 : p.x;
      var anc = dir === 'e' ? 'start' : 'middle';
      var lab = t(c);
      var aria = (day ? s('dayN', day) + ': ' : '') + lab;
      return '<g class="city' + (night ? '' : ' pass') + (dd && dd.vibe === 'future' ? ' future' : '') + '" role="button" tabindex="0" data-act="goday" data-n="' + (day || '') + '" aria-label="' + esc(aria) + '">' +
        '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="22" fill="transparent"/>' +
        (idx === todayIdx ? '<circle class="pulse" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="12"/>' : '') +
        '<circle class="dot" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (night ? 10 : 6) + '"/>' +
        (night ? '<text class="num" x="' + p.x.toFixed(1) + '" y="' + (p.y + 0.5).toFixed(1) + '">' + c.nights[0] + '</text>' : '') +
        '<text class="lab" x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="' + anc + '">' + esc(lab) + '</text></g>';
    }).join('');
    var rider = reduceMotion ? '' : '<circle class="rider" r="5"><animateMotion dur="16s" repeatCount="indefinite" path="' + d + '"/></circle>';
    var svg = '<svg class="map-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(s('mapAria')) + '">' +
      '<defs><filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter>' +
      '<mask id="m-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><path class="mask-path" pathLength="1" d="' + d + '"/></mask></defs>' +
      grid + waves +
      '<text class="sea-t" x="300" y="' + (H - 14) + '" text-anchor="middle">' + esc(s('sea')) + '</text>' +
      '<g class="compass" transform="translate(40 46)"><circle r="17"/><path d="M0 -24 L5 0 L0 24 L-5 0 Z"/><text x="0" y="-28" text-anchor="middle">N</text></g>' +
      '<g filter="url(#rough)"><path class="route" mask="url(#m-reveal)" d="' + d + '"/></g>' + rider +
      markers + '</svg>';
    var list = T.days.map(function (dd) {
      return '<button type="button" data-act="goday" data-n="' + dd.n + '" data-vibe="' + esc(dd.vibe) + '"><span class="n">' + dd.n + '</span><span class="r">' + esc(t(dd.route)) + '</span><span class="go" aria-hidden="true">→</span></button>';
    }).join('');
    return secHead('mapHead', 'h-map', s('mapLede')) +
      '<div class="map-card map reveal" id="mapcard">' + svg +
      '<div class="legend"><span><i></i>' + s('legOver') + '</span><span><i class="f"></i>' + s('legFuture') + '</span><span><i class="p"></i>' + s('legPass') + '</span>' + (todayIdx >= 0 ? '<span><i class="t"></i>' + s('legToday') + '</span>' : '') + '</div></div>' +
      '<div class="daylist reveal">' + list + '</div>';
  }

  /* --- food --- */
  var GROUPS = ['chaoshan', 'cantonese'];
  function groupCount(g) {
    var list = T.food[g] || [], done = 0;
    list.forEach(function (x) { if (state.food[g + ':' + x.en]) done++; });
    return { total: list.length, done: done };
  }
  function dishCount() {
    var total = 0, done = 0;
    GROUPS.forEach(function (g) { var c = groupCount(g); total += c.total; done += c.done; });
    return { total: total, done: done };
  }
  function dishHTML(g, x) {
    var k = g + ':' + x.en;
    var on = !!state.food[k];
    return '<li><button type="button" class="dish" data-act="dish" data-g="' + g + '" data-k="' + esc(k) + '" aria-pressed="' + on + '">' +
      (x.image ? photo(x.image, t(x), x.imageCredit, x.emoji, t(x)) : '<span class="emo" aria-hidden="true">' + x.emoji + '</span>') +
      '<span class="nm">' + esc(t(x)) + '</span><span class="st" aria-hidden="true">' + s('stamp') + '</span></button></li>';
  }
  function foodHTML() {
    var c = dishCount();
    var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
    var groups = GROUPS.map(function (g) {
      var gc = groupCount(g);
      return '<div class="food-group reveal" id="fg-' + g + '"><h3><span>' + s(g) + '</span><small id="gc-' + g + '">' + gc.done + ' / ' + gc.total + '</small>' +
        '<span class="gdone" id="gd-' + g + '"' + (gc.total && gc.done === gc.total ? '' : ' hidden') + '>✓ ' + s('complete') + '</span></h3><ul class="dishes">' +
        (T.food[g] || []).map(function (x) { return dishHTML(g, x); }).join('') + '</ul></div>';
    }).join('');
    return secHead('foodHead', 'h-food', s('foodLede')) +
      '<div class="passport reveal" role="status"><div class="ring" id="food-ringbox"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="trk" cx="32" cy="32" r="27"/><circle class="val" id="food-ring" cx="32" cy="32" r="27" pathLength="100" style="stroke-dashoffset:' + (100 - pct) + '"/></svg><b id="food-pct">' + pct + '<small>%</small></b></div>' +
      '<div class="pt"><strong>' + s('passT') + '</strong><span id="food-cnt">' + s('tried', c.done, c.total) + '</span></div></div>' +
      groups;
  }
  function packCount() {
    var done = 0;
    (T.packing || []).forEach(function (x) { if (state.pack[x.en]) done++; });
    return done;
  }

  /* --- info --- */
  var remarksOpen = false;
  function infoHTML() {
    var total = (T.packing || []).length, done = packCount();
    var pack = (T.packing || []).map(function (x) {
      var on = !!state.pack[x.en];
      return '<button type="button" data-act="pack" data-k="' + esc(x.en) + '" aria-pressed="' + on + '"><span class="box" aria-hidden="true"></span><span class="tx">' + esc(t(x)) + '</span></button>';
    }).join('');
    var li = function (a) { return a.map(function (x) { return '<li><span class="ic" aria-hidden="true">' + x.icon + '</span><span>' + esc(t(x)) + '</span></li>'; }).join(''); };
    var contacts = (T.contacts || []).map(function (c) {
      var digits = String(c.phone).replace(/\D/g, '');
      var mobile = /^\+601/.test(c.phone);
      var cname = (c.name && typeof c.name === 'object') ? t(c.name) : c.name;
      return '<div class="contact"><p class="cn">' + esc(cname) + '</p><p class="cr">' + esc(t(c.role)) + '</p><p class="num">' + esc(c.display) + '</p>' +
        '<div class="links"><a class="lnk" href="tel:' + esc(c.phone) + '" aria-label="' + esc(s('callName', cname)) + '">📞 ' + s('call') + '</a>' +
        (mobile ? '<a class="lnk" href="https://wa.me/' + digits + '" target="_blank" rel="noopener" aria-label="' + esc(s('waName', cname)) + '">💬 ' + s('whatsapp') + '</a>' : '') +
        '</div></div>';
    }).join('');
    return secHead('infoHead', 'h-info') +
      '<div class="subsec" style="margin-top:0"><h3 class="reveal">' + s('packHead') + '</h3><p class="reveal" style="color:var(--ink-2);font-size:15px;text-align:center">' + s('packLede') + '</p>' +
      '<div class="progress reveal" role="status"><div class="bar"><i id="pack-bar" style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></i></div><span class="cnt" id="pack-cnt">' + s('ready', done, total) + '</span></div>' +
      '<div class="pack reveal">' + pack + '</div></div>' +

      '<div class="subsec reveal"><h3>' + s('highlights') + '</h3><div class="cards hls">' +
      (T.highlights || []).map(function (h) { return '<div class="hl"><span class="ic" aria-hidden="true">' + h.icon + '</span><span>' + esc(t(h)) + '</span></div>'; }).join('') + '</div></div>' +

      '<div class="two reveal"><section class="panel" aria-labelledby="h-inc"><h3 id="h-inc">' + s('includes') + '</h3><ul>' + li(T.includes || []) + '</ul></section>' +
      '<section class="panel ex" aria-labelledby="h-exc"><h3 id="h-exc">' + s('excludes') + '</h3><ul>' + li(T.excludes || []) + '</ul></section></div>' +

      '<details class="remarks reveal"' + (remarksOpen ? ' open' : '') + '><summary>' + s('remarks') + '</summary><ol>' +
      (T.remarks || []).map(function (r) { return '<li>' + esc(t(r)) + '</li>'; }).join('') + '</ol></details>' +

      '<div class="subsec reveal"><h3>' + s('contacts') + '</h3><div class="contacts">' + contacts + '</div>' +
      (T.agency ? '<p class="addr">' + esc(T.agency.name) + '<br>' + esc(T.agency.address) + '</p>' : '') + '</div>' +

      '<div class="note-card reveal"><b>' + s('notes') + '</b><p>📶 ' + s('offlineNote') + '</p><p>📍 ' + s('pinNote') + '</p></div>';
  }

  /* ---------------- master render ---------------- */
  var firstRender = true;
  function applyStatic() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = s('title') + t(T.title);
    $$('[data-i]').forEach(function (el) { el.textContent = s(el.getAttribute('data-i')); });
    $$('[data-i-label]').forEach(function (el) { el.setAttribute('aria-label', s(el.getAttribute('data-i-label'))); });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === lang)); });
    var brand = $('.brand'); if (brand) brand.setAttribute('aria-label', s('brand'));
  }

  function render() {
    applyStatic();
    $('#hero-slot').innerHTML = heroHTML();
    $('#flights-slot').innerHTML = flightsHTML();
    $('#days-head').innerHTML = secHead('daysHead', 'h-days');
    $('#chips').innerHTML = chipsHTML();
    $('#days-slot').innerHTML = T.days.map(dayHTML).join('');
    $('#map-slot').innerHTML = mapHTML();
    $('#food-slot').innerHTML = foodHTML();
    $('#info-slot').innerHTML = infoHTML();
    observeReveal();
    observeDays();
    lastChip = null;
    spy();
  }

  /* ---------------- reveal on scroll ---------------- */
  var io = null, dayIO = null, visibleDays = [];
  function observeReveal() {
    var els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting || en.boundingClientRect.top < 0) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    els.forEach(function (e) {
      if (!firstRender) e.classList.add('in'); /* re-render (language change): no replay */
      else io.observe(e);
    });
  }
  /* which day cards are on screen (for parallax) */
  function observeDays() {
    visibleDays = [];
    if (!('IntersectionObserver' in window) || reduceMotion) return;
    if (dayIO) dayIO.disconnect();
    dayIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = visibleDays.indexOf(en.target);
        if (en.isIntersecting) { if (i < 0) visibleDays.push(en.target); }
        else if (i >= 0) visibleDays.splice(i, 1);
      });
      parallax();
    }, { rootMargin: '10% 0px 10% 0px' });
    $$('.day').forEach(function (d) { dayIO.observe(d); });
  }
  function parallax() {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    visibleDays.forEach(function (card) {
      var media = card.querySelector('.day-media');
      if (!media) return;
      var r = media.getBoundingClientRect();
      var p = (r.top + r.height / 2 - vh / 2) / vh; /* -1..1 */
      media.style.setProperty('--py', (p * -26).toFixed(1) + 'px');
    });
  }

  /* ---------------- scroll helpers, progress plane & spy ---------------- */
  var lastChip = null, lastTab = -2;
  function scrollToDay(n, instant) {
    var el = $('#day-' + n);
    if (!el) return;
    el.scrollIntoView({ behavior: (reduceMotion || instant) ? 'auto' : 'smooth', block: 'start' });
  }
  function hdrH() { var h = $('.topbar'); return h ? h.offsetHeight : 56; }
  var ticking = false;
  var SECS = ['days', 'map', 'food', 'info'];
  function spy() {
    ticking = false;
    var y = hdrH() + 110;
    var cur = null;
    SECS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= y) cur = id;
    });
    var docH = document.documentElement.scrollHeight, vh = window.innerHeight;
    if (vh + window.scrollY >= docH - 4) cur = 'info';
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    /* animated tab indicator */
    var idx = cur ? SECS.indexOf(cur) : -1;
    if (idx !== lastTab) {
      lastTab = idx;
      var tb = document.getElementById('tabbar');
      if (tb) { if (idx >= 0) { tb.style.setProperty('--i', idx); tb.removeAttribute('data-none'); } else tb.setAttribute('data-none', 'true'); }
    }
    /* trail: dashed route + plane */
    var span = Math.max(1, docH - vh);
    var p = Math.min(1, Math.max(0, window.scrollY / span));
    var fill = document.getElementById('trail-fill'), plane = document.getElementById('trail-plane');
    if (fill) fill.style.clipPath = 'inset(0 ' + ((1 - p) * 100).toFixed(2) + '% 0 0)';
    if (plane) plane.style.transform = 'translate3d(' + (p * (window.innerWidth - 18)).toFixed(1) + 'px,0,0) rotate(45deg)';
    /* active day chip */
    var active = null;
    $$('.day').forEach(function (c) { if (c.getBoundingClientRect().top <= y + 60) active = c.getAttribute('data-n'); });
    if (cur !== 'days') active = null;
    if (active !== lastChip) {
      lastChip = active;
      $$('.chip').forEach(function (c) {
        var on = c.getAttribute('data-n') === active;
        if (on) { c.setAttribute('aria-current', 'true'); } else { c.removeAttribute('aria-current'); }
        if (on) {
          var row = $('#chips');
          var left = c.offsetLeft - (row.clientWidth - c.offsetWidth) / 2;
          try { row.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' }); } catch (e) { row.scrollLeft = left; }
        }
      });
    }
    parallax();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(spy); }
  }, { passive: true });
  window.addEventListener('resize', spy);

  /* ---------------- bottom sheet (map links) ---------------- */
  var sheetOpener = null;
  function openSheet(di, si, opener) {
    var d = T.days[di], st = d && d.stops[si];
    if (!st) return;
    var name = t(st.name);
    var amap = 'https://uri.amap.com/marker?position=' + st.lng + ',' + st.lat + '&name=' + encodeURIComponent(st.name.zh || st.name.en);
    var gm = 'https://www.google.com/maps/search/?api=1&query=' + st.lat + ',' + st.lng;
    var tag = st.tag in TAG_KEY ? st.tag : 'sight';
    var sh = $('#sheet'), root = $('#sheet-root');
    sh.innerHTML = '<div class="grab" aria-hidden="true"></div>' +
      '<p class="sh-tag">' + TAG_ICON[tag] + ' ' + esc(s(TAG_KEY[tag])) + ' · ' + esc(s('dayN', d.n)) + '</p>' +
      '<h3 id="sheet-title">' + esc(name) + '</h3>' +
      '<p class="sh-desc">' + esc(s('openMap')) + '</p>' +
      '<div class="rows">' +
      '<a href="' + esc(amap) + '" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">🧭</span><span>' + s('amap') + '<small>' + s('amapNote') + '</small></span><span aria-hidden="true">↗</span></a>' +
      '<a href="' + esc(gm) + '" target="_blank" rel="noopener"><span class="ic" aria-hidden="true">🌍</span><span>' + s('gmaps') + '<small>' + s('gmapsNote') + '</small></span><span aria-hidden="true">↗</span></a>' +
      '</div><button type="button" class="btn close" data-act="closesheet">' + s('close') + '</button>';
    sheetOpener = opener || null;
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('open');
    var first = $('a', sh);
    window.setTimeout(function () { if (first) first.focus(); }, 60);
  }
  function closeSheet() {
    var root = $('#sheet-root');
    if (!root || !root.classList.contains('open')) return;
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    if (sheetOpener && sheetOpener.focus) { try { sheetOpener.focus(); } catch (e) { /* ignore */ } }
    sheetOpener = null;
  }

  /* ---------------- confetti-style burst ---------------- */
  function burst(el, big) {
    if (reduceMotion || !el) return;
    var r = el.getBoundingClientRect();
    var box = document.createElement('div');
    box.className = 'burst';
    box.style.left = (r.left + r.width / 2) + 'px';
    box.style.top = (r.top + r.height / 2) + 'px';
    var bits = ['🎉', '✨', '🏮', '🥢', '🧧', '⭐', '🍵'];
    var n = big ? 26 : 16, html = '';
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, dist = (big ? 90 : 60) + Math.random() * (big ? 120 : 70);
      html += '<span aria-hidden="true" style="--dx:' + (Math.cos(a) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(a) * dist - 20).toFixed(0) + 'px;--r:' + ((Math.random() * 360 - 180) | 0) + 'deg;animation-delay:' + ((Math.random() * 120) | 0) + 'ms">' + bits[(Math.random() * bits.length) | 0] + '</span>';
    }
    box.innerHTML = html;
    document.body.appendChild(box);
    window.setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 1500);
  }

  /* ---------------- events ---------------- */
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* ignore */ } }
  function setBar(id, cntId, done, total, label) {
    var bar = document.getElementById(id), cnt = document.getElementById(cntId);
    if (bar) bar.style.width = (total ? Math.round(done / total * 100) : 0) + '%';
    if (cnt) cnt.textContent = label;
  }
  function updateFoodUI() {
    var c = dishCount();
    var pct = c.total ? Math.round(c.done / c.total * 100) : 0;
    var ring = document.getElementById('food-ring'), pe = document.getElementById('food-pct'), cn = document.getElementById('food-cnt');
    if (ring) ring.style.strokeDashoffset = String(100 - pct);
    if (pe) pe.innerHTML = pct + '<small>%</small>';
    if (cn) cn.textContent = s('tried', c.done, c.total);
    GROUPS.forEach(function (g) {
      var gc = groupCount(g);
      var e = document.getElementById('gc-' + g), dn = document.getElementById('gd-' + g);
      if (e) e.textContent = gc.done + ' / ' + gc.total;
      if (dn) { if (gc.total && gc.done === gc.total) dn.removeAttribute('hidden'); else dn.setAttribute('hidden', ''); }
    });
    return c;
  }

  function onAct(el) {
    var act = el.getAttribute('data-act');
    var k = el.getAttribute('data-k');
    if (act === 'lang') {
      lang = el.getAttribute('data-v') === 'zh' ? 'zh' : 'en';
      state.lang = lang; saveState();
      firstRender = false;
      closeSheet();
      render();
    } else if (act === 'goday') {
      var n = el.getAttribute('data-n');
      if (n) scrollToDay(n);
    } else if (act === 'jumptoday') {
      if (status.kind === 'during') scrollToDay(status.day);
    } else if (act === 'editdate') {
      editingDate = true; renderCountdown();
    } else if (act === 'canceldate') {
      editingDate = false; renderCountdown();
    } else if (act === 'cleardate') {
      delete state.departure; saveState();
      editingDate = false; status = tripStatus(); firstRender = false; render();
    } else if (act === 'pin') {
      openSheet(+el.getAttribute('data-d'), +el.getAttribute('data-i'), el);
    } else if (act === 'closesheet') {
      closeSheet();
    } else if (act === 'dish') {
      var g = el.getAttribute('data-g');
      var before = groupCount(g), beforeAll = dishCount();
      var on = !state.food[k];
      if (on) state.food[k] = 1; else delete state.food[k];
      saveState();
      el.setAttribute('aria-pressed', String(on));
      el.classList.remove('thunk');
      if (on) { void el.offsetWidth; if (!reduceMotion) el.classList.add('thunk'); buzz(); }
      var c = updateFoodUI(), after = groupCount(g);
      if (on && before.done < before.total && after.done === after.total) {
        burst(document.getElementById('gc-' + g), false);
        if (c.done === c.total && beforeAll.done < beforeAll.total) burst(document.getElementById('food-ringbox'), true);
      }
    } else if (act === 'pack') {
      var on2 = !state.pack[k];
      if (on2) state.pack[k] = 1; else delete state.pack[k];
      saveState();
      el.setAttribute('aria-pressed', String(on2));
      el.classList.remove('thunk');
      if (on2) { void el.offsetWidth; if (!reduceMotion) el.classList.add('thunk'); buzz(); }
      var tot = (T.packing || []).length, dn2 = packCount();
      setBar('pack-bar', 'pack-cnt', dn2, tot, s('ready', dn2, tot));
      if (on2 && tot && dn2 === tot) burst(el, false);
    } else if (act === 'opt') {
      var on3 = !state.opt[k];
      if (on3) state.opt[k] = 1; else delete state.opt[k];
      saveState();
      el.setAttribute('aria-pressed', String(on3));
      el.textContent = on3 ? s('optJoined') : s('optJoin');
      var box = el.closest('.opt'); if (box) box.setAttribute('data-on', String(on3));
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (el) onAct(el);
  });
  document.addEventListener('keydown', function (e) {
    var root = $('#sheet-root');
    if (root && root.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
      if (e.key === 'Tab') { /* keep focus inside the dialog */
        var f = $$('a[href], button', $('#sheet'));
        if (f.length) {
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          else if (f.indexOf(document.activeElement) < 0) { e.preventDefault(); first.focus(); }
        }
        return;
      }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute && e.target.getAttribute('role') === 'button' && e.target.getAttribute('data-act')) {
      e.preventDefault(); onAct(e.target);
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('data-form') === 'date') {
      e.preventDefault();
      var v = ($('#dep-input') || {}).value;
      if (parseDate(v)) {
        state.departure = v; saveState();
        editingDate = false; status = tripStatus(); firstRender = false; render();
        if (status.kind === 'during') scrollToDay(status.day);
      }
    }
  });
  /* details toggle doesn't bubble: capture it */
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('remarks')) remarksOpen = e.target.open;
  }, true);
  /* image failure -> themed fallback (error doesn't bubble: capture) */
  document.addEventListener('error', function (e) {
    var t0 = e.target;
    if (t0 && t0.tagName === 'IMG') {
      var f = t0.closest('.ph');
      if (f) f.classList.add('failed');
    }
  }, true);

  /* 3D tilt on postcards: laptop with a real pointer only */
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', function (e) {
      var m = e.target.closest ? e.target.closest('.day-media') : null;
      if (!m) return;
      var r = m.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      m.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg');
      m.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
    });
    document.addEventListener('pointerout', function (e) {
      var m = e.target.closest ? e.target.closest('.day-media') : null;
      if (m && !m.contains(e.relatedTarget)) { m.style.setProperty('--rx', '0deg'); m.style.setProperty('--ry', '0deg'); }
    });
  }

  /* refresh countdown when the app comes back to the foreground */
  function refreshStatus() {
    var ns = tripStatus();
    if (ns.kind !== status.kind || ns.day !== status.day || ns.left !== status.left) {
      status = ns; firstRender = false; render();
    } else { tickCountdown(); }
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshStatus(); });
  window.setInterval(function () { if (!document.hidden) refreshStatus(); }, 20000);

  /* ---------------- boot ---------------- */
  render();
  firstRender = false;

  if (status.kind === 'during' && !location.hash) {
    window.setTimeout(function () { scrollToDay(status.day, true); }, 350);
  }

  /* offline: register service worker only on http(s) */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline features simply unavailable */ });
    });
  }
})();
