"""Generate narasi per adegan + timing kata (edge-tts)."""
import asyncio, json, os, ssl, sys
import edge_tts, edge_tts.communicate as c
from script import SCENES, VOICE, RATE

CA = os.environ.get("SSL_CERT_FILE")
if CA:
    c._SSL_CTX = ssl.create_default_context(cafile=CA)
OUT = sys.argv[1] if len(sys.argv) > 1 else "build"
os.makedirs(OUT, exist_ok=True)

async def one(key, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words, audio = [], bytearray()
    async for ch in comm.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "s": ch["offset"] / 1e7, "d": ch["duration"] / 1e7})
    open(f"{OUT}/{key}.mp3", "wb").write(audio)
    return words

async def main():
    data = {}
    for key, text in SCENES:
        data[key] = await one(key, text)
        print(key, len(data[key]), "kata")
    json.dump(data, open(f"{OUT}/words.json", "w"), ensure_ascii=False, indent=1)

asyncio.run(main())
