// 카드뉴스를 PNG로 다시 뽑는 스크립트
// 1) 저장소 맨 위 폴더에서: python3 -m http.server 8123
// 2) 이 폴더에서:          node render.js   (Playwright 필요: npm i playwright)
// → cardnews/ 폴더의 PNG 6장을 새로 만듭니다
const { chromium } = require("playwright");
const path = require("path");
const url = process.argv[2] || "http://localhost:8123/cardnews/src/cardnews.html";
const names = { banner: "00-banner", card1: "01-cover", card2: "02-design", card3: "03-dm-order", card4: "04-youtube", card5: "05-price" };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const [id, name] of Object.entries(names)) {
    await page.locator("#" + id).screenshot({ path: path.join(__dirname, "..", name + ".png") });
  }
  await browser.close();
})();
