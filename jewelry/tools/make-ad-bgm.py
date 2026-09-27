"""
쥬얼리 시안 광고 영상(20초)용 배경음악 - numpy 로 직접 합성 (외부 음원 없음)

- 120 BPM(한 박 0.5초), 장면 전환(4.5, 8.5, 12.5, 16.5초)이 박자에 맞음
- 잔잔한 패드 화음 + 피아노 느낌 아르페지오 + 낮은 베이스
- 반짝임 순간마다 종소리, 장면 전환마다 '휙', 로고 등장 때 낮은 울림
"""
import wave

import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414


def fft_lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def fft_bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / hi) ** 4) * (1 - 1 / np.sqrt(1 + (f / lo) ** 4))
    return np.fft.irfft(X, len(x))


# ---------- 악기 ----------
def piano(freq, dur=2.5):
    t = tt(dur)
    env = np.exp(-t * 2.2) * (1 - np.exp(-t * 400))
    sig = sum(np.sin(2 * np.pi * freq * k * t * (1 + 0.0004 * k * k)) * a * np.exp(-t * (1.5 + k))
              for k, a in [(1, 1.0), (2, 0.45), (3, 0.22), (4, 0.12), (5, 0.06)])
    return sig * env * 0.5


def pad(notes, dur):
    t = tt(dur)
    sig = np.zeros(len(t))
    for m in notes:
        f = midi(m)
        for det in (-0.12, 0.0, 0.12):
            ph = rng.uniform(0, 2 * np.pi)
            saw = 2 * ((f * (1 + det / 100) * t + ph / (2 * np.pi)) % 1) - 1
            sig += saw
    sig = fft_lowpass(sig / (len(notes) * 3), 1400)
    att = np.minimum(1, t / 1.2)
    rel = np.minimum(1, (dur - t) / 0.8)
    return sig * att * np.clip(rel, 0, 1) * 0.22


def bass(m, dur):
    t = tt(dur)
    f = midi(m)
    sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / 0.05) * np.clip((dur - t) / 0.4, 0, 1) * (0.7 + 0.3 * np.exp(-t * 1.5))
    return sig * env * 0.32


def bell(freq, dur=2.2):
    t = tt(dur)
    parts = [(1, 1.0), (2.76, 0.5), (5.40, 0.25), (8.93, 0.12)]
    sig = sum(np.sin(2 * np.pi * freq * p * t) * a * np.exp(-t * (2.5 + p * 0.6)) for p, a in parts)
    return sig * (1 - np.exp(-t * 800)) * 0.22


def whoosh(dur=0.9, up=True):
    t = tt(dur)
    noise = rng.standard_normal(len(t))
    sig = fft_bandpass(noise, 600, 7000)
    env = np.sin(np.pi * (t / dur) ** (0.6 if up else 1.6)) ** 2
    return sig * env * 0.07


def boom(dur=2.5):
    t = tt(dur)
    f = 90 * np.exp(-t * 3) + 42
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 1.6) * (1 - np.exp(-t * 300)) * 0.55


# ---------- 곡 구성 ----------
CHORDS = [  # (시작, 끝, 패드 음, 베이스, 아르페지오 음)
    (0.0, 4.5, [62, 66, 69, 73, 76], 38, [62, 69, 73, 76, 78, 81]),   # Dmaj9
    (4.5, 8.5, [59, 62, 66, 69, 73], 35, [59, 66, 69, 73, 74, 78]),   # Bm9
    (8.5, 12.5, [55, 59, 62, 66, 69], 31, [55, 62, 66, 69, 71, 74]),  # Gmaj9
    (12.5, 16.5, [57, 62, 64, 66, 69], 33, [57, 64, 66, 69, 73, 76]),  # A6sus → A
    (16.5, 20.0, [62, 66, 69, 73, 76, 81], 38, [74, 78, 81, 85, 86]),  # Dmaj9 (마무리)
]
for a, b, notes, root, arp in CHORDS:
    place(pad(notes, b - a + 0.6), max(0, a - 0.3), 1.0)
    place(bass(root, b - a), a, 1.0)
    step = 0.125 if a == 12.5 else 0.25  # 빠른 컷 장면은 16분음표
    start = 1.0 if a == 0 else a
    if a == 16.5:
        # 마무리: 천천히 올라가는 아르페지오
        for i, m in enumerate(arp):
            place(piano(midi(m), 3.0), a + 0.3 + i * 0.35, 0.8, pan=-0.3 + i * 0.15)
        continue
    i = 0
    t = start
    pattern = [0, 2, 1, 3, 2, 4, 3, 5]
    while t < b - 0.05:
        m = arp[pattern[i % len(pattern)] % len(arp)]
        place(piano(midi(m)), t, 0.55 if i % 4 else 0.7, pan=np.sin(i * 0.9) * 0.4)
        i += 1
        t += step

# 반짝임 종소리 (영상의 반짝임 순간과 맞춤)
for t, m in [(2.85, 93), (5.8, 90), (6.95, 97), (7.95, 93), (11.55, 91), (13.25, 93), (14.58, 90), (14.83, 97), (18.15, 98)]:
    place(bell(midi(m)), t - 0.05, 1.0, pan=rng.uniform(-0.5, 0.5))

# 장면 전환 '휙' + 빠른 컷 틱
for c in (4.5, 8.5, 12.5, 16.5):
    place(whoosh(0.9), c - 0.75, 1.0)
for c in (13.833, 15.167):
    place(whoosh(0.35), c - 0.25, 0.8)

# 로고 등장 울림
place(boom(), 16.5, 1.0)

# ---------- 공간감(리버브) ----------
def reverb(x, seconds=2.4, mix=0.28, seed=0):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / seconds))
    ir = fft_lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    size = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - mix) + wet * mix


L = reverb(L, seed=1)
R = reverb(R, seed=2)

# 시작·끝 페이드
t = np.arange(N) / SR
env = np.minimum(1, t / 0.8) * np.clip((DUR - t) / 1.2, 0, 1)
L *= env
R *= env
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = L / peak * 0.9, R / peak * 0.9

stereo = (np.stack([L, R], axis=1) * 32767).astype(np.int16)
with wave.open("ad-bgm.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print("ad-bgm.wav", DUR, "s")
