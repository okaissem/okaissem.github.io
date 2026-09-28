/* ============================================================
   4종목 쇼핑몰 홈페이지 시안 - 동작 스크립트
   - 내용은 config.js, 상품은 data/products.js 에서 읽습니다.
   ============================================================ */
(function () {
  "use strict";

  var config = window.SHOP_CONFIG || {};
  var products = window.SHOP_PRODUCTS || [];
  var categories = config.categories || [];
  var PAGE = config.pageSize || 24;
  var SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];
  var PRICES = [
    { key: "u2", label: "2만 원 이하", min: 0, max: 20000 },
    { key: "2-5", label: "2만~5만 원", min: 20001, max: 50000 },
    { key: "5-10", label: "5만~10만 원", min: 50001, max: 100000 },
    { key: "10u", label: "10만 원 이상", min: 100001, max: Infinity },
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
  function hex(name) { return (config.colors || {})[name] || "#cfcac2"; }
  function catOf(name) { return categories.filter(function (c) { return c.name === name; })[0]; }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function sizeRank(s) {
    var i = SIZE_ORDER.indexOf(s);
    if (i >= 0) return 100 + i;
    var n = parseFloat(s);
    return isNaN(n) ? 999 : n;
  }
  function uniq(list) {
    var seen = {}, out = [];
    list.forEach(function (v) { if (!seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }
  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3200);
  }

  // ---------- 상품 그림 (사진이 없을 때 색상에 맞춰 그립니다) ----------
  function shade(h, amt) {
    var n = parseInt(h.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(c * (1 - amt)))); }
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }
  var SHAPES = {
    "아우터": '<path class="b" d="M70 36 L46 46 L30 120 L28 176 L48 178 L58 112 L60 182 L140 182 L142 112 L152 178 L172 176 L170 120 L154 46 L130 36 L100 96 Z"/><path class="l" d="M70 36 L86 82 L100 96 L114 82 L130 36 M100 96 L100 182"/><circle class="d" cx="108" cy="122" r="3.5"/><circle class="d" cx="108" cy="148" r="3.5"/>',
    "셔츠": '<path class="b" d="M72 42 L48 50 L30 110 L28 152 L46 154 L58 104 L58 170 L142 170 L142 104 L154 154 L172 152 L170 110 L152 50 L128 42 L100 60 Z"/><path class="d" d="M76 40 L100 62 L124 40 L112 34 L100 48 L88 34 Z"/><path class="l" d="M100 62 L100 170"/><circle class="d" cx="100" cy="86" r="3"/><circle class="d" cx="100" cy="112" r="3"/><circle class="d" cx="100" cy="138" r="3"/>',
    "바지": '<path class="b" d="M62 32 L138 32 L148 180 L110 180 L100 84 L90 180 L52 180 Z"/><rect class="d" x="62" y="32" width="76" height="14" rx="3"/><path class="l" d="M100 46 L100 84 M70 52 Q80 62 76 74 M130 52 Q120 62 124 74"/>',
    "원피스": '<path class="b" d="M80 34 Q100 50 120 34 L130 40 L124 88 L152 178 L48 178 L76 88 L70 40 Z"/><path class="d" d="M76 86 L124 86 L123 97 L77 97 Z"/><path class="l" d="M80 34 Q100 50 120 34 M86 104 L76 176 M114 104 L124 176"/>',
    "니트": '<path class="b" d="M72 42 L48 50 L30 110 L28 152 L46 154 L58 104 L58 168 L142 168 L142 104 L154 154 L172 152 L170 110 L152 50 L128 42 Q100 64 72 42 Z"/><path class="d" d="M58 156 L142 156 L142 170 L58 170 Z M28 144 L47 146 L46 156 L27 154 Z M172 144 L153 146 L154 156 L173 154 Z"/><path class="l w4" d="M74 44 Q100 64 126 44"/><path class="l" d="M86 80 L86 150 M100 76 L100 150 M114 80 L114 150"/>',
    "반팔": '<path class="b" d="M72 42 L48 50 L22 78 L40 98 L58 86 L58 168 L142 168 L142 86 L160 98 L178 78 L152 50 L128 42 Q100 64 72 42 Z"/><path class="l" d="M72 42 Q100 64 128 42 M58 86 L58 96 M142 86 L142 96"/>',
    "오버핏": '<path class="b" d="M68 40 L40 50 L16 86 L38 104 L54 92 L54 170 L146 170 L146 92 L162 104 L184 86 L160 50 L132 40 Q100 62 68 40 Z"/><path class="l" d="M68 40 Q100 62 132 40"/>',
    "긴팔": '<path class="b" d="M72 42 L48 50 L30 110 L28 152 L46 154 L58 104 L58 168 L142 168 L142 104 L154 154 L172 152 L170 110 L152 50 L128 42 Q100 64 72 42 Z"/><path class="l" d="M72 42 Q100 64 128 42 M28 144 L47 146 M172 144 L153 146"/>',
    "민소매": '<path class="b" d="M78 38 Q74 70 60 84 L60 168 L140 168 L140 84 Q126 70 122 38 L110 38 Q100 58 90 38 Z"/><path class="l" d="M90 38 Q100 58 110 38"/>',
    "토트백": '<path class="l w6" d="M74 86 Q74 42 100 42 Q126 42 126 86"/><path class="b" d="M46 84 L154 84 L146 170 L54 170 Z"/><path class="l" d="M50 100 L150 100"/>',
    "숄더백": '<path class="l w5" d="M64 88 Q100 16 136 88"/><path class="b" d="M50 98 Q50 84 64 84 L136 84 Q150 84 150 98 L144 158 Q142 168 130 168 L70 168 Q58 168 56 158 Z"/><path class="d" d="M50 98 Q50 84 64 84 L136 84 Q150 84 150 98 L150 118 Q100 132 50 118 Z"/><circle class="l" cx="100" cy="124" r="4"/>',
    "크로스백": '<path class="l w4" d="M66 110 Q100 -14 134 110"/><rect class="b" x="60" y="104" width="80" height="62" rx="10"/><path class="d" d="M60 114 Q60 104 70 104 L130 104 Q140 104 140 114 L140 132 Q100 146 60 132 Z"/>',
    "백팩": '<path class="l w5" d="M88 50 Q100 34 112 50"/><path class="b" d="M58 72 Q58 50 80 50 L120 50 Q142 50 142 72 L146 162 Q146 174 134 174 L66 174 Q54 174 54 162 Z"/><rect class="d" x="70" y="118" width="60" height="42" rx="8"/><path class="l" d="M72 76 L128 76"/>',
    "클러치": '<rect class="b" x="36" y="76" width="128" height="76" rx="8"/><path class="d" d="M36 84 Q36 76 44 76 L156 76 Q164 76 164 84 L100 124 Z"/><circle class="l" cx="100" cy="118" r="5"/>',
  };
  function art(p, colorName) {
    var fill = hex(colorName || (p.col || [])[0]);
    var shape = SHAPES[p.sub] || SHAPES[{ "의류": "아우터", "티셔츠": "반팔", "가방": "토트백" }[p.c]] ||
      '<circle class="l w6" cx="100" cy="112" r="34"/><circle class="b" cx="100" cy="76" r="12"/>';
    return '<div class="art"><svg viewBox="0 0 200 200" role="img" aria-label="' + escapeHtml((colorName || "") + " " + (p.sub || p.c)) + '">' +
      '<rect width="200" height="200" fill="#ecebe6"/><ellipse cx="100" cy="182" rx="62" ry="6" fill="#000" opacity="0.07"/>' +
      '<g stroke-linejoin="round" stroke-linecap="round">' +
      shape.replace(/class="b"/g, 'fill="' + fill + '" stroke="' + shade(fill, 0.35) + '" stroke-width="2"')
        .replace(/class="d"/g, 'fill="' + shade(fill, 0.12) + '" stroke="' + shade(fill, 0.35) + '" stroke-width="2"')
        .replace(/class="l w(\d)"/g, 'fill="none" stroke="' + shade(fill, 0.35) + '" stroke-width="$1"')
        .replace(/class="l"/g, 'fill="none" stroke="' + shade(fill, 0.35) + '" stroke-width="2"') +
      "</g></svg></div>";
  }
  function picture(p, colorName) {
    if (p.img) return '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.n) + '" loading="lazy" width="600" height="600" />';
    return art(p, colorName);
  }

  // ---------- 글자 채우기 ----------
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
      if (url === "#demo") {
        a.removeAttribute("target");
        a.addEventListener("click", function (e) { e.preventDefault(); toast("시안용 가상 링크입니다. 실제 주소를 받으면 연결됩니다."); });
      }
    });
  }

  // ---------- 첫 화면 종목 타일 ----------
  var TILE_LOOK = { "의류": ["아우터", "베이지"], "티셔츠": ["반팔", "스카이블루"], "가방": ["토트백", "카멜"] };
  function countIn(cat) { return products.filter(function (p) { return p.c === cat; }).length; }
  function renderTiles() {
    $("totalCount").textContent = products.length.toLocaleString("ko-KR");
    var ul = $("catTiles");
    categories.forEach(function (c) {
      var li = el("li");
      var b = el("button", "cat-tile");
      b.type = "button";
      var look = TILE_LOOK[c.name];
      var sample = products.filter(function (p) { return p.c === c.name && (look ? p.sub === look[0] : p.img); })[0];
      var pic = "";
      if (sample && sample.img) pic = '<img src="' + sample.img + '" alt="" loading="lazy" />';
      else if (sample) pic = art(sample, look[1]);
      b.innerHTML = pic + '<span class="label"><b>' + c.name + ' <small>' + c.en + "</small></b><span>" + countIn(c.name).toLocaleString("ko-KR") + "개</span></span>";
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
      b.innerHTML = (c.name || "전체") + "<small>" + (c.name ? countIn(c.name) : products.length).toLocaleString("ko-KR") + "</small>";
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
  function card(p) {
    var li = el("li");
    var b = el("button", "card");
    b.type = "button";
    var badge = p.tag ? '<span class="badge ' + (p.tag === "신상" ? "new" : p.tag === "베스트" ? "best" : "") + '">' + p.tag + "</span>" : "";
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
  function priceHtml(p, cls) {
    if (p.sp && p.sp < p.p) {
      var rate = Math.round((1 - p.sp / p.p) * 100);
      return '<p class="' + (cls || "price") + '"><span class="rate">' + rate + "%</span>" + won(p.sp) + "<s>" + won(p.p) + "</s></p>";
    }
    return '<p class="' + (cls || "price") + '">' + won(p.p) + "</p>";
  }

  var current = [];
  function refresh(keepScroll) {
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
    var grid = $("grid");
    var frag = document.createDocumentFragment();
    current.slice(state.shown, state.shown + PAGE).forEach(function (p) { frag.appendChild(card(p)); });
    grid.appendChild(frag);
    state.shown += PAGE;
    var shown = Math.min(state.shown, current.length);
    $("progress").textContent = shown.toLocaleString("ko-KR") + " / " + current.length.toLocaleString("ko-KR");
    $("more").hidden = shown >= current.length;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
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

  // ---------- 상품 상세 · 주문서 ----------
  var order = { p: null, color: "", size: "", qty: 1 };
  function openProduct(id) {
    var p = byId[id];
    if (!p) return;
    // 필터로 고른 색이 있으면 그 색을 먼저 골라 둡니다
    var picked = (p.col || []).filter(function (c) { return state.colors.indexOf(c) >= 0; })[0];
    order = { p: p, color: picked || (p.col || [])[0] || "", size: (p.sz || []).length === 1 ? p.sz[0] : "", qty: 1 };
    $("pCrumb").textContent = p.c + (p.sub ? " › " + p.sub : "");
    $("pId").textContent = "상품코드 " + p.id;
    $("pName").textContent = p.n;
    $("pPrice").outerHTML = priceHtml(p, "price p-price").replace("<p ", '<p id="pPrice" ');
    $("pDesc").textContent = p.d || "";

    // 색상
    var pc = $("pColors");
    pc.innerHTML = "";
    $("pColorRow").hidden = !(p.col || []).length;
    (p.col || []).forEach(function (c) {
      var b = el("button", "swatch");
      b.type = "button";
      b.innerHTML = '<i style="background:' + hex(c) + '"></i>' + escapeHtml(c);
      b.addEventListener("click", function () { order.color = c; drawProduct(); });
      b.dataset.value = c;
      pc.appendChild(b);
    });
    // 사이즈
    var ps = $("pSizes");
    ps.innerHTML = "";
    $("pSizeRow").hidden = !(p.sz || []).length;
    (p.sz || []).forEach(function (s) {
      var b = el("button", "chip", s);
      b.type = "button";
      b.dataset.value = s;
      b.disabled = p.st === "품절";
      b.addEventListener("click", function () { order.size = s; drawProduct(); });
      ps.appendChild(b);
    });
    // 실측
    var cat = catOf(p.c);
    var box = $("pMeasure");
    box.innerHTML = "";
    if (p.ms && cat && cat.measure.length) {
      var t = "<table><caption>실측 사이즈 (cm)</caption><thead><tr><th>사이즈</th>" +
        cat.measure.map(function (m) { return "<th>" + m + "</th>"; }).join("") + "</tr></thead><tbody>";
      Object.keys(p.ms).sort(function (a, b) { return sizeRank(a) - sizeRank(b); }).forEach(function (s) {
        t += '<tr data-size="' + escapeHtml(s) + '"><th>' + escapeHtml(s) + "</th>" + p.ms[s].map(function (v) { return "<td>" + (v == null ? "-" : v) + "</td>"; }).join("") + "</tr>";
      });
      box.innerHTML = t + "</tbody></table>";
    }
    // 소재 · 배송
    var spec = $("pSpec");
    spec.innerHTML = "";
    [["소재", p.m], ["배송", config.shipping]].forEach(function (r) {
      if (!r[1]) return;
      var d = el("div");
      d.appendChild(el("dt", "", r[0]));
      d.appendChild(el("dd", "", r[1]));
      spec.appendChild(d);
    });
    $("checkout").hidden = true;
    $("payGuide").hidden = true;
    drawProduct();
    var sheet = $("productSheet");
    if (!sheet.open) sheet.showModal();
    sheet.querySelector(".sheet-body").scrollTop = 0;
    syncUrl();
  }
  function drawProduct() {
    var p = order.p;
    // 사진 (사진이 없으면 고른 색으로 그림을 다시 그립니다)
    var pics = p.img ? [p.img].concat(p.imgs || []) : [];
    var main = $("pPic");
    if (!pics.length) main.innerHTML = art(p, order.color);
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
    Array.prototype.forEach.call($("pColors").children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === order.color)); });
    Array.prototype.forEach.call($("pSizes").children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === order.size)); });
    $("pColorName").textContent = order.color;
    Array.prototype.forEach.call(document.querySelectorAll("#pMeasure tr[data-size]"), function (tr) { tr.classList.toggle("on", tr.dataset.size === order.size); });
    $("qty").textContent = order.qty;
    $("pTotal").textContent = won(pay(p) * order.qty);
    var sold = p.st === "품절";
    $("consultBtn").textContent = sold ? "카톡으로 재입고 문의" : "카톡으로 상담하기";
    $("orderBtn").disabled = sold;
    $("orderBtn").textContent = sold ? "품절" : "바로 주문하기";
    $("orderNote").textContent = sold ? "품절된 상품입니다. 카톡으로 재입고 알림을 요청해 주세요." : "회원가입 없이 주문할 수 있어요. 궁금한 점은 먼저 카톡으로 물어보세요.";
    $("orderMessage").textContent = message();
  }

  // ---------- 메시지 (상담 · 주문) ----------
  function optionLines() {
    var p = order.p;
    var lines = ["상품: " + p.n + " (" + p.id + ")"];
    if (order.color) lines.push("색상: " + order.color);
    if (order.size) lines.push("사이즈: " + order.size);
    lines.push("수량: " + order.qty + "개", "금액: " + won(pay(p) * order.qty));
    return lines;
  }
  function youtubeLine() {
    return fromYoutube && config.youtube && config.youtube.tag ? ["(" + config.youtube.tag + ")"] : [];
  }
  function consultMessage() {
    var p = order.p;
    var head = p.st === "품절" ? "[재입고 문의]" : "[상담 요청]";
    return [head].concat(youtubeLine(), optionLines(), ["", "궁금한 점: "]).join("\n");
  }
  function payMethod() {
    var r = document.querySelector('input[name="payMethod"]:checked');
    return r && r.value === "card" ? "카드·간편결제" : "무통장 입금";
  }
  function message() {
    var memo = $("oMemo").value.trim();
    return ["[" + config.storeName + " 주문]"].concat(youtubeLine(), optionLines(), [
      "",
      "받는 분: " + $("oName").value.trim(),
      "연락처: " + $("oPhone").value.trim(),
      "주소: " + $("oAddr").value.trim(),
    ], memo ? ["요청 사항: " + memo] : [], ["결제 방법: " + payMethod()]).join("\n");
  }

  // ---------- 보내기 (카톡 · 문자) ----------
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () {});
    return Promise.resolve();
  }
  // 메시지를 복사하고 카톡 채널(또는 문자)을 엽니다. 시안(#demo)에서는 안내만 띄웁니다.
  function openChannel(key, text, done) {
    var url = key === "sms" ? "sms:" + (config.phone || "") + "?&body=" + encodeURIComponent(text) : (config.links || {})[key];
    copy(text).then(function () {
      if (done) done();
      if (!url || url === "#demo" || (key === "sms" && config.previewMode)) {
        toast("메시지를 복사했습니다. (시안이라 실제 대화창은 열리지 않습니다)");
        return;
      }
      toast("메시지를 복사했습니다. 대화창에 붙여넣기 해 주세요.");
      if (key === "sms") window.location.href = url;
      else window.open(url, "_blank", "noopener");
    });
  }
  function needSize() {
    var p = order.p;
    if ((p.sz || []).length > 1 && !order.size) { toast("사이즈를 먼저 골라 주세요."); return true; }
    return false;
  }
  function consult() {
    openChannel("kakao", consultMessage());
  }
  function startOrder() {
    if (needSize()) return;
    var box = $("checkout");
    box.hidden = false;
    $("payGuide").hidden = true;
    renderChannels();
    $("orderMessage").textContent = message();
    box.scrollIntoView({ block: "start", behavior: "smooth" });
    setTimeout(function () { $("oName").focus({ preventScroll: true }); }, 300);
  }
  var ORDER_CHANNELS = [
    { key: "kakao", label: "카카오톡으로 주문 보내기", cls: "ch-kakao" },
    { key: "sms", label: "문자로 보내기", cls: "ch-sms" },
  ];
  function renderChannels() {
    var box = $("orderChannels");
    box.innerHTML = "";
    ORDER_CHANNELS.forEach(function (ch) {
      var b = el("button", ch.cls, ch.label);
      b.type = "button";
      b.addEventListener("click", function () { sendOrder(ch.key); });
      box.appendChild(b);
    });
  }
  function sendOrder(key) {
    if (needSize()) return;
    var missing = [["oName", "성함"], ["oPhone", "연락처"], ["oAddr", "주소"]].filter(function (f) { return !$(f[0]).value.trim(); });
    if (missing.length) {
      toast("적어 주세요: " + missing.map(function (f) { return f[1]; }).join(", "));
      $(missing[0][0]).focus();
      return;
    }
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test($("oPhone").value.trim())) {
      toast("연락처를 010-0000-0000 모양으로 적어 주세요.");
      $("oPhone").focus();
      return;
    }
    openChannel(key, message(), showPayGuide);
  }
  // 주문서를 보낸 뒤: 입금 계좌 또는 결제 링크 안내
  function showPayGuide() {
    var g = $("payGuide");
    var total = won(pay(order.p) * order.qty);
    var payCfg = config.pay || {};
    g.innerHTML = "";
    g.appendChild(el("h3", "", "주문서를 보냈어요"));
    if (payMethod() === "카드·간편결제" && payCfg.payLink) {
      g.appendChild(el("p", "", "아래 버튼을 눌러 " + total + "을 결제해 주세요. 결제가 확인되면 1~3일 안에 보내 드립니다."));
      var a = el("a", "btn btn-dark pay-link", "카드·간편결제로 " + total + " 결제하기");
      a.href = payCfg.payLink;
      a.target = "_blank";
      a.rel = "noopener";
      if (payCfg.payLink === "#demo") {
        a.removeAttribute("target");
        a.addEventListener("click", function (e) { e.preventDefault(); toast("시안용 가상 결제 링크입니다. 실제로는 토스·카카오페이 결제 창이 열립니다."); });
      }
      g.appendChild(a);
    } else {
      var bank = payCfg.bank || {};
      g.appendChild(el("p", "", "아래 계좌로 입금해 주세요. 입금이 확인되면 1~3일 안에 보내 드립니다."));
      var dl = el("dl", "bank");
      [["입금할 금액", total], ["은행", bank.name], ["계좌번호", bank.account], ["예금주", bank.holder]].forEach(function (r) {
        if (!r[1]) return;
        var d = el("div");
        d.appendChild(el("dt", "", r[0]));
        d.appendChild(el("dd", "", r[1]));
        dl.appendChild(d);
      });
      g.appendChild(dl);
      var c = el("button", "btn btn-line", "계좌번호 복사");
      c.type = "button";
      c.addEventListener("click", function () { copy(bank.account || "").then(function () { toast("계좌번호를 복사했습니다."); }); });
      g.appendChild(c);
    }
    g.appendChild(el("p", "fine", "카톡 대화창에 주문 내용을 붙여넣어 보내 주셔야 주문이 접수됩니다."));
    g.hidden = false;
    g.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  // ---------- 주소(URL)에 지금 보는 화면 기억 ----------
  function syncUrl() {
    var ps = new URLSearchParams();
    if (state.cat) ps.set("cat", state.cat);
    if (state.sub) ps.set("sub", state.sub);
    if (state.q) ps.set("q", state.q);
    if ($("productSheet").open && order.p) ps.set("id", order.p.id);
    var qs = ps.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }
  function readUrl() {
    var ps = new URLSearchParams(location.search);
    // 유튜브에서 온 손님은 다른 화면으로 옮겨도 기억합니다
    try {
      if (ps.get("from") === "youtube") sessionStorage.setItem("shop-from", "youtube");
      fromYoutube = sessionStorage.getItem("shop-from") === "youtube";
    } catch (e) {
      fromYoutube = ps.get("from") === "youtube";
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
    [["결제", config.payment], ["배송", config.shipping], ["상담 시간", config.contactHours], ["전화", config.previewMode ? "" : config.phone]].forEach(function (r) {
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
    $("consultBtn").addEventListener("click", consult);
    $("orderBtn").addEventListener("click", startOrder);
    ["oName", "oPhone", "oAddr", "oMemo"].forEach(function (id) {
      $(id).addEventListener("input", function () { $("orderMessage").textContent = message(); });
    });
    document.querySelectorAll('input[name="payMethod"]').forEach(function (r) {
      r.addEventListener("change", function () { $("orderMessage").textContent = message(); });
    });
    if (!(config.pay || {}).payLink) $("payCardOpt").hidden = true;
    $("qtyDown").addEventListener("click", function () { if (order.qty > 1) { order.qty--; drawProduct(); } });
    $("qtyUp").addEventListener("click", function () { if (order.qty < 99) { order.qty++; drawProduct(); } });
    $("productSheet").addEventListener("close", function () {
      $("pThumbs").innerHTML = "";
      $("pPic").innerHTML = "";
      syncUrl();
    });
    // 바깥 어두운 곳을 누르면 닫기
    ["productSheet", "filterSheet"].forEach(function (id) {
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

    if (config.previewMode) document.body.insertBefore(el("p", "preview-badge", "미리보기 · 결제 전 시안입니다 · 상품 4,000개는 가상 상품"), document.body.firstChild);

    // 종목 탭이 머리글 바로 밑에 붙도록 머리글 높이를 알려 줍니다
    function headerHeight() {
      document.documentElement.style.setProperty("--header-h", document.querySelector(".site-header").offsetHeight + "px");
    }
    headerHeight();
    window.addEventListener("resize", headerHeight);
  });
})();
