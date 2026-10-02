"""Import kandungan sebenar Rabbaniyyah (curriculum.dart) ke content/topics.json.

Hanya data yang wujud dalam sumber diambil: kosa kata, isi tempat kosong,
susun perkataan dan soal jawab (matchQuestions). Tiada kandungan direka.
Jalankan: python3 scripts/import-content.py [laluan/curriculum.dart]
"""
import json, pathlib, re, sys

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                   '/Users/sufyanthawry/Desktop/GERAN RC/rabbaniyyah_app/lib/data/curriculum.dart')
src = SRC.read_text()
STR = r"""(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")"""


def strings(text):
    return [(a or b).replace("\\'", "'") for a, b in re.findall(STR, text)]


def const(block, name):
    m = re.search(r'static const ' + name + r' = \[(.*?)\n  \];', block, re.S) or \
        re.search(r'static const ' + name + r' = \[(.*?)\];', block, re.S)
    return m.group(1) if m else None


def sequence_of(tokens, answer):
    """Susunan token yang membentuk ayat jawapan tepat, atau None jika tidak sepadan."""
    rest, seq, pool = re.sub(r'[.،,؟!?]', '', answer).split(), [], list(tokens)
    while rest:
        for tok in sorted(pool, key=lambda t: -len(t.split())):
            size = len(tok.split())
            if rest[:size] == tok.split():
                seq.append(tok); pool.remove(tok); rest = rest[size:]
                break
        else:
            return None
    return seq if not pool else None


titles = {int(n): t for n, t in re.findall(r"LessonRef\((\d+), '([^']+)'", src)}
topics, issues = [], []
for n in range(1, 13):
    block = re.search(r'class Dars11' + str(n) + r' \{(.*?)(?=\nclass |\Z)', src, re.S).group(1)
    ref = f'curriculum.dart › Dars11{n}'
    vocab = [dict(word=s[0], meaning=s[1]) for s in
             (strings(m) for m in re.findall(r'VocabItem\((.*?)\),?\n', const(block, 'vocab') + '\n'))]
    fill_bank = strings(const(block, 'fillBank') or '')
    fill = []
    for m in re.findall(r'FillItem\((.*?)\),?\n', (const(block, 'fillItems') or '') + '\n'):
        before, after, answer = strings(m)
        fill.append(dict(before=before, after=after, answer=answer))
    order = []
    for m in re.findall(r'WordOrderItem\(\[(.*?)\],\s*(.*?)\),?\n', (const(block, 'wordOrder') or '') + '\n', re.S):
        tokens, answer = strings(m[0]), strings(m[1])[0]
        sequence = sequence_of(tokens, answer)
        if sequence:
            order.append(dict(tokens=tokens, answer=answer, sequence=sequence))
        else:
            issues.append(dict(topic=n, type='order', tokens=tokens, answer=answer,
                               reason='Token tidak sepadan tepat dengan ayat jawapan; tidak digunakan.'))
    qa = []
    mq, ma, mi = const(block, 'matchQuestions'), const(block, 'matchAnswers'), re.search(r'matchCorrectIndex = \[(.*?)\]', block)
    if mq and ma and mi:
        qs, ans, idx = strings(mq), strings(ma), [int(x) for x in re.findall(r'\d+', mi.group(1))]
        qa = [dict(question=q, answer=ans[i], options=ans) for q, i in zip(qs, idx)]
    topics.append(dict(id=n, title=titles[n], source=ref, vocab=vocab, fillBank=fill_bank,
                       fill=fill, order=order, qa=qa))

out = pathlib.Path(__file__).resolve().parent.parent / 'content' / 'topics.json'
out.write_text(json.dumps(topics, ensure_ascii=False, indent=2) + '\n')
(out.parent / 'import-issues.json').write_text(json.dumps(issues, ensure_ascii=False, indent=2) + '\n')
print('Isu sumber:', len(issues))
for t in topics:
    print(t['id'], 'vocab', len(t['vocab']), 'fill', len(t['fill']), 'order', len(t['order']), 'qa', len(t['qa']))
