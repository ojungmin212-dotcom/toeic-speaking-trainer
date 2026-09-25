# 신경망 TTS(edge-tts)로 질문/답변 음성을 mp3로 일괄 생성 → audio/ + audio/manifest.json
# 실행: python tools/generate_audio.py   (먼저 node tools/export-texts.mjs)
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


async def gen_one(sem, text, voice, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return  # 이미 생성됨 (재실행 시 이어서)
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, voice, rate=RATE).save(path)
                return
            except Exception:
                await asyncio.sleep(1.5 * (attempt + 1))
        failures.append(path)


async def main():
    with open(os.path.join(HERE, "texts.json"), encoding="utf-8") as f:
        items = json.load(f)

    os.makedirs(AUDIO_DIR, exist_ok=True)
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
            tasks.append(gen_one(sem, text, VOICES[(lang, g)], os.path.join(AUDIO_DIR, fname)))

    total = len(tasks)
    print(f"generating {total} audio files ...")
    done = 0
    for chunk_start in range(0, total, 40):
        await asyncio.gather(*tasks[chunk_start:chunk_start + 40])
        done = min(chunk_start + 40, total)
        print(f"  {done}/{total}")

    # 실패한 파일은 manifest에서 제외 (앱이 브라우저 TTS로 폴백)
    ok_manifest = {}
    for key, entry in manifest.items():
        kept = {g: p for g, p in entry.items()
                if os.path.exists(os.path.join(ROOT, p)) and os.path.getsize(os.path.join(ROOT, p)) > 1000}
        if kept:
            ok_manifest[key] = kept

    with open(os.path.join(AUDIO_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(ok_manifest, f, ensure_ascii=False)

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
