"""
시안용 가상 상품 4,000개(쥬얼리·모자·의류·가방 1,000개씩)를 만들어 data/products.js 로 저장합니다.
바이크 라이더를 위한 옷·용품 가게를 가정한 이름과 설명입니다.

  python3 shop/tools/make_sample_products.py

실제 상품은 이 파일 대신 excel_to_products.py 로 고객 엑셀에서 만듭니다.
같은 씨앗 값(seed)을 쓰므로 몇 번을 돌려도 같은 상품이 나옵니다.
"""
import random
from pathlib import Path

from excel_to_products import write_products

rng = random.Random(20260928)
PER_CATEGORY = 1000

ADJ = ["라이더", "모토", "투어링", "로드", "빈티지", "헤비", "올드스쿨", "나이트", "와일드", "클래식", "어반", "크루저"]

JEWELRY = {
    "반지": (["시그넷 반지", "체인 반지", "스컬 반지", "실버 링", "볼드 밴드 반지", "레이어드 링"],
             ["../jewelry/images/04-silver-ring.jpg", "../jewelry/images/02-eternity-ring.jpg", "../jewelry/images/01-solitaire-ring-photo.jpg", "../jewelry/images/03-emerald-ring.jpg"]),
    "목걸이": (["체인 목걸이", "도그태그 목걸이", "펜던트 목걸이", "볼 체인 목걸이", "쿠반 체인 목걸이"],
             ["../jewelry/images/07-sapphire-necklace.jpg", "../jewelry/images/13-lumiere-necklace.jpg", "../jewelry/images/05-pearl-necklace.jpg", "../jewelry/images/06-heart-necklace.jpg"]),
    "팔찌": (["체인 팔찌", "레더 팔찌", "뱅글", "ID 팔찌", "비즈 팔찌"],
             ["../jewelry/images/12-chain-bracelet.jpg", "../jewelry/images/11-tennis-bracelet.jpg", "../jewelry/images/15-lumiere-bracelet.jpg"]),
    "귀걸이": (["링 귀걸이", "스터드 귀걸이", "후프 귀걸이", "드롭 귀걸이"],
             ["../jewelry/images/08-ball-earrings.jpg", "../jewelry/images/10-ruby-earrings.jpg", "../jewelry/images/14-lumiere-earrings.jpg", "../jewelry/images/09-pearl-earrings.jpg"]),
}
JW_METAL = [("925 실버", ["실버", "블랙"]), ("써지컬 스틸", ["실버", "골드", "블랙"]), ("14K 골드", ["골드", "화이트골드"])]

CAP = {
    "볼캡": ["워싱 볼캡", "자수 볼캡", "코듀로이 볼캡", "나일론 볼캡"],
    "스냅백": ["패치 스냅백", "플랫 스냅백", "메시 트러커 캡"],
    "비니": ["골지 비니", "숏 비니", "와치캡"],
    "버킷햇": ["코튼 버킷햇", "나일론 버킷햇", "왁스 버킷햇"],
}
CAP_MAT = ["면 100%", "나일론 100%", "울 50% 아크릴 50%", "코듀로이 (면 100%)", "폴리 메시"]

APPAREL = {
    "티셔츠": ["그래픽 반팔 티셔츠", "로고 반팔 티셔츠", "헤비코튼 티셔츠", "롱슬리브 티셔츠", "포켓 티셔츠"],
    "재킷": ["레더 라이더 재킷", "모토 재킷", "메시 라이딩 재킷", "데님 재킷", "왁스 코튼 재킷", "코치 재킷"],
    "후디·맨투맨": ["집업 후디", "풀오버 후디", "기모 맨투맨", "그래픽 맨투맨"],
    "팬츠": ["라이딩 데님", "카고 팬츠", "워크 팬츠", "케블라 데님"],
    "조끼": ["레더 베스트", "데님 베스트", "패딩 베스트"],
}
APPAREL_MAT = {
    "티셔츠": ["면 100% (20수)", "헤비코튼 (면 100%)", "면 95% 스판 5%"],
    "재킷": ["소가죽", "양가죽", "폴리 메시", "면 100% (데님)", "왁스 코튼", "나일론 100%"],
    "후디·맨투맨": ["면 100% (기모)", "면 80% 폴리 20%", "프렌치테리 (면 100%)"],
    "팬츠": ["면 98% 스판 2% (데님)", "면 100% (캔버스)", "아라미드 혼방 데님"],
    "조끼": ["소가죽", "면 100% (데님)", "나일론 100%"],
}
APPAREL_DESC = {
    "티셔츠": "탄탄한 원단이라 라이딩 재킷 안에 받쳐 입어도 늘어지지 않습니다.",
    "재킷": "어깨·팔꿈치에 보호대를 넣을 수 있는 주머니가 있고, 바람이 덜 들어오게 소매를 조일 수 있습니다.",
    "후디·맨투맨": "재킷 안에 겹쳐 입기 좋은 두께로, 바람 부는 날에도 따뜻합니다.",
    "팬츠": "무릎을 굽혀 앉아도 편한 입체 패턴으로, 오래 타도 당기지 않습니다.",
    "조끼": "티셔츠나 후디 위에 걸치기 좋은 라이더 베스트입니다.",
}

BAG = {
    "백팩": ["라이딩 백팩", "롤탑 백팩", "하드쉘 백팩", "미니 백팩"],
    "슬링백": ["라이더 슬링백", "메신저 슬링백", "체스트 백"],
    "힙색": ["레그 백", "웨이스트 백", "사이드 힙색"],
    "사이드백": ["새들백", "레더 사이드백", "탱크백"],
    "토트백": ["캔버스 토트백", "레더 토트백", "헬멧 토트백"],
}
BAG_MAT = ["소가죽", "인조가죽", "캔버스 (면 100%)", "코듀라 나일론", "방수 타포린"]

APPAREL_COLORS = ["블랙", "화이트", "그레이", "차콜", "네이비", "베이지", "크림", "카키", "브라운", "레드", "오렌지", "올리브"]
BAG_COLORS = ["블랙", "브라운", "카멜", "카키", "차콜", "올리브", "네이비"]


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
    sizes = []
    if sub == "반지":
        start = rng.choice([9, 11, 13])
        sizes = [f"{n}호" for n in range(start, start + rng.choice([8, 10, 12]), 2)]
    elif sub in ("목걸이", "팔찌"):
        sizes = rng.choice([["FREE"], ["45cm", "50cm", "55cm"] if sub == "목걸이" else ["18cm", "20cm", "22cm"]])
    return common({
        "id": f"JW-{i:04d}", "c": "쥬얼리", "sub": sub,
        "n": f"{rng.choice(ADJ)} {rng.choice(names)}", "col": rng.sample(cols, rng.randint(1, len(cols))), "sz": sizes, "m": mat,
        "d": f"{mat} 소재라 땀과 물에 강하고, 장갑을 끼고 벗어도 걸리지 않게 마감했습니다.",
        "img": imgs[i % len(imgs)],
    }, price(19, 159))


def cap(i):
    sub = rng.choice(list(CAP))
    sizes = rng.choice([["FREE"], ["FREE"], ["M", "L"]])
    ms = {}
    for s in sizes:
        head = 58 if s in ("FREE", "M") else 60
        brim = rng.choice([6, 6.5, 7]) if sub in ("볼캡", "스냅백") else (5 if sub == "버킷햇" else None)
        ms[s] = [head, brim, rng.choice([11, 12, 13]) if sub != "비니" else 20]
    return common({
        "id": f"HT-{i:04d}", "c": "모자", "sub": sub,
        "n": f"{rng.choice(ADJ)} {rng.choice(CAP[sub])}", "col": rng.sample(APPAREL_COLORS, rng.randint(1, 5)), "sz": sizes,
        "m": rng.choice(CAP_MAT), "d": "헬멧을 벗은 뒤 눌린 머리를 가리기 좋고, 뒷면에서 크기를 조절할 수 있습니다.", "ms": ms,
    }, price(19, 49))


def apparel(i):
    sub = rng.choice(list(APPAREL))
    order = ["S", "M", "L", "XL", "XXL"]
    if sub == "팬츠":
        sizes = rng.choice([["28", "30", "32", "34", "36"], ["S", "M", "L", "XL"]])
    else:
        sizes = rng.choice([["S", "M", "L", "XL"], ["M", "L", "XL", "XXL"], ["FREE"]])
    ms = {}
    for s in sizes:
        # 사이즈마다 치수를 조금씩 늘립니다 (허리 28~36 은 0~4단계)
        k = (int(s) - 28) / 2 if s.isdigit() else (1.5 if s == "FREE" else order.index(s))
        if sub == "팬츠":
            ms[s] = [None, None, 36 + 2 * k, 102 + k, None]
        else:
            length = {"티셔츠": 70, "재킷": 66, "후디·맨투맨": 68, "조끼": 62}[sub]
            sleeve = None if sub == "조끼" else (21 + k if sub == "티셔츠" and rng.random() < 0.7 else 61 + k)
            ms[s] = [45 + 2 * k, 54 + 3 * k, None, length + 2 * k, sleeve]
    base = {"티셔츠": price(25, 59), "재킷": price(89, 390), "후디·맨투맨": price(49, 119), "팬츠": price(59, 189), "조끼": price(59, 199)}[sub]
    return common({
        "id": f"CL-{i:04d}", "c": "의류", "sub": sub,
        "n": f"{rng.choice(ADJ)} {rng.choice(APPAREL[sub])}", "col": rng.sample(APPAREL_COLORS, rng.randint(1, 4)), "sz": sizes,
        "m": rng.choice(APPAREL_MAT[sub]), "d": APPAREL_DESC[sub], "ms": ms,
    }, base)


def bag(i):
    sub = rng.choice(list(BAG))
    size = {"백팩": (30, 44, 16, 80), "슬링백": (18, 30, 8, 110), "힙색": (22, 16, 7, 100), "사이드백": (32, 26, 12, None), "토트백": (40, 34, 14, 28)}[sub]
    ms = {"FREE": [size[0] + rng.choice([-2, 0, 2]), size[1] + rng.choice([-2, 0, 2]), size[2], size[3]]}
    return common({
        "id": f"BG-{i:04d}", "c": "가방", "sub": sub,
        "n": f"{rng.choice(ADJ)} {rng.choice(BAG[sub])}", "col": rng.sample(BAG_COLORS, rng.randint(1, 3)), "sz": ["FREE"],
        "m": rng.choice(BAG_MAT), "d": "달리는 중에도 흔들리지 않게 끈을 조일 수 있고, 비가 와도 안쪽이 젖지 않습니다.", "ms": ms,
    }, price(39, 229))


def main():
    items = []
    for make in (jewelry, cap, apparel, bag):
        items += [make(i) for i in range(1, PER_CATEGORY + 1)]
    for it in items:
        if it.get("ms"):
            it["ms"] = {k: [int(x) if isinstance(x, float) and x.is_integer() else x for x in v] for k, v in it["ms"].items()}
    out = Path(__file__).resolve().parent.parent / "data" / "products.js"
    write_products(items, out, note="시안용 가상 상품 4,000개 (make_sample_products.py 로 만듦)")
    print(f"{len(items)}개 → {out}")


if __name__ == "__main__":
    main()
