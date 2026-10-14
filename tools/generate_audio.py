# 신경망 TTS(edge-tts)로 질문/답변 음성을 mp3로 일괄 생성 → audio/ + audio/manifest.json
# 실행: python tools/generate_audio.py   (먼저 node tools/export-texts.mjs)
# 영어 음성은 문장 경계 시각도 함께 기록 → audio/timings.json (쉐도잉: 문장별 끊어 재생에 사용)
#   이미 있는 파일에 시각 정보가 없으면 다시 합성해 경계만 얻는다 (길이가 같으면 파일은 그대로 둠)
# 특정 실존 화자의 목소리 복제가 아니라 Microsoft의 합성 신경망 음성을 사용한다.
import asyncio
import hashlib
import json
import os
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
AUDIO_DIR = os.path.join(ROOT, "audio")

# 시험 안내 방송에 가까운 명확하고 차분한 음성
VOICES = {
    ("en", "f"): "en-US-AriaNeural",
    ("en", "m"): "en-US-GuyNeural",
    ("ko", "f"): "ko-KR-SunHiNeural",
}
RATE = "-5%"  # 살짝 여유 있는 시험 안내 속도

failures = []
timings = {"files": {}, "spans": {}}  # files: 파일 → [[시작초, 끝초], ...] / spans: 문장 → [[글자 시작, 끝], ...]


def sentence_spans(text, bound_texts):
    """경계 문장들이 원문의 어디에 있는지 글자 위치로 (앞에서부터 차례로 찾기)"""
    spans, pos = [], 0
    for t in bound_texts:
        i = text.find(t, pos)
        if i < 0:
            return None
        spans.append([i, i + len(t)])
        pos = i + len(t)
    return spans


async def synth(text, voice, want_bounds):
    c = edge_tts.Communicate(text, voice, rate=RATE, boundary="SentenceBoundary") if want_bounds         else edge_tts.Communicate(text, voice, rate=RATE)
    audio, bounds = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "SentenceBoundary":
            start = ch["offset"] / 1e7
            bounds.append((round(start, 3), round(start + ch["duration"] / 1e7, 3), ch["text"]))
    return bytes(audio), bounds


async def gen_one(sem, key, text, voice, path, want_bounds):
    rel = "audio/" + os.path.basename(path)
    exists = os.path.exists(path) and os.path.getsize(path) > 1000
    if exists and (not want_bounds or rel in timings["files"]):
        return  # 이미 생성됨 (재실행 시 이어서)
    async with sem:
        for attempt in range(4):
            try:
                audio, bounds = await synth(text, voice, want_bounds)
                if len(audio) < 1000:
                    raise RuntimeError("empty audio")
                # 같은 문장·음성은 같은 길이로 합성된다 — 길이가 다르면 시각이 어긋나므로 파일을 새로 저장
                if not exists or os.path.getsize(path) != len(audio):
                    with open(path, "wb") as out:
                        out.write(audio)
                if want_bounds and bounds:
                    timings["files"][rel] = [[b[0], b[1]] for b in bounds]
                    spans = sentence_spans(text, [b[2] for b in bounds])
                    if spans:
                        timings["spans"][key] = spans
                return
            except Exception:
                await asyncio.sleep(1.5 * (attempt + 1))
        failures.append(path)


async def main():
    with open(os.path.join(HERE, "texts.json"), encoding="utf-8") as f:
        items = json.load(f)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    tpath = os.path.join(AUDIO_DIR, "timings.json")
    if os.path.exists(tpath):
        with open(tpath, encoding="utf-8") as f:
            old = json.load(f)
        timings["files"].update(old.get("files", {}))
        timings["spans"].update(old.get("spans", {}))
    sem = asyncio.Semaphore(8)
    tasks = []
    manifest = {}

    for it in items:
        lang, text, name = it["lang"], it["text"], it["name"]
        key = f"{lang}|{text}"
        entry = manifest.setdefault(key, {})
        # 파일명에 텍스트 해시 포함 — 문장을 수정하면 새 파일이 생성되어
        # '옛 음성이 새 텍스트에 재생되는' 문제를 원천 차단 (기존 파일은 건너뛰기 안전)
        th = hashlib.md5(text.encode("utf-8")).hexdigest()[:8]
        genders = ["f", "m"] if lang == "en" else ["f"]
        for g in genders:
            fname = f"{name}-{th}-{g}.mp3"
            entry[g] = "audio/" + fname
            tasks.append(gen_one(sem, key, text, VOICES[(lang, g)], os.path.join(AUDIO_DIR, fname), lang == "en"))

    total = len(tasks)
    print(f"generating {total} audio files ...")
    done = 0
    for chunk_start in range(0, total, 40):
        await asyncio.gather(*tasks[chunk_start:chunk_start + 40])
        done = min(chunk_start + 40, total)
        print(f"  {done}/{total}")

    # 대량 실패(서버 차단·네트워크 오류)면 manifest를 덮어쓰거나 파일을 지우지 않고 중단 —
    # 그대로 진행하면 정상 음성까지 '안 쓰는 파일'로 지워진다 (edge-tts 403 사례)
    if len(failures) > 20:
        print(f"too many failures ({len(failures)}) — manifest/timings/prune skipped. edge-tts 업데이트: pip install --user -U edge-tts")
        sys.exit(1)

    # 실패한 파일은 manifest에서 제외 (앱이 브라우저 TTS로 폴백)
    ok_manifest = {}
    for key, entry in manifest.items():
        kept = {g: p for g, p in entry.items()
                if os.path.exists(os.path.join(ROOT, p)) and os.path.getsize(os.path.join(ROOT, p)) > 1000}
        if kept:
            ok_manifest[key] = kept

    with open(os.path.join(AUDIO_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(ok_manifest, f, ensure_ascii=False)

    # 문장 시각: 지금 manifest에 있는 영어 파일·문장만 남긴다
    live_files = {p for k, e in ok_manifest.items() if k.startswith("en|") for p in e.values()}
    out_t = {"files": {p: v for p, v in timings["files"].items() if p in live_files},
             "spans": {k: v for k, v in timings["spans"].items() if k in ok_manifest}}
    with open(tpath, "w", encoding="utf-8") as f:
        json.dump(out_t, f, ensure_ascii=False, separators=(",", ":"))
    print(f"timings: {len(out_t['files'])} files, {len(out_t['spans'])} texts")

    # manifest가 참조하지 않는 옛 파일 정리 (텍스트 수정으로 대체된 음성)
    referenced = {os.path.basename(p) for entry in ok_manifest.values() for p in entry.values()}
    pruned = 0
    for fname in os.listdir(AUDIO_DIR):
        if fname.endswith(".mp3") and fname not in referenced:
            os.remove(os.path.join(AUDIO_DIR, fname))
            pruned += 1
    if pruned:
        print(f"pruned {pruned} stale audio files")

    print(f"manifest: {len(ok_manifest)} texts, failures: {len(failures)}")
    if failures:
        for p in failures[:10]:
            print("  FAIL", os.path.basename(p))
        sys.exit(1)


asyncio.run(main())
