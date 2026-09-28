# 4종목 쇼핑몰 - 상품 넣는 방법

상품 4,000개는 하나씩 손으로 넣지 않고, 고객이 채운 엑셀을 한 번에 바꿔서 넣습니다.

## 순서

1. **고객에게 엑셀 양식 보내기** - `상품등록_양식_4종목_4000개.xlsx`
   (양식을 다시 만들 때: `python3 shop/tools/make_template.py shop/tools/상품등록_양식_4종목_4000개.xlsx`)
2. **채운 엑셀과 사진 받기** - 사진은 엑셀에 적힌 파일 이름 그대로 `shop/images/` 폴더에 넣습니다.
3. **상품 데이터 만들기**

   ```
   pip install openpyxl
   python3 shop/tools/excel_to_products.py 받은엑셀.xlsx
   ```

   `shop/data/products.js` 가 새로 만들어지고, 종목별 개수와 **고칠 줄**(필수 항목 빠짐, 상품코드 중복, 종목 이름 틀림)이 화면에 나옵니다.
   고칠 줄은 홈페이지에 들어가지 않으니 고객에게 알려 주세요. 판매상태가 `숨김`인 상품도 빠집니다.
4. `shop/index.html` 안의 `?v=` 숫자를 바꾸고 올리면 손님 휴대폰에도 새 상품이 바로 보입니다.

## 파일

| 파일 | 하는 일 |
|---|---|
| `make_template.py` | 고객에게 보낼 엑셀 양식을 만듭니다 |
| `excel_to_products.py` | 채운 엑셀 → `data/products.js` |
| `make_sample_products.py` | 시안용 가상 상품 4,000개를 만듭니다 (실제 상품을 넣으면 쓰지 않습니다) |

색상 이름이 새로 나오면 `shop/config.js` 의 `colors` 에 색을 추가해 주세요. 없으면 회색 점으로 보입니다.
