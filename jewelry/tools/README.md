# 쥬얼리 시안 - 가상 이미지·광고 영상 만드는 도구

모두 **시안용 가상 자료**입니다. 실제 상품 사진·영상을 받으면 바꿔 주세요.

| 파일 | 만드는 것 |
| --- | --- |
| `product-render.html` | 상품 3D 이미지 (`../images/`) — 주소 뒤에 `?type=solitaire&metal=gold&gem=%23ffffff` 처럼 붙여 모양·금속·보석 색을 고릅니다 |
| `ad.html` | 20초 광고 영상의 장면 (1280×720). `window.renderAt(초)` 로 한 장면씩 그립니다 |
| `make-ad-bgm.py` | 광고 배경음악 (numpy 로 직접 합성, 외부 음원 없음 → 저작권 걱정 없음) |

## 다시 만드는 방법 (요약)

1. 이 폴더에서 `npm i three @fontsource/noto-serif-kr @fontsource/cormorant-garamond`
2. `npx http-server -p 8799 .` 로 띄운 뒤, Playwright 등으로 `ad.html` 을 열어
   0~20초를 30fps 로 `renderAt(t)` → 화면 캡처 (`frames/f0000.jpg` …)
3. `python3 make-ad-bgm.py` → `ad-bgm.wav`
4. `ffmpeg -framerate 30 -i frames/f%04d.jpg -i ad-bgm.wav -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 160k -shortest ../video/finest-jewelry-ad.mp4`
