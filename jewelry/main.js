/* ============================================================
   쥬얼리 매장 홈페이지 시안 - 동작
   - config.js 의 내용을 화면에 채웁니다.
   - 사진이 아직 없는 상품은 예시 그림(SVG)을 그려 줍니다.
   ============================================================ */
(function () {
  "use strict";

  var config = window.JEWELRY_CONFIG || {};
  var links = config.links || {};
  var svgCount = 0;

  // "hero.headline" 같은 이름으로 설정값 찾기
  function pick(path) {
    return path.split(".").reduce(function (obj, key) {
      return obj == null ? undefined : obj[key];
    }, config);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // ---------- 시안용 가상 링크 ("#demo") ----------
  var toastTimer;
  function showToast(message) {
    var toast = document.querySelector(".toast") || el("div", "toast");
    // 주문서가 열려 있으면 주문서 위에 보이도록 그 안에 띄웁니다
    var host = document.querySelector("dialog[open]") || document.body;
    if (toast.parentNode !== host) host.appendChild(toast);
    toast.setAttribute("role", "status");
    toast.textContent = message;
    toast.classList.add("shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("shown"); }, 2200);
  }

  // 링크 주소 넣기 - "#demo" 이면 누를 때 안내만 띄웁니다
  function setLink(node, url) {
    if (url === "#demo") {
      node.href = "#";
      node.removeAttribute("target");
      node.addEventListener("click", function (e) {
        e.preventDefault();
        showToast("시안용 가상 링크입니다. 실제 주소를 받으면 연결됩니다.");
      });
    } else {
      node.href = url;
    }
  }

  // ---------- 예시 쥬얼리 그림 ----------
  var METALS = {
    gold: ["#fbeab8", "#d4b06a", "#86652a"],
    rose: ["#fbdccf", "#d99a86", "#94584a"],
    silver: ["#ffffff", "#c9ced6", "#767d88"],
  };

  function gemShape(cx, cy, size, color) {
    var s = size;
    return (
      '<polygon points="' + [cx - s, cy - s * 0.35, cx - s * 0.5, cy - s, cx + s * 0.5, cy - s, cx + s, cy - s * 0.35, cx, cy + s].join(" ") +
      '" fill="' + color + '" stroke="rgba(255,255,255,.7)" stroke-width="1.2"/>' +
      '<polygon points="' + [cx - s * 0.5, cy - s, cx, cy - s * 0.35, cx - s, cy - s * 0.35].join(" ") + '" fill="rgba(255,255,255,.55)"/>' +
      '<polygon points="' + [cx, cy - s * 0.35, cx + s, cy - s * 0.35, cx, cy + s].join(" ") + '" fill="rgba(0,0,0,.18)"/>'
    );
  }

  function jewelrySvg(category, metalName, gem) {
    var m = METALS[metalName] || METALS.gold;
    var id = "metal" + svgCount++;
    var defs =
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + m[0] + '"/><stop offset=".5" stop-color="' + m[1] + '"/>' +
      '<stop offset="1" stop-color="' + m[2] + '"/></linearGradient></defs>';
    var metal = "url(#" + id + ")";
    var body;

    if (category === "목걸이") {
      body =
        '<path d="M28 20 Q100 170 172 20" fill="none" stroke="' + metal + '" stroke-width="4" stroke-dasharray="7 3" stroke-linecap="round"/>' +
        '<circle cx="100" cy="112" r="5" fill="none" stroke="' + metal + '" stroke-width="3"/>' +
        gemShape(100, 138, 20, gem);
    } else if (category === "귀걸이") {
      body = [68, 132]
        .map(function (x) {
          return (
            '<path d="M' + x + ' 40 a10 10 0 1 1 0 20" fill="none" stroke="' + metal + '" stroke-width="4" stroke-linecap="round"/>' +
            '<line x1="' + x + '" y1="60" x2="' + x + '" y2="92" stroke="' + metal + '" stroke-width="4"/>' +
            '<circle cx="' + x + '" cy="118" r="22" fill="' + gem + '" stroke="' + metal + '" stroke-width="4"/>' +
            '<ellipse cx="' + (x - 7) + '" cy="110" rx="7" ry="5" fill="rgba(255,255,255,.6)"/>'
          );
        })
        .join("");
    } else if (category === "팔찌") {
      var dots = "";
      for (var i = 0; i < 9; i++) {
        var a = Math.PI * (0.08 + (i / 8) * 0.84);
        dots += '<circle cx="' + (100 - Math.cos(a) * 74).toFixed(1) + '" cy="' + (100 + Math.sin(a) * 34).toFixed(1) +
          '" r="6.5" fill="' + gem + '" stroke="rgba(255,255,255,.8)" stroke-width="1.2"/>';
      }
      body = '<ellipse cx="100" cy="100" rx="74" ry="34" fill="none" stroke="' + metal + '" stroke-width="14"/>' + dots;
    } else {
      // 반지
      body =
        '<ellipse cx="100" cy="122" rx="54" ry="54" fill="none" stroke="' + metal + '" stroke-width="13"/>' +
        '<path d="M86 70 L92 52 M114 70 L108 52" stroke="' + metal + '" stroke-width="5" stroke-linecap="round"/>' +
        gemShape(100, 52, 24, gem);
    }
    return '<svg viewBox="0 0 200 200" role="img" aria-label="' + category + ' 예시 그림">' + defs + body + "</svg>";
  }

  // ---------- 글자 채우기 ----------
  function fillText() {
    document.querySelectorAll("[data-bind]").forEach(function (node) {
      var value = pick(node.getAttribute("data-bind"));
      if (value) node.textContent = value;
    });
    document.title = (config.previewMode ? "[미리보기] " : "") + config.storeName + " | " + (config.tagline || "");
  }

  // 주소가 있는 버튼만 보여 주기
  function fillLinks() {
    document.querySelectorAll("[data-link]").forEach(function (node) {
      var url = links[node.getAttribute("data-link")];
      if (url) setLink(node, url);
      else node.hidden = true;
    });
    var bar = document.querySelector(".bottom-bar");
    if (!links.kakao && bar) {
      // 카카오 채널이 없으면 전화 버튼으로 대신합니다
      var kakao = bar.querySelector(".bar-kakao");
      if (config.phone) {
        kakao.hidden = false;
        kakao.textContent = "전화 문의";
        kakao.href = "tel:" + config.phone.replace(/[^0-9+]/g, "");
        kakao.removeAttribute("target");
      } else {
        bar.classList.add("one");
      }
    }
  }

  function renderPoints() {
    var list = document.getElementById("points");
    ((config.story || {}).points || []).forEach(function (p) {
      var li = el("li");
      li.appendChild(el("b", null, p.title));
      li.appendChild(el("span", null, p.desc));
      list.appendChild(li);
    });
  }

  // ---------- 컬렉션 ----------
  // 상품 카드 한 장 만들기 (컬렉션·루미에르 공용)
  function makeCard(p) {
      var li = el("li", "card");
      li.dataset.category = p.category;
      var a = el("button", "card-btn");
      a.type = "button";
      a.dataset.order = p.id || "";
      a.setAttribute("aria-label", p.name + " 주문하기");

      var thumb = el("span", "thumb");
      if (p.image) {
        var img = el("img");
        img.src = p.image;
        img.alt = p.name;
        img.loading = "lazy";
        img.width = 800;
        img.height = 800;
        thumb.appendChild(img);
        if (p.virtual) thumb.appendChild(el("span", "sample", "가상 이미지"));
      } else {
        thumb.innerHTML = jewelrySvg(p.category, p.metal, p.gem || "#f4f7ff");
        thumb.appendChild(el("span", "sample", "예시 이미지"));
      }

      var body = el("span", "card-body");
      body.appendChild(el("span", "card-cat", p.category));
      body.appendChild(el("span", "card-name", p.name));
      if (p.price) body.appendChild(el("span", "card-price", p.price));
      body.appendChild(el("span", "card-cta", "주문하기 →"));
      a.appendChild(thumb);
      a.appendChild(body);
      li.appendChild(a);
      return li;
  }

  function renderCollection() {
    var grid = document.getElementById("grid");
    var filters = document.getElementById("filters");
    (config.products || []).forEach(function (p) {
      addToCatalog(p, p.category);
      grid.appendChild(makeCard(p));
    });

    ["전체"].concat(config.categories || []).forEach(function (name, i) {
      var btn = el("button", null, name);
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
      btn.addEventListener("click", function () {
        filters.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        grid.querySelectorAll(".card").forEach(function (card) {
          card.hidden = name !== "전체" && card.dataset.category !== name;
        });
      });
      filters.appendChild(btn);
    });
  }

  // ---------- 루미에르 컬렉션 + 세트 가격 ----------
  function won(n) {
    return n.toLocaleString("ko-KR") + "원";
  }

  function renderLumiere() {
    var info = config.lumiere;
    var section = document.getElementById("lumiere");
    if (!info || !(info.items || []).length) {
      section.hidden = true;
      return;
    }
    var grid = document.getElementById("lumiereGrid");
    var total = 0;
    info.items.forEach(function (p) {
      addToCatalog(p, info.title);
      grid.appendChild(makeCard(p));
      total += Number(String(p.price || "0").replace(/[^0-9]/g, ""));
    });
    var rate = Number(info.setDiscount) || 0;
    if (!rate || !total) return;
    var setPrice = Math.round((total * (100 - rate)) / 100 / 100) * 100;
    var box = document.getElementById("setBox");
    box.appendChild(el("span", "set-label", info.items.length + "종 세트로 구매하면"));
    var row = el("div", "set-row");
    row.appendChild(el("s", "set-before", won(total)));
    row.appendChild(el("strong", "set-price", won(setPrice)));
    row.appendChild(el("span", "set-rate", rate + "% 할인"));
    box.appendChild(row);
    box.appendChild(el("span", "set-note", won(total - setPrice) + " 아껴요 · 선물 포장 무료"));
    var setItem = {
      id: "lumiere-set",
      name: (info.title || "").replace(/\s*컬렉션$/, "") + " " + info.items.length + "종 세트",
      category: "세트",
      price: won(setPrice),
      image: info.items[0].image,
    };
    catalog.unshift({ group: info.title, item: setItem });
    var buy = el("button", "btn btn-gold set-buy", setItem.name + " 주문하기");
    buy.type = "button";
    buy.dataset.order = setItem.id;
    box.appendChild(buy);
  }

  // ---------- 유튜브 ----------
  function renderVideo() {
    var box = document.getElementById("videoBox");
    var yt = config.youtube || {};
    var id = yt.videoId;
    if (!id && yt.video) {
      var video = el("video");
      video.src = yt.video;
      if (yt.poster) video.poster = yt.poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", "매장 광고 영상");
      box.appendChild(video);
    } else if (id) {
      var frame = el("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
      frame.title = "매장 소개 영상";
      frame.loading = "lazy";
      frame.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      box.appendChild(frame);
    } else {
      var empty = el("div", "video-empty");
      empty.appendChild(el("div", "play"));
      empty.appendChild(el("span", null, "유튜브 영상이 들어갈 자리입니다"));
      box.appendChild(empty);
    }
  }

  function renderGift() {
    var list = document.getElementById("giftTags");
    ((config.gift || {}).items || []).forEach(function (t) {
      list.appendChild(el("li", null, t));
    });
  }

  // ---------- 홈페이지 안내 / 매장 안내 중 하나 보여 주기 ----------
  function renderSiteInfo() {
    var info = config.siteInfo || {};
    if (!info.show) return;
    document.getElementById("site-info").hidden = false;
    document.getElementById("visit").hidden = true;
    var nav = document.querySelector('[data-nav="info"]');
    if (nav) {
      nav.href = "#site-info";
      nav.textContent = "홈페이지 안내";
    }
    var list = document.getElementById("features");
    (info.features || []).forEach(function (f) {
      var li = el("li");
      li.appendChild(el("b", null, f.title));
      li.appendChild(el("span", null, f.desc));
      list.appendChild(li);
    });
  }

  // ---------- 매장 안내 ----------
  function renderInfo() {
    var dl = document.getElementById("info");
    [
      ["전화", config.phone],
      ["주소", config.address],
      ["영업시간", config.hours],
    ].forEach(function (row) {
      if (!row[1] && !config.previewMode) return;
      dl.appendChild(el("dt", null, row[0]));
      var dd = el("dd", row[1] ? null : "todo", row[1] || "매장 정보를 받으면 채워집니다");
      dl.appendChild(dd);
    });

    var box = document.getElementById("channels");
    [
      ["smartstore", "스마트스토어"],
      ["kakao", "카카오톡 채널"],
      ["dm", "인스타그램 DM"],
      ["naverPlace", "네이버플레이스"],
      ["instagram", "인스타그램"],
      ["youtube", "유튜브"],
    ].forEach(function (item) {
      if (!links[item[0]]) return;
      var a = el("a", "btn btn-line", item[1]);
      a.target = "_blank";
      a.rel = "noopener";
      setLink(a, links[item[0]]);
      box.appendChild(a);
    });

    if (config.previewMode) {
      box.parentNode.appendChild(el("p", "demo-note", "※ 전화번호·주소·영업시간·가격은 시안용 가상 정보입니다."));
    }
    if (config.previewMode && (config.siteInfo || {}).show) {
      document.getElementById("site-info").appendChild(el("p", "demo-note", "※ 위 컬렉션의 상품·가격과 채널 링크는 시안용 가상 정보입니다."));
    }
  }

  // ---------- 주문서 (홈페이지·DM으로 바로 주문) ----------
  var catalog = []; // { group, item }
  var orderCfg = config.order || {};
  var fromYoutube = false;
  var CHANNELS = {
    dm: { label: "인스타그램 DM으로 주문", cls: "ch-dm", app: "인스타그램 DM" },
    kakao: { label: "카카오톡으로 주문", cls: "ch-kakao", app: "카카오톡" },
    sms: { label: "문자로 주문", cls: "ch-sms", app: "문자" },
  };

  function addToCatalog(p, group) {
    if (p.id) catalog.push({ group: group, item: p });
  }

  function findItem(id) {
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].item.id === id) return catalog[i].item;
    }
    return null;
  }

  function priceNumber(p) {
    return Number(String(p.price || "").replace(/[^0-9]/g, ""));
  }

  var sheet, qty = 1;

  function currentItem() {
    return findItem(document.getElementById("orderProduct").value) || catalog[0].item;
  }

  function needsSize(item) {
    return item.category === "반지" || item.category === "세트";
  }

  function buildMessage() {
    var item = currentItem();
    var unit = priceNumber(item);
    var name = document.getElementById("orderName").value.trim();
    var memo = document.getElementById("orderMemo").value.trim();
    var lines = [
      "안녕하세요, " + (fromYoutube ? "유튜브 영상" : "홈페이지") + " 보고 주문합니다.",
      "[주문서 · " + config.storeName + "]",
      "· 제품: " + item.name,
      "· 수량: " + qty + "개",
    ];
    if (needsSize(item)) lines.push("· 반지 사이즈: " + document.getElementById("orderSize").value);
    lines.push("· 선물 포장: " + (document.getElementById("orderGift").checked ? "원해요" : "필요 없어요"));
    lines.push("· 금액: " + (unit ? won(unit * qty) : "상담 후 안내"));
    if (name) lines.push("· 주문자: " + name);
    if (memo) lines.push("· 요청 사항: " + memo);
    return lines.join("\n");
  }

  function updateOrder() {
    var item = currentItem();
    var unit = priceNumber(item);
    var img = document.getElementById("orderImg");
    img.hidden = !item.image;
    if (item.image) img.src = item.image;
    document.getElementById("orderPrice").textContent = item.price || "가격은 상담 후 안내";
    document.getElementById("orderQty").textContent = qty;
    document.getElementById("qtyDown").disabled = qty <= 1;
    document.getElementById("qtyUp").disabled = qty >= 9;
    document.getElementById("sizeRow").hidden = !needsSize(item);
    document.getElementById("orderTotal").textContent = unit ? won(unit * qty) : "상담 후 안내";
    document.getElementById("orderMessage").textContent = buildMessage();
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return copyFallback(text); }
      );
    }
    return Promise.resolve(copyFallback(text));
  }

  function copyFallback(text) {
    var area = el("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    sheet.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }

  function sendOrder(key) {
    var ch = CHANNELS[key];
    var msg = buildMessage();
    var url;
    if (key === "sms") {
      url = config.phone && !config.previewMode
        ? "sms:" + config.phone.replace(/[^0-9+]/g, "") + "?&body=" + encodeURIComponent(msg)
        : "#demo";
    } else {
      url = links[key];
    }

    if (url === "#demo") {
      copyText(msg);
      showToast("시안용: 실제로는 주문 내용이 담긴 " + ch.app + " 창이 열립니다.");
      return;
    }
    if (key === "sms") {
      window.location.href = url;
      return;
    }
    // DM·카카오톡은 글을 미리 채울 수 없어서, 복사해 두고 대화창을 엽니다
    window.open(url, "_blank", "noopener");
    copyText(msg).then(function (ok) {
      showToast(ok
        ? "주문 내용이 복사됐어요. " + ch.app + " 대화창에 붙여넣기만 하세요."
        : "아래 '보낼 주문 내용'을 복사해 " + ch.app + "으로 보내 주세요.");
      if (!ok) sheet.querySelector(".order-preview").open = true;
    });
  }

  function openOrder(id) {
    if (!catalog.length) return;
    var item = findItem(id) || catalog[0].item;
    document.getElementById("orderProduct").value = item.id;
    qty = 1;
    updateOrder();
    if (typeof sheet.showModal === "function") sheet.showModal();
    else sheet.setAttribute("open", "");
  }

  function setupOrder() {
    sheet = document.getElementById("orderSheet");
    if (!sheet || !catalog.length) return;

    // 제품 고르기 (분류별로 묶기)
    var select = document.getElementById("orderProduct");
    var groups = {};
    catalog.forEach(function (c) {
      if (!groups[c.group]) {
        groups[c.group] = el("optgroup");
        groups[c.group].label = c.group;
        select.appendChild(groups[c.group]);
      }
      var opt = el("option", null, c.item.name);
      opt.value = c.item.id;
      groups[c.group].appendChild(opt);
    });

    var size = document.getElementById("orderSize");
    ["모르겠어요 (상담 요청)"].concat(orderCfg.ringSizes || []).forEach(function (s) {
      var opt = el("option", null, s);
      opt.value = s;
      size.appendChild(opt);
    });

    // 주문 보내기 버튼
    var box = document.getElementById("orderChannels");
    (orderCfg.channels || ["dm", "kakao", "sms"]).forEach(function (key) {
      var ch = CHANNELS[key];
      if (!ch || (key === "sms" ? !config.phone : !links[key])) return;
      var btn = el("button", "order-send " + ch.cls, ch.label);
      btn.type = "button";
      btn.addEventListener("click", function () { sendOrder(key); });
      box.appendChild(btn);
    });

    document.getElementById("qtyDown").addEventListener("click", function () { qty = Math.max(1, qty - 1); updateOrder(); });
    document.getElementById("qtyUp").addEventListener("click", function () { qty = Math.min(9, qty + 1); updateOrder(); });
    sheet.addEventListener("input", updateOrder);
    sheet.addEventListener("change", updateOrder);
    // 바깥(어두운 곳)을 누르면 닫기
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet) sheet.close();
    });

    // 페이지 어디서든 data-order 버튼을 누르면 주문서 열기
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-order]");
      if (!btn) return;
      e.preventDefault();
      openOrder(btn.dataset.order);
    });
  }

  // ---------- 유튜브에서 온 손님 (?from=youtube&order=제품id) ----------
  function setupDeepLink() {
    var params = new URLSearchParams(window.location.search);
    try {
      if (params.get("from") === "youtube") sessionStorage.setItem("jewelry-from", "youtube");
      fromYoutube = sessionStorage.getItem("jewelry-from") === "youtube";
    } catch (e) {
      fromYoutube = params.get("from") === "youtube";
    }

    var id = params.get("order");
    if (id && findItem(id)) {
      openOrder(id);
    } else if (fromYoutube && orderCfg.youtubeWelcome) {
      var ribbon = el("div", "yt-ribbon");
      var go = el("button", "yt-go", orderCfg.youtubeWelcome + " →");
      go.type = "button";
      go.dataset.order = orderCfg.youtubeWelcomeItem || "";
      var close = el("button", "yt-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", "안내 닫기");
      close.addEventListener("click", function () { ribbon.remove(); });
      ribbon.appendChild(go);
      ribbon.appendChild(close);
      document.body.appendChild(ribbon);
    }
  }

  // ---------- 스크롤하면 나타나기 ----------
  function setupReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("shown"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("shown");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (n) { io.observe(n); });
  }

  // ---------- 미리보기(결제 전 시안) 표시 ----------
  function setupPreviewMode() {
    if (!config.previewMode) return;
    document.body.appendChild(el("div", "preview-watermark"));
    document.body.appendChild(el("div", "preview-badge", "미리보기 · 결제 전 시안입니다"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillText();
    fillLinks();
    var heroRing = document.getElementById("heroRing");
    var heroImage = (config.hero || {}).image;
    if (heroImage) {
      var heroImg = el("img");
      heroImg.src = heroImage;
      heroImg.alt = "";
      heroImg.width = 900;
      heroImg.height = 900;
      heroRing.appendChild(heroImg);
    } else {
      heroRing.innerHTML = jewelrySvg("반지", "gold", "#eef3ff");
    }
    renderPoints();
    renderLumiere();
    renderCollection();
    renderVideo();
    renderGift();
    renderInfo();
    renderSiteInfo();
    setupOrder();
    setupDeepLink();
    setupReveal();
    setupPreviewMode();
  });
})();
