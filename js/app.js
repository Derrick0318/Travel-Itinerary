/* 我的旅程 · My Trip — renders everything from window.TRIP (js/data.js).
   Always bilingual (中文 + English). Live weather from Open-Meteo, real map with Leaflet. */
(function () {
  'use strict';

  var T = window.TRIP;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- storage (always wrapped: private mode can throw) ---------- */
  var KEY = 'trip.v2', WX_KEY = 'trip.wx.v1';
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  var state = Object.assign({ fs: 1, departure: '', packing: {}, optional: {}, layer: '' }, store.get(KEY) || {});
  function save() { store.set(KEY, state); }

  /* ---------- bilingual helpers ---------- */
  function bi(o) { return o ? '<span class="bi"><span class="zh">' + esc(o.zh) + '</span><span class="en" lang="en">' + esc(o.en) + '</span></span>' : ''; }
  function bib(o) { return o ? '<span class="bib"><span class="zh">' + esc(o.zh) + '</span><span class="en" lang="en">' + esc(o.en) + '</span></span>' : ''; }
  function en(s) { return '<span class="en" lang="en">' + esc(s) + '</span>'; }

  var TAGS = {
    sight: { ic: '🏛️', zh: '景点', en: 'Sight' },
    food: { ic: '🍽️', zh: '美食', en: 'Food' },
    film: { ic: '🎬', zh: '取景地', en: 'Film location' },
    shop: { ic: '🛍️', zh: '购物', en: 'Shopping' },
    travel: { ic: '✈️', zh: '交通', en: 'Travel' }
  };
  var TAG_COLOR = { sight: '#2b4a99', food: '#b8322a', film: '#b8862b', shop: '#7a3e9d', travel: '#0a6a7a' };
  var MEALS = { b: { ic: '🥣', zh: '早餐', en: 'Breakfast' }, l: { ic: '🍱', zh: '午餐', en: 'Lunch' }, d: { ic: '🍲', zh: '晚餐', en: 'Dinner' } };
  var MEAL_ST = { 'in': { zh: '含', en: 'Included', cls: 'in' }, own: { zh: '自理', en: 'Own expense', cls: 'own' }, air: { zh: '机上', en: 'On board', cls: 'air' }, '-': { zh: '无', en: 'None', cls: 'none' } };
  var VIBE = { future: { zh: '未来之城', en: 'Future city' }, old: { zh: '老街烟火', en: 'Old streets' }, film: { zh: '电影足迹', en: 'Film trail' }, city: { zh: '城市灯火', en: 'City lights' } };

  /* ---------- dates ---------- */
  var WEEK_ZH = '日一二三四五六', WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function depString() { return state.departure || T.departureDate || ''; }
  function depDate() {
    var s = depString(); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]);
  }
  function dayDate(n) { var d = depDate(); return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + n - 1) : null; }
  function fmtDay(d) { return { zh: (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + WEEK_ZH[d.getDay()], en: WEEK_EN[d.getDay()] + ' ' + d.getDate() + ' ' + MON_EN[d.getMonth()] }; }
  // The whole trip runs on UTC+8 (Brunei and China), so time maths uses UTC+8
  // regardless of the time zone the phone happens to be set to.
  var TZ = 8;
  function tzNow() { return new Date(Date.now() + TZ * 36e5); } // read with getUTC*
  function todayStr() { var t = tzNow(); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); }
  // Days since departure day: <0 before trip, 0..6 during, >6 after. null if no date.
  function tripIndex() {
    var d = depDate(); if (!d) return null;
    var t = tzNow();
    return Math.round((Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  }
  function todayDay() { var i = tripIndex(); return i != null && i >= 0 && i < T.days.length ? i + 1 : 0; }

  /* ---------- text size ---------- */
  var FS = [0.875, 1, 1.125, 1.25, 1.375];
  function applyFs() {
    if (FS.indexOf(state.fs) < 0) state.fs = 1;
    document.documentElement.style.fontSize = (state.fs * 100) + '%';
    $('#fs-val').textContent = Math.round(state.fs * 100) + '%';
    $$('.fs-btn').forEach(function (b) {
      var i = FS.indexOf(state.fs) + Number(b.dataset.d);
      b.disabled = i < 0 || i >= FS.length;
    });
    if (map) setTimeout(function () { map.invalidateSize(); }, 60);
    moveTabInd();
  }

  /* ---------- small pieces ---------- */
  var ORN = '<svg class="orn" viewBox="0 0 176 16" aria-hidden="true"><path d="M0 8h64M112 8h64" stroke="currentColor" stroke-width="1"/>' +
    '<path d="M70 8c0-4 5-6 8-3 1-4 8-5 10-1 2-4 9-3 10 1 3-3 8-1 8 3 0 4-5 5-8 3-2 3-8 4-10 1-2 3-9 2-10-1-3 2-8 1-8-3z" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
    '<circle cx="88" cy="8" r="1.6" fill="currentColor"/></svg>';
  function head(id, eyebrow, zh, lead, wm) {
    return '<header class="sec-head rv"' + (wm ? ' data-wm="' + esc(wm) + '"' : '') + '><p class="eyebrow" lang="en">' + esc(eyebrow) + '</p><h2 id="' + id + '">' + esc(zh) + '</h2>' + ORN +
      (lead ? '<p class="lead">' + bib(lead) + '</p>' : '') + '</header>';
  }
  function img(src, alt, w, h, cls) {
    return '<img src="' + esc(src) + '" alt="' + esc(alt) + '" width="' + (w || 960) + '" height="' + (h || 640) + '" loading="lazy" decoding="async"' + (cls ? ' class="' + cls + '"' : '') + '>';
  }
  function postmark(d) {
    var y = d ? String(d.getFullYear()) : '----', md = d ? pad(d.getMonth() + 1) + '.' + pad(d.getDate()) : '--.--';
    return '<svg class="postmark" viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs><path id="pm-a" d="M50,50 m-36,0 a36,36 0 1,1 72,0"/><path id="pm-b" d="M50,50 m-38,0 a38,38 0 0,0 76,0"/></defs>' +
      '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
      '<text font-size="9.5" letter-spacing="1.5"><textPath href="#pm-a" startOffset="50%" text-anchor="middle">文莱 BRUNEI</textPath></text>' +
      '<text font-size="8.5" letter-spacing="1.2"><textPath href="#pm-b" startOffset="50%" text-anchor="middle">深圳 SHENZHEN</textPath></text>' +
      '<text x="50" y="47" font-size="10" text-anchor="middle">' + y + '</text>' +
      '<text x="50" y="61" font-size="12" text-anchor="middle">' + md + '</text></svg>';
  }

  /* ---------- hero + countdown ---------- */
  function charSpans(s, start) {
    // one-shot letter-by-letter reveal (CSS animation-delay per character)
    var i = 0;
    return s.split('').map(function (ch) {
      if (ch === '\n') return '<br>';
      return '<span class="ch" style="--d:' + (start + (i++) * 70) + 'ms">' + esc(ch) + '</span>';
    }).join('');
  }
  function renderHero() {
    var d1 = dayDate(1), d7 = dayDate(T.days.length);
    var range = d1 ? d1.getFullYear() + '.' + (d1.getMonth() + 1) + '.' + d1.getDate() + ' – ' + (d7.getMonth() + 1) + '.' + d7.getDate() : '';
    $('#hero-slot').innerHTML =
      '<section class="hero" id="top" aria-labelledby="h-hero">' +
      '<div class="hero-media"><img src="' + esc(T.heroImage) + '" alt="潮州广济桥 Guangji Bridge, Chaozhou" width="1280" height="960" fetchpriority="high" decoding="async"></div>' +
      '<div class="hero-grain" aria-hidden="true"></div>' +
      '<div class="hero-in wrap">' +
      '<p class="kicker"><i></i>广东 · 潮汕 <span lang="en">Guangdong · Chaoshan</span></p>' +
      '<h1 class="hero-title" id="h-hero" aria-label="一半烟火，一半未来 ' + esc(T.title.en) + '"><span class="zh" aria-hidden="true">' + charSpans('一半烟火，\n一半未来', 150) + '</span>' +
      '<span class="en" lang="en" aria-hidden="true">' + esc(T.title.en) + '</span></h1>' +
      '<p class="hero-sub">' + bib(T.subtitle) + '</p>' +
      '<div class="hero-tags"><span class="hero-tag">✈ ' + bi(T.duration) + '</span>' + (range ? '<span class="hero-tag">🗓 ' + range + '</span>' : '') + '</div>' +
      '</div>' +
      '<div class="hero-vert" aria-hidden="true">给阿嬷的情书</div>' +
      '<div class="hero-seal" aria-hidden="true"><span>信</span></div>' +
      '<p class="hero-credit">图 Photo: Wikimedia Commons</p>' +
      '</section>' +
      '<div class="wrap"><div class="count" id="count"></div></div>';
    renderCount();
  }

  var flipTimer = null, lastTripIdx = null;
  // Time left until the first flight leaves (its local time is UTC+8).
  function countParts() {
    var d = depDate(); if (!d) return [0, 0, 0, 0, 0];
    var hm = (T.flights[0].from.time || '00:00').split(':').map(Number);
    var ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hm[0] - TZ, hm[1]) - Date.now();
    var left = ms;
    if (ms < 0) ms = 0;
    return [Math.floor(ms / 864e5), Math.floor(ms % 864e5 / 36e5), Math.floor(ms % 36e5 / 6e4), Math.floor(ms % 6e4 / 1e3), left];
  }
  function nextFlightTicket() {
    var f = T.flights[0];
    return '<div class="count-ticket" aria-label="第一班航班 First flight">' +
      '<span class="ct-no">' + esc(f.no) + '</span>' +
      '<div class="ct-route"><b>' + esc(f.from.code) + '</b><i aria-hidden="true">✈</i><b>' + esc(f.to.code) + '</b></div>' +
      '<div class="ct-time">' + esc(f.from.time) + ' → ' + esc(f.to.time) + '</div>' +
      '<small>' + bi(f.airline) + '</small></div>';
  }
  function renderCount(editing) {
    var el = $('#count'); if (!el) return;
    var dep = depDate(), idx = tripIndex(), title, body = '', side = '';
    lastTripIdx = idx;
    if (!dep) {
      title = { zh: '还没设定出发日期', en: 'Departure date not set' };
    } else if (idx < 0 || (idx === 0 && countParts()[4] > 0)) {
      title = { zh: '距离出发还有', en: 'Until take-off' };
      var p = countParts(), units = [['天', 'Days'], ['时', 'Hrs'], ['分', 'Min'], ['秒', 'Sec']];
      body = '<div class="flip" id="flip" role="timer">' + units.map(function (u, i) {
        return '<div class="flip-u' + (i === 3 ? ' is-sec' : '') + '"><div class="flip-n" data-i="' + i + '">' + pad(p[i]) + '</div><span class="flip-l">' + u[0] + ' <span lang="en">' + u[1] + '</span></span></div>';
      }).join('<span class="flip-colon" aria-hidden="true">:</span>') + '</div>';
      side = nextFlightTicket();
    } else if (idx < T.days.length) {
      var day = T.days[idx];
      title = { zh: '旅程第 ' + (idx + 1) + ' 天', en: 'Day ' + (idx + 1) + ' of ' + T.days.length };
      body = '<p class="count-route">' + bib(day.route) + '</p>' +
        '<div class="count-dots" aria-hidden="true">' + T.days.map(function (d) { return '<i class="' + (d.n < idx + 1 ? 'done' : d.n === idx + 1 ? 'now' : '') + '"></i>'; }).join('') + '</div>';
    } else {
      title = { zh: '欢迎回家', en: 'Welcome home' };
      body = '<p class="count-route">' + bib({ zh: '好一趟旅程。留住这些回忆。', en: 'What a trip. Keep the memories.' }) + '</p>';
    }
    var actions;
    if (editing) {
      actions = '<label for="dep-in" style="position:absolute;left:-999rem">出发日期 Departure date</label>' +
        '<input type="date" id="dep-in" value="' + esc(depString()) + '">' +
        '<button type="button" class="btn btn-sm btn-red" data-act="savedate">保存 ' + en('Save') + '</button>' +
        '<button type="button" class="btn btn-sm btn-ghost" data-act="canceldate">取消 ' + en('Cancel') + '</button>';
    } else {
      actions = (idx != null && idx >= 0 && idx < T.days.length ? '<a class="btn btn-sm btn-red" href="#day-' + (idx + 1) + '" data-go>查看今天 ' + en('See today') + '</a>' : '') +
        '<button type="button" class="btn btn-sm" data-act="editdate">✎ ' + (dep ? '更改日期 ' + en('Change date') : '设定日期 ' + en('Set date')) + '</button>';
    }
    el.innerHTML = postmark(dep) + '<div class="count-main"><h2>' + esc(title.zh) + '<span class="en" lang="en">' + esc(title.en) + '</span></h2>' + body +
      '<div class="count-actions">' + actions + '</div></div>' + side;
    if (editing) { var inp = $('#dep-in'); if (inp) inp.focus(); }
    clearInterval(flipTimer);
    flipTimer = setInterval(tickFlip, 1000);
  }
  function tickFlip() {
    // Day changed (midnight, UTC+8) or the plane just left: refresh everything that depends on "today".
    if (tripIndex() !== lastTripIdx) { rerenderDates(); return; }
    var flip = $('#flip'); if (!flip) return;
    var p = countParts();
    if (p[4] <= 0) { rerenderDates(); return; }
    $$('.flip-n', flip).forEach(function (n) {
      var v = pad(p[Number(n.dataset.i)]);
      if (n.textContent !== v) {
        n.textContent = v;
        if (!reduceMotion) { n.classList.remove('tick'); void n.offsetWidth; n.classList.add('tick'); }
      }
    });
  }

  /* ---------- flights ---------- */
  function renderFlights() {
    $('#flights-slot').innerHTML = '<div class="passes">' + T.flights.map(function (f) {
      var d = dayDate(f.day), date = d ? fmtDay(d) : null;
      var pt = function (p, cls) {
        return '<div class="pass-pt ' + cls + '"><div class="code">' + esc(p.code) + '</div><div class="city">' + bi(p.city) + '</div><div class="time">' + esc(p.time) + '</div></div>';
      };
      return '<article class="pass rv"><div class="pass-main">' +
        '<div class="pass-top"><span>' + bi(f.airline) + (date ? ' · ' + bi(date) : '') + '</span><span class="no">' + esc(f.no) + '</span></div>' +
        '<div class="pass-route">' + pt(f.from, 'from') + '<div class="pass-plane" aria-hidden="true">✈</div>' + pt(f.to, 'to') + '</div></div>' +
        '<div class="pass-stub"><span>🧳 ' + bi({ zh: '行李 ' + T.baggage.zh, en: T.baggage.en }) + '</span>' +
        '<a class="btn btn-sm" href="#day-' + f.day + '" data-go>第' + f.day + '天 ' + en('Day ' + f.day) + ' →</a>' +
        '<span class="barcode" aria-hidden="true"></span></div></article>';
    }).join('') + '</div>';
  }

  /* ---------- days ---------- */
  function mapLinks(stop, day) {
    var city = T.cities[day.city];
    if (stop.approx || stop.lat == null) {
      return {
        amap: 'https://uri.amap.com/search?keyword=' + encodeURIComponent(stop.name.zh) + '&city=' + encodeURIComponent(city.zh) + '&callnative=1',
        google: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(stop.name.en + ', ' + city.en)
      };
    }
    return {
      amap: 'https://uri.amap.com/marker?position=' + stop.lng + ',' + stop.lat + '&name=' + encodeURIComponent(stop.name.zh) + '&coordinate=wgs84&callnative=1',
      google: 'https://www.google.com/maps/search/?api=1&query=' + stop.lat + ',' + stop.lng
    };
  }

  function renderDays() {
    $('#days-head').innerHTML = head('h-days', 'Day by day', '每日行程', { zh: '七天六晚，从深圳到潮汕，再经广州、佛山、中山回家。', en: 'Seven days: Shenzhen to Chaoshan, then Guangzhou, Foshan and Zhongshan, and home.' }, '行');
    var today = todayDay();
    $('#chips').innerHTML = T.days.map(function (d) {
      var dt = dayDate(d.n);
      return '<a class="chip' + (d.n === today ? ' today' : '') + '" href="#day-' + d.n + '" data-day="' + d.n + '" data-go><b>第' + d.n + '天</b><small lang="en">' +
        (dt ? (dt.getMonth() + 1) + '/' + dt.getDate() + ' · ' : '') + 'D' + d.n + '</small></a>';
    }).join('');

    $('#days-slot').innerHTML = T.days.map(function (d) {
      var dt = dayDate(d.n), isToday = d.n === today, vibe = VIBE[d.vibe];
      var photo = d.image ? img(d.image, d.route.zh + ' ' + d.route.en, 960, 640) : '<div class="pc-fallback" aria-hidden="true">✉️</div>';
      var meals = ['b', 'l', 'd'].map(function (k) {
        var m = MEALS[k], st = MEAL_ST[d.meals[k]] || MEAL_ST['-'];
        return '<div class="meal ' + st.cls + '"><span class="ic" aria-hidden="true">' + m.ic + '</span><b>' + m.zh + '</b><small lang="en">' + m.en + '</small>' +
          '<span class="st">' + st.zh + ' <span lang="en">' + st.en + '</span></span></div>';
      }).join('');
      var stops = d.stops.map(function (s, i) {
        var t = TAGS[s.tag] || TAGS.sight, film = s.tag === 'film';
        return '<li class="stop' + (film ? ' film' : '') + '">' +
          '<span class="stop-ic" aria-hidden="true">' + t.ic + '</span>' +
          '<div>' + (film ? '<span class="film-rib">🎞 取景地 <span lang="en">Film location</span></span>' : '') +
          '<h4>' + bi(s.name) + '</h4>' + (film ? '' : '<span class="tag">' + t.zh + ' <span lang="en">' + t.en + '</span></span>') + '</div>' +
          '<button type="button" class="pin" data-act="stop" data-day="' + d.n + '" data-i="' + i + '" aria-label="在地图打开 Open in map: ' + esc(s.name.zh) + '">📍</button>' +
          '<p class="desc">' + bib(s.desc) + '</p>' +
          (s.image ? '<div class="stop-img">' + img(s.image, s.name.zh + ' ' + s.name.en) + (s.imageCredit ? '<span class="credit">' + esc(s.imageCredit) + '</span>' : '') + '</div>' : '') +
          '</li>';
      }).join('');
      var opt = '';
      if (d.optional && T.optionalTours[d.optional]) {
        var o = T.optionalTours[d.optional], on = !!state.optional[d.optional];
        opt = '<div class="opt"><p class="lbl">自费项目 ' + esc(d.optional) + ' · <span lang="en">Optional tour ' + esc(d.optional) + '</span></p>' +
          '<h4>' + bi(o.name) + '</h4><p class="price">' + esc(o.currency) + ' ' + esc(o.price) + ' <small style="font-size:.6em">/ 位 <span lang="en">per person</span></small></p>' +
          '<p class="small">' + bib(T.optionalTours.note) + '</p>' +
          '<button type="button" class="btn btn-sm" data-act="optional" data-v="' + esc(d.optional) + '" aria-pressed="' + on + '">' +
          (on ? '✓ 我会参加 ' + en("I'm joining") : '＋ 我想参加 ' + en("I'll join")) + '</button></div>';
      }
      var hotel = d.hotel
        ? '<div class="hotel"><span class="ic" aria-hidden="true">🛏️</span><div><small>今晚入住 <span lang="en">Tonight</span></small><b>' + bib(d.hotel) + '</b></div></div>'
        : '<div class="hotel"><span class="ic" aria-hidden="true">🏠</span><div><small>今晚 <span lang="en">Tonight</span></small><b>' + bib({ zh: '回到温暖的家', en: 'Home sweet home' }) + '</b></div></div>';

      return '<article class="day' + (isToday ? ' is-today' : '') + '" id="day-' + d.n + '" data-vibe="' + esc(d.vibe) + '" aria-labelledby="day-h-' + d.n + '">' +
        '<div class="pc">' + photo +
        '<div class="stamp" aria-hidden="true"><small>第</small><b>' + d.n + '</b><small>天 · DAY</small></div>' +
        (isToday ? '<span class="today-pill">今天 <span lang="en">Today</span></span>' : '') +
        (d.imageCredit ? '<span class="credit">' + esc(d.imageCredit) + '</span>' : '') +
        '<div class="pc-cap">' + (dt ? '<p class="pc-date">' + bi(fmtDay(dt)) + (vibe ? ' · ' + bi(vibe) : '') + '</p>' : (vibe ? '<p class="pc-date">' + bi(vibe) + '</p>' : '')) +
        '<h3 id="day-h-' + d.n + '"><span class="zh">' + esc(d.route.zh) + '</span><span class="en" lang="en">' + esc(d.route.en) + '</span></h3></div>' +
        '</div>' +
        '<div class="day-body">' +
        '<p class="tagline">' + bib(d.tagline) + '</p>' +
        '<div class="day-meta">' + (d.drive ? '<span class="pill">🚌 ' + bi(d.drive) + '</span>' : '') +
        '<span class="pill pill-wx" data-wxday="' + d.n + '" hidden></span></div>' +
        '<p class="lbl">餐食 <span lang="en">Meals</span></p><div class="meals">' + meals + '</div>' +
        (d.mealNote ? '<p class="note">🍴 ' + bib(d.mealNote) + '</p>' : '') +
        '<p class="lbl">行程 <span lang="en">Stops</span></p><ol class="stops">' + stops + '</ol>' +
        opt + hotel +
        '</div></article>';
    }).join('');
  }

  /* ---------- stop sheet ---------- */
  var lastFocus = null;
  function openSheet(html) {
    lastFocus = document.activeElement;
    var root = $('#sheet-root'), sh = $('#sheet');
    sh.innerHTML = html;
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { sh.focus(); }, 30);
  }
  function closeSheet() {
    var root = $('#sheet-root'); if (root.hidden) return;
    root.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openStop(dn, i) {
    var day = T.days[dn - 1], s = day.stops[i], l = mapLinks(s, day), t = TAGS[s.tag] || TAGS.sight;
    openSheet('<h3 id="sheet-title">' + esc(s.name.zh) + '<span class="en" lang="en">' + esc(s.name.en) + '</span></h3>' +
      '<p>' + t.ic + ' 第' + dn + '天 · <span lang="en">Day ' + dn + '</span> · ' + t.zh + ' <span lang="en">' + t.en + '</span></p>' +
      (s.approx ? '<p>' + bib({ zh: '确切位置不确定，将按名称搜索。', en: 'Exact location unknown, so this searches by name.' }) + '</p>' : '') +
      '<div class="acts">' +
      '<a class="btn btn-red" href="' + esc(l.amap) + '" target="_blank" rel="noopener">🧭 高德地图 ' + en('Amap (best in China)') + '</a>' +
      '<a class="btn" href="' + esc(l.google) + '" target="_blank" rel="noopener">🌐 Google 地图 ' + en('Google Maps') + '</a>' +
      (s.approx ? '' : '<button type="button" class="btn btn-ink" data-act="showonmap" data-day="' + dn + '" data-i="' + i + '">🗺️ 在本页地图查看 ' + en('Show on this map') + '</button>') +
      '<button type="button" class="btn btn-ghost" data-act="closesheet">关闭 ' + en('Close') + '</button></div>');
  }

  /* ---------- weather ---------- */
  var WX = store.get(WX_KEY) || {};
  var wxTab = null;
  function wmo(code, isDay) {
    var c = Number(code), night = isDay === 0;
    if (c === 0) return { ic: night ? '🌙' : '☀️', zh: '晴', en: 'Clear', tint: '#f6c445' };
    if (c === 1) return { ic: night ? '🌙' : '🌤️', zh: '大致晴朗', en: 'Mainly clear', tint: '#f6c445' };
    if (c === 2) return { ic: night ? '☁️' : '⛅', zh: '多云', en: 'Partly cloudy', tint: '#9fb6d6' };
    if (c === 3) return { ic: '☁️', zh: '阴', en: 'Overcast', tint: '#9aa3b5' };
    if (c === 45 || c === 48) return { ic: '🌫️', zh: '雾', en: 'Fog', tint: '#b9bec9' };
    if (c >= 51 && c <= 57) return { ic: '🌦️', zh: '毛毛雨', en: 'Drizzle', tint: '#7fb0d8' };
    if (c === 61) return { ic: '🌧️', zh: '小雨', en: 'Light rain', tint: '#6aa0d4' };
    if (c === 63) return { ic: '🌧️', zh: '中雨', en: 'Rain', tint: '#4f88c6' };
    if (c === 65 || c === 66 || c === 67) return { ic: '🌧️', zh: '大雨', en: 'Heavy rain', tint: '#3b6fb0' };
    if (c >= 71 && c <= 77) return { ic: '❄️', zh: '雪', en: 'Snow', tint: '#cfe3f5' };
    if (c === 80 || c === 81) return { ic: '🌦️', zh: '阵雨', en: 'Showers', tint: '#6aa0d4' };
    if (c === 82) return { ic: '⛈️', zh: '强阵雨', en: 'Heavy showers', tint: '#3b6fb0' };
    if (c === 85 || c === 86) return { ic: '🌨️', zh: '阵雪', en: 'Snow showers', tint: '#cfe3f5' };
    if (c >= 95) return { ic: '⛈️', zh: '雷阵雨', en: 'Thunderstorm', tint: '#6c5ca8' };
    return { ic: '🌡️', zh: '—', en: '—', tint: 'transparent' };
  }
  // Animated weather picture for a WMO code (CSS draws and animates it).
  function wxKind(code) {
    var c = Number(code);
    if (c === 0) return 'clear';
    if (c === 1) return 'mainly';
    if (c === 2) return 'partly';
    if (c === 3) return 'overcast';
    if (c === 45 || c === 48) return 'fog';
    if (c >= 51 && c <= 57) return 'drizzle';
    if (c >= 61 && c <= 67) return 'rain';
    if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'snow';
    if (c >= 80 && c <= 82) return 'showers';
    if (c >= 95) return 'thunder';
    return 'overcast';
  }
  function wxArt(code, isDay, small) {
    var k = wxKind(code), night = isDay === 0;
    var sky = night ? '<i class="a-moon"></i>' : '<i class="a-sun"><b></b></i>';
    var cloud = function (c) { return '<i class="a-cloud' + (c ? ' ' + c : '') + '"></i>'; };
    var drops = function (n, c) { var s = ''; for (var i = 0; i < n; i++) s += '<i class="a-drop' + (c ? ' ' + c : '') + '" style="--i:' + i + '"></i>'; return s; };
    var h = {
      clear: sky,
      mainly: sky + cloud('sm'),
      partly: sky + cloud(),
      overcast: cloud('back') + cloud(),
      fog: cloud('back') + '<i class="a-fog"></i><i class="a-fog f2"></i>',
      drizzle: cloud() + drops(3, 'fine'),
      rain: cloud('dark') + drops(4),
      showers: sky + cloud() + drops(3),
      thunder: cloud('dark') + '<i class="a-bolt"></i>' + drops(2),
      snow: cloud() + drops(3, 'flake')
    }[k];
    return '<span class="wxa wxa-' + k + (night ? ' night' : '') + (small ? ' sm' : '') + '" aria-hidden="true">' + h + '</span>';
  }
  function r0(n) { return n == null || isNaN(n) ? '–' : Math.round(n); }
  function fetchJSON(url, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 8000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { clearTimeout(timer); });
  }
  function coordParams() {
    return 'latitude=' + T.cities.map(function (c) { return c.lat; }).join(',') + '&longitude=' + T.cities.map(function (c) { return c.lng; }).join(',');
  }
  function asArray(x) { return Array.isArray(x) ? x : [x]; }

  function renderWeatherShell() {
    var skel = '';
    for (var i = 0; i < 4; i++) skel += '<div class="skel" aria-hidden="true"></div>';
    $('#weather-slot').innerHTML = head('h-weather', 'Live weather', '实时天气', { zh: '各城市现在的天气，以及旅程每一天的预报。', en: 'Weather right now in each city, plus a forecast for every trip day.' }, '天') +
      '<div class="seg" role="tablist" aria-label="天气视图 Weather view">' +
      '<button type="button" role="tab" id="wt-now" aria-controls="wx-now" data-act="wxtab" data-v="now">现在 ' + en('Now') + '</button>' +
      '<button type="button" role="tab" id="wt-trip" aria-controls="wx-trip" data-act="wxtab" data-v="trip">旅程预报 ' + en('Trip forecast') + '</button></div>' +
      '<div id="wx-now" role="tabpanel" aria-labelledby="wt-now" class="wx-grid">' + skel + '</div>' +
      '<div id="wx-trip" role="tabpanel" aria-labelledby="wt-trip" class="trip-wx" hidden></div>' +
      '<p class="wx-status" id="wx-status" aria-live="polite"></p><p class="wx-note" id="wx-note"></p>';
  }
  function setWxTab(v) {
    wxTab = v;
    $$('.seg [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.v === v)); b.tabIndex = b.dataset.v === v ? 0 : -1; });
    $('#wx-now').hidden = v !== 'now';
    $('#wx-trip').hidden = v !== 'trip';
  }
  // Forecast entry for a trip day, or last-year entry, or null.
  function dayWeather(d) {
    var dt = dayDate(d.n); if (!dt) return null;
    var fc = WX.fc && asArray(WX.fc.data)[d.city];
    if (fc && fc.daily) {
      var i = fc.daily.time.indexOf(ymd(dt));
      if (i >= 0) return { src: ymd(dt) < todayStr() ? 'past' : 'fc', code: fc.daily.weather_code[i], max: fc.daily.temperature_2m_max[i], min: fc.daily.temperature_2m_min[i], rain: fc.daily.precipitation_probability_max[i] };
    }
    var ly = WX.ly && asArray(WX.ly.data)[d.city];
    if (ly && ly.daily) {
      var j = ly.daily.time.indexOf(ymd(new Date(dt.getFullYear() - 1, dt.getMonth(), dt.getDate())));
      if (j >= 0) return { src: 'ly', code: ly.daily.weather_code[j], max: ly.daily.temperature_2m_max[j], min: ly.daily.temperature_2m_min[j], mm: ly.daily.precipitation_sum[j] };
    }
    return null;
  }
  function paintWeather() {
    var today = todayDay(), todayCity = today ? T.days[today - 1].city : -1;
    var data = WX.fc ? asArray(WX.fc.data) : null;

    // Now
    if (data) {
      $('#wx-now').innerHTML = T.cities.map(function (c, i) {
        var w = data[i]; if (!w || !w.current) return '';
        var cur = w.current, info = wmo(cur.weather_code, cur.is_day), dl = w.daily || {};
        var ti = dl.time ? dl.time.indexOf(String(cur.time || '').slice(0, 10)) : -1;
        return '<article class="wx' + (i === todayCity ? ' today' : '') + '" style="--wx-tint:' + info.tint + '">' +
          (i === todayCity ? '<span class="wx-today-tag">今天 <span lang="en">Today</span></span>' : '') +
          '<h3 class="wx-city">' + bi(c) + '</h3>' +
          '<div class="wx-now">' + wxArt(cur.weather_code, cur.is_day) + '<span class="wx-t">' + r0(cur.temperature_2m) + '°</span></div>' +
          '<p class="wx-lab">' + bi(info) + '</p>' +
          '<dl class="wx-dl">' +
          '<dt>体感<span class="en" lang="en">Feels</span></dt><dd>' + r0(cur.apparent_temperature) + '°</dd>' +
          (ti >= 0 ? '<dt>今日<span class="en" lang="en">Today</span></dt><dd>' + r0(dl.temperature_2m_max[ti]) + '° / ' + r0(dl.temperature_2m_min[ti]) + '°</dd>' +
            '<dt>降雨<span class="en" lang="en">Rain</span></dt><dd>☔ ' + r0(dl.precipitation_probability_max[ti]) + '%</dd>' : '') +
          '<dt>湿度<span class="en" lang="en">Humidity</span></dt><dd>' + r0(cur.relative_humidity_2m) + '%</dd>' +
          '<dt>风<span class="en" lang="en">Wind</span></dt><dd>' + r0(cur.wind_speed_10m) + ' km/h</dd></dl></article>';
      }).join('');
    } else if (WX.failed) {
      $('#wx-now').innerHTML = '<p class="wx-note" style="grid-column:1/-1">' + bib({ zh: '暂时无法取得天气，请稍后再试。', en: 'Weather is unavailable right now. Please try again later.' }) + '</p>';
    }

    // Trip forecast
    var anyFc = false;
    $('#wx-trip').innerHTML = T.days.map(function (d) {
      var dt = dayDate(d.n), c = T.cities[d.city], w = dayWeather(d), info = w ? wmo(w.code, 1) : null;
      if (w && w.src !== 'ly') anyFc = true;
      return '<article class="twx' + (d.n === today ? ' today' : '') + '">' +
        '<div class="twx-d"><b>第' + d.n + '天</b><small lang="en">' + (dt ? WEEK_EN[dt.getDay()] + ' ' + dt.getDate() + ' ' + MON_EN[dt.getMonth()] : 'Day ' + d.n) + '</small></div>' +
        '<div class="twx-m"><div class="city">' + bi(c) + '</div>' +
        (w ? '<span class="src ' + w.src + '">' + ({ fc: '预报 <span lang="en">Forecast</span>', past: '当天天气 <span lang="en">On the day</span>', ly: '去年同期 <span lang="en">Same day last year</span>' })[w.src] + '</span>' + ' <small class="muted">' + bi(info) + '</small>'
          : '<span class="src ly">暂无 <span lang="en">Not yet</span></span>') + '</div>' +
        '<div class="twx-w">' + (w ? wxArt(w.code, 1, true) + '<div class="hl">' + r0(w.max) + '° <span>/ ' + r0(w.min) + '°</span></div>' +
          '<small>' + (w.src !== 'ly' ? '☔ ' + r0(w.rain) + '%' : '💧 ' + (w.mm == null ? '–' : (Math.round(w.mm * 10) / 10)) + ' mm') + '</small>' : '<span class="ic" aria-hidden="true">·</span>') + '</div>' +
        '</article>';
    }).join('');

    // Forecast chips on day cards (forecast only)
    T.days.forEach(function (d) {
      var el = $('[data-wxday="' + d.n + '"]'); if (!el) return;
      var w = dayWeather(d);
      if (w && w.src === 'fc') {
        var info = wmo(w.code, 1);
        el.innerHTML = wxArt(w.code, 1, true) + ' ' + r0(w.max) + '° / ' + r0(w.min) + '° · ☔ ' + r0(w.rain) + '% <span class="en" lang="en">forecast</span>';
        el.hidden = false;
      } else el.hidden = true;
    });

    // Status + note
    var st = $('#wx-status');
    if (WX.fc) {
      var t = new Date(WX.fc.t), hhmm = pad(t.getHours()) + ':' + pad(t.getMinutes());
      var dateStr = (t.getMonth() + 1) + '/' + t.getDate();
      st.className = 'wx-status' + (WX.offline ? ' off' : '');
      st.innerHTML = '<span>' + (WX.offline ? '📴 离线 · 上次更新 ' + dateStr + ' ' + hhmm + ' <span lang="en">Offline · last updated</span>' : '更新于 ' + hhmm + ' <span lang="en">Updated</span>') + '</span>' +
        '<button type="button" class="btn btn-sm" data-act="wxrefresh">↻ 刷新 ' + en('Refresh') + '</button>';
    } else {
      st.innerHTML = WX.failed ? '<button type="button" class="btn btn-sm" data-act="wxrefresh">↻ 重试 ' + en('Retry') + '</button>' : '载入中… <span lang="en">Loading…</span>';
    }
    var note = $('#wx-note'), dep = depDate();
    if (dep && !anyFc && tripIndex() < 0) {
      var from = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate() - 15);
      note.innerHTML = bib({ zh: '出发前约16天（' + (from.getMonth() + 1) + '月' + from.getDate() + '日起）自动显示每日预报，现在先显示去年同期天气。', en: 'The live daily forecast appears automatically about 16 days before departure (from ' + from.getDate() + ' ' + MON_EN[from.getMonth()] + '). Until then you see last year’s weather for the same dates.' }) +
        '<br><small>' + bi({ zh: '每30分钟自动更新 · 数据来源', en: 'Auto-updates every 30 min · data' }) + ' Open-Meteo.com</small>';
    } else {
      note.innerHTML = '<small>' + bi({ zh: '每30分钟自动更新 · 数据来源', en: 'Auto-updates every 30 min · data' }) + ' Open-Meteo.com</small>';
    }
    if (!wxTab) setWxTab(anyFc || todayDay() ? 'trip' : 'now');
    renderMapInfo();
  }
  var wxBusy = false;
  function loadForecast(force) {
    var fresh = WX.fc && Date.now() - WX.fc.t < 30 * 60e3;
    if ((fresh && !force) || wxBusy) { paintWeather(); return; }
    wxBusy = true;
    var url = 'https://api.open-meteo.com/v1/forecast?' + coordParams() +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=16&past_days=7';
    fetchJSON(url).then(function (data) {
      WX.fc = { t: Date.now(), data: asArray(data) }; WX.offline = false; WX.failed = false;
      store.set(WX_KEY, WX);
    }).catch(function () {
      if (WX.fc) WX.offline = true; else WX.failed = true;
    }).then(function () { wxBusy = false; paintWeather(); });
  }
  function loadLastYear() {
    var d1 = dayDate(1); if (!d1) return;
    var s = new Date(d1.getFullYear() - 1, d1.getMonth(), d1.getDate()), e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + T.days.length - 1);
    if (e > new Date(Date.now() - 7 * 864e5)) return; // archive lags a few days behind
    var range = ymd(s) + '_' + ymd(e);
    if (WX.ly && WX.ly.range === range) return;
    var url = 'https://archive-api.open-meteo.com/v1/archive?' + coordParams() + '&start_date=' + ymd(s) + '&end_date=' + ymd(e) +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FShanghai';
    fetchJSON(url, 10000).then(function (data) {
      WX.ly = { range: range, data: asArray(data) }; store.set(WX_KEY, WX); paintWeather();
    }).catch(function () { /* keep going without it */ });
  }

  /* ---------- real map (Leaflet) ---------- */
  var map = null, mapLayers = {}, curLayer = 'osm', mkGroup = null, meMk = null, mapDay = 0, stopMarkers = {};
  var OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var AMAP_URL = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';

  // WGS-84 -> GCJ-02 (Amap tiles are in GCJ-02).
  function outOfChina(lat, lng) { return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271; }
  function tLat(x, y) {
    var PI = Math.PI, r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
    r += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
    r += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
    return r;
  }
  function tLng(x, y) {
    var PI = Math.PI, r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
    r += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
    r += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
    return r;
  }
  function wgs2gcj(lat, lng) {
    if (outOfChina(lat, lng)) return [lat, lng];
    var a = 6378245.0, ee = 0.00669342162296594323, PI = Math.PI;
    var dLat = tLat(lng - 105, lat - 35), dLng = tLng(lng - 105, lat - 35);
    var radLat = lat / 180 * PI, magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sq = Math.sqrt(magic);
    dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sq) * PI);
    dLng = (dLng * 180) / (a / sq * Math.cos(radLat) * PI);
    return [lat + dLat, lng + dLng];
  }
  function P(lat, lng) { return curLayer === 'amap' ? wgs2gcj(lat, lng) : [lat, lng]; }

  function renderMapShell() {
    $('#map-slot').innerHTML = head('h-map', 'Route map', '路线地图', { zh: '真实地图，可以随意拖动、缩放。点标记或下方列表看详情。', en: 'A real map you can drag and zoom. Tap a marker or the list below for details.' }, '图') +
      '<div class="map-tools">' +
      '<div class="map-days" role="group" aria-label="按天筛选 Filter by day"><button type="button" data-act="mapday" data-v="0" aria-pressed="true">全部 ' + en('All') + '</button>' +
      T.days.map(function (d) { return '<button type="button" data-act="mapday" data-v="' + d.n + '" aria-pressed="false">第' + d.n + '天</button>'; }).join('') + '</div>' +
      '<div class="map-layer" role="group" aria-label="底图 Base map"><button type="button" data-act="layer" data-v="osm" aria-pressed="false">OSM</button><button type="button" data-act="layer" data-v="amap" aria-pressed="false">高德 <span lang="en">Amap</span></button></div>' +
      '</div>' +
      '<div class="map-wrap">' +
      '<div class="map-frame"><div class="map-box" id="leaflet" role="region" aria-label="路线地图 Route map"></div>' +
      '<div class="map-ctl"><button type="button" data-act="locate" aria-label="定位我 Locate me" title="定位 Locate me">📍</button>' +
      '<button type="button" data-act="fitall" aria-label="显示全部 Show everything" title="全部 Show all">🧭</button></div></div>' +
      '<aside class="map-info" id="map-info" aria-live="polite"></aside>' +
      '</div>' +
      '<div class="map-legend">' + ['sight', 'film', 'food', 'shop', 'travel'].map(function (k) {
        return '<span><i style="background:' + TAG_COLOR[k] + '"></i>' + TAGS[k].zh + ' <span lang="en">' + TAGS[k].en + '</span></span>';
      }).join('') + '<span><i style="background:linear-gradient(120deg,#f9e6a8,#d6a443);border-radius:.15rem"></i>过夜城市 <span lang="en">Overnight city</span></span></div>' +
      '<p class="map-note" id="map-note">' + bib({ zh: '在中国大陆建议用「高德」底图，加载更快。看过的区域可离线查看。', en: 'In mainland China the Amap base map loads faster. Areas you have viewed work offline.' }) + '</p>';
    renderMapInfo();
  }

  function initMap() {
    if (map || !window.L) {
      if (!window.L) $('#leaflet').innerHTML = '<p class="wx-note" style="padding:2rem">' + bib({ zh: '地图载入失败。', en: 'The map could not load.' }) + '</p>';
      return;
    }
    map = L.map('leaflet', { scrollWheelZoom: false, boxZoom: false, zoomSnap: 0.5, preferCanvas: true, attributionControl: true });
    map.attributionControl.setPrefix(false);
    // Mouse-wheel zoom only once you click into the map, so the page still scrolls normally.
    map.on('focus click', function () { map.scrollWheelZoom.enable(); });
    map.on('blur mouseout', function () { map.scrollWheelZoom.disable(); });
    map.on('zoomend', function () { $('#leaflet').classList.toggle('z-near', map.getZoom() >= 11); });
    mapLayers.osm = L.tileLayer(OSM_URL, { maxZoom: 19, attribution: '© OpenStreetMap contributors', crossOrigin: true });
    mapLayers.amap = L.tileLayer(AMAP_URL, { maxZoom: 18, subdomains: '1234', attribution: '© 高德地图 AutoNavi', crossOrigin: true });
    mkGroup = L.layerGroup().addTo(map);

    var chosen = state.layer === 'amap' ? 'amap' : 'osm';
    setLayer(chosen, true);

    // If OSM tiles keep failing early on (common on some mainland networks), switch to Amap once.
    if (!state.layer && chosen === 'osm') {
      var errs = 0, oks = 0;
      var onErr = function () { errs++; }, onOk = function () { oks++; };
      mapLayers.osm.on('tileerror', onErr).on('tileload', onOk);
      setTimeout(function () {
        mapLayers.osm.off('tileerror', onErr).off('tileload', onOk);
        if (errs >= 4 && oks < 2 && curLayer === 'osm') { setLayer('amap'); state.layer = 'amap'; save(); }
      }, 6000);
    }
    map.on('locationfound', function (e) {
      var ll = P(e.latlng.lat, e.latlng.lng);
      if (meMk) meMk.remove();
      meMk = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-mk"></div>', iconSize: [18, 18] }), title: '我在这里 You are here' }).addTo(map);
      map.setView(ll, Math.max(map.getZoom(), 13));
    });
    map.on('locationerror', function () {
      $('#map-note').innerHTML = bib({ zh: '无法取得你的位置（请允许定位权限）。', en: 'Could not get your location (please allow location access).' });
    });
  }

  function setLayer(v, initial) {
    if (!map) { state.layer = v; save(); return; }
    var prev = curLayer;
    if (mapLayers[prev] && map.hasLayer(mapLayers[prev])) map.removeLayer(mapLayers[prev]);
    curLayer = v;
    mapLayers[v].addTo(map);
    $$('[data-act="layer"]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === v)); });
    drawMarkers(initial || prev !== v);
    if (meMk) { meMk.remove(); meMk = null; }
  }

  function cityDays(i) { return T.days.filter(function (d) { return d.city === i; }).map(function (d) { return d.n; }); }
  // Which side of the stamp each city's name sits on, so neighbours don't overlap.
  var LABEL_SIDE = { 5: 'top', 6: 'left' };

  function popupHtml(name, sub, dn, links) {
    return '<div class="pop"><h4>' + esc(name.zh) + '<span class="en" lang="en">' + esc(name.en) + '</span></h4>' +
      (sub ? '<p>' + sub + '</p>' : '') + '<div class="row">' +
      (dn ? '<button type="button" class="btn btn-sm btn-ink" data-act="goday" data-v="' + dn + '">跳到这天 ' + en('Go to day') + '</button>' : '') +
      (links ? '<a class="btn btn-sm" href="' + esc(links.amap) + '" target="_blank" rel="noopener">高德 Amap</a><a class="btn btn-sm" href="' + esc(links.google) + '" target="_blank" rel="noopener">Google</a>' : '') +
      '</div></div>';
  }

  function drawMarkers(fit) {
    if (!map) return;
    mkGroup.clearLayers(); stopMarkers = {};
    var today = todayDay(), bounds = [];

    // route line through the cities, in travel order
    var route = T.routeOrder.map(function (i) { return P(T.cities[i].lat, T.cities[i].lng); });
    L.polyline(route, { color: '#b8322a', weight: 3, opacity: .75, dashArray: '8 8', interactive: false }).addTo(mkGroup);

    // cities: gold stamp with the day number(s) + a permanent name label
    T.cities.forEach(function (c, i) {
      var days = cityDays(i), isToday = today && T.days[today - 1].city === i;
      var show = !mapDay || days.indexOf(mapDay) >= 0;
      var mk = L.marker(P(c.lat, c.lng), {
        icon: L.divIcon({ className: 'city-mk' + (days.length ? '' : ' pass') + (isToday ? ' today' : ''), html: '<span>' + (days.length ? esc(days.join('·')) : '') + '</span>', iconSize: [0, 0] }),
        title: c.zh + ' ' + c.en, opacity: show ? 1 : .4, zIndexOffset: 500
      }).addTo(mkGroup);
      var side = LABEL_SIDE[i] || 'right';
      mk.bindTooltip('<b>' + esc(c.zh) + '</b><span lang="en">' + esc(c.en) + '</span>', {
        permanent: true, direction: side, className: 'city-tip' + (show ? '' : ' dim'),
        offset: side === 'left' ? [-16, 0] : side === 'top' ? [0, -16] : [16, 0]
      });
      var sub = days.length ? '第' + days.join('、') + '天 · <span lang="en">Day ' + days.join(', ') + '</span>' : '途经 <span lang="en">Passing through</span>';
      mk.bindPopup(popupHtml(c, sub, days[0] || 0, null));
      if (!mapDay || show) bounds.push(P(c.lat, c.lng));
    });

    // stops with a known location
    T.days.forEach(function (d) {
      if (mapDay && d.n !== mapDay) return;
      d.stops.forEach(function (s, i) {
        if (s.approx || s.lat == null) return;
        var ll = P(s.lat, s.lng), t = TAGS[s.tag] || TAGS.sight, mk;
        if (s.tag === 'film') {
          mk = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="film-mk">🎬</div>', iconSize: [28, 28] }), title: s.name.zh + ' ' + s.name.en });
        } else {
          mk = L.circleMarker(ll, { radius: 7, color: '#fffbf2', weight: 2, fillColor: TAG_COLOR[s.tag] || TAG_COLOR.sight, fillOpacity: 1 });
        }
        // names show permanently when a single day is selected; otherwise on hover
        mk.bindTooltip(esc(s.name.zh) + ' <span lang="en">' + esc(s.name.en) + '</span>', { permanent: !!mapDay, direction: 'top', offset: [0, -8], className: 'stop-tip' });
        mk.bindPopup(popupHtml(s.name, t.ic + ' 第' + d.n + '天 · <span lang="en">Day ' + d.n + '</span> · ' + t.zh + ' <span lang="en">' + t.en + '</span>', d.n, mapLinks(s, d)));
        mk.addTo(mkGroup);
        stopMarkers[d.n + ':' + i] = mk;
        if (mapDay) bounds.push(ll);
      });
    });

    if (fit && bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(mapDay ? .3 : .08), { maxZoom: 14, animate: !reduceMotion });
  }

  // The panel beside/below the map: whole-trip overview, or one day's stops.
  function renderMapInfo() {
    var el = $('#map-info'); if (!el) return;
    var today = todayDay();
    if (!mapDay) {
      el.innerHTML = '<p class="mi-k">全部行程 <span lang="en">Whole trip</span></p>' +
        '<ol class="mi-days">' + T.days.map(function (d) {
          var dt = dayDate(d.n), w = dayWeather(d), info = w ? wmo(w.code, 1) : null;
          return '<li><button type="button" class="mi-day' + (d.n === today ? ' today' : '') + '" data-act="mapday" data-v="' + d.n + '">' +
            '<span class="mi-n">' + d.n + '</span><span class="mi-t"><b>' + esc(d.route.zh) + '</b><small lang="en">' + (dt ? WEEK_EN[dt.getDay()] + ' ' + dt.getDate() + ' ' + MON_EN[dt.getMonth()] + ' · ' : '') + esc(d.route.en) + '</small></span>' +
            (info ? '<span class="mi-w">' + info.ic + ' ' + r0(w.max) + '°</span>' : '') + '</button></li>';
        }).join('') + '</ol>';
      return;
    }
    var d = T.days[mapDay - 1], dt = dayDate(d.n);
    el.innerHTML = '<p class="mi-k">第' + d.n + '天 <span lang="en">Day ' + d.n + '</span>' + (dt ? ' · ' + bi(fmtDay(dt)) : '') + '</p>' +
      '<h3 class="mi-h">' + esc(d.route.zh) + '<span class="en" lang="en">' + esc(d.route.en) + '</span></h3>' +
      '<ol class="mi-stops">' + d.stops.map(function (s, i) {
        var t = TAGS[s.tag] || TAGS.sight;
        if (s.approx || s.lat == null) {
          var l = mapLinks(s, d);
          return '<li class="mi-stop approx"><span class="mi-ic" aria-hidden="true">' + t.ic + '</span><span class="mi-t"><b>' + esc(s.name.zh) + '</b><small lang="en">' + esc(s.name.en) + '</small>' +
            '<small>位置不确定 · <a href="' + esc(l.amap) + '" target="_blank" rel="noopener">高德搜索</a> · <a href="' + esc(l.google) + '" target="_blank" rel="noopener" lang="en">Google search</a></small></span></li>';
        }
        return '<li><button type="button" class="mi-stop" data-act="flyto" data-day="' + d.n + '" data-i="' + i + '"><span class="mi-ic" aria-hidden="true">' + t.ic + '</span>' +
          '<span class="mi-t"><b>' + esc(s.name.zh) + '</b><small lang="en">' + esc(s.name.en) + '</small></span><span class="mi-go" aria-hidden="true">→</span></button></li>';
      }).join('') + '</ol>' +
      (d.hotel ? '<p class="mi-hotel">🛏️ ' + bib(d.hotel) + '</p>' : '') +
      '<div class="mi-acts"><button type="button" class="btn btn-sm btn-ink" data-act="goday" data-v="' + d.n + '">看这天行程 ' + en('Day details') + '</button>' +
      '<button type="button" class="btn btn-sm" data-act="mapday" data-v="0">全部 ' + en('All days') + '</button></div>';
  }

  function setMapDay(n) {
    mapDay = n;
    $$('.map-days [data-act="mapday"]').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.v) === n)); });
    drawMarkers(true);
    renderMapInfo();
  }
  function flyTo(dn, i) {
    initMap(); if (!map) return;
    if (mapDay !== dn) setMapDay(dn);
    var mk = stopMarkers[dn + ':' + i]; if (!mk) return;
    var frame = $('.map-frame').getBoundingClientRect();
    if (frame.top < 0 || frame.bottom > innerHeight) goTo($('.map-frame'));
    map.setView(mk.getLatLng(), 15, { animate: !reduceMotion });
    setTimeout(function () { mk.openPopup(); }, reduceMotion ? 0 : 300);
  }
  function showOnMap(dn, i) {
    closeSheet();
    goTo($('#map'));
    setTimeout(function () { flyTo(dn, i); }, reduceMotion ? 0 : 600);
  }

  /* ---------- info ---------- */
  function renderInfo() {
    var done = T.packing.filter(function (_, i) { return state.packing[i]; }).length;
    var listItems = function (arr) { return arr.map(function (x) { return '<li><span class="ic" aria-hidden="true">' + esc(x.icon || '•') + '</span>' + bib(x) + '</li>'; }).join(''); };
    var foodGroup = function (title, arr) {
      return '<h4>' + bi(title) + '</h4><div class="food-list">' + arr.map(function (f) { return '<span class="food"><span aria-hidden="true">' + f.emoji + '</span>' + bi(f) + '</span>'; }).join('') + '</div>';
    };
    $('#info-slot').innerHTML = head('h-info', 'Trip info', '旅程资讯', null, '讯') +
      '<div class="info-grid">' +
      '<section class="box rv" aria-labelledby="h-pack"><h3 id="h-pack">出发前清单 ' + en('Before I go') + '</h3>' +
      '<p class="muted" style="font-size:.85rem">' + bib({ zh: '我自己的准备清单，打勾会存在这部手机。', en: 'My own prep list. Ticks are saved on this phone.' }) + '</p>' +
      '<div class="bar" aria-hidden="true"><i id="pack-bar" style="transform:scaleX(' + (done / T.packing.length) + ')"></i></div>' +
      '<p class="muted" id="pack-count" style="font-size:.8rem;margin-bottom:.5rem">' + done + ' / ' + T.packing.length + ' 已准备 <span lang="en">ready</span></p>' +
      '<div class="checks">' + T.packing.map(function (p, i) {
        return '<button type="button" class="check" role="checkbox" aria-checked="' + !!state.packing[i] + '" data-act="pack" data-i="' + i + '"><span class="bx" aria-hidden="true">✓</span>' + bib(p) + '</button>';
      }).join('') + '</div></section>' +

      '<section class="box rv" aria-labelledby="h-contact"><h3 id="h-contact">联络 ' + en('Contacts') + '</h3><div class="contacts">' +
      T.contacts.map(function (c) {
        var name = typeof c.name === 'string' ? { zh: c.name, en: '' } : c.name;
        var mobile = /^\+601/.test(c.phone);
        return '<div class="contact"><div class="who"><b>' + esc(name.zh) + (name.en && name.en !== name.zh ? ' <span class="en" lang="en" style="font-size:.8em;color:var(--ink-2)">' + esc(name.en) + '</span>' : '') + '</b>' +
          '<small>' + bi(c.role) + '</small><span class="num">' + esc(c.display) + '</span></div>' +
          '<div class="acts"><a class="btn btn-sm btn-red" href="tel:' + esc(c.phone) + '">📞 拨打 ' + en('Call') + '</a>' +
          (mobile ? '<a class="btn btn-sm" href="https://wa.me/' + esc(c.phone.replace(/\D/g, '')) + '" target="_blank" rel="noopener">💬 WhatsApp</a>' : '') + '</div></div>';
      }).join('') + '</div>' +
      '<p class="notes"><span>🏢 ' + esc(T.agency.name) + '<br>' + esc(T.agency.address) + '</span></p></section>' +

      '<section class="box rv" aria-labelledby="h-hi"><h3 id="h-hi">行程特色 ' + en('Highlights') + '</h3><ul class="list">' + listItems(T.highlights) + '</ul></section>' +

      '<section class="box rv" aria-labelledby="h-inc"><h3 id="h-inc">费用包含 ' + en('Included') + '</h3><ul class="list">' + listItems(T.includes) + '</ul>' +
      '<h3 style="margin-top:1rem;font-size:1.2rem">不包含 ' + en('Not included') + '</h3><ul class="list" style="margin-top:.6rem">' + listItems(T.excludes) + '</ul></section>' +

      '<section class="box rv span2 foods" aria-labelledby="h-food"><h3 id="h-food">特色美食 ' + en('Signature food') + '</h3>' +
      foodGroup({ zh: '潮汕美食', en: 'Chaoshan cuisine' }, T.food.chaoshan) + foodGroup({ zh: '粤菜', en: 'Cantonese cuisine' }, T.food.cantonese) + '</section>' +

      '<section class="box rv span2"><details class="remarks"><summary>备注 ' + en('Remarks from the brochure') + '</summary><ol class="remark-list">' +
      T.remarks.map(function (r) { return '<li>' + bib(r) + '</li>'; }).join('') + '</ol></details></section>' +

      '<section class="box rv span2"><h3>小提示 ' + en('Good to know') + '</h3><div class="notes">' +
      '<p>📶 ' + bib({ zh: '出发前先在 Wi-Fi 下打开一次这个页面，之后没有网络也能看。', en: 'Open this page once on Wi-Fi before the trip so it works offline.' }) + '</p>' +
      '<p>🗺️ ' + bib({ zh: '地图位置仅供参考，集合地点请以导游为准。', en: 'Map pins are a guide only. Confirm meeting points with the tour guide.' }) + '</p>' +
      '<p>🌐 ' + bib({ zh: '在中国大陆，Google 地图需要 VPN；高德地图可直接使用。', en: 'In mainland China, Google Maps needs a VPN; Amap works directly.' }) + '</p>' +
      '</div></section>' +
      '</div>';
  }
  function updatePacking() {
    var done = T.packing.filter(function (_, i) { return state.packing[i]; }).length;
    $('#pack-bar').style.transform = 'scaleX(' + (done / T.packing.length) + ')';
    $('#pack-count').innerHTML = done + ' / ' + T.packing.length + ' 已准备 <span lang="en">ready</span>' + (done === T.packing.length ? ' 🎉' : '');
  }

  /* ---------- navigation, scroll ---------- */
  var goTimer = null;
  function goTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // content-visibility can shift sizes mid-scroll; make sure we land on target.
    clearTimeout(goTimer);
    goTimer = setTimeout(function () {
      var top = el.getBoundingClientRect().top, want = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      if (Math.abs(top - want) > 12) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, reduceMotion ? 50 : 900);
  }

  var SECTIONS = ['days', 'weather', 'map', 'info'], activeSec = 'days';
  function moveTabInd() {
    var i = SECTIONS.indexOf(activeSec), ind = $('#tab-ind');
    if (ind) ind.style.transform = 'translateX(' + (Math.max(0, i) * 100) + '%)';
  }
  function setActiveSec(id) {
    if (id === activeSec && $('.tabbar a.on')) return;
    activeSec = id;
    $$('[data-nav]').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === id); if (a.dataset.nav === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    moveTabInd();
  }
  function setActiveChip(n) {
    var bar = $('#chips'), on = null;
    $$('.chip', bar).forEach(function (c) { var is = Number(c.dataset.day) === n; c.classList.toggle('on', is); if (is) on = c; });
    if (on) {
      var left = on.offsetLeft - bar.clientWidth / 2 + on.clientWidth / 2;
      bar.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function observers() {
    if (!('IntersectionObserver' in window)) { $$('.rv').forEach(function (e) { e.classList.add('in'); }); return; }
    var rv = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.rv').forEach(function (e) { rv.observe(e); });

    var secObs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) setActiveSec(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(function (id) { secObs.observe($('#' + id)); });

    var seen = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -15% 0px' });
    $$('.day').forEach(function (d) { seen.observe(d); });

    var dayObs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) setActiveChip(Number(e.target.id.split('-')[1])); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.day').forEach(function (d) { dayObs.observe(d); });

    var wxObs = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { e.target.classList.toggle('wx-on', e.isIntersecting); });
    });
    wxObs.observe($('#weather'));

    var mapObs = new IntersectionObserver(function (ents) {
      if (ents.some(function (e) { return e.isIntersecting; })) { initMap(); mapObs.disconnect(); }
    }, { rootMargin: '400px 0px' });
    mapObs.observe($('#map'));
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      var k = h > 0 ? Math.min(1, scrollY / h) : 0;
      $('#progress-bar').style.transform = 'scaleX(' + k + ')';
      var pl = $('#progress-plane');
      pl.style.transform = 'translateX(' + Math.round(k * (document.documentElement.clientWidth - pl.offsetWidth - 2)) + 'px)';
    });
  }

  /* ---------- events ---------- */
  function onClick(e) {
    var go = e.target.closest('a[data-go], .topnav a, .tabbar a');
    if (go && go.hash) {
      var target = $(go.hash);
      if (target) { e.preventDefault(); goTo(target); if (history.replaceState) history.replaceState(null, '', go.hash); }
      return;
    }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act, v = b.dataset.v;
    switch (act) {
      case 'fs': {
        var i = FS.indexOf(state.fs) + Number(b.dataset.d);
        if (i >= 0 && i < FS.length) { state.fs = FS[i]; save(); applyFs(); }
        break;
      }
      case 'editdate': renderCount(true); break;
      case 'canceldate': renderCount(false); break;
      case 'savedate': {
        var val = ($('#dep-in') || {}).value || '';
        state.departure = /^\d{4}-\d{2}-\d{2}$/.test(val) && val !== T.departureDate ? val : '';
        save(); rerenderDates(); break;
      }
      case 'stop': openStop(Number(b.dataset.day), Number(b.dataset.i)); break;
      case 'closesheet': closeSheet(); break;
      case 'showonmap': showOnMap(Number(b.dataset.day), Number(b.dataset.i)); break;
      case 'optional': {
        state.optional[v] = !state.optional[v]; save();
        var on = state.optional[v];
        b.setAttribute('aria-pressed', String(on));
        b.innerHTML = on ? '✓ 我会参加 ' + en("I'm joining") : '＋ 我想参加 ' + en("I'll join");
        break;
      }
      case 'pack': {
        var k = Number(b.dataset.i); state.packing[k] = !state.packing[k]; save();
        b.setAttribute('aria-checked', String(!!state.packing[k])); updatePacking(); break;
      }
      case 'wxtab': setWxTab(v); break;
      case 'wxrefresh': loadForecast(true); break;
      case 'mapday': initMap(); setMapDay(Number(v)); break;
      case 'layer': state.layer = v; save(); initMap(); setLayer(v); break;
      case 'flyto': flyTo(Number(b.dataset.day), Number(b.dataset.i)); break;
      case 'locate': initMap(); if (map) map.locate({ setView: false, enableHighAccuracy: true, timeout: 10000 }); break;
      case 'fitall': initMap(); setMapDay(0); break;
      case 'goday': if (map) map.closePopup(); goTo($('#day-' + v)); break;
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab' && !$('#sheet-root').hidden) {
      var f = $$('#sheet a, #sheet button'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.matches('.seg [role="tab"]')) {
      setWxTab(wxTab === 'now' ? 'trip' : 'now'); $('.seg [aria-selected="true"]').focus();
    }
  }
  function onImgError(e) {
    var t = e.target;
    if (t.tagName !== 'IMG' || t.dataset.failed) return;
    t.dataset.failed = '1';
    var fb = document.createElement('div'); fb.className = 'pc-fallback'; fb.setAttribute('aria-hidden', 'true'); fb.textContent = '✉️';
    t.replaceWith(fb);
  }

  function rerenderDates() {
    renderHero(); renderFlights(); renderDays(); paintWeather(); loadLastYear();
    if (map) drawMarkers(false);
    observers();
  }

  /* ---------- boot ---------- */
  function boot() {
    renderHero();
    renderFlights();
    renderDays();
    renderWeatherShell();
    renderMapShell();
    renderInfo();
    applyFs();
    observers();
    setActiveSec('days');

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    document.addEventListener('error', onImgError, true);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    onScroll();

    // Start the map in idle time after load, so it never hitches mid-scroll.
    addEventListener('load', function () {
      var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 300); };
      setTimeout(function () { idle(initMap, { timeout: 3000 }); }, 600);
    });

    paintWeather();
    loadForecast(false);
    loadLastYear();
    setInterval(function () { if (document.visibilityState === 'visible') loadForecast(false); }, 5 * 60e3);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { loadForecast(false); tickFlip(); } });

    if (location.hash && $(location.hash)) setTimeout(function () { goTo($(location.hash)); }, 100);

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ }); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
