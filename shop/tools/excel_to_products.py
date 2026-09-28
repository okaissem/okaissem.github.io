"""
고객이 채운 상품 등록 엑셀을 홈페이지 상품 데이터(data/products.js)로 바꿉니다.

  python3 shop/tools/excel_to_products.py 고객엑셀.xlsx
  python3 shop/tools/excel_to_products.py 고객엑셀.xlsx 시험용.js   (저장 위치를 바꿀 때)

- 양식: tools/상품등록_양식_4종목_4000개.xlsx ('상품목록', '실측사이즈' 시트)
- 상품코드가 '예시'로 시작하는 줄, 안내 줄, 빈 줄은 건너뜁니다.
- 판매상태가 '숨김'인 상품은 홈페이지에 넣지 않습니다.
- 필수 항목이 빠졌거나 상품코드가 겹치는 줄은 건너뛰고, 줄 번호를 알려 줍니다.
- 사진은 shop/images/ 폴더에 엑셀에 적힌 파일 이름 그대로 넣어 주세요.

필요한 것: pip install openpyxl
"""
import json
import sys
from pathlib import Path

# config.js 의 categories 와 같게 맞춰 주세요 (실측 사이즈 항목 순서)
MEASURE = {
    "쥬얼리": [],
    "모자": ["머리둘레", "챙길이", "높이"],
    "의류": ["어깨", "가슴단면", "허리", "총장", "소매"],
    "가방": ["가로", "세로", "폭", "끈길이"],
}
REQUIRED = ["상품코드", "종목", "상품명", "판매가(원)", "대표사진 파일명"]
HEADER_ROW = 3
IMAGE_DIR = "images/"


def split_list(value):
    """'블랙, 화이트 ,네이비' → ['블랙', '화이트', '네이비']"""
    if value is None:
        return []
    return [v.strip() for v in str(value).replace("，", ",").split(",") if v.strip()]


def to_int(value):
    if value is None or str(value).strip() == "":
        return None
    return int(float(str(value).replace(",", "").replace("원", "").strip()))


def to_num(value):
    if value is None or str(value).strip() == "":
        return None
    n = float(str(value).replace("cm", "").strip())
    return int(n) if n.is_integer() else n


def read_sheet(ws):
    """머리글(3번째 줄) 이름으로 된 사전 목록을 돌려줍니다. 머리글 끝의 ' *'는 뺍니다."""
    headers = [str(c.value).replace(" *", "").strip() if c.value else "" for c in ws[HEADER_ROW]]
    for row in ws.iter_rows(min_row=HEADER_ROW + 1):
        values = {h: c.value for h, c in zip(headers, row) if h}
        yield row[0].row, values


def is_skip(code):
    """빈 줄, '예시' 줄, '▼ 여기부터 입력' 안내 줄은 건너뜁니다."""
    code = "" if code is None else str(code).strip()
    return code == "" or code.startswith("예시") or code.startswith("▼")


def convert(xlsx_path):
    from openpyxl import load_workbook

    wb = load_workbook(xlsx_path, data_only=True, read_only=True)
    problems = []

    # 실측 사이즈: {상품코드: {사이즈: [값...]}} - 종목은 상품목록을 읽은 뒤에 맞춥니다
    raw_measure = {}
    if "실측사이즈" in wb.sheetnames:
        for rownum, v in read_sheet(wb["실측사이즈"]):
            code = v.get("상품코드")
            if is_skip(code) or not v.get("사이즈"):
                continue
            raw_measure.setdefault(str(code).strip(), {})[str(v["사이즈"]).strip()] = v

    items, seen = [], set()
    for rownum, v in read_sheet(wb["상품목록"]):
        code = v.get("상품코드")
        if is_skip(code):
            continue
        code = str(code).strip()
        missing = [k for k in REQUIRED if v.get(k) is None or str(v.get(k)).strip() == ""]
        if missing:
            problems.append(f"{rownum}번째 줄 ({code}): 필수 항목 빠짐 - {', '.join(missing)}")
            continue
        if code in seen:
            problems.append(f"{rownum}번째 줄 ({code}): 상품코드 중복 - 건너뜀")
            continue
        category = str(v["종목"]).strip()
        if category not in MEASURE:
            hint = " - 티셔츠·재킷 등 옷은 종목을 '의류'로, 세부분류에 '티셔츠'처럼 적어 주세요" if category in ("티셔츠", "티", "재킷", "자켓", "후디", "팬츠", "바지") else ""
            problems.append(f"{rownum}번째 줄 ({code}): 종목 '{category}' 은(는) 쥬얼리/모자/의류/가방이 아님{hint}")
            continue
        status = str(v.get("판매상태") or "판매중").strip()
        if status == "숨김":
            continue
        try:
            p, sp = to_int(v["판매가(원)"]), to_int(v.get("할인가(원)"))
        except ValueError:
            problems.append(f"{rownum}번째 줄 ({code}): 가격이 숫자가 아님")
            continue
        seen.add(code)

        item = {
            "id": code, "c": category, "sub": str(v.get("세부분류") or "").strip(),
            "n": str(v["상품명"]).strip(), "p": p,
            "col": split_list(v.get("색상")), "sz": split_list(v.get("사이즈")),
            "m": str(v.get("소재") or "").strip(), "d": str(v.get("짧은 설명") or "").strip(),
            "img": IMAGE_DIR + str(v["대표사진 파일명"]).strip(),
            "st": "품절" if status == "품절" else "판매중",
            "tag": str(v.get("표시") or "").strip(),
        }
        if sp and sp < p:
            item["sp"] = sp
        extra = [IMAGE_DIR + f for f in split_list(v.get("추가사진 파일명"))]
        if extra:
            item["imgs"] = extra
        fields = MEASURE[category]
        if fields and code in raw_measure:
            ms = {}
            for size, row in raw_measure[code].items():
                try:
                    ms[size] = [to_num(row.get(f)) for f in fields]
                except ValueError:
                    problems.append(f"실측사이즈 ({code} {size}): 숫자가 아닌 값이 있음")
            item["ms"] = ms
        items.append(item)
    return items, problems


def write_products(items, out_path, note=""):
    """상품 목록을 홈페이지가 읽는 data/products.js 로 저장합니다 (한 줄에 상품 하나)."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    clean = []
    for it in items:
        # 빈 값은 빼서 파일을 가볍게 합니다
        # 판매상태는 '품절'일 때만 적습니다 (없으면 판매중)
        clean.append({k: v for k, v in it.items() if v not in ("", None, [], {}) and not (k == "st" and v == "판매중")})
    lines = [json.dumps(it, ensure_ascii=False, separators=(",", ":")) for it in clean]
    header = (
        "/* 상품 데이터 - 직접 고치지 말고 tools/ 의 스크립트로 다시 만드세요.\n"
        f" * {note}\n"
        " * id 상품코드 · c 종목 · sub 세부분류 · n 상품명 · p 판매가 · sp 할인가 · col 색상 · sz 사이즈\n"
        " * m 소재 · d 설명 · img 대표사진 · imgs 추가사진 · st 판매상태 · tag 표시 · ms 실측(cm, config.js 의 measure 순서) */\n"
    )
    out_path.write_text(header + "window.SHOP_PRODUCTS = [\n" + ",\n".join(lines) + "\n];\n", encoding="utf-8")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    items, problems = convert(sys.argv[1])
    # 두 번째 값으로 저장 위치를 바꿀 수 있습니다 (시험해 볼 때)
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "data" / "products.js"
    write_products(items, out, note=f"{Path(sys.argv[1]).name} 에서 만듦")
    counts = {}
    for it in items:
        counts[it["c"]] = counts.get(it["c"], 0) + 1
    print(f"상품 {len(items)}개 → {out}")
    for c, n in counts.items():
        print(f"  {c}: {n}개")
    if problems:
        print(f"\n확인이 필요한 줄 {len(problems)}개 (홈페이지에 넣지 않았습니다):")
        for p in problems:
            print("  - " + p)


if __name__ == "__main__":
    main()
