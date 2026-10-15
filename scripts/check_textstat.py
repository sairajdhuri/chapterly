"""Cross-check text-readability with Python textstat; no chapter leaves this machine."""

import json
import math
import subprocess
from pathlib import Path

import textstat

ROOT = Path(__file__).resolve().parents[1]


def check() -> None:
    textstat.set_lang("en_US")
    cases = [
        "The cat sat on the mat.",
        "The bookshop was closed. Clara found a small brass key. She opened the door.",
        "Despite considerable uncertainty, the committee recommended a comprehensive reconsideration of the extraordinarily complicated proposal.",
    ]
    js = (
        "import r from 'text-readability';"
        "let input='';for await(const chunk of process.stdin) input+=chunk;"
        "console.log(JSON.stringify(JSON.parse(input).map(text=>({"
        "ease:r.fleschReadingEase(text),grade:r.fleschKincaidGrade(text)}))));"
    )
    result = subprocess.run(
        ["node", "--input-type=module", "-e", js],
        input=json.dumps(cases), text=True, capture_output=True, check=True, cwd=ROOT,
    )
    js_scores = json.loads(result.stdout)
    report = []
    for text, js_score in zip(cases, js_scores, strict=True):
        py_ease = textstat.flesch_reading_ease(text)
        py_grade = textstat.flesch_kincaid_grade(text)
        assert all(math.isfinite(v) for v in (py_ease, py_grade, js_score["ease"], js_score["grade"]))
        report.append({
            "text": text,
            "textstat": {"ease": py_ease, "grade": py_grade},
            "text_readability": js_score,
            "ease_difference": round(abs(py_ease - js_score["ease"]), 2),
        })
    # The libraries use different syllable dictionaries and rounding rules.
    assert abs(report[0]["textstat"]["ease"] - 116.145) < 0.1
    assert abs(report[0]["text_readability"]["ease"] - 116.145) < 0.1
    assert report[1]["textstat"]["ease"] > report[2]["textstat"]["ease"]
    assert report[1]["text_readability"]["ease"] > report[2]["text_readability"]["ease"]
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    check()
