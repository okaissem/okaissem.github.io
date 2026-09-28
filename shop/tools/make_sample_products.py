"""
시안용 가상 상품 4,000개(의류·가방·쥬얼리·티셔츠 1,000개씩)를 만들어 data/products.js 로 저장합니다.

  python3 shop/tools/make_sample_products.py

실제 상품은 이 파일 대신 excel_to_products.py 로 고객 엑셀에서 만듭니다.
같은 씨앗 값(seed)을 쓰므로 몇 번을 돌려도 같은 상품이 나옵니다.
"""
import json
import random
from pathlib import Path

from excel_to_products import write_products

rng = random.Random(20260928)
PER_CATEGORY = 1000

ADJ = ["데일리", "미니멀", "베이직", "클래식", "모던", "빈티지", "소프트", "시그니처", "에센셜", "위켄드", "시티", "코지"]

JEWELRY = {
    "반지": (["큐빅 반지", "체인 반지", "진주 반지", "실버 링", "이터니티 반지", "시그넷 반지", "레이어드 링", "볼 반지"],
             ["../jewelry/images/01-solitaire-ring-photo.jpg", "../jewelry/images/02-eternity-ring.jpg", "../jewelry/images/03-emerald-ring.jpg", "../jewelry/images/04-silver-ring.jpg"]),
    "목걸이": (["진주 목걸이", "하트 목걸이", "드롭 목걸이", "체인 목걸이", "솔리테어 목걸이", "이니셜 목걸이"],
             ["../jewelry/images/05-pearl-necklace.jpg", "../jewelry/images/06-heart-necklace.jpg", "../jewelry/images/07-sapphire-necklace.jpg", "../jewelry/images/13-lumiere-necklace.jpg"]),
    "귀걸이": (["볼 귀걸이", "진주 귀걸이", "스터드 귀걸이", "링 귀걸이", "드롭 귀걸이", "이어커프"],
             ["../jewelry/images/08-ball-earrings.jpg", "../jewelry/images/09-pearl-earrings.jpg", "../jewelry/images/10-ruby-earrings.jpg", "../jewelry/images/14-lumiere-earrings.jpg"]),
    "팔찌": (["테니스 팔찌", "체인 팔찌", "뱅글", "비즈 팔찌", "레이어드 팔찌"],
             ["../jewelry/images/11-tennis-bracelet.jpg", "../jewelry/images/12-chain-bracelet.jpg", "../jewelry/images/15-lumiere-bracelet.jpg"]),
}
JW_METAL = [("14K 골드", ["골드", "로즈골드", "화이트골드"]), ("925 실버", ["실버", "골드"]), ("써지컬 스틸", ["실버", "골드", "로즈골드"])]

APPAREL = {
    "아우터": ["트렌치 코트", "숏 패딩", "울 코트", "데님 재킷", "니트 가디건", "바람막이 재킷"],
    "셔츠": ["옥스퍼드 셔츠", "린넨 셔츠", "스트라이프 셔츠", "오버핏 셔츠", "체크 셔츠"],
    "바지": ["와이드 슬랙스", "데님 팬츠", "조거 팬츠", "코튼 치노 팬츠", "카고 팬츠"],
    "원피스": ["플리츠 원피스", "셔츠 원피스", "니트 원피스", "롱 원피스"],
    "니트": ["라운드 니트", "브이넥 니트", "케이블 니트", "니트 조끼", "터틀넥 니트"],
}
APPAREL_MAT = ["면 100%", "울 50% 폴리 50%", "폴리에스터 100%", "린넨 100%", "면 98% 스판 2%", "아크릴 혼방", "나일론 100%"]

TEE = {
    "반팔": ["로고 반팔 티셔츠", "무지 반팔 티셔츠", "포켓 반팔 티셔츠", "스트라이프 반팔 티셔츠", "레터링 반팔 티셔츠"],
    "긴팔": ["무지 긴팔 티셔츠", "헨리넥 긴팔 티셔츠", "스트라이프 긴팔 티셔츠", "와플 긴팔 티셔츠"],
    "민소매": ["골지 민소매", "코튼 나시", "레이어드 민소매"],
    "오버핏": ["오버핏 반팔 티셔츠", "헤비코튼 오버핏 티셔츠", "그래픽 오버핏 티셔츠"],
}
TEE_MAT = ["면 100% (20수)", "면 100% (30수)", "면 95% 스판 5%", "린넨 혼방", "헤비코튼 (면 100%)"]

BAG = {
    "숄더백": ["미니 숄더백", "호보 숄더백", "레더 숄더백", "퀼팅 숄더백"],
    "토트백": ["캔버스 토트백", "빅 토트백", "레더 토트백", "에코백"],
    "크로스백": ["미니 크로스백", "메신저백", "폰 크로스백", "슬링백"],
    "백팩": ["데일리 백팩", "미니 백팩", "노트북 백팩", "롤탑 백팩"],
    "클러치": ["레더 클러치", "파우치 클러치", "봉투 클러치"],
}
BAG_MAT = ["소가죽", "인조가죽", "캔버스 (면 100%)", "나일론", "스웨이드"]

APPAREL_COLORS = ["블랙", "화이트", "그레이", "차콜", "네이비", "스카이블루", "베이지", "크림", "카키", "브라운", "레드", "핑크", "그린", "옐로우"]
BAG_COLORS = ["블랙", "화이트", "베이지", "크림", "카멜", "브라운", "네이비", "카키", "그레이", "레드"]


def price(lo, hi):
    """lo~hi 천 원 사이 가격 (예: price(15, 49) → 15,000~49,000원)"""
    return rng.randint(lo, hi) * 1000


def common(item, base):
    """판매가·할인가·판매상태·표시를 정합니다."""
    item["p"] = base
    if rng.random() < 0.15:
        item["sp"] = int(round(base * rng.choice([0.8, 0.85, 0.9]), -2))
    roll = rng.random()
    item["tag"] = "신상" if roll < 0.10 else "베스트" if roll < 0.15 else "추천" if roll < 0.20 else ""
    item["st"] = "품절" if rng.random() < 0.05 else "판매중"
    return item


def jewelry(i):
    sub = rng.choice(list(JEWELRY))
    names, imgs = JEWELRY[sub]
    mat, cols = rng.choice(JW_METAL)
    base = rng.choice(names)
    sizes = []
    if sub == "반지":
        start = rng.choice([5, 7, 9])
        sizes = [f"{n}호" for n in range(start, start + rng.choice([8, 10, 12]), 2)]
    elif sub in ("목걸이", "팔찌"):
        sizes = ["FREE"]
    img = imgs[i % len(imgs)]
    return common({
        "id": f"JW-{i:04d}", "c": "쥬얼리", "sub": sub,
        "n": f"{rng.choice(ADJ)} {base}", "col": rng.sample(cols, rng.randint(1, len(cols))), "sz": sizes, "m": mat,
        "d": f"{mat} 소재의 {sub}. 매일 해도 부담 없는 크기로 만들었습니다.",
        "img": img,
    }, price(19, 159))


def apparel(i):
    sub = rng.choice(list(APPAREL))
    base = rng.choice(APPAREL[sub])
    order = ["S", "M", "L", "XL"]
    if sub == "바지":
        sizes = rng.choice([["26", "28", "30", "32", "34"], ["S", "M", "L"]])
    elif sub == "원피스":
        sizes = rng.choice([["S", "M"], ["FREE"]])
    else:
        sizes = rng.choice([["S", "M", "L", "XL"], ["M", "L"], ["FREE"]])
    ms = {}
    for s in sizes:
        # 사이즈마다 치수를 조금씩 늘립니다 (허리 사이즈 26~34 는 0~4단계)
        k = (int(s) - 26) / 2 if s.isdigit() else (1.5 if s == "FREE" else order.index(s))
        if sub == "바지":
            ms[s] = [None, None, 34 + 2 * k, 100 + k, None]
        elif sub == "원피스":
            ms[s] = [37 + k, 45 + 2 * k, 35 + 2 * k, 115 + 2 * k, rng.choice([None, 58])]
        else:
            length = 92 if sub == "아우터" and base in ("트렌치 코트", "울 코트") else 68
            sleeve = None if base == "니트 조끼" else 59 + k
            ms[s] = [44 + 2 * k, 53 + 3 * k, None, length + 2 * k, sleeve]
    return common({
        "id": f"CL-{i:04d}", "c": "의류", "sub": sub,
        "n": f"{rng.choice(ADJ)} {base}", "col": rng.sample(APPAREL_COLORS, rng.randint(1, 5)), "sz": sizes,
        "m": rng.choice(APPAREL_MAT), "d": "체형을 가리지 않는 핏으로, 단독으로도 레이어드로도 입기 좋습니다.", "ms": ms,
    }, price(29, 189))


def tee(i):
    sub = rng.choice(list(TEE))
    base = rng.choice(TEE[sub])
    sizes = rng.choice([["S", "M", "L", "XL"], ["S", "M", "L"], ["M", "L", "XL", "XXL"], ["FREE"]])
    over = 4 if sub == "오버핏" else 0
    ms = {}
    order = ["S", "M", "L", "XL", "XXL"]
    for s in sizes:
        k = 1.5 if s == "FREE" else order.index(s)
        sleeve = None if sub == "민소매" else (58 if sub == "긴팔" else 20) + k
        ms[s] = [50 + over + 3 * k, 66 + 2 * k, 46 + over + 2 * k, sleeve]
    return common({
        "id": f"TS-{i:04d}", "c": "티셔츠", "sub": sub,
        "n": f"{rng.choice(ADJ)} {base}", "col": rng.sample(APPAREL_COLORS, rng.randint(1, 6)), "sz": sizes,
        "m": rng.choice(TEE_MAT), "d": "세탁 후에도 목이 늘어나지 않는 탄탄한 원단입니다.", "ms": ms,
    }, price(12, 49))


def bag(i):
    sub = rng.choice(list(BAG))
    base = rng.choice(BAG[sub])
    size = {"숄더백": (28, 20, 9, 60), "토트백": (38, 32, 12, 26), "크로스백": (22, 16, 6, 120), "백팩": (30, 42, 14, 80), "클러치": (28, 18, 3, None)}[sub]
    ms = {"FREE": [size[0] + rng.choice([-2, 0, 2]), size[1] + rng.choice([-2, 0, 2]), size[2], size[3]]}
    return common({
        "id": f"BG-{i:04d}", "c": "가방", "sub": sub,
        "n": f"{rng.choice(ADJ)} {base}", "col": rng.sample(BAG_COLORS, rng.randint(1, 4)), "sz": ["FREE"],
        "m": rng.choice(BAG_MAT), "d": "스마트폰과 지갑, 파우치가 넉넉히 들어가고 끈 길이를 조절할 수 있습니다.", "ms": ms,
    }, price(29, 189))


def main():
    items = []
    for make in (apparel, bag, jewelry, tee):
        items += [make(i) for i in range(1, PER_CATEGORY + 1)]
    for it in items:
        it.setdefault("sz", [])
        if it.get("ms"):
            it["ms"] = {k: [int(x) if isinstance(x, float) and x.is_integer() else x for x in v] for k, v in it["ms"].items()}
    out = Path(__file__).resolve().parent.parent / "data" / "products.js"
    write_products(items, out, note="시안용 가상 상품 4,000개 (make_sample_products.py 로 만듦)")
    print(f"{len(items)}개 → {out}")


if __name__ == "__main__":
    main()
