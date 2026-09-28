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
    "반팔": '<path class="b" d="M72 42 L48 50 L22 78 L40 98 L58 86 L58 168 L142 168 L142 86 L160 98 L178 78 L152 50 L128 42 Q100 64 72 42 Z"/><path class="l" d="M72 42 Q100 64 128 42 M58 86 L58 96 M142 86 L142 96"/>',
    "오버핏": '<path class="b" d="M68 40 L40 50 L16 86 L38 104 L54 92 L54 170 L146 170 L146 92 L162 104 L184 86 L160 50 L132 40 Q100 62 68 40 Z"/><path class="l" d="M68 40 Q100 62 132 40"/>',
    "긴팔": '<path class="b" d="M72 42 L48 50 L30 110 L28 152 L46 154 L58 104 L58 168 L142 168 L142 104 L154 154 L172 152 L170 110 L152 50 L128 42 Q100 64 72 42 Z"/><path class="l" d="M72 42 Q100 64 128 42 M28 144 L47 146 M172 144 L153 146"/>',
    "민소매": '<path class="b" d="M78 38 Q74 70 60 84 L60 168 L140 168 L140 84 Q126 70 122 38 L110 38 Q100 58 90 38 Z"/><path class="l" d="M90 38 Q100 58 110 38"/>',
    "볼캡": '<path class="b" d="M52 118 Q50 62 100 60 Q150 62 150 118 Z"/><path class="d" d="M52 118 Q100 110 150 118 L180 132 Q152 148 110 140 Q70 134 52 118 Z"/><path class="l" d="M100 60 Q96 90 100 118 M74 68 Q70 92 72 116"/><circle class="d" cx="100" cy="60" r="4"/>',
    "스냅백": '<path class="b" d="M50 122 Q48 56 100 54 Q152 56 150 122 Z"/><path class="d" d="M42 122 L158 122 L164 136 L36 136 Z"/><path class="l" d="M100 54 L100 122 M76 60 L72 122 M124 60 L128 122"/>',
    "버킷햇": '<path class="d" d="M30 120 Q100 96 170 120 Q156 146 100 146 Q44 146 30 120 Z"/><path class="b" d="M64 116 L72 62 Q100 52 128 62 L136 116 Q100 126 64 116 Z"/><path class="l" d="M68 100 Q100 110 132 100"/>',
    "비니": '<path class="b" d="M56 128 Q56 50 100 48 Q144 50 144 128 Z"/><rect class="d" x="50" y="116" width="100" height="34" rx="8"/><path class="l" d="M66 120 L66 146 M82 120 L82 146 M100 120 L100 146 M118 120 L118 146 M134 120 L134 146"/>',
    "토트백": '<path class="l w6" d="M74 86 Q74 42 100 42 Q126 42 126 86"/><path class="b" d="M46 84 L154 84 L146 170 L54 170 Z"/><path class="l" d="M50 100 L150 100"/>',
    "숄더백": '<path class="l w5" d="M64 88 Q100 16 136 88"/><path class="b" d="M50 98 Q50 84 64 84 L136 84 Q150 84 150 98 L144 158 Q142 168 130 168 L70 168 Q58 168 56 158 Z"/><path class="d" d="M50 98 Q50 84 64 84 L136 84 Q150 84 150 98 L150 118 Q100 132 50 118 Z"/><circle class="l" cx="100" cy="124" r="4"/>',
    "크로스백": '<path class="l w4" d="M66 110 Q100 -14 134 110"/><rect class="b" x="60" y="104" width="80" height="62" rx="10"/><path class="d" d="M60 114 Q60 104 70 104 L130 104 Q140 104 140 114 L140 132 Q100 146 60 132 Z"/>',
    "백팩": '<path class="l w5" d="M88 50 Q100 34 112 50"/><path class="b" d="M58 72 Q58 50 80 50 L120 50 Q142 50 142 72 L146 162 Q146 174 134 174 L66 174 Q54 174 54 162 Z"/><rect class="d" x="70" y="118" width="60" height="42" rx="8"/><path class="l" d="M72 76 L128 76"/>',
    "클러치": '<rect class="b" x="36" y="76" width="128" height="76" rx="8"/><path class="d" d="M36 84 Q36 76 44 76 L156 76 Q164 76 164 84 L100 124 Z"/><circle class="l" cx="100" cy="118" r="5"/>',
  };
  function art(p, colorName) {
    var fill = hex(colorName || (p.col || [])[0]);
    var shape = SHAPES[p.sub] || SHAPES[{ "모자": "볼캡", "티셔츠": "반팔", "가방": "토트백" }[p.c]] ||
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
  var TILE_LOOK = { "모자": ["볼캡", "네이비"], "티셔츠": ["반팔", "스카이블루"], "가방": ["토트백", "카멜"] };
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
    $("orderMessage").textContent = message();
    var sold = p.st === "품절";
    $("orderHow").textContent = sold ? "품절된 상품입니다. DM으로 재입고 알림을 요청해 주세요." : "아래 방법 중 하나를 누르면 주문 내용이 복사되고 대화창이 열립니다.";
    renderChannels(sold);
  }
  function message() {
    var p = order.p;
    var lines = ["[" + config.storeName + " 주문]", "상품: " + p.n + " (" + p.id + ")"];
    if (order.color) lines.push("색상: " + order.color);
    if (order.size) lines.push("사이즈: " + order.size);
    lines.push("수량: " + order.qty + "개", "금액: " + won(pay(p) * order.qty));
    lines.push("", "받는 분 성함 / 연락처 / 주소:");
    return lines.join("\n");
  }
  var CHANNELS = [
    { key: "dm", label: "인스타 DM", cls: "ch-dm" },
    { key: "kakao", label: "카카오톡", cls: "ch-kakao" },
    { key: "sms", label: "문자", cls: "ch-sms" },
  ];
  function renderChannels(sold) {
    var box = $("orderChannels");
    box.innerHTML = "";
    CHANNELS.forEach(function (ch) {
      var b = el("button", ch.cls, sold && ch.key !== "dm" ? ch.label : sold ? "재입고 알림 요청" : ch.label + "로 주문");
      b.type = "button";
      if (sold && ch.key !== "dm") b.disabled = true;
      b.addEventListener("click", function () { send(ch.key, sold); });
      box.appendChild(b);
    });
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).catch(function () {});
    return Promise.resolve();
  }
  function send(key, sold) {
    var p = order.p;
    if (!sold && (p.sz || []).length > 1 && !order.size) { toast("사이즈를 골라 주세요."); return; }
    var text = sold ? "[재입고 알림 요청]\n" + p.n + " (" + p.id + ")" + (order.color ? "\n색상: " + order.color : "") : message();
    var url = key === "sms" ? "sms:" + (config.phone || "") + "?&body=" + encodeURIComponent(text) : (config.links || {})[key];
    copy(text).then(function () {
      if (!url || url === "#demo" || (key === "sms" && config.previewMode)) {
        toast("주문 내용을 복사했습니다. (시안이라 실제 대화창은 열리지 않습니다)");
        return;
      }
      toast("주문 내용을 복사했습니다. 대화창에 붙여넣기 해 주세요.");
      window.location.href = url;
    });
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

    if (config.previewMode) document.body.insertBefore(el("p", "preview-badge", "미리보기 · 결제 전 시안입니다 · 상품 4,000개는 가상 상품"), document.body.firstChild);

    // 종목 탭이 머리글 바로 밑에 붙도록 머리글 높이를 알려 줍니다
    function headerHeight() {
      document.documentElement.style.setProperty("--header-h", document.querySelector(".site-header").offsetHeight + "px");
    }
    headerHeight();
    window.addEventListener("resize", headerHeight);
  });
})();
