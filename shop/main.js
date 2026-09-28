/* ============================================================
   4종목 라이더 쇼핑몰 시안 - 동작 스크립트
   - 내용은 config.js, 상품은 data/products.js 에서 읽습니다.
   - 회원가입 없이: 장바구니 → 주문서 → 토스페이먼츠 결제위젯으로 결제
   - 상담은 카카오톡 (상품 정보가 담긴 메시지를 복사해 채널을 엽니다)
   ============================================================ */
(function () {
  "use strict";

  var config = window.SHOP_CONFIG || {};
  var products = window.SHOP_PRODUCTS || [];
  var categories = config.categories || [];
  var PAGE = config.pageSize || 24;
  var SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];
  var PRICES = [
    { key: "u3", label: "3만 원 이하", min: 0, max: 30000 },
    { key: "3-7", label: "3만~7만 원", min: 30001, max: 70000 },
    { key: "7-15", label: "7만~15만 원", min: 70001, max: 150000 },
    { key: "15u", label: "15만 원 이상", min: 150001, max: Infinity },
  ];

  var fromYoutube = false;
  var state = { cat: "", sub: "", q: "", colors: [], sizes: [], prices: [], stock: false, sale: false, sort: "rec", shown: PAGE };
  var byId = {};
  products.forEach(function (p, i) { p._i = i; byId[p.id] = p; });

  // ---------- 작은 도우미 ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function won(n) { return Number(n).toLocaleString("ko-KR") + "원"; }
  function pay(p) { return p.sp && p.sp < p.p ? p.sp : p.p; }
  function hex(name) { return (config.colors || {})[name] || "#b9b5ad"; }
  function catOf(name) { return categories.filter(function (c) { return c.name === name; })[0]; }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function sizeRank(s) {
    var i = SIZE_ORDER.indexOf(s);
    if (i >= 0) return 1000 + i;
    var n = parseFloat(s);
    return isNaN(n) ? 9999 : n;
  }
  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }
  // 브라우저 저장 (개인 창 등에서는 막힐 수 있어 감쌉니다)
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ---------- 상품 그림 (사진이 없을 때 고른 색으로 그립니다) ----------
  function shade(h, amt) {
    var n = parseInt(h.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(c * (1 - amt)))); }
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }
  var SHAPES = {
    // 의류
    "티셔츠": '<path class="b" d="M72 42 L48 50 L22 78 L40 98 L58 86 L58 168 L142 168 L142 86 L160 98 L178 78 L152 50 L128 42 Q100 64 72 42 Z"/><path class="l" d="M72 42 Q100 64 128 42 M58 86 L58 96 M142 86 L142 96"/>',
    "재킷": '<path class="b" d="M72 40 L46 50 L30 112 L28 156 L46 158 L58 106 L58 168 L142 168 L142 106 L154 158 L172 156 L170 112 L154 50 L128 40 L100 52 Z"/><path class="d" d="M72 40 L58 80 L90 68 Z M128 40 L144 80 L114 66 Z"/><path class="l w3" d="M110 54 L90 168"/><path class="d" d="M58 152 L142 152 L142 160 L58 160 Z"/><rect class="d" x="94" y="150" width="14" height="12" rx="2"/><path class="l" d="M66 110 L84 106 M120 118 L136 114"/>',
    "후디·맨투맨": '<path class="d" d="M74 46 Q68 12 100 10 Q132 12 126 46 Q100 60 74 46 Z"/><path class="b" d="M72 42 L48 50 L30 110 L28 152 L46 154 L58 104 L58 168 L142 168 L142 104 L154 154 L172 152 L170 110 L152 50 L128 42 Q100 60 72 42 Z"/><path class="d" d="M76 118 L124 118 L132 150 L68 150 Z"/><path class="l" d="M94 54 L92 82 M106 54 L108 82 M58 158 L142 158"/>',
    "팬츠": '<path class="b" d="M62 32 L138 32 L148 180 L110 180 L100 84 L90 180 L52 180 Z"/><rect class="d" x="62" y="32" width="76" height="14" rx="3"/><path class="l" d="M100 46 L100 84 M70 52 Q80 62 76 74 M130 52 Q120 62 124 74 M60 120 L84 120 L84 140 L58 140"/>',
    "조끼": '<path class="b" d="M74 38 Q70 70 60 84 L60 168 L140 168 L140 84 Q130 70 126 38 L112 38 L100 88 L88 38 Z"/><path class="l" d="M100 88 L100 168 M68 120 L88 120 M112 120 L132 120"/><circle class="d" cx="106" cy="106" r="3"/><circle class="d" cx="106" cy="130" r="3"/><circle class="d" cx="106" cy="154" r="3"/>',
    // 모자
    "볼캡": '<path class="b" d="M52 118 Q50 62 100 60 Q150 62 150 118 Z"/><path class="d" d="M52 118 Q100 110 150 118 L180 132 Q152 148 110 140 Q70 134 52 118 Z"/><path class="l" d="M100 60 Q96 90 100 118 M74 68 Q70 92 72 116"/><circle class="d" cx="100" cy="60" r="4"/>',
    "스냅백": '<path class="b" d="M50 122 Q48 56 100 54 Q152 56 150 122 Z"/><path class="d" d="M42 122 L158 122 L164 136 L36 136 Z"/><path class="l" d="M100 54 L100 122 M76 60 L72 122 M124 60 L128 122"/>',
    "버킷햇": '<path class="d" d="M30 120 Q100 96 170 120 Q156 146 100 146 Q44 146 30 120 Z"/><path class="b" d="M64 116 L72 62 Q100 52 128 62 L136 116 Q100 126 64 116 Z"/><path class="l" d="M68 100 Q100 110 132 100"/>',
    "비니": '<path class="b" d="M56 128 Q56 50 100 48 Q144 50 144 128 Z"/><rect class="d" x="50" y="116" width="100" height="34" rx="8"/><path class="l" d="M66 120 L66 146 M82 120 L82 146 M100 120 L100 146 M118 120 L118 146 M134 120 L134 146"/>',
    // 가방
    "백팩": '<path class="l w5" d="M88 50 Q100 34 112 50"/><path class="b" d="M58 72 Q58 50 80 50 L120 50 Q142 50 142 72 L146 162 Q146 174 134 174 L66 174 Q54 174 54 162 Z"/><rect class="d" x="70" y="118" width="60" height="42" rx="8"/><path class="l" d="M72 76 L128 76"/>',
    "슬링백": '<path class="l w5" d="M30 36 L112 118"/><path class="b" d="M88 96 Q86 80 102 78 L150 74 Q166 74 166 90 L168 132 Q168 146 152 146 L106 148 Q90 148 90 134 Z"/><path class="l" d="M98 96 L160 92"/><rect class="d" x="118" y="108" width="28" height="22" rx="4"/>',
    "힙색": '<path class="l w5" d="M16 112 L184 112"/><path class="b" d="M48 98 Q48 80 70 80 L130 80 Q152 80 152 98 L152 126 Q152 148 128 148 L72 148 Q48 148 48 126 Z"/><path class="l" d="M56 100 Q100 90 144 100"/><rect class="d" x="92" y="112" width="16" height="10" rx="2"/>',
    "사이드백": '<path class="b" d="M48 68 L152 68 L152 150 Q152 172 130 172 L70 172 Q48 172 48 150 Z"/><path class="d" d="M48 68 L152 68 L152 120 Q100 136 48 120 Z"/><rect class="d" x="66" y="110" width="14" height="26" rx="2"/><rect class="d" x="120" y="110" width="14" height="26" rx="2"/>',
    "토트백": '<path class="l w6" d="M74 86 Q74 42 100 42 Q126 42 126 86"/><path class="b" d="M46 84 L154 84 L146 170 L54 170 Z"/><path class="l" d="M50 100 L150 100"/>',
  };
  var DEFAULT_SHAPE = { "의류": "티셔츠", "모자": "볼캡", "가방": "백팩" };
  function art(p, colorName) {
    var fill = hex(colorName || (p.col || [])[0]);
    var line = shade(fill, 0.4);
    var shape = SHAPES[p.sub] || SHAPES[DEFAULT_SHAPE[p.c]] ||
      '<circle class="l w6" cx="100" cy="112" r="34"/><circle class="b" cx="100" cy="76" r="12"/>';
    return '<div class="art"><svg viewBox="0 0 200 200" role="img" aria-label="' + escapeHtml((colorName || "") + " " + (p.sub || p.c)) + '">' +
      '<rect width="200" height="200" fill="#dcd9d2"/><ellipse cx="100" cy="184" rx="62" ry="6" fill="#000" opacity="0.1"/>' +
      '<g stroke-linejoin="round" stroke-linecap="round">' +
      shape.replace(/class="b"/g, 'fill="' + fill + '" stroke="' + line + '" stroke-width="2"')
        .replace(/class="d"/g, 'fill="' + shade(fill, 0.15) + '" stroke="' + line + '" stroke-width="2"')
        .replace(/class="l w(\d)"/g, 'fill="none" stroke="' + line + '" stroke-width="$1"')
        .replace(/class="l"/g, 'fill="none" stroke="' + line + '" stroke-width="2"') +
      "</g></svg></div>";
  }
  function picture(p, colorName) {
    if (p.img) return '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.n) + '" loading="lazy" width="600" height="600" />';
    return art(p, colorName);
  }

  // ---------- 글자 · 링크 채우기 ----------
  function demoLink(a, msg) {
    a.removeAttribute("target");
    a.addEventListener("click", function (e) { e.preventDefault(); toast(msg); });
  }
  function bindText() {
    document.querySelectorAll("[data-bind]").forEach(function (n) {
      var v = get(config, n.dataset.bind);
      if (v) n.textContent = v;
    });
    document.title = (config.previewMode ? "[미리보기] " : "") + config.storeName + " | " + (config.tagline || "");
    document.querySelectorAll("[data-link]").forEach(function (a) {
      var url = (config.links || {})[a.dataset.link];
      if (!url) { a.hidden = true; return; }
      a.href = url;
      if (url === "#demo") demoLink(a, "시안용 가상 링크입니다. 실제 카카오톡 채널 주소를 받으면 연결됩니다.");
    });
  }

  // ---------- 첫 화면 종목 타일 ----------
  var TILE_LOOK = { "모자": ["볼캡", "카키"], "의류": ["재킷", "브라운"], "가방": ["백팩", "블랙"] };
  function countIn(cat) { return products.filter(function (p) { return p.c === cat; }).length; }
  function renderTiles() {
    var ul = $("catTiles");
    categories.forEach(function (c) {
      var li = el("li");
      var b = el("button", "cat-tile");
      b.type = "button";
      var look = TILE_LOOK[c.name];
      var sample = products.filter(function (p) { return p.c === c.name && (look ? p.sub === look[0] : p.img); })[0];
      var pic = "";
      if (sample && sample.img) pic = '<img src="' + escapeHtml(sample.img) + '" alt="" loading="lazy" />';
      else if (sample) pic = art(sample, look[1]);
      b.innerHTML = pic + '<span class="label"><b>' + escapeHtml(c.name) + ' <small>' + escapeHtml(c.en) + "</small></b><span>" + countIn(c.name).toLocaleString("ko-KR") + "개</span></span>";
      b.addEventListener("click", function () { setCat(c.name); $("shop").scrollIntoView(); });
      li.appendChild(b);
      ul.appendChild(li);
    });
  }

  // ---------- 탭 · 세부분류 ----------
  function renderTabs() {
    var nav = $("tabs");
    nav.innerHTML = "";
    nav.setAttribute("role", "tablist");
    [{ name: "" }].concat(categories).forEach(function (c) {
      var b = el("button", "tab");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(state.cat === c.name));
      b.innerHTML = escapeHtml(c.name || "전체") + "<small>" + (c.name ? countIn(c.name) : products.length).toLocaleString("ko-KR") + "</small>";
      b.addEventListener("click", function () { setCat(c.name); });
      nav.appendChild(b);
    });
    var subs = $("subs");
    subs.innerHTML = "";
    var cat = catOf(state.cat);
    if (!cat) return;
    ["전체"].concat(cat.subs).forEach(function (s) {
      var val = s === "전체" ? "" : s;
      var b = el("button", "chip", s);
      b.type = "button";
      b.setAttribute("aria-pressed", String(state.sub === val));
      b.addEventListener("click", function () { state.sub = val; state.shown = PAGE; refresh(); });
      subs.appendChild(b);
    });
  }
  function setCat(name) {
    state.cat = name;
    state.sub = "";
    // 다른 종목에 없는 색상·사이즈 필터는 지웁니다
    var pool = inScope();
    state.colors = state.colors.filter(function (c) { return pool.some(function (p) { return (p.col || []).indexOf(c) >= 0; }); });
    state.sizes = state.sizes.filter(function (s) { return pool.some(function (p) { return (p.sz || []).indexOf(s) >= 0; }); });
    state.shown = PAGE;
    refresh();
  }

  // ---------- 거르기 · 정렬 ----------
  function inScope() {
    return products.filter(function (p) {
      return (!state.cat || p.c === state.cat) && (!state.sub || p.sub === state.sub);
    });
  }
  function matches(p) {
    if (state.q) {
      var hay = [p.n, p.c, p.sub, p.m, p.id, (p.col || []).join(" "), p.tag].join(" ").toLowerCase();
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.every(function (w) { return hay.indexOf(w) >= 0; })) return false;
    }
    if (state.colors.length && !(p.col || []).some(function (c) { return state.colors.indexOf(c) >= 0; })) return false;
    if (state.sizes.length && !(p.sz || []).some(function (s) { return state.sizes.indexOf(s) >= 0; })) return false;
    if (state.prices.length) {
      var v = pay(p);
      if (!PRICES.some(function (r) { return state.prices.indexOf(r.key) >= 0 && v >= r.min && v <= r.max; })) return false;
    }
    if (state.stock && p.st === "품절") return false;
    if (state.sale && !(p.sp && p.sp < p.p)) return false;
    return true;
  }
  var TAG_RANK = { "베스트": 0, "추천": 1, "신상": 2 };
  function sorted(list) {
    var s = state.sort;
    return list.slice().sort(function (a, b) {
      if (s === "low") return pay(a) - pay(b) || a._i - b._i;
      if (s === "high") return pay(b) - pay(a) || a._i - b._i;
      if (s === "new") return ((a.tag === "신상" ? 0 : 1) - (b.tag === "신상" ? 0 : 1)) || b._i - a._i;
      var ra = a.st === "품절" ? 9 : (TAG_RANK[a.tag] != null ? TAG_RANK[a.tag] : 3);
      var rb = b.st === "품절" ? 9 : (TAG_RANK[b.tag] != null ? TAG_RANK[b.tag] : 3);
      return ra - rb || a._i - b._i;
    });
  }

  // ---------- 상품 목록 ----------
  function priceHtml(p, cls) {
    if (p.sp && p.sp < p.p) {
      var rate = Math.round((1 - p.sp / p.p) * 100);
      return '<p class="' + (cls || "price") + '"><span class="rate">' + rate + "%</span>" + won(p.sp) + "<s>" + won(p.p) + "</s></p>";
    }
    return '<p class="' + (cls || "price") + '">' + won(p.p) + "</p>";
  }
  function card(p) {
    var li = el("li");
    var b = el("button", "card");
    b.type = "button";
    var badge = p.tag ? '<span class="badge ' + (p.tag === "신상" ? "new" : p.tag === "베스트" ? "best" : "") + '">' + escapeHtml(p.tag) + "</span>" : "";
    var sold = p.st === "품절" ? '<span class="soldout">SOLD OUT</span>' : "";
    var cols = p.col || [];
    var dots = cols.slice(0, 5).map(function (c) { return '<i class="dot" style="background:' + hex(c) + '" title="' + escapeHtml(c) + '"></i>'; }).join("") +
      (cols.length > 5 ? "<small>+" + (cols.length - 5) + "</small>" : "");
    b.innerHTML = '<div class="pic">' + picture(p) + badge + sold + "</div>" +
      '<div class="meta"><p class="sub-name">' + escapeHtml(p.c + (p.sub ? " · " + p.sub : "")) + '</p><p class="name">' + escapeHtml(p.n) + "</p>" +
      priceHtml(p) + (dots ? '<div class="dots">' + dots + "</div>" : "") + "</div>";
    b.addEventListener("click", function () { openProduct(p.id); });
    li.appendChild(b);
    return li;
  }
  var current = [];
  function refresh() {
    renderTabs();
    current = sorted(inScope().filter(matches));
    var grid = $("grid");
    grid.innerHTML = "";
    var frag = document.createDocumentFragment();
    current.slice(0, state.shown).forEach(function (p) { frag.appendChild(card(p)); });
    grid.appendChild(frag);
    var total = current.length;
    $("count").innerHTML = (state.q ? "‘" + escapeHtml(state.q) + "’ " : "") + "<b>" + total.toLocaleString("ko-KR") + "</b>개 상품";
    $("empty").hidden = total > 0;
    var shown = Math.min(state.shown, total);
    $("progress").textContent = total ? shown.toLocaleString("ko-KR") + " / " + total.toLocaleString("ko-KR") : "";
    $("more").hidden = shown >= total;
    renderActiveFilters();
    syncUrl();
  }
  function showMore() {
    var frag = document.createDocumentFragment();
    current.slice(state.shown, state.shown + PAGE).forEach(function (p) { frag.appendChild(card(p)); });
    $("grid").appendChild(frag);
    state.shown += PAGE;
    var shown = Math.min(state.shown, current.length);
    $("progress").textContent = shown.toLocaleString("ko-KR") + " / " + current.length.toLocaleString("ko-KR");
    $("more").hidden = shown >= current.length;
  }

  // ---------- 필터 ----------
  function filterCount() {
    return state.colors.length + state.sizes.length + state.prices.length + (state.stock ? 1 : 0) + (state.sale ? 1 : 0);
  }
  function renderActiveFilters() {
    var box = $("activeFilters");
    box.innerHTML = "";
    function add(label, remove) {
      var b = el("button", "", label);
      b.type = "button";
      b.setAttribute("aria-label", label + " 필터 지우기");
      b.addEventListener("click", function () { remove(); state.shown = PAGE; refresh(); });
      box.appendChild(b);
    }
    if (state.q) add("검색: " + state.q, function () { state.q = ""; $("q").value = ""; });
    state.colors.forEach(function (c) { add(c, function () { state.colors = state.colors.filter(function (x) { return x !== c; }); }); });
    state.sizes.forEach(function (s) { add(s, function () { state.sizes = state.sizes.filter(function (x) { return x !== s; }); }); });
    state.prices.forEach(function (k) {
      var r = PRICES.filter(function (x) { return x.key === k; })[0];
      add(r.label, function () { state.prices = state.prices.filter(function (x) { return x !== k; }); });
    });
    if (state.stock) add("품절 제외", function () { state.stock = false; });
    if (state.sale) add("할인 상품", function () { state.sale = false; });
    var n = filterCount();
    $("filterBadge").hidden = !n;
    $("filterBadge").textContent = n;
  }
  function option(type, value, label, checked, colorHex) {
    var lab = el("label", type === "color" ? "swatch" : "chip");
    var input = el("input");
    input.type = "checkbox";
    input.name = type;
    input.value = value;
    input.checked = checked;
    lab.appendChild(input);
    if (colorHex) { var i = el("i"); i.style.background = colorHex; lab.appendChild(i); }
    lab.appendChild(document.createTextNode(label));
    return lab;
  }
  function openFilter() {
    var pool = inScope();
    var colors = uniq([].concat.apply([], pool.map(function (p) { return p.col || []; })));
    var order = Object.keys(config.colors || {});
    colors.sort(function (a, b) { return (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99); });
    var sizes = uniq([].concat.apply([], pool.map(function (p) { return p.sz || []; }))).sort(function (a, b) { return sizeRank(a) - sizeRank(b); });
    var fc = $("fColors"), fs = $("fSizes"), fp = $("fPrices");
    fc.innerHTML = ""; fs.innerHTML = ""; fp.innerHTML = "";
    colors.forEach(function (c) { fc.appendChild(option("color", c, c, state.colors.indexOf(c) >= 0, hex(c))); });
    sizes.forEach(function (s) { fs.appendChild(option("size", s, s, state.sizes.indexOf(s) >= 0)); });
    fs.closest("fieldset").hidden = !sizes.length;
    PRICES.forEach(function (r) { fp.appendChild(option("price", r.key, r.label, state.prices.indexOf(r.key) >= 0)); });
    $("fStock").checked = state.stock;
    $("fSale").checked = state.sale;
    $("filterSheet").showModal();
  }
  function applyFilter() {
    function vals(name) {
      return Array.prototype.map.call(document.querySelectorAll('#filterSheet input[name="' + name + '"]:checked'), function (i) { return i.value; });
    }
    state.colors = vals("color");
    state.sizes = vals("size");
    state.prices = vals("price");
    state.stock = $("fStock").checked;
    state.sale = $("fSale").checked;
    state.shown = PAGE;
    refresh();
  }

  // ---------- 상품 상세 ----------
  var sel = { p: null, color: "", size: "", qty: 1 };
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    // 필터로 고른 색이 있으면 그 색을 먼저 골라 둡니다
    var picked = (p.col || []).filter(function (c) { return state.colors.indexOf(c) >= 0; })[0];
    sel = { p: p, color: picked || (p.col || [])[0] || "", size: (p.sz || []).length === 1 ? p.sz[0] : "", qty: 1 };
    $("pCrumb").textContent = p.c + (p.sub ? " › " + p.sub : "");
    $("pId").textContent = "상품코드 " + p.id;
    $("pName").textContent = p.n;
    $("pPrice").outerHTML = priceHtml(p, "price p-price").replace("<p ", '<p id="pPrice" ');
    $("pDesc").textContent = p.d || "";

    var pc = $("pColors");
    pc.innerHTML = "";
    $("pColorRow").hidden = !(p.col || []).length;
    (p.col || []).forEach(function (c) {
      var b = el("button", "swatch");
      b.type = "button";
      b.dataset.value = c;
      b.innerHTML = '<i style="background:' + hex(c) + '"></i>' + escapeHtml(c);
      b.addEventListener("click", function () { sel.color = c; drawProduct(); });
      pc.appendChild(b);
    });
    var ps = $("pSizes");
    ps.innerHTML = "";
    $("pSizeRow").hidden = !(p.sz || []).length;
    (p.sz || []).forEach(function (s) {
      var b = el("button", "chip", s);
      b.type = "button";
      b.dataset.value = s;
      b.disabled = p.st === "품절";
      b.addEventListener("click", function () { sel.size = s; drawProduct(); });
      ps.appendChild(b);
    });
    // 실측 사이즈표 (값이 하나도 없는 칸은 뺍니다 - 예: 팬츠의 어깨)
    var cat = catOf(p.c);
    var box = $("pMeasure");
    box.innerHTML = "";
    if (p.ms && cat && cat.measure.length) {
      var keys = Object.keys(p.ms).sort(function (a, b) { return sizeRank(a) - sizeRank(b); });
      var cols = cat.measure.map(function (m, i) { return i; }).filter(function (i) {
        return keys.some(function (k) { return p.ms[k][i] != null; });
      });
      var t = "<table><caption>실측 사이즈 (cm)</caption><thead><tr><th>사이즈</th>" +
        cols.map(function (i) { return "<th>" + escapeHtml(cat.measure[i]) + "</th>"; }).join("") + "</tr></thead><tbody>";
      keys.forEach(function (s) {
        t += '<tr data-size="' + escapeHtml(s) + '"><th>' + escapeHtml(s) + "</th>" + cols.map(function (i) { var v = p.ms[s][i]; return "<td>" + (v == null ? "-" : v) + "</td>"; }).join("") + "</tr>";
      });
      box.innerHTML = t + "</tbody></table>";
    }
    var spec = $("pSpec");
    spec.innerHTML = "";
    [["소재", p.m], ["배송", (config.shipping || {}).text]].forEach(function (r) {
      if (!r[1]) return;
      var d = el("div");
      d.appendChild(el("dt", "", r[0]));
      d.appendChild(el("dd", "", r[1]));
      spec.appendChild(d);
    });
    $("pThumbs").innerHTML = "";
    $("pPic").innerHTML = "";
    drawProduct();
    var sheet = $("productSheet");
    if (!sheet.open) sheet.showModal();
    sheet.querySelector(".sheet-body").scrollTop = 0;
    syncUrl();
  }
  function drawProduct() {
    var p = sel.p;
    var pics = p.img ? [p.img].concat(p.imgs || []) : [];
    var main = $("pPic");
    if (!pics.length) main.innerHTML = art(p, sel.color);
    else if (!main.querySelector("img")) main.innerHTML = '<img src="' + escapeHtml(pics[0]) + '" alt="' + escapeHtml(p.n) + '" />';
    var th = $("pThumbs");
    if (pics.length > 1 && !th.children.length) {
      pics.forEach(function (src, i) {
        var b = el("button");
        b.type = "button";
        b.setAttribute("aria-label", (i + 1) + "번째 사진");
        b.setAttribute("aria-pressed", String(i === 0));
        b.innerHTML = '<img src="' + escapeHtml(src) + '" alt="" />';
        b.addEventListener("click", function () {
          main.querySelector("img").src = src;
          Array.prototype.forEach.call(th.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        });
        th.appendChild(b);
      });
    }
    Array.prototype.forEach.call($("pColors").children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === sel.color)); });
    Array.prototype.forEach.call($("pSizes").children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === sel.size)); });
    $("pColorName").textContent = sel.color;
    Array.prototype.forEach.call(document.querySelectorAll("#pMeasure tr[data-size]"), function (tr) { tr.classList.toggle("on", tr.dataset.size === sel.size); });
    $("qty").textContent = sel.qty;
    $("pTotal").textContent = won(pay(p) * sel.qty);
    var sold = p.st === "품절";
    $("addCartBtn").disabled = sold;
    $("buyNowBtn").disabled = sold;
    $("buyNowBtn").textContent = sold ? "품절" : "바로 구매";
    $("consultBtn").textContent = sold ? "카톡으로 재입고 문의" : "카톡으로 상담하기";
    $("orderNote").textContent = sold ? "품절된 상품입니다. 카톡으로 재입고 알림을 요청해 주세요." : "회원가입 없이 결제할 수 있어요. 사이즈가 고민되면 카톡으로 물어보세요.";
  }
  function needOptions() {
    var p = sel.p;
    if ((p.sz || []).length > 1 && !sel.size) { toast("사이즈를 먼저 골라 주세요."); return true; }
    return false;
  }

  // ---------- 카톡 상담 ----------
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () {});
    return Promise.resolve();
  }
  function consult() {
    var p = sel.p;
    var lines = [p.st === "품절" ? "[재입고 문의]" : "[상담 요청]"];
    if (fromYoutube && config.youtube && config.youtube.tag) lines.push("(" + config.youtube.tag + ")");
    lines.push("상품: " + p.n + " (" + p.id + ")");
    if (sel.color) lines.push("색상: " + sel.color);
    if (sel.size) lines.push("사이즈: " + sel.size);
    lines.push("", "궁금한 점: ");
    var url = (config.links || {}).kakao;
    copy(lines.join("\n")).then(function () {
      if (!url || url === "#demo") { toast("상담 메시지를 복사했습니다. (시안이라 카톡 창은 열리지 않습니다)"); return; }
      toast("상담 메시지를 복사했습니다. 카톡 창에 붙여넣어 보내 주세요.");
      window.open(url, "_blank", "noopener");
    });
  }

  // ---------- 장바구니 ----------
  var CART_KEY = "shop-cart";
  var cart = load(CART_KEY, []).filter(function (it) { return byId[it.id]; });
  function saveCart() { save(CART_KEY, cart); renderCartCount(); }
  function lineKey(it) { return it.id + "|" + (it.color || "") + "|" + (it.size || ""); }
  function addToCart() {
    if (needOptions()) return;
    var item = { id: sel.p.id, color: sel.color, size: sel.size, qty: sel.qty };
    var same = cart.filter(function (it) { return lineKey(it) === lineKey(item); })[0];
    if (same) same.qty = Math.min(99, same.qty + item.qty);
    else cart.push(item);
    saveCart();
    toast("장바구니에 담았습니다.");
  }
  function renderCartCount() {
    var n = cart.reduce(function (s, it) { return s + it.qty; }, 0);
    $("cartCount").hidden = !n;
    $("cartCount").textContent = n;
    $("barCartCount").textContent = n ? "(" + n + ")" : "";
  }
  function totals(items) {
    var sub = items.reduce(function (s, it) { return s + pay(byId[it.id]) * it.qty; }, 0);
    var ship = config.shipping || {};
    var fee = !sub || sub >= (ship.freeOver || Infinity) ? 0 : (ship.fee || 0);
    return { sub: sub, fee: fee, total: sub + fee };
  }
  function sumHtml(t) {
    return "<div><dt>상품 금액</dt><dd>" + won(t.sub) + "</dd></div><div><dt>배송비</dt><dd>" + (t.fee ? won(t.fee) : "무료") + "</dd></div>" +
      '<div class="total"><dt>결제 금액</dt><dd>' + won(t.total) + "</dd></div>";
  }
  function optText(it) { return [it.color, it.size].filter(Boolean).join(" / "); }
  function renderCart() {
    var ul = $("cartList");
    ul.innerHTML = "";
    cart.forEach(function (it, idx) {
      var p = byId[it.id];
      var li = el("li", "cart-item");
      li.innerHTML = '<div class="thumb">' + picture(p, it.color) + '</div><div class="ci-body"><p class="ci-name">' + escapeHtml(p.n) + '</p><p class="ci-opt">' + escapeHtml(optText(it) || "옵션 없음") +
        '</p><div class="ci-row"><div class="stepper small"><button type="button" data-act="down" aria-label="수량 줄이기">−</button><output>' + it.qty +
        '</output><button type="button" data-act="up" aria-label="수량 늘리기">+</button></div><strong>' + won(pay(p) * it.qty) + '</strong></div></div><button type="button" class="ci-del" data-act="del" aria-label="빼기">&times;</button>';
      li.addEventListener("click", function (e) {
        var act = e.target.closest("[data-act]");
        if (!act) return;
        if (act.dataset.act === "up") it.qty = Math.min(99, it.qty + 1);
        if (act.dataset.act === "down") it.qty = Math.max(1, it.qty - 1);
        if (act.dataset.act === "del") cart.splice(idx, 1);
        saveCart();
        renderCart();
      });
      ul.appendChild(li);
    });
    $("cartEmpty").hidden = cart.length > 0;
    $("cartSum").innerHTML = cart.length ? sumHtml(totals(cart)) : "";
    $("goCheckout").hidden = !cart.length;
  }
  function openCart() {
    renderCart();
    $("cartSheet").showModal();
  }

  // ---------- 주문 · 결제 (토스페이먼츠 결제위젯) ----------
  var checkout = { items: [], source: "cart" };
  var toss = { widgets: null, ready: false, loading: null };
  function loadTossScript() {
    if (window.TossPayments) return Promise.resolve();
    if (toss.loading) return toss.loading;
    toss.loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://js.tosspayments.com/v2/standard";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
      setTimeout(reject, 10000);
    });
    return toss.loading;
  }
  function prepareWidgets(amount) {
    var payCfg = config.pay || {};
    if (!payCfg.clientKey) return Promise.reject(new Error("no key"));
    return loadTossScript().then(function () {
      if (!toss.widgets) {
        var tp = window.TossPayments(payCfg.clientKey);
        toss.widgets = tp.widgets({ customerKey: window.TossPayments.ANONYMOUS });
      }
      return toss.widgets.setAmount({ currency: "KRW", value: amount });
    }).then(function () {
      if (toss.ready) return;
      return Promise.all([
        toss.widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
        toss.widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
      ]).then(function () { toss.ready = true; });
    });
  }
  function showPayFallback() {
    var f = $("payFallback");
    f.innerHTML = "";
    f.appendChild(el("p", "", "결제창을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 열어 주세요."));
    if (config.previewMode) f.appendChild(el("p", "fine", "시안에서는 '결제하기'를 누르면 결제가 끝난 뒤의 화면을 보여 드립니다."));
    f.hidden = false;
  }
  function openCheckout(items, source) {
    checkout = { items: items, source: source };
    var ul = $("coItems");
    ul.innerHTML = "";
    items.forEach(function (it) {
      var p = byId[it.id];
      var li = el("li");
      li.innerHTML = '<div class="thumb">' + picture(p, it.color) + '</div><div><p class="ci-name">' + escapeHtml(p.n) + '</p><p class="ci-opt">' +
        escapeHtml((optText(it) ? optText(it) + " · " : "") + it.qty + "개") + "</p></div><strong>" + won(pay(p) * it.qty) + "</strong>";
      ul.appendChild(li);
    });
    var t = totals(items);
    $("coSum").innerHTML = sumHtml(t);
    $("payBtn").textContent = won(t.total) + " 결제하기";
    $("payFallback").hidden = true;
    ["productSheet", "cartSheet"].forEach(function (id) { if ($(id).open) $(id).close(); });
    $("checkoutSheet").showModal();
    $("checkoutSheet").querySelector(".sheet-body").scrollTop = 0;
    prepareWidgets(t.total).catch(showPayFallback);
  }
  function buyNow() {
    if (needOptions()) return;
    openCheckout([{ id: sel.p.id, color: sel.color, size: sel.size, qty: sel.qty }], "now");
  }
  function orderId() {
    var d = new Date();
    function two(n) { return (n < 10 ? "0" : "") + n; }
    return "MS" + d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + two(d.getHours()) + two(d.getMinutes()) + two(d.getSeconds()) +
      "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function submitCheckout(e) {
    e.preventDefault();
    var fields = [["oName", "성함"], ["oPhone", "휴대폰 번호"], ["oAddr", "주소"]];
    var missing = fields.filter(function (f) { return !$(f[0]).value.trim(); });
    if (missing.length) {
      toast("적어 주세요: " + missing.map(function (f) { return f[1]; }).join(", "));
      $(missing[0][0]).focus();
      return;
    }
    var phone = $("oPhone").value.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(phone)) { toast("휴대폰 번호를 010-0000-0000 모양으로 적어 주세요."); $("oPhone").focus(); return; }
    var email = $("oEmail").value.trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("이메일 주소를 다시 확인해 주세요."); $("oEmail").focus(); return; }

    var items = checkout.items;
    var t = totals(items);
    var first = byId[items[0].id];
    var name = first.n + (items.length > 1 ? " 외 " + (items.length - 1) + "건" : "");
    var order = {
      orderId: orderId(), orderName: name.slice(0, 100), amount: t.total, sub: t.sub, fee: t.fee, source: checkout.source,
      fromYoutube: fromYoutube, date: new Date().toISOString(),
      items: items.map(function (it) { var p = byId[it.id]; return { id: it.id, n: p.n, color: it.color, size: it.size, qty: it.qty, price: pay(p) }; }),
      customer: { name: $("oName").value.trim(), phone: $("oPhone").value.trim(), email: email, addr: $("oAddr").value.trim(), memo: $("oMemo").value.trim() },
    };
    // 결제 뒤 돌아온 화면에서 주문 내용을 보여 주려고 저장해 둡니다
    save("shop-last-order", order);
    var payCfg = config.pay || {};
    var success = new URL(payCfg.successUrl || "order-complete.html", location.href).href;
    var fail = new URL(payCfg.failUrl || "order-complete.html?fail=1", location.href).href;

    if (toss.ready) {
      var req = {
        orderId: order.orderId, orderName: order.orderName, successUrl: success, failUrl: fail,
        customerName: order.customer.name, customerMobilePhone: phone,
      };
      if (email) req.customerEmail = email;
      $("payBtn").disabled = true;
      toss.widgets.requestPayment(req).catch(function (err) {
        toast(err && err.message ? err.message : "결제를 마치지 못했습니다. 다시 시도해 주세요.");
      }).then(function () { $("payBtn").disabled = false; });
      return;
    }
    if (config.previewMode) {
      // 시안: 결제창을 못 불러와도 결제가 끝난 뒤의 화면을 보여 줍니다
      location.href = success + (success.indexOf("?") >= 0 ? "&" : "?") + "orderId=" + encodeURIComponent(order.orderId) + "&amount=" + order.amount + "&paymentKey=preview";
      return;
    }
    toast("결제창을 불러오지 못했습니다. 잠시 뒤 다시 시도하거나 카톡으로 문의해 주세요.");
  }

  // ---------- 주소(URL)에 지금 보는 화면 기억 ----------
  function syncUrl() {
    var ps = new URLSearchParams();
    if (state.cat) ps.set("cat", state.cat);
    if (state.sub) ps.set("sub", state.sub);
    if (state.q) ps.set("q", state.q);
    if ($("productSheet").open && sel.p) ps.set("id", sel.p.id);
    var qs = ps.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (e) {}
  }
  function readUrl() {
    var ps = new URLSearchParams(location.search);
    // 유튜브에서 온 손님은 다른 화면으로 옮겨도 기억합니다
    try {
      if (ps.get("from") === "youtube") sessionStorage.setItem("shop-from", "youtube");
      fromYoutube = fromYoutube || sessionStorage.getItem("shop-from") === "youtube";
    } catch (e) {
      fromYoutube = fromYoutube || ps.get("from") === "youtube";
    }
    if (catOf(ps.get("cat"))) state.cat = ps.get("cat");
    if (ps.get("sub") && catOf(state.cat) && catOf(state.cat).subs.indexOf(ps.get("sub")) >= 0) state.sub = ps.get("sub");
    if (ps.get("q")) { state.q = ps.get("q"); $("q").value = state.q; }
    return ps.get("id");
  }

  // ---------- 주문 안내 ----------
  function renderInfo() {
    var ol = $("notice");
    (config.notice || []).forEach(function (n) {
      var li = el("li");
      li.appendChild(el("b", "", n.title));
      li.appendChild(el("span", "", n.desc));
      ol.appendChild(li);
    });
    var dl = $("infoList");
    [["결제", "카드 · 간편결제(토스페이·카카오페이 등) · 계좌이체"], ["배송", (config.shipping || {}).text], ["상담", "카카오톡 채널 · " + (config.contactHours || "")], ["전화", config.previewMode ? "" : config.phone]].forEach(function (r) {
      if (!r[1]) return;
      var d = el("div");
      d.appendChild(el("dt", "", r[0]));
      d.appendChild(el("dd", "", r[1]));
      dl.appendChild(d);
    });
  }

  // ---------- 시작 ----------
  document.addEventListener("DOMContentLoaded", function () {
    bindText();
    renderTiles();
    renderInfo();
    renderCartCount();
    var openId = readUrl();
    refresh();
    if (openId) openProduct(openId);

    $("searchForm").addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = $("q").value.trim();
      // 머리글 검색은 모든 종목에서 찾습니다
      state.cat = "";
      state.sub = "";
      state.shown = PAGE;
      refresh();
      $("shop").scrollIntoView();
      $("q").blur();
    });
    $("q").addEventListener("search", function () {
      if (!$("q").value) { state.q = ""; state.shown = PAGE; refresh(); }
    });
    $("sort").addEventListener("change", function () { state.sort = this.value; state.shown = PAGE; refresh(); });
    $("more").addEventListener("click", showMore);
    $("openFilter").addEventListener("click", openFilter);
    $("applyFilter").addEventListener("click", applyFilter);
    $("resetFilter").addEventListener("click", function () {
      document.querySelectorAll("#filterSheet input").forEach(function (i) { i.checked = false; });
    });
    $("qtyDown").addEventListener("click", function () { if (sel.qty > 1) { sel.qty--; drawProduct(); } });
    $("qtyUp").addEventListener("click", function () { if (sel.qty < 99) { sel.qty++; drawProduct(); } });
    $("consultBtn").addEventListener("click", consult);
    $("addCartBtn").addEventListener("click", addToCart);
    $("buyNowBtn").addEventListener("click", buyNow);
    $("openCart").addEventListener("click", openCart);
    $("barCart").addEventListener("click", openCart);
    $("goCheckout").addEventListener("click", function () { if (cart.length) openCheckout(cart.slice(), "cart"); });
    $("checkoutForm").addEventListener("submit", submitCheckout);
    $("closeCheckout").addEventListener("click", function () { $("checkoutSheet").close(); });
    $("productSheet").addEventListener("close", syncUrl);
    // 바깥 어두운 곳을 누르면 닫기
    ["productSheet", "filterSheet", "cartSheet"].forEach(function (id) {
      $(id).addEventListener("click", function (e) { if (e.target === this) this.close(); });
    });

    if (fromYoutube && config.youtube && config.youtube.welcome) {
      var ribbon = el("div", "yt-ribbon");
      ribbon.appendChild(el("span", "yt-mark", "▶"));
      ribbon.appendChild(el("p", "", config.youtube.welcome));
      var x = el("button", "yt-close", "×");
      x.type = "button";
      x.setAttribute("aria-label", "안내 닫기");
      x.addEventListener("click", function () { ribbon.remove(); });
      ribbon.appendChild(x);
      document.body.appendChild(ribbon);
    }
    if (config.previewMode) document.body.insertBefore(el("p", "preview-badge", "미리보기 시안 · 가상 상품 4,000개 · 테스트 결제"), document.body.firstChild);

    // 종목 탭이 머리글 바로 밑에 붙도록 머리글 높이를 알려 줍니다
    function headerHeight() {
      document.documentElement.style.setProperty("--header-h", document.querySelector(".site-header").offsetHeight + "px");
    }
    headerHeight();
    window.addEventListener("resize", headerHeight);
  });
})();
