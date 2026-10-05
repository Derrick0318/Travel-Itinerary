/* 团友旅程手册 · Tour companion (love-letter edition). Renders everything from window.TRIP (js/data.js).
   Always bilingual. Live weather from Open-Meteo. Real map with Leaflet. */
(function () {
  'use strict';

  const T = window.TRIP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- storage (wrapped: private mode can throw) ---------- */
  const KEY = 'trip.v2', WX_KEY = 'trip.wx.v1';
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const state = Object.assign({ fs: 1, departure: '', packing: {}, optional: {}, layer: '' }, load(KEY) || {});
  const save = () => store(KEY, state);

  /* ---------- small builders ---------- */
  const bi = (o) => o ? `<span class="bi"><span class="zh">${esc(o.zh)}</span><span class="en" lang="en">${esc(o.en)}</span></span>` : '';
  const bib = (o) => o ? `<span class="bib"><span class="zh">${esc(o.zh)}</span><span class="en" lang="en">${esc(o.en)}</span></span>` : '';
  const en = (s) => `<span class="en" lang="en">${esc(s)}</span>`;
  const ic = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const img = (src, alt, w = 960, h = 640) => `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
  const ORN = '<svg class="orn" viewBox="0 0 176 16" aria-hidden="true"><path d="M0 8h64M112 8h64" stroke="currentColor" stroke-width="1"/><path d="M70 8c0-4 5-6 8-3 1-4 8-5 10-1 2-4 9-3 10 1 3-3 8-1 8 3 0 4-5 5-8 3-2 3-8 4-10 1-2 3-9 2-10-1-3 2-8 1-8-3z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="88" cy="8" r="1.6" fill="currentColor"/></svg>';
  const head = (id, zh, enText, lead, wm) => `<header class="head"${wm ? ` data-wm="${wm}"` : ''}><h2 id="${id}">${esc(zh)}<span class="en" lang="en">${esc(enText)}</span></h2>${ORN}${lead ? `<p>${bib(lead)}</p>` : ''}</header>`;

  const TAGS = {
    sight: { ic: 'binoculars', zh: '景点', en: 'Sight', color: '#2457b3' },
    food: { ic: 'fork-knife', zh: '美食', en: 'Food', color: '#c81e29' },
    film: { ic: 'film-slate', zh: '电影取景地', en: 'Film location', color: '#f2c200' },
    shop: { ic: 'shopping-bag', zh: '购物', en: 'Shopping', color: '#7a4fb5' },
    travel: { ic: 'airplane-tilt', zh: '交通', en: 'Travel', color: '#138a84' },
  };
  const MEALS = { b: ['coffee', '早餐', 'Breakfast'], l: ['bowl-food', '午餐', 'Lunch'], d: ['fork-knife', '晚餐', 'Dinner'] };
  const MEAL_ST = { in: ['in', '含', 'Included'], own: ['own', '自理', 'Own expense'], air: ['air', '机上', 'On board'], '-': ['none', '无', 'None'] };

  /* ---------- dates: the whole trip runs on UTC+8 (Brunei and China) ---------- */
  const TZ = 8;
  const WEEK_ZH = '日一二三四五六', WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tzNow = () => new Date(Date.now() + TZ * 36e5); // read with getUTC*
  const todayStr = () => { const t = tzNow(); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
  const depString = () => state.departure || T.departureDate || '';
  const depDate = () => { const s = depString(); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const dayDate = (n) => { const d = depDate(); return d && new Date(d.getFullYear(), d.getMonth(), d.getDate() + n - 1); };
  const fmtDay = (d) => ({ zh: `${d.getMonth() + 1}月${d.getDate()}日 周${WEEK_ZH[d.getDay()]}`, en: `${WEEK_EN[d.getDay()]} ${d.getDate()} ${MON_EN[d.getMonth()]}` });
  const tripIndex = () => { // <0 before, 0..6 during, >6 after
    const d = depDate(); if (!d) return null;
    const t = tzNow();
    return Math.round((Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  };
  const todayDay = () => { const i = tripIndex(); return i != null && i >= 0 && i < T.days.length ? i + 1 : 0; };
  const msToTakeoff = () => {
    const d = depDate(); if (!d) return 0;
    const [h, m] = T.flights[0].from.time.split(':').map(Number);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h - TZ, m) - Date.now();
  };

  /* ---------- text size ---------- */
  const FS = [0.875, 1, 1.125, 1.25, 1.375];
  function applyFs() {
    if (!FS.includes(state.fs)) state.fs = 1;
    document.documentElement.style.fontSize = state.fs * 100 + '%';
    $('#fs-val').textContent = Math.round(state.fs * 100) + '%';
    $$('[data-act="fs"]').forEach((b) => { const i = FS.indexOf(state.fs) + Number(b.dataset.d); b.disabled = i < 0 || i >= FS.length; });
    if (map) setTimeout(() => map.invalidateSize(), 60);
  }

  /* ---------- hero (letter-by-letter gold title, wax seal) + countdown card ---------- */
  const VIBE = { future: ['未来之城', 'Future city'], old: ['老街烟火', 'Old streets'], film: ['电影足迹', 'Film trail'], city: ['城市灯火', 'City lights'] };
  const chars = (s, start) => { let i = 0; return s.split('').map((c) => (c === '\n' ? '<br>' : `<span class="ch" style="--d:${start + i++ * 70}ms">${esc(c)}</span>`)).join(''); };
  function postmark(d) {
    const y = d ? String(d.getFullYear()) : '----', md = d ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : '--.--';
    return `<svg class="postmark" viewBox="0 0 100 100" aria-hidden="true">
      <defs><path id="pm-a" d="M50,50 m-36,0 a36,36 0 1,1 72,0"/><path id="pm-b" d="M50,50 m-38,0 a38,38 0 0,0 76,0"/></defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="1.4"/>
      <text font-size="9.5" letter-spacing="1.5"><textPath href="#pm-a" startOffset="50%" text-anchor="middle">文莱 BRUNEI</textPath></text>
      <text font-size="8.5" letter-spacing="1.2"><textPath href="#pm-b" startOffset="50%" text-anchor="middle">深圳 SHENZHEN</textPath></text>
      <text x="50" y="47" font-size="10" text-anchor="middle">${y}</text><text x="50" y="61" font-size="12" text-anchor="middle">${md}</text></svg>`;
  }
  function renderTop() {
    const d1 = dayDate(1), d7 = dayDate(T.days.length);
    const range = d1 ? `${d1.getFullYear()}.${d1.getMonth() + 1}.${d1.getDate()} - ${d7.getMonth() + 1}.${d7.getDate()}` : '';
    $('#top-slot').innerHTML = `
      <section class="hero" id="top" aria-labelledby="h-title">
        <div class="hero-media">${img(T.heroImage, '潮州广济桥 Guangji Bridge, Chaozhou', 1280, 960).replace('loading="lazy"', 'fetchpriority="high"')}</div>
        <div class="hero-grain" aria-hidden="true"></div>
        <div class="hero-in wrap">
          <h1 id="h-title" aria-label="${esc(T.title.zh)} ${esc(T.title.en)}"><span class="zh" aria-hidden="true">${chars('一半烟火，\n一半未来', 150)}</span><span class="en" lang="en" aria-hidden="true">${esc(T.title.en)}</span></h1>
          <p class="hero-sub">${bib(T.subtitle)}</p>
          <p class="hero-tags"><span class="hero-tag">${ic('airplane-tilt')} ${bi(T.duration)}</span>${range ? `<span class="hero-tag">${ic('calendar-blank')} ${range}</span>` : ''}</p>
        </div>
        <div class="hero-vert" aria-hidden="true">给阿嬷的情书</div>
        <div class="hero-seal" aria-hidden="true"><span>信</span></div>
      </section>
      <div class="wrap"><section class="count" id="now" aria-labelledby="h-now"></section>
        <h2 class="passes-h">${ic('ticket')} 登机牌 ${en('Boarding passes')}</h2>
        <div class="passes">${T.flights.map((f) => {
          const d = dayDate(f.day), pt = (p, cls) => `<div class="pass-pt ${cls}"><b class="code">${esc(p.code)}</b><span class="city">${bi(p.city)}</span><b class="time">${esc(p.time)}</b></div>`;
          return `<article class="pass"><div class="pass-main"><p class="pass-top"><span>${bi(f.airline)}${d ? ` · ${bi(fmtDay(d))}` : ''}</span><b class="no">${esc(f.no)}</b></p>
            <div class="pass-route">${pt(f.from, 'from')}${ic('airplane-tilt')}${pt(f.to, 'to')}</div></div>
            <div class="pass-stub"><span>${ic('suitcase')} ${bi(T.baggage)}</span><a class="btn btn-sm" href="#day-${f.day}" data-go>第${f.day}天 ${en('Day ' + f.day)} ${ic('arrow-right')}</a><span class="barcode" aria-hidden="true"></span></div></article>`;
        }).join('')}</div></div>`;
    renderNow();
  }

  let tickTimer = null, lastIdx = null;
  function renderNow(editing) {
    const dep = depDate(), idx = tripIndex();
    lastIdx = idx;
    let main, side = '';
    if (!dep) {
      main = `<h2 id="h-now">还没设定出发日期<span class="en" lang="en">Departure date not set</span></h2>`;
    } else if (idx < 0 || (idx === 0 && msToTakeoff() > 0)) {
      main = `<h2 id="h-now">距离出发还有<span class="en" lang="en">Until take-off</span></h2>
        <div class="flip" role="timer" aria-label="距离出发 Until take-off">${[['天', 'Days'], ['时', 'Hrs'], ['分', 'Min'], ['秒', 'Sec']]
          .map(([z, e], i) => `<div class="flip-u"><b class="flip-n${i === 3 ? ' is-sec' : ''}" data-i="${i}">00</b><small>${z} <span lang="en">${e}</span></small></div>`).join('')}</div>`;
      const f = T.flights[0];
      side = `<div class="count-ticket"><b class="ct-no">${esc(f.no)}</b><span class="ct-route">${esc(f.from.code)} ${ic('airplane-tilt')} ${esc(f.to.code)}</span>
        <span class="ct-time">${esc(f.from.time)} → ${esc(f.to.time)}</span><small>${bi(f.airline)}</small></div>`;
    } else if (idx < T.days.length) {
      const day = T.days[idx];
      main = `<h2 id="h-now">旅程第 ${idx + 1} 天<span class="en" lang="en">Day ${idx + 1} of ${T.days.length}</span></h2>
        <p class="count-route">${bib(day.route)}</p>
        <p class="count-dots" aria-hidden="true">${T.days.map((d) => `<i class="${d.n < idx + 1 ? 'done' : d.n === idx + 1 ? 'now' : ''}"></i>`).join('')}</p>
        ${day.hotel ? `<p class="count-route">${ic('bed')} ${bi(day.hotel)}</p>` : ''}`;
    } else {
      main = `<h2 id="h-now">欢迎回家<span class="en" lang="en">Welcome home</span></h2><p class="count-route">${bib({ zh: '谢谢一起同行。', en: 'Thanks for travelling together.' })}</p>`;
    }
    const actions = editing
      ? `<label for="dep-in" class="muted" style="font-size:.8rem">出发日期 <span lang="en">Departure date</span></label>
         <input type="date" id="dep-in" value="${esc(depString())}">
         <button type="button" class="btn btn-sm btn-red" data-act="savedate">保存 ${en('Save')}</button>
         <button type="button" class="btn btn-sm" data-act="canceldate">取消 ${en('Cancel')}</button>`
      : `${idx != null && idx >= 0 && idx < T.days.length ? `<a class="btn btn-sm btn-red" href="#day-${idx + 1}" data-go>查看今天 ${en('See today')}</a>` : ''}
         <button type="button" class="btn btn-sm" data-act="editdate">${ic('calendar-blank')} 更改日期 ${en('Change date')}</button>`;
    $('#now').innerHTML = `${postmark(dep)}<div class="count-main">${main}<div class="count-actions">${actions}</div></div>${side}`;
    if (editing) $('#dep-in').focus();
    tick();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 1000);
  }
  function tick() {
    // a new day (UTC+8) or take-off changes what "today" means: redraw the date-dependent parts
    if (tripIndex() !== lastIdx) return rerenderDates();
    const cells = $$('.flip-n'); if (!cells.length) return;
    const ms = msToTakeoff();
    if (ms <= 0) return rerenderDates();
    const parts = [Math.floor(ms / 864e5), Math.floor(ms % 864e5 / 36e5), Math.floor(ms % 36e5 / 6e4), Math.floor(ms % 6e4 / 1e3)];
    cells.forEach((b) => {
      const v = pad(parts[b.dataset.i]);
      if (b.textContent === v) return;
      b.textContent = v;
      if (!reduceMotion) { b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick'); }
    });
  }

  /* ---------- days: stamp chips + postcards ---------- */
  function mapLinks(stop, day) {
    const city = T.cities[day.city];
    if (stop.approx || stop.lat == null) return {
      amap: `https://uri.amap.com/search?keyword=${encodeURIComponent(stop.name.zh)}&city=${encodeURIComponent(city.zh)}&callnative=1`,
      google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name.en + ', ' + city.en)}`,
    };
    return {
      amap: `https://uri.amap.com/marker?position=${stop.lng},${stop.lat}&name=${encodeURIComponent(stop.name.zh)}&coordinate=wgs84&callnative=1`,
      google: `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}`,
    };
  }
  const optLabel = (on) => on ? `${ic('check')} 我会参加 ${en("I'm joining")}` : `我想参加 ${en("I'll join")}`;

  function renderDays() {
    const today = todayDay();
    const chips = T.days.map((d) => {
      const dt = dayDate(d.n);
      return `<a class="chip${d.n === today ? ' today' : ''}" href="#day-${d.n}" data-day="${d.n}" data-go><b>第${d.n}天</b><small lang="en">${dt ? `${dt.getMonth() + 1}/${dt.getDate()} · ` : ''}D${d.n}</small></a>`;
    }).join('');

    const cards = T.days.map((d) => {
      const dt = dayDate(d.n), vibe = VIBE[d.vibe], isToday = d.n === today;
      const stops = d.stops.map((s, i) => {
        const t = TAGS[s.tag] || TAGS.sight, l = mapLinks(s, d), film = s.tag === 'film';
        return `<li class="stop${film ? ' film' : ''}"><span class="stop-ic">${ic(t.ic)}</span><div>
          ${film ? `<span class="film-rib">${ic('film-slate')} 取景地 <span lang="en">Film location</span></span>` : ''}
          <h4>${bib(s.name)}</h4>${film ? '' : `<span class="tag">${t.zh} <span lang="en">${t.en}</span></span>`}
          <p class="desc">${bib(s.desc)}</p>
          ${s.image ? `<div class="stop-img">${img(s.image, s.name.zh + ' ' + s.name.en)}</div>` : ''}
          <details class="go"><summary>${ic('map-pin')} 导航 ${en('Directions')}</summary><div class="go-links">
            ${s.approx ? `<p class="go-note">${bi({ zh: '确切位置不确定，按名称搜索。', en: 'Exact spot unknown, so this searches by name.' })}</p>` : ''}
            <a class="btn btn-sm btn-red" href="${esc(l.amap)}" target="_blank" rel="noopener">高德地图 ${en('Amap')}</a>
            <a class="btn btn-sm" href="${esc(l.google)}" target="_blank" rel="noopener">Google ${en('Maps')}</a>
            ${s.approx ? '' : `<button type="button" class="btn btn-sm" data-act="showonmap" data-day="${d.n}" data-i="${i}">${ic('map-trifold')} 本页地图 ${en('On this map')}</button>`}
          </div></details></div></li>`;
      }).join('');
      const meals = Object.entries(MEALS).map(([k, [icon, zh, e]]) => {
        const [cls, sz, se] = MEAL_ST[d.meals[k]] || MEAL_ST['-'];
        return `<div class="meal ${cls}">${ic(icon)}<b>${zh}</b><small lang="en">${e}</small><span class="st">${sz} <span lang="en">${se}</span></span></div>`;
      }).join('');
      const o = d.optional && T.optionalTours[d.optional];
      const opt = o ? `<div class="opt"><p class="lbl">${ic('ticket')} 自费项目 ${esc(d.optional)} <span lang="en">Optional tour ${esc(d.optional)}</span></p>
          <h4>${bib(o.name)}</h4><p class="price">${esc(o.currency)} ${esc(o.price)} <small>/ 位 <span lang="en">per person</span></small></p><p class="small">${bib(T.optionalTours.note)}</p>
          <button type="button" class="btn btn-sm" data-act="optional" data-v="${esc(d.optional)}" aria-pressed="${!!state.optional[d.optional]}">${optLabel(state.optional[d.optional])}</button></div>` : '';
      return `<article class="day${isToday ? ' is-today' : ''}" id="day-${d.n}" data-vibe="${esc(d.vibe)}" aria-labelledby="day-h-${d.n}">
        <div class="pc">${img(d.image, d.route.zh + ' ' + d.route.en)}
          <div class="stamp" aria-hidden="true"><small>第</small><b>${d.n}</b><small>天 · DAY</small></div>
          ${isToday ? `<span class="today-pill">今天 <span lang="en">Today</span></span>` : ''}
          <div class="pc-cap"><p class="pc-date">${dt ? bi(fmtDay(dt)) : ''}${vibe ? `${dt ? ' · ' : ''}${bi({ zh: vibe[0], en: vibe[1] })}` : ''}</p>
            <h3 id="day-h-${d.n}">${esc(d.route.zh)}<span class="en" lang="en">${esc(d.route.en)}</span></h3></div>
        </div>
        <div class="day-body">
          <p class="tagline">${bib(d.tagline)}</p>
          <p class="day-meta">${d.drive ? `<span class="pill">${ic('bus')} ${bi(d.drive)}</span>` : ''}<span class="pill pill-wx" data-wxday="${d.n}" hidden></span></p>
          <h4 class="lbl">${ic('fork-knife')} 餐食 <span lang="en">Meals</span></h4><div class="meals">${meals}</div>
          ${d.mealNote ? `<p class="note">${bib(d.mealNote)}</p>` : ''}
          <h4 class="lbl">${ic('clock')} 行程 <span lang="en">Stops</span></h4><ol class="stops">${stops}</ol>
          ${opt}
          <div class="hotel">${ic(d.hotel ? 'bed' : 'house')}<div><small>今晚 <span lang="en">Tonight</span></small><b>${bib(d.hotel || { zh: '回到温暖的家', en: 'Home sweet home' })}</b></div></div>
        </div></article>`;
    }).join('');

    $('#days').innerHTML = `<div class="wrap">${head('h-days', '每日行程', 'Day by day', { zh: '七天六晚，从深圳到潮汕，再经广州、佛山、中山回家。', en: 'Seven days: Shenzhen to Chaoshan, then Guangzhou, Foshan and Zhongshan, and home.' }, '行')}</div>
      <nav class="chips-bar" aria-label="选择天数 Choose a day"><div class="wrap"><div class="chips">${chips}</div></div></nav>
      <div class="wrap day-list">${cards}</div>`;
  }

  /* ---------- weather ---------- */
  let WX = load(WX_KEY) || {}, wxTab = null, wxBusy = false;
  const WMO = [[[0], '晴', 'Clear', 'clear'], [[1], '大致晴朗', 'Mainly clear', 'mainly'], [[2], '多云', 'Partly cloudy', 'partly'], [[3], '阴', 'Overcast', 'overcast'],
    [[45, 48], '雾', 'Fog', 'fog'], [[51, 53, 55, 56, 57], '毛毛雨', 'Drizzle', 'drizzle'], [[61], '小雨', 'Light rain', 'rain'], [[63], '中雨', 'Rain', 'rain'],
    [[65, 66, 67], '大雨', 'Heavy rain', 'rain'], [[71, 73, 75, 77, 85, 86], '雪', 'Snow', 'snow'], [[80, 81], '阵雨', 'Showers', 'showers'], [[82], '强阵雨', 'Heavy showers', 'showers'], [[95, 96, 99], '雷阵雨', 'Thunderstorm', 'thunder']];
  const wmo = (code) => { const r = WMO.find(([cs]) => cs.includes(Number(code))) || [[], '-', '-', 'overcast']; return { zh: r[1], en: r[2], kind: r[3] }; };
  function wxArt(code, isDay, small) {
    const k = wmo(code).kind, night = isDay === 0;
    const sky = night ? '<i class="a-moon"></i>' : '<i class="a-sun"><b></b></i>';
    const cloud = (c) => `<i class="a-cloud ${c || ''}"></i>`;
    const drops = (n, c) => Array.from({ length: n }, (_, i) => `<i class="a-drop ${c || ''}" style="--i:${i}"></i>`).join('');
    const art = { clear: sky, mainly: sky + cloud('sm'), partly: sky + cloud(), overcast: cloud('back') + cloud(), fog: cloud('back') + '<i class="a-fog"></i><i class="a-fog f2"></i>',
      drizzle: cloud() + drops(3, 'fine'), rain: cloud('dark') + drops(4), showers: sky + cloud() + drops(3), thunder: cloud('dark') + '<i class="a-bolt"></i>' + drops(2), snow: cloud() + drops(3, 'flake') }[k];
    return `<span class="wxa wxa-${k}${small ? ' sm' : ''}" aria-hidden="true">${art}</span>`;
  }
  const r0 = (n) => (n == null || isNaN(n) ? '-' : Math.round(n));
  const fetchJSON = (url, ms = 8000) => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    return fetch(url, { signal: ctl.signal, cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).finally(() => clearTimeout(t));
  };
  const coords = () => `latitude=${T.cities.map((c) => c.lat)}&longitude=${T.cities.map((c) => c.lng)}`;
  const arr = (x) => (Array.isArray(x) ? x : [x]);

  function renderWeatherShell() {
    $('#weather').innerHTML = `<div class="wrap">${head('h-weather', '实时天气', 'Live weather', { zh: '各城市现在的天气，以及旅程每一天的预报。', en: 'Weather right now in each city, plus a forecast for every trip day.' }, '天')}
      <div class="tabs" role="tablist" aria-label="天气 Weather">
        <button type="button" role="tab" id="wt-trip" aria-controls="wx-trip" data-act="wxtab" data-v="trip">旅程预报 ${en('Trip forecast')}</button>
        <button type="button" role="tab" id="wt-now" aria-controls="wx-now" data-act="wxtab" data-v="now">现在 ${en('Now')}</button></div>
      <div id="wx-trip" role="tabpanel" aria-labelledby="wt-trip" class="wx-rows"><div class="skel"></div><div class="skel"></div></div>
      <div id="wx-now" role="tabpanel" aria-labelledby="wt-now" class="wx-rows" hidden><div class="skel"></div><div class="skel"></div></div>
      <p class="wx-status" id="wx-status" aria-live="polite"></p><p class="wx-note" id="wx-note"></p></div>`;
  }
  function setWxTab(v) {
    wxTab = v;
    $$('.tabs [role="tab"]').forEach((b) => { const on = b.dataset.v === v; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    $('#wx-now').hidden = v !== 'now';
    $('#wx-trip').hidden = v !== 'trip';
  }
  function dayWeather(d) {
    const dt = dayDate(d.n); if (!dt) return null;
    const fc = WX.fc && arr(WX.fc.data)[d.city];
    const i = fc?.daily ? fc.daily.time.indexOf(ymd(dt)) : -1;
    if (i >= 0) return { src: ymd(dt) < todayStr() ? 'past' : 'fc', code: fc.daily.weather_code[i], max: fc.daily.temperature_2m_max[i], min: fc.daily.temperature_2m_min[i], rain: fc.daily.precipitation_probability_max[i] };
    const ly = WX.ly && arr(WX.ly.data)[d.city];
    const j = ly?.daily ? ly.daily.time.indexOf(ymd(new Date(dt.getFullYear() - 1, dt.getMonth(), dt.getDate()))) : -1;
    if (j >= 0) return { src: 'ly', code: ly.daily.weather_code[j], max: ly.daily.temperature_2m_max[j], min: ly.daily.temperature_2m_min[j], mm: ly.daily.precipitation_sum[j] };
    return null;
  }
  const SRC = { fc: ['预报', 'Forecast'], past: ['当天天气', 'On the day'], ly: ['去年同期', 'Same day last year'] };

  function paintWeather() {
    const today = todayDay(), todayCity = today ? T.days[today - 1].city : -1;
    if (WX.fc) {
      $('#wx-now').innerHTML = arr(WX.fc.data).map((w, i) => {
        const c = T.cities[i], cur = w?.current; if (!c || !cur) return '';
        const info = wmo(cur.weather_code), dl = w.daily || {}, ti = dl.time ? dl.time.indexOf(String(cur.time).slice(0, 10)) : -1;
        return `<div class="wx-row${i === todayCity ? ' today' : ''}">${wxArt(cur.weather_code, cur.is_day)}
          <div class="who"><b>${esc(c.zh)}</b> <span class="en" lang="en">${esc(c.en)}</span><small>${bi(info)}</small></div>
          <div class="t"><b>${r0(cur.temperature_2m)}°</b><small>体感 <span lang="en">Feels</span> ${r0(cur.apparent_temperature)}°</small></div>
          <div class="more">${ti >= 0 ? `<span>今日 <span lang="en">Today</span> <b>${r0(dl.temperature_2m_max[ti])}° / ${r0(dl.temperature_2m_min[ti])}°</b></span><span>降雨 <span lang="en">Rain</span> <b>${r0(dl.precipitation_probability_max[ti])}%</b></span>` : ''}
            <span>湿度 <span lang="en">Humidity</span> <b>${r0(cur.relative_humidity_2m)}%</b></span><span>风 <span lang="en">Wind</span> <b>${r0(cur.wind_speed_10m)} km/h</b></span></div></div>`;
      }).join('');
    } else if (WX.failed) {
      $('#wx-now').innerHTML = `<p class="wx-note">${bi({ zh: '暂时无法取得天气。', en: 'Weather is unavailable right now.' })}</p>`;
    }

    let anyLive = false;
    $('#wx-trip').innerHTML = T.days.map((d) => {
      const dt = dayDate(d.n), c = T.cities[d.city], w = dayWeather(d), info = w && wmo(w.code);
      if (w && w.src !== 'ly') anyLive = true;
      return `<div class="wx-row${d.n === today ? ' today' : ''}">${w ? wxArt(w.code, 1) : '<span></span>'}
        <div class="who"><b>第${d.n}天</b> <span class="en" lang="en">Day ${d.n}${dt ? ` · ${WEEK_EN[dt.getDay()]} ${dt.getDate()} ${MON_EN[dt.getMonth()]}` : ''}</span>
          <small>${bi(c)}${info ? ` · ${bi(info)}` : ''}</small>
          <span class="src ${w ? w.src : ''}">${w ? `${SRC[w.src][0]} <span class="en" lang="en">${SRC[w.src][1]}</span>` : `暂无 <span class="en" lang="en">Not yet</span>`}</span></div>
        <div class="t">${w ? `<b>${r0(w.max)}°</b><small>${r0(w.min)}° · ${w.src === 'ly' ? `${w.mm == null ? '-' : Math.round(w.mm * 10) / 10} mm` : `${r0(w.rain)}%`}</small>` : ''}</div></div>`;
    }).join('');

    T.days.forEach((d) => { // forecast chip on each day card
      const el = $(`[data-wxday="${d.n}"]`); if (!el) return;
      const w = dayWeather(d);
      el.hidden = !(w && w.src === 'fc');
      if (!el.hidden) el.innerHTML = `${wxArt(w.code, 1, true)} ${r0(w.max)}° / ${r0(w.min)}° · ${r0(w.rain)}% <span class="en" lang="en">forecast</span>`;
    });

    const st = $('#wx-status');
    if (WX.fc) {
      const t = new Date(WX.fc.t), hhmm = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
      st.className = 'wx-status' + (WX.offline ? ' off' : '');
      st.innerHTML = `<span>${WX.offline ? `${ic('wifi-slash')} 离线，上次更新 ${t.getMonth() + 1}/${t.getDate()} ${hhmm} <span lang="en">Offline, last updated</span>` : `更新于 ${hhmm} <span lang="en">Updated</span>`}</span>
        <button type="button" class="btn btn-sm" data-act="wxrefresh">${ic('arrow-clockwise')} 刷新 ${en('Refresh')}</button>`;
    } else {
      st.innerHTML = WX.failed ? `<button type="button" class="btn btn-sm" data-act="wxrefresh">${ic('arrow-clockwise')} 重试 ${en('Retry')}</button>` : `载入中 <span lang="en">Loading</span>`;
    }
    const dep = depDate();
    const from = dep && new Date(dep.getFullYear(), dep.getMonth(), dep.getDate() - 15);
    $('#wx-note').innerHTML = (dep && !anyLive && tripIndex() < 0
      ? bib({ zh: `出发前约16天（${from.getMonth() + 1}月${from.getDate()}日起）自动显示每日预报，之前显示去年同期天气。`, en: `The daily forecast appears by itself about 16 days before departure (from ${from.getDate()} ${MON_EN[from.getMonth()]}). Until then you see last year's weather for the same dates.` }) + '<br>'
      : '') + `<small>${bi({ zh: '每30分钟自动更新，数据来自', en: 'Updates every 30 min. Data:' })} Open-Meteo.com</small>`;
    if (!wxTab) setWxTab('trip');
    renderMapInfo();
  }
  function loadForecast(force) {
    if ((WX.fc && Date.now() - WX.fc.t < 30 * 60e3 && !force) || wxBusy) return paintWeather();
    wxBusy = true;
    fetchJSON(`https://api.open-meteo.com/v1/forecast?${coords()}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=16&past_days=7`)
      .then((data) => { WX.fc = { t: Date.now(), data: arr(data) }; WX.offline = WX.failed = false; store(WX_KEY, WX); })
      .catch(() => { if (WX.fc) WX.offline = true; else WX.failed = true; })
      .then(() => { wxBusy = false; paintWeather(); });
  }
  function loadLastYear() {
    const d1 = dayDate(1); if (!d1) return;
    const s = new Date(d1.getFullYear() - 1, d1.getMonth(), d1.getDate()), e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + T.days.length - 1);
    if (e > new Date(Date.now() - 7 * 864e5)) return; // the archive lags a few days
    const range = `${ymd(s)}_${ymd(e)}`;
    if (WX.ly?.range === range) return;
    fetchJSON(`https://archive-api.open-meteo.com/v1/archive?${coords()}&start_date=${ymd(s)}&end_date=${ymd(e)}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FShanghai`, 10000)
      .then((data) => { WX.ly = { range, data: arr(data) }; store(WX_KEY, WX); paintWeather(); }).catch(() => {});
  }

  /* ---------- real map (Leaflet) ---------- */
  let map = null, layers = {}, curLayer = 'osm', group = null, meMk = null, mapDay = 0, stopMk = {};
  const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const AMAP = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';

  // WGS-84 -> GCJ-02 (Amap tiles use GCJ-02)
  function wgs2gcj(lat, lng) {
    if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) return [lat, lng];
    const PI = Math.PI, a = 6378245, ee = 0.00669342162296594323, x = lng - 105, y = lat - 35;
    const wave = (s) => (20 * Math.sin(6 * s * PI) + 20 * Math.sin(2 * s * PI)) * 2 / 3;
    let dLat = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)) + wave(x) + (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3 + (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
    let dLng = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)) + wave(x) + (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3 + (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
    const rad = lat / 180 * PI, magic = 1 - ee * Math.sin(rad) ** 2, sq = Math.sqrt(magic);
    dLat = dLat * 180 / ((a * (1 - ee)) / (magic * sq) * PI);
    dLng = dLng * 180 / (a / sq * Math.cos(rad) * PI);
    return [lat + dLat, lng + dLng];
  }
  const P = (lat, lng) => (curLayer === 'amap' ? wgs2gcj(lat, lng) : [lat, lng]);
  const cityDays = (i) => T.days.filter((d) => d.city === i).map((d) => d.n);
  const LABEL_SIDE = { 5: 'top', 6: 'left' }; // Guangzhou above, Foshan left: the two sit close together

  function renderMapShell() {
    $('#map').innerHTML = `<div class="wrap">${head('h-map', '路线地图', 'Route map', { zh: '可以拖动、缩放。点标记或列表看详情。', en: 'Drag and zoom freely. Tap a marker or the list for details.' }, '图')}
      <div class="map-tools">
        <div class="seg" role="group" aria-label="按天筛选 Filter by day"><button type="button" data-act="mapday" data-v="0" aria-pressed="true">全部 ${en('All')}</button>${T.days.map((d) => `<button type="button" data-act="mapday" data-v="${d.n}" aria-pressed="false">第${d.n}天</button>`).join('')}</div>
        <div class="seg" role="group" aria-label="底图 Base map"><button type="button" data-act="layer" data-v="osm" aria-pressed="false">OSM</button><button type="button" data-act="layer" data-v="amap" aria-pressed="false">高德 ${en('Amap')}</button></div>
      </div>
      <div class="map-wrap">
        <div class="map-frame"><div class="map-box" id="leaflet" role="region" aria-label="路线地图 Route map"></div>
          <div class="map-ctl"><button type="button" data-act="locate" aria-label="定位我 Locate me" title="定位 Locate me">${ic('crosshair')}</button>
          <button type="button" data-act="fitall" aria-label="显示全部 Show everything" title="全部 Show all">${ic('arrows-out')}</button></div></div>
        <aside class="map-info" id="map-info" aria-live="polite"></aside>
      </div>
      <p class="map-legend">${['sight', 'film', 'food', 'shop', 'travel'].map((k) => `<span><i style="background:${TAGS[k].color}"></i>${TAGS[k].zh} <span lang="en">${TAGS[k].en}</span></span>`).join('')}</p>
      <p class="map-note" id="map-note">${bi({ zh: '在中国大陆建议用「高德」底图。看过的区域可离线查看。', en: 'In mainland China use the Amap base map. Areas you have viewed work offline.' })}</p></div>`;
    renderMapInfo();
  }

  function initMap() {
    if (map) return;
    if (!window.L) { $('#leaflet').innerHTML = `<p class="wx-note" style="padding:2rem">${bi({ zh: '地图载入失败。', en: 'The map could not load.' })}</p>`; return; }
    map = L.map('leaflet', { scrollWheelZoom: false, boxZoom: false, zoomSnap: 0.5, preferCanvas: true });
    map.attributionControl.setPrefix(false);
    map.on('focus click', () => map.scrollWheelZoom.enable()); // wheel zoom only once you click in, so the page still scrolls
    map.on('blur mouseout', () => map.scrollWheelZoom.disable());
    layers.osm = L.tileLayer(OSM, { maxZoom: 19, attribution: '© OpenStreetMap contributors', crossOrigin: true });
    layers.amap = L.tileLayer(AMAP, { maxZoom: 18, subdomains: '1234', attribution: '© 高德地图 AutoNavi', crossOrigin: true });
    group = L.layerGroup().addTo(map);
    setLayer(state.layer === 'amap' ? 'amap' : 'osm', true);
    if (!state.layer) { // OSM keeps failing on some mainland networks: switch to Amap once
      let errs = 0, oks = 0;
      const onErr = () => errs++, onOk = () => oks++;
      layers.osm.on('tileerror', onErr).on('tileload', onOk);
      setTimeout(() => { layers.osm.off('tileerror', onErr).off('tileload', onOk); if (errs >= 4 && oks < 2 && curLayer === 'osm') { setLayer('amap'); state.layer = 'amap'; save(); } }, 6000);
    }
    map.on('locationfound', (e) => {
      const ll = P(e.latlng.lat, e.latlng.lng);
      meMk?.remove();
      meMk = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-mk"></div>', iconSize: [18, 18] }), title: '我在这里 You are here' }).addTo(map);
      map.setView(ll, Math.max(map.getZoom(), 13));
    });
    map.on('locationerror', () => { $('#map-note').innerHTML = bi({ zh: '无法取得你的位置，请允许定位权限。', en: 'Could not get your location. Please allow location access.' }); });
  }
  function setLayer(v, first) {
    if (!map) { state.layer = v; return save(); }
    const changed = curLayer !== v;
    map.removeLayer(layers[curLayer]);
    curLayer = v;
    layers[v].addTo(map);
    $$('[data-act="layer"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
    drawMarkers(first || changed);
    meMk?.remove(); meMk = null;
  }
  const popup = (name, sub, dn, links) => `<div class="pop"><h4>${esc(name.zh)}<span class="en" lang="en">${esc(name.en)}</span></h4>${sub ? `<p>${sub}</p>` : ''}<div class="row">
    ${dn ? `<button type="button" class="btn btn-sm btn-solid" data-act="goday" data-v="${dn}">看这天 ${en('See day')}</button>` : ''}
    ${links ? `<a class="btn btn-sm" href="${esc(links.amap)}" target="_blank" rel="noopener">高德 Amap</a><a class="btn btn-sm" href="${esc(links.google)}" target="_blank" rel="noopener">Google</a>` : ''}</div></div>`;

  function drawMarkers(fit) {
    if (!map) return;
    group.clearLayers(); stopMk = {};
    const today = todayDay(), bounds = [];
    L.polyline(T.routeOrder.map((i) => P(T.cities[i].lat, T.cities[i].lng)), { color: '#c81e29', weight: 3, opacity: .8, dashArray: '8 8', interactive: false }).addTo(group);
    T.cities.forEach((c, i) => {
      const days = cityDays(i), show = !mapDay || days.includes(mapDay), side = LABEL_SIDE[i] || 'right';
      const mk = L.marker(P(c.lat, c.lng), {
        icon: L.divIcon({ className: `city-mk${days.length ? '' : ' pass'}${today && T.days[today - 1].city === i ? ' today' : ''}`, html: `<span>${days.join('·')}</span>`, iconSize: [0, 0] }),
        title: `${c.zh} ${c.en}`, opacity: show ? 1 : .4, zIndexOffset: 500,
      }).addTo(group);
      mk.bindTooltip(`${esc(c.zh)}<span lang="en">${esc(c.en)}</span>`, { permanent: true, direction: side, className: 'city-tip' + (show ? '' : ' dim'), offset: side === 'left' ? [-16, 0] : side === 'top' ? [0, -16] : [16, 0] });
      mk.bindPopup(popup(c, days.length ? `第${days.join('、')}天 · <span lang="en">Day ${days.join(', ')}</span>` : '途经 <span lang="en">Passing through</span>', days[0], null));
      if (show) bounds.push(P(c.lat, c.lng));
    });
    T.days.forEach((d) => {
      if (mapDay && d.n !== mapDay) return;
      d.stops.forEach((s, i) => {
        if (s.approx || s.lat == null) return;
        const ll = P(s.lat, s.lng), t = TAGS[s.tag];
        const mk = s.tag === 'film'
          ? L.marker(ll, { icon: L.divIcon({ className: '', html: `<div class="film-mk">${ic('film-slate')}</div>`, iconSize: [27, 27] }), title: `${s.name.zh} ${s.name.en}` })
          : L.circleMarker(ll, { radius: 7, color: '#f8f8f9', weight: 2, fillColor: t.color, fillOpacity: 1 });
        mk.bindTooltip(esc(s.name.zh), { permanent: !!mapDay, direction: 'top', offset: [0, -8], className: 'stop-tip' });
        mk.bindPopup(popup(s.name, `第${d.n}天 · <span lang="en">Day ${d.n}</span> · ${t.zh} <span lang="en">${t.en}</span>`, d.n, mapLinks(s, d)));
        mk.addTo(group);
        stopMk[`${d.n}:${i}`] = mk;
        if (mapDay) bounds.push(ll);
      });
    });
    if (fit && bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(mapDay ? .3 : .08), { maxZoom: 14, animate: !reduceMotion });
  }
  function renderMapInfo() {
    const el = $('#map-info'); if (!el) return;
    const today = todayDay();
    if (!mapDay) {
      el.innerHTML = `<p class="mi-k">全部行程 <span class="en" lang="en">Whole trip</span></p><div class="mi-list">${T.days.map((d) => {
        const dt = dayDate(d.n), w = dayWeather(d);
        return `<button type="button" class="mi-item${d.n === today ? ' today' : ''}" data-act="mapday" data-v="${d.n}"><span class="mi-n">${d.n}</span>
          <span class="mi-t"><b>${esc(d.route.zh)}</b><small lang="en">${dt ? `${WEEK_EN[dt.getDay()]} ${dt.getDate()} ${MON_EN[dt.getMonth()]} · ` : ''}${esc(d.route.en)}</small></span>
          <span class="mi-w">${w ? `${r0(w.max)}°` : ''}</span></button>`;
      }).join('')}</div>`;
      return;
    }
    const d = T.days[mapDay - 1], dt = dayDate(d.n);
    el.innerHTML = `<p class="mi-k">第${d.n}天 <span class="en" lang="en">Day ${d.n}</span>${dt ? ` · ${bi(fmtDay(dt))}` : ''}</p>
      <h3 class="mi-h">${esc(d.route.zh)}<span class="en" lang="en">${esc(d.route.en)}</span></h3>
      <div class="mi-list">${d.stops.map((s, i) => {
        const t = TAGS[s.tag];
        if (s.approx || s.lat == null) {
          const l = mapLinks(s, d);
          return `<div class="mi-item" style="cursor:default"><span>${ic(t.ic)}</span><span class="mi-t"><b>${esc(s.name.zh)}</b><small lang="en">${esc(s.name.en)}</small>
            <small>位置不确定 <span lang="en">Exact spot unknown</span>: <a href="${esc(l.amap)}" target="_blank" rel="noopener">高德搜索</a> · <a href="${esc(l.google)}" target="_blank" rel="noopener" lang="en">Google</a></small></span></div>`;
        }
        return `<button type="button" class="mi-item" data-act="flyto" data-day="${d.n}" data-i="${i}"><span>${ic(t.ic)}</span>
          <span class="mi-t"><b>${esc(s.name.zh)}</b><small lang="en">${esc(s.name.en)}</small></span>${ic('arrow-right')}</button>`;
      }).join('')}</div>
      ${d.hotel ? `<p class="mi-hotel">${ic('bed')} ${bib(d.hotel)}</p>` : ''}
      <div class="mi-acts"><button type="button" class="btn btn-sm btn-solid" data-act="goday" data-v="${d.n}">看这天行程 ${en('Day details')}</button>
        <button type="button" class="btn btn-sm" data-act="mapday" data-v="0">全部 ${en('All days')}</button></div>`;
  }
  function setMapDay(n) {
    mapDay = n;
    $$('[data-act="mapday"]', $('.map-tools')).forEach((b) => b.setAttribute('aria-pressed', Number(b.dataset.v) === n));
    drawMarkers(true);
    renderMapInfo();
  }
  function flyTo(dn, i) {
    initMap(); if (!map) return;
    if (mapDay !== dn) setMapDay(dn);
    const mk = stopMk[`${dn}:${i}`]; if (!mk) return;
    const r = $('.map-frame').getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) goTo($('.map-frame'));
    map.setView(mk.getLatLng(), 15, { animate: !reduceMotion });
    setTimeout(() => mk.openPopup(), reduceMotion ? 0 : 300);
  }

  /* ---------- info ---------- */
  function renderInfo() {
    const list = (items, cls, icon) => items.map((x) => `<li class="${cls}">${ic(icon)}${bib(x)}</li>`).join('');
    const foods = (title, items) => `<p class="foods-k">${bi(title)}</p><ul class="foods">${items.map((f) => `<li>${bi(f)}</li>`).join('')}</ul>`;
    $('#info').innerHTML = `<div class="wrap">${head('h-info', '旅程资讯', 'Trip info', null, '讯')}<div class="info-grid">
      <section class="blk" aria-labelledby="h-pack"><h3 id="h-pack">${ic('suitcase')} 出发前清单 ${en('Before you go')}</h3>
        <p>${bib({ zh: '建议准备的东西。打勾只存在你自己的手机。', en: 'Suggested things to sort out. Ticks are saved on your own phone only.' })}</p>
        <div class="count-line"><span id="pack-count"></span><span class="meter"><i id="pack-bar"></i></span></div>
        <div>${T.packing.map((p, i) => `<button type="button" class="check" role="checkbox" aria-checked="${!!state.packing[i]}" data-act="pack" data-i="${i}"><span class="bx">${ic('check')}</span>${bib(p)}</button>`).join('')}</div></section>
      <section class="blk" aria-labelledby="h-contact"><h3 id="h-contact">${ic('phone')} 联络 ${en('Contacts')}</h3>
        ${T.contacts.map((c) => {
          const name = typeof c.name === 'string' ? { zh: c.name, en: '' } : c.name;
          return `<div class="contact"><div><b>${esc(name.zh)}</b>${name.en ? ` <span class="en" lang="en">${esc(name.en)}</span>` : ''}<small>${bi(c.role)}</small><span class="num">${esc(c.display)}</span></div>
            <div class="acts"><a class="btn btn-sm btn-red" href="tel:${esc(c.phone)}">${ic('phone')} 拨打 ${en('Call')}</a>
            ${/^\+601/.test(c.phone) ? `<a class="btn btn-sm" href="https://wa.me/${esc(c.phone.replace(/\D/g, ''))}" target="_blank" rel="noopener">${ic('whatsapp-logo')} WhatsApp</a>` : ''}</div></div>`;
        }).join('')}
        <p>${esc(T.agency.name)}<br>${esc(T.agency.address)}</p></section>
      <section class="blk" aria-labelledby="h-inc"><h3 id="h-inc">${ic('check-circle')} 费用包含 ${en('Included')}</h3><ul class="list">${list(T.includes, 'yes', 'check-circle')}</ul>
        <h3 style="margin-top:1.4rem">${ic('x-circle')} 不包含 ${en('Not included')}</h3><ul class="list">${list(T.excludes, 'no', 'x-circle')}</ul></section>
      <section class="blk" aria-labelledby="h-hi"><h3 id="h-hi">${ic('star')} 行程特色 ${en('Highlights')}</h3><ul class="list">${list(T.highlights, '', 'star')}</ul>
        <h3 style="margin-top:1.4rem">${ic('bowl-food')} 特色美食 ${en('Signature food')}</h3>
        ${foods({ zh: '潮汕美食', en: 'Chaoshan' }, T.food.chaoshan)}${foods({ zh: '粤菜', en: 'Cantonese' }, T.food.cantonese)}</section>
      <section class="blk span2"><details class="remarks"><summary>备注 <span class="en" lang="en">Remarks from the brochure</span></summary>
        <ol class="remark-list">${T.remarks.map((r) => `<li>${bib(r)}</li>`).join('')}</ol></details></section>
      <section class="blk span2" aria-labelledby="h-tips"><h3 id="h-tips">${ic('warning-circle')} 小提示 ${en('Good to know')}</h3><ul class="list">
        ${list([{ zh: '出发前先在 Wi-Fi 下打开一次这个页面，之后没有网络也能看。', en: 'Open this page once on Wi-Fi before the trip so it works offline.' },
          { zh: '地图位置仅供参考，集合地点请以导游为准。', en: 'Map pins are a guide only. Confirm meeting points with the tour guide.' },
          { zh: '在中国大陆，Google 地图需要 VPN；高德地图可直接使用。', en: 'In mainland China, Google Maps needs a VPN; Amap works directly.' }], '', 'info')}</ul></section>
    </div></div>`;
    updatePacking();
  }
  function updatePacking() {
    const done = T.packing.filter((_, i) => state.packing[i]).length;
    $('#pack-bar').style.transform = `scaleX(${done / T.packing.length})`;
    $('#pack-count').innerHTML = `${done} / ${T.packing.length} 已准备 <span lang="en">ready</span>`;
  }
  function renderFoot() {
    const credits = [{ what: { zh: '封面：潮州广济桥', en: 'Cover: Guangji Bridge' }, by: T.heroCredit }];
    T.days.forEach((d) => {
      credits.push({ what: { zh: `第${d.n}天`, en: `Day ${d.n}` }, by: d.imageCredit });
      d.stops.forEach((s) => s.image && credits.push({ what: s.name, by: s.imageCredit }));
    });
    $('#foot').innerHTML = `<p>${bib({ zh: '由团友制作，非旅行社官方页面。行程资料来自 Brighton Travel & Tour（Amy 编制）。', en: 'Made by a fellow traveller, not an official Brighton Travel page. Itinerary from Brighton Travel & Tour, prepared by Amy.' })}</p>
      <h2>${ic('camera')} 图片来源 <span class="en" lang="en">Photo credits (Wikimedia Commons)</span></h2>
      <ul class="credits">${credits.filter((c) => c.by).map((c) => `<li>${bi(c.what)}: ${esc(c.by)}</li>`).join('')}</ul>
      <p>${bi({ zh: '天气', en: 'Weather' })} Open-Meteo.com · ${bi({ zh: '地图', en: 'Map' })} OpenStreetMap, 高德 · ${bi({ zh: '字体', en: 'Font' })} Noto Serif SC (OFL) · ${bi({ zh: '图标', en: 'Icons' })} Phosphor (MIT)</p>`;
  }

  /* ---------- navigation ---------- */
  let goTimer = null;
  function goTo(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    clearTimeout(goTimer); // land exactly, even if images above finished loading mid-scroll
    goTimer = setTimeout(() => { if (Math.abs(el.getBoundingClientRect().top - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0)) > 12) el.scrollIntoView({ block: 'start' }); }, reduceMotion ? 50 : 900);
  }
  function setActiveSec(id) {
    $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === id; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
  }
  function setActiveChip(n) {
    const bar = $('.chips'); let on = null;
    $$('.chip', bar).forEach((c) => { const is = Number(c.dataset.day) === n; c.classList.toggle('on', is); if (is) on = c; });
    if (on) bar.scrollTo({ left: on.offsetLeft - bar.clientWidth / 2 + on.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  let observed = [];
  function observers() {
    observed.forEach((o) => o.disconnect());
    const watch = (els, cb, rootMargin) => { const o = new IntersectionObserver((es) => es.forEach(cb), { rootMargin }); els.forEach((e) => o.observe(e)); observed.push(o); return o; };
    watch(['days', 'weather', 'map', 'info'].map((id) => $('#' + id)), (e) => e.isIntersecting && setActiveSec(e.target.id), '-45% 0px -50% 0px');
    watch($$('.day'), (e) => e.isIntersecting && setActiveChip(Number(e.target.id.slice(4))), '-35% 0px -60% 0px');
    const seen = watch($$('.day'), (e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }, '0px 0px -15% 0px');
    watch([$('#weather')], (e) => e.target.classList.toggle('live', e.isIntersecting));
    // day jumps land just below the sticky day chips, whatever their height at this text size
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--stick', $('.bar').offsetHeight + $('.chips-bar').offsetHeight + 'px'));
    ro.observe($('.chips-bar')); ro.observe($('.bar')); observed.push(ro);
    if (!map) { const mo = watch([$('#map')], (e) => { if (e.isIntersecting) { initMap(); mo.disconnect(); } }, '400px 0px'); }
  }
  function rerenderDates() {
    renderTop(); renderDays(); paintWeather(); loadLastYear(); drawMarkers(false); renderFoot(); observers();
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-go], .topnav a, .tabbar a');
    if (link?.hash && $(link.hash)) { e.preventDefault(); goTo($(link.hash)); history.replaceState(null, '', link.hash); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const v = b.dataset.v;
    ({
      fs() { const i = FS.indexOf(state.fs) + Number(b.dataset.d); if (FS[i]) { state.fs = FS[i]; save(); applyFs(); } },
      editdate: () => renderNow(true),
      canceldate: () => renderNow(false),
      savedate() { const val = $('#dep-in').value; state.departure = /^\d{4}-\d{2}-\d{2}$/.test(val) && val !== T.departureDate ? val : ''; save(); rerenderDates(); },
      optional() { state.optional[v] = !state.optional[v]; save(); b.setAttribute('aria-pressed', state.optional[v]); b.innerHTML = optLabel(state.optional[v]); },
      pack() { const k = b.dataset.i; state.packing[k] = !state.packing[k]; save(); b.setAttribute('aria-checked', !!state.packing[k]); updatePacking(); },
      wxtab: () => setWxTab(v),
      wxrefresh: () => loadForecast(true),
      mapday() { initMap(); setMapDay(Number(v)); },
      layer() { state.layer = v; save(); initMap(); setLayer(v); },
      locate() { initMap(); map?.locate({ enableHighAccuracy: true, timeout: 10000 }); },
      fitall() { initMap(); setMapDay(0); },
      flyto: () => flyTo(Number(b.dataset.day), Number(b.dataset.i)),
      showonmap() { goTo($('#map')); setTimeout(() => flyTo(Number(b.dataset.day), Number(b.dataset.i)), reduceMotion ? 0 : 600); },
      goday() { map?.closePopup(); goTo($('#day-' + v)); },
    })[b.dataset.act]?.();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && e.target.matches('.tabs [role="tab"]')) { setWxTab(wxTab === 'now' ? 'trip' : 'now'); $('.tabs [aria-selected="true"]').focus(); }
  });
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

  /* ---------- boot ---------- */
  renderTop();
  renderDays();
  renderWeatherShell();
  renderMapShell();
  renderInfo();
  renderFoot();
  applyFs();
  observers();
  setActiveSec('days');
  paintWeather();
  loadForecast(false);
  loadLastYear();
  setInterval(() => document.visibilityState === 'visible' && loadForecast(false), 5 * 60e3);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && (loadForecast(false), tick()));
  addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(initMap, { timeout: 3000 }), 600)); // map starts in idle time, never mid-scroll
  if (location.hash && $(location.hash)) setTimeout(() => goTo($(location.hash)), 100);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
