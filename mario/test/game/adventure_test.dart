import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:io';
import 'package:umt3033_app/game/data/question_bank.dart';
import 'package:umt3033_app/game/engine/adventure_game.dart';
import 'package:umt3033_app/game/models/curriculum.dart';
import 'package:umt3033_app/game/models/race_state.dart';
import 'package:umt3033_app/game/services/progress_store.dart';
import 'package:umt3033_app/game/widgets/adventure_style.dart';
import 'package:umt3033_app/game/widgets/question_gate.dart';
import 'package:umt3033_app/game/screens/results_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late List<dynamic> raw;
  setUpAll(() {
    final text = File('assets/data/bank_tayammum.json').readAsStringSync();
    raw = jsonDecode(text) as List;
    QuestionBank.loadFromJson(text);
  });
  test(
    'level 1/2/3 memulangkan set asas/tebus/klinik daripada bank Tayammum',
    () {
      final bank = QuestionBank();
      const expected = {1: 16, 2: 10, 3: 12};
      const sets = {1: 'asas', 2: 'tebus', 3: 'klinik'};
      expect(adventureLevels.length, 3);
      var total = 0;
      for (final level in [1, 2, 3]) {
        final questions = bank.forLevel(level);
        expect(questions.length, expected[level]);
        expect(questions.map((q) => q.id).toSet().length, questions.length);
        final ids = raw
            .where((j) => j['set'] == sets[level])
            .map((j) => j['id'])
            .toList();
        expect(questions.map((q) => q.id).toList(), ids);
        total += questions.length;
        for (final q in questions) {
          expect(q.type, QuestionType.multipleChoice);
          expect(q.questionArabic, isEmpty);
          expect(q.options.length, 4);
          expect(q.options.toSet().length, 4);
          expect(q.options.where((o) => o == q.correctAnswer).length, 1);
          expect(q.explanation, isNot(contains('SAHKAN')));
          expect(q.sourceReference, contains('SK 4.10'));
        }
      }
      expect(total, raw.length);
    },
  );
  test('jawapan betul tidak sentiasa pilihan pertama; susunan stabil', () {
    final bank = QuestionBank();
    final all = [
      for (final l in [1, 2, 3]) ...bank.forLevel(l),
    ];
    final positions = all
        .map((q) => q.options.indexOf(q.correctAnswer))
        .toSet();
    expect(positions.length, 4);
    expect(bank.forLevel(1).first.options, bank.forLevel(1).first.options);
    // Jawapan betul sepadan dengan indeks 'answer' dalam bank (mcq).
    for (final j in raw.where((j) => j['type'] == 'mcq')) {
      final q = all.firstWhere((q) => q.id == j['id']);
      expect(q.correctAnswer, (j['options'] as List)[j['answer'] as int]);
    }
  });
  test(
    'soalan susun (arrange) ditukar kepada pilihan ganda dengan susunan betul',
    () {
      final all = [
        for (final l in [1, 2, 3]) ...QuestionBank().forLevel(l),
      ];
      for (final j in raw.where((j) => j['type'] == 'arrange')) {
        final q = all.firstWhere((q) => q.id == j['id']);
        final seq = (j['sequence'] as List).cast<String>();
        expect(q.questionMalay, contains('Pilih susunan'));
        for (var i = 0; i < seq.length; i++) {
          expect(q.correctAnswer, contains('${i + 1}. ${seq[i]}'));
        }
        expect(
          q.correctAnswer.indexOf(seq.first),
          lessThan(q.correctAnswer.indexOf(seq.last)),
        );
      }
    },
  );
  test(
    'knowledge dominates gems, first attempt accuracy and one completion award',
    () {
      final expert = RunState(), collector = RunState();
      for (var i = 0; i < 9; i++) {
        expert.answer(1, true, 20000);
        collector.answer(1, false, 10);
      }
      for (var i = 0; i < 18; i++) {
        collector.collect();
      }
      expert.finish();
      collector.finish();
      expert.finish();
      expect(expert.score, 1100);
      expect(expert.score, greaterThan(collector.score));
      expect(expert.accuracy, 1);
      expect(collector.elapsedMs, 27000);
      expect(RunState.fromJson(expert.toJson()).stars, 3);
    },
  );
  test(
    'solo progress restores checkpoints, bests and topic mastery separately',
    () async {
      SharedPreferences.setMockInitialValues({
        'umt3033_app_v1': '{"theme":"dark"}',
      });
      final store = await ProgressStore.load();
      final run = RunState();
      run.answer(1, true, 1000);
      await store.saveSolo(1, run);
      expect((await ProgressStore.load()).resume(1)!.checkpoint, 1);
      run.finish();
      await store.saveSolo(1, run);
      final restored = await ProgressStore.load();
      expect(restored.best(1)['stars'], 3);
      expect(restored.data['mastery']['1'], 1);
      expect(store.prefs.getString('umt3033_app_v1'), '{"theme":"dark"}');
    },
  );
  test('Firebase numeric topic arrays retain analytics after refresh', () {
    final run = RunState.fromJson({
      'topics': [
        null,
        {'correct': 2, 'wrong': 1},
      ],
    });
    expect(run.topics['1']['correct'], 2);
  });
  test(
    'actual platform simulation reaches all 16 gates (level 1) and the finish',
    () async {
      final run = RunState();
      late AdventureGame game;
      game = AdventureGame(
        run: run,
        gates: 16,
        avatar: 0,
        level: 1,
        onGate: (i) {
          run.answer(i ~/ 3 + 1, true, 1200);
          game.releaseGate(true);
        },
        onChanged: () {},
        onFinish: () {},
      );
      // Flame requires its internal load hook for a headless physics test.
      // ignore: invalid_use_of_internal_member
      await game.load();
      for (var frame = 0; frame < 120000 && !run.finished; frame++) {
        game.right = true;
        final localX = game.x % 1100;
        if (game.grounded &&
            ((localX > 575 && localX < 640) ||
                (localX > 790 && localX < 900))) {
          game.jump();
        }
        game.update(1 / 120);
      }
      expect(
        run.finished,
        isTrue,
        reason:
            'Stopped at x=${game.x}, y=${game.y}, checkpoint=${run.checkpoint}',
      );
      expect(run.correct, 16);
      expect(run.progress, 1);
      game.onRemove();
    },
  );
  testWidgets('Arabic gate and matching remain usable at phone width', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final q = QuestionBank().forLevel(1).first;
    bool? answer;
    await tester.pumpWidget(
      MaterialApp(
        theme: adventureTheme(),
        home: Scaffold(
          body: QuestionGate(
            question: q,
            onComplete: (right, ms) => answer = right,
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    await tester.tap(find.text(q.correctAnswer));
    await tester.pump();
    final continueButton = find.text('Teruskan pengembaraan →');
    await tester.ensureVisible(continueButton);
    await tester.tap(continueButton);
    expect(answer, isTrue);
    await tester.pumpWidget(
      MaterialApp(
        theme: adventureTheme(),
        home: Scaffold(
          body: QuestionGate(
            key: const ValueKey('match'),
            question: QuestionBank().forLevel(3)[2],
            onComplete: (_, _) {},
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
  });
  testWidgets('skrin keputusan muat pada lebar telefon tanpa limpahan', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final run = RunState();
    run.answer(1, true, 1200);
    run.answer(2, false, 2000);
    run.finish();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ResultsView(
              players: [
                RacePlayer(id: 'solo', nickname: 'Anda', avatar: 1, run: run),
              ],
            ),
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('Ilmu dibuka.'), findsOneWidget);
    expect(find.textContaining('Terkuat: SK 4.10.1'), findsOneWidget);
  });
  test('CSV escapes quoted names and prevents formula injection', () {
    final csv = resultsCsv([RacePlayer(id: '1', nickname: '=SUM(1,2)')]);
    expect(csv, contains('"\'=SUM(1,2)"'));
  });
}
