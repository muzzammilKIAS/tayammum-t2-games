import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import '../models/curriculum.dart';

/// Bank soalan Tayammum (Tingkatan 2, DSKP KSSM SK 4.10).
/// Sumber tunggal: assets/data/bank_tayammum.json (salinan bank_tayammum.json).
/// Level 1 = set asas, Level 2 = set tebus, Level 3 = set klinik.
class QuestionBank {
  static const assetPath = 'assets/data/bank_tayammum.json';
  static const levelSets = ['asas', 'tebus', 'klinik'];
  static List<Map<String, dynamic>>? _items;

  QuestionBank();

  static Future<void> ensureLoaded() async {
    if (_items != null) return;
    loadFromJson(await rootBundle.loadString(assetPath));
  }

  /// Digunakan oleh ujian atau pemuat lain.
  static void loadFromJson(String source) {
    _items = (jsonDecode(source) as List).cast<Map<String, dynamic>>();
  }

  List<KnowledgeQuestion> forLevel(int levelId) {
    final items = _items;
    if (items == null) {
      throw StateError('QuestionBank.ensureLoaded() belum dipanggil.');
    }
    final set = levelSets[(levelId - 1).clamp(0, levelSets.length - 1)];
    return [
      for (final j in items)
        if (j['set'] == set) _convert(j, levelId),
    ];
  }

  static final _tag = RegExp(r'\s*\[SAHKAN[^\]]*\]');
  static String _clean(String s) => s.replaceAll(_tag, '').trim();

  KnowledgeQuestion _convert(Map<String, dynamic> j, int levelId) {
    final id = j['id'] as String;
    final sk = (j['sk'] as String?) ?? '4.10.1';
    final topic = int.tryParse(sk.split('.').last) ?? 1;
    final isArrange = j['type'] == 'arrange';
    late final String correct;
    late final List<String> options;
    late final String question;
    if (isArrange) {
      final seq = (j['sequence'] as List).cast<String>();
      correct = _order(seq);
      options = _arrangeOptions(seq);
      question = 'Pilih susunan langkah yang betul: ${j['q']}';
    } else {
      final raw = (j['options'] as List).cast<String>();
      correct = raw[j['answer'] as int];
      options = raw;
      question = j['q'] as String;
    }
    return KnowledgeQuestion(
      id: id,
      topicId: topic,
      levelId: levelId,
      type: QuestionType.multipleChoice,
      questionArabic: '',
      questionMalay: question,
      options: _place(options, correct, id),
      correctAnswer: correct,
      explanation: _clean(j['explanation'] as String),
      sourceReference: 'DSKP KSSM SK $sk  •  $id',
      difficulty: (j['kbat'] == true) ? 'kbat' : 'normal',
    );
  }

  static String _order(List<String> seq) =>
      [for (var i = 0; i < seq.length; i++) '${i + 1}. ${seq[i]}'].join('   ');

  /// Susunan betul + tiga susunan salah daripada langkah yang sama.
  static List<String> _arrangeOptions(List<String> seq) {
    final n = seq.length;
    final orders = <String>[_order(seq)];
    final candidates = <List<String>>[
      seq.reversed.toList(),
      [...seq.skip(1), seq.first],
      [seq.last, ...seq.take(n - 1)],
      [seq[1], seq[0], ...seq.skip(2)],
      [...seq.take(n - 2), seq[n - 1], seq[n - 2]],
    ];
    for (final c in candidates) {
      final text = _order(c);
      if (!orders.contains(text)) orders.add(text);
      if (orders.length == 4) break;
    }
    return orders;
  }

  /// Bank menyimpan jawapan betul pada indeks 0; letakkan semula pada
  /// kedudukan tetap (berdasarkan id) supaya sama untuk setiap peranti.
  static List<String> _place(List<String> options, String correct, String id) {
    final others = options.where((o) => o != correct).toList();
    final seed = id.codeUnits.fold<int>(0, (a, b) => (a * 31 + b) & 0x7fffffff);
    final pos = (seed ~/ 3) % options.length;
    return [...others.take(pos), correct, ...others.skip(pos)];
  }
}
