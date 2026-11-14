import argparse
import json
import os
import re
import sys
from pathlib import Path


SP = Path(
    os.environ.get(
        "AWA_TRANSLATION_SP",
        r"D:\ClaudeTemp\claude\d--HAWA\c8099df9-4cfb-4b1a-b42c-35a73d73b121\scratchpad\ar",
    )
)
WORK = Path(r"D:\HAWA\.work")
AFRI_MODEL = Path(r"D:\HAWA\.models\afrislm\TranslatePsy-AfriSLM-0.8B-Q4_K_M-imat.gguf")
NLLB_MODEL = Path(r"D:\HAWA\.models\nllb")

LANG_NAMES = {
    "xh": "Xhosa",
    "sn": "Shona",
    "ln": "Lingala",
    "ff": "Fulfulde",
}

NLLB_CODES = {
    "xh": "xho_Latn",
    "sn": "sna_Latn",
    "ln": "lin_Latn",
    "ff": "fuv_Latn",
}

PROTECTED_RE = re.compile(
    r"\{\{[^}]+\}\}|</?[A-Za-z][^>]*>|%[sd]|https?://\S+|"
    r"\b(?:AWA|PDF|CSV|JSON|PIN)\b|Face ID"
)


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temp.replace(path)


def mask_text(text):
    protected = []

    def replace(match):
        token = f"ZXQPH{len(protected)}QXZ"
        protected.append((token, match.group(0)))
        return token

    return PROTECTED_RE.sub(replace, text), protected


def unmask_text(text, protected):
    for token, original in protected:
        variants = {
            token,
            token.lower(),
            token.replace("PH", " PH "),
            token.replace("ZXQ", "ZXQ ").replace("QXZ", " QXZ"),
        }
        found = False
        for variant in variants:
            if variant in text:
                text = text.replace(variant, original)
                found = True
                break
        if not found:
            raise ValueError(f"protected token was not preserved: {token}")
    return text.strip()


class Cache:
    def __init__(self, language):
        self.path = WORK / f"translation_cache_{language}.json"
        self.data = load_json(self.path) if self.path.exists() else {}
        self.dirty = 0

    def get(self, text):
        return self.data.get(text)

    def put(self, text, translation):
        self.data[text] = translation
        self.dirty += 1
        if self.dirty >= 32:
            self.flush()

    def flush(self):
        if self.dirty:
            save_json(self.path, self.data)
            self.dirty = 0


class AfriSlmTranslator:
    def __init__(self, language):
        sys.path.insert(0, str(Path(r"D:\HAWA\.localpy")))
        from llama_cpp import Llama

        self.language = language
        self.language_name = LANG_NAMES[language]
        self.cache = Cache(language)
        self.llm = Llama(
            model_path=str(AFRI_MODEL),
            n_ctx=2048,
            n_batch=512,
            n_threads=max(1, min(6, os.cpu_count() or 1)),
            n_gpu_layers=0,
            verbose=False,
        )
        self.system = (
            f"You are a professional English to {self.language_name} translator. "
            f"Accurately convey meaning in natural, standard {self.language_name}, "
            "using respectful, plain language suitable for a women's health app. "
            "Preserve every token shaped like ZXQPH0QXZ exactly. Preserve AWA and "
            "technical abbreviations. Return only the requested translation data, "
            "without explanations or commentary."
        )

    def _ask(self, masked_items):
        payload = json.dumps(masked_items, ensure_ascii=False)
        user = (
            f"Translate every string in this JSON array from English into "
            f"{self.language_name}. Return a valid JSON array with exactly the same "
            f"number and order of strings. Translate each item independently:\n{payload}"
        )
        response = self.llm.create_chat_completion(
            messages=[
                {"role": "system", "content": self.system},
                {"role": "user", "content": user},
            ],
            temperature=0.0,
            max_tokens=min(1400, max(128, len(payload) * 2)),
        )
        content = response["choices"][0]["message"]["content"].strip()
        start, end = content.find("["), content.rfind("]")
        if start < 0 or end < start:
            raise ValueError("model did not return a JSON array")
        result = json.loads(content[start : end + 1])
        if len(result) != len(masked_items) or not all(isinstance(x, str) for x in result):
            raise ValueError("model returned the wrong JSON shape")
        return result

    def translate_many(self, texts, source_code="eng_Latn"):
        result = [None] * len(texts)
        pending = []
        for index, text in enumerate(texts):
            cached = self.cache.get(text)
            if cached is not None:
                result[index] = cached
            else:
                masked, protected = mask_text(text)
                pending.append((index, text, masked, protected))

        cursor = 0
        while cursor < len(pending):
            batch = []
            size = 0
            while cursor + len(batch) < len(pending) and len(batch) < 8:
                candidate = pending[cursor + len(batch)]
                if batch and size + len(candidate[2]) > 1100:
                    break
                batch.append(candidate)
                size += len(candidate[2])
            try:
                translated = self._ask([item[2] for item in batch])
                restored = [
                    unmask_text(value, item[3])
                    for value, item in zip(translated, batch)
                ]
            except Exception:
                if len(batch) == 1:
                    raise
                restored = []
                for item in batch:
                    value = self._ask([item[2]])[0]
                    restored.append(unmask_text(value, item[3]))
            for item, value in zip(batch, restored):
                index, source = item[0], item[1]
                result[index] = value
                self.cache.put(source, value)
            cursor += len(batch)
            print(f"  translated {cursor}/{len(pending)} uncached strings", flush=True)
        self.cache.flush()
        return result


class NllbTranslator:
    def __init__(self, language):
        import ctranslate2
        import sentencepiece as spm

        self.language = language
        self.cache = Cache(language)
        self.target = NLLB_CODES[language]
        self.sp = spm.SentencePieceProcessor()
        self.sp.load(str(NLLB_MODEL / "sentencepiece.bpe.model"))
        self.translator = ctranslate2.Translator(
            str(NLLB_MODEL), device="cpu", compute_type="int8", inter_threads=1
        )

    def _translate_around_protected(self, source, source_code):
        matches = list(PROTECTED_RE.finditer(source))
        if not matches:
            raise ValueError("protected token recovery requested without a token")
        segments = []
        cursor = 0
        for match in matches:
            segments.append(source[cursor : match.start()])
            cursor = match.end()
        segments.append(source[cursor:])
        indexes = [index for index, value in enumerate(segments) if value]
        translated = iter(
            self.translate_many(
                [segments[index] for index in indexes], source_code=source_code
            )
        )
        rebuilt = []
        tokens = iter(match.group(0) for match in matches)
        for index, segment in enumerate(segments):
            rebuilt.append(next(translated) if segment else "")
            if index < len(matches):
                rebuilt.append(next(tokens))
        return "".join(rebuilt)

    def translate_many(self, texts, source_code="eng_Latn"):
        result = [None] * len(texts)
        pending = []
        for index, text in enumerate(texts):
            cached = self.cache.get(text)
            if cached is not None:
                result[index] = cached
            else:
                masked, protected = mask_text(text)
                pending.append((index, text, masked, protected))

        for offset in range(0, len(pending), 128):
            batch = pending[offset : offset + 128]
            pieces = self.sp.encode_as_pieces([item[2] for item in batch])
            sources = [[source_code] + value + ["</s>"] for value in pieces]
            prefixes = [[self.target] for _ in batch]
            outputs = self.translator.translate_batch(
                sources,
                target_prefix=prefixes,
                beam_size=1,
                max_decoding_length=256,
                batch_type="tokens",
                max_batch_size=8192,
            )
            for item, output in zip(batch, outputs):
                tokens = output.hypotheses[0]
                if tokens and tokens[0] == self.target:
                    tokens = tokens[1:]
                index, source = item[0], item[1]
                try:
                    value = unmask_text(self.sp.decode(tokens), item[3])
                except ValueError:
                    value = self._translate_around_protected(source, source_code)
                result[index] = value
                self.cache.put(source, value)
            print(
                f"  translated {min(offset + len(batch), len(pending))}/{len(pending)} uncached strings",
                flush=True,
            )
        self.cache.flush()
        return result


def expected_files():
    return (
        [f"dict_{number:02d}.json" for number in range(1, 15)]
        + [f"edit_{number:02d}.json" for number in range(1, 11)]
        + ["extra_01.json"]
    )


def source_path(filename):
    return SP / ("jobs" if filename.startswith("edit_") else "jobs2") / filename


def translate_file(translator, filename):
    source = load_json(source_path(filename))
    if filename.startswith("dict_"):
        items = source["items"]
        translations = translator.translate_many([item["en"] for item in items])
        return {item["k"]: value for item, value in zip(items, translations)}
    if filename.startswith("edit_"):
        flattened = [
            (unit["id"], item)
            for unit in source["units"]
            for item in unit["items"]
        ]
        translations = [None] * len(flattened)
        for source_code in ("eng_Latn", "fra_Latn"):
            indexes = [
                index
                for index, (unit_id, _) in enumerate(flattened)
                if (unit_id == "UnderstandCycle") == (source_code == "fra_Latn")
            ]
            values = translator.translate_many(
                [flattened[index][1]["en"] for index in indexes],
                source_code=source_code,
            )
            for index, value in zip(indexes, values):
                translations[index] = value
        output = {}
        for (unit_id, item), value in zip(flattened, translations):
            output.setdefault(unit_id, {})[str(item["i"])] = value
        return output

    values = []
    for entry in source["terms"]:
        values.extend([entry["title"], entry["body"]])
    for entry in source["privacy"]:
        values.extend([entry["title"], entry["body"]])
    values.extend(source["imageAlts"])
    values.append("Use AWA in " + LANG_NAMES[translator.language])
    translated = iter(translator.translate_many(values))
    return {
        "terms": [
            {"title": next(translated), "body": next(translated)}
            for _ in source["terms"]
        ],
        "privacy": [
            {"title": next(translated), "body": next(translated)}
            for _ in source["privacy"]
        ],
        "imageAlts": [next(translated) for _ in source["imageAlts"]],
        "selectorSubtitle": next(translated),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("engine", choices=["afrislm", "nllb"])
    parser.add_argument("languages", nargs="+", choices=sorted(LANG_NAMES))
    args = parser.parse_args()

    for language in args.languages:
        output_dir = SP / f"out_{language}"
        missing = [name for name in expected_files() if not (output_dir / name).exists()]
        print(f"{language}: {len(missing)} missing files", flush=True)
        if not missing:
            continue
        translator = (
            AfriSlmTranslator(language)
            if args.engine == "afrislm"
            else NllbTranslator(language)
        )
        for filename in missing:
            print(f"{language} {filename}", flush=True)
            save_json(output_dir / filename, translate_file(translator, filename))
            print(f"{language} {filename} written", flush=True)


if __name__ == "__main__":
    main()
