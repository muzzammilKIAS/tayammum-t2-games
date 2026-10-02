import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:io';
import 'package:umt3033_app/game/data/question_bank.dart';
import 'package:umt3033_app/game/engine/adventure_game.dart';
import 'package:umt3033_app/game/models/curriculum.dart';
import 'package:umt3033_app/game/models/race_state.dart';
import 'package:umt3033_app/game/multiplayer/local_room_service.dart';
import 'package:umt3033_app/game/multiplayer/room_service.dart';
import 'package:umt3033_app/game/multiplayer/server_config.dart';
import 'package:umt3033_app/game/widgets/race_board.dart';
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

  test('pautan sertai mengekalkan laluan GitHub Pages dan parameter bilik', () {
    final url = Uri.parse(
      joinUrl(
        Uri.parse(
          'https://muzzammilkias.github.io/tayammum-t2-games/mario/#/game/host',
        ),
        'ABC234',
      ),
    );
    expect(url.path, '/tayammum-t2-games/mario/');
    expect(url.fragment, '/game/join?room=ABC234');
    final withServer = Uri.parse(
      joinUrl(
        Uri.parse('https://muzzammilkias.github.io/tayammum-t2-games/mario/'),
        'ABC234',
        server: 'wss://contoh.onrender.com/ws',
      ),
    );
    expect(
      withServer.fragment,
      '/game/join?room=ABC234&server=wss%3A%2F%2Fcontoh.onrender.com%2Fws',
    );
  });
  test('URL pelayan: lalai, dart-define dan penimpaan masa jalan', () {
    expect(defaultServerUrl, 'wss://tayammum-mario-server.onrender.com/ws');
    expect(resolveServerUrl(), defaultServerUrl);
    expect(
      resolveServerUrl(build: 'ws://localhost:3416/ws'),
      'ws://localhost:3416/ws',
    );
    // parameter query dan hash mengatasi nilai simpanan dan binaan
    expect(
      resolveServerUrl(
        base: Uri.parse('https://x.io/mario/?server=wss://a.onrender.com/ws'),
        stored: 'wss://b.onrender.com/ws',
      ),
      'wss://a.onrender.com/ws',
    );
    expect(
      resolveServerUrl(
        base: Uri.parse(
          'https://x.io/mario/#/game/host?server=https://c.onrender.com',
        ),
      ),
      'wss://c.onrender.com/ws',
    );
    expect(
      resolveServerUrl(
        base: Uri.parse('https://x.io/mario/'),
        stored: 'd.onrender.com',
      ),
      'wss://d.onrender.com/ws',
    );
    expect(normalizeServerUrl('ftp://x'), isNull);
    expect(normalizeServerUrl('local'), localServerKeyword);
  });
  test('peralihan masa hos mengekalkan masa jeda', () {
    final room = RaceRoom(
      code: 'ABC234',
      hostId: 'host',
      level: 1,
      phase: RoomPhase.paused,
      pausedAt: 1000,
      pausedMs: 200,
    );
    expect(controlChanges(room, 'resume', 4000)['pausedMs'], 3200);
    expect(() => controlChanges(room, 'start', 4000), throwsStateError);
  });
  for (final count in [2, 10, 50]) {
    test(
      'adapter tempatan $count pelajar: sertai, kunci, lumba, pulih, keputusan dan tahap seterusnya',
      () async {
        SharedPreferences.setMockInitialValues({});
        final prefs = await SharedPreferences.getInstance();
        final host = LocalRoomService(prefs, 'host'),
            other = LocalRoomService(prefs, 'other');
        final code = await host.create(1);
        final players = List.generate(
          count,
          (i) => LocalRoomService(prefs, 'p$i'),
        );
        for (var i = 0; i < count; i++) {
          await players[i].join(code, 'Pelajar $i', i % 4);
        }
        expect((await host.watch(code).first)!.players.length, count);
        await expectLater(other.join(code, 'Pelajar 0', 0), throwsStateError);
        await expectLater(other.control(code, 'start'), throwsStateError);
        await expectLater(
          other.join('ZZZZZZ', 'Pemain baharu', 0),
          throwsA(
            isA<StateError>().having(
              (e) => e.message,
              'mesej',
              contains('Bilik tidak ditemui'),
            ),
          ),
        );
        await host.control(code, 'start');
        await expectLater(other.join(code, 'Lewat', 0), throwsStateError);
        for (var i = 0; i < count; i++) {
          final run = RunState();
          run.answer(1, i.isEven, 1000);
          run.progress = .2;
          await players[i].publish(code, 0, run);
        }
        var room = (await host.watch(code).first)!;
        expect(room.players.every((p) => p.run.checkpoint == 1), isTrue);
        await players.first.leave(code);
        await players.first.join(code, 'Nama pemulihan diabaikan', 2);
        room = (await host.watch(code).first)!;
        expect(room.players.first.run.checkpoint, 1);
        expect(room.players.first.nickname, 'Pelajar 0');
        await host.control(code, 'end');
        await host.control(code, 'next', level: 2);
        await players.first.publish(code, 0, RunState(score: 999));
        room = (await host.watch(code).first)!;
        expect(room.level, 2);
        expect(room.round, 1);
        expect(room.players.every((p) => p.run.score == 0), isTrue);
        await host.control(code, 'remove', playerId: players.first.userId);
        await expectLater(
          players.first.join(code, 'Dikeluarkan', 0),
          throwsStateError,
        );
        await host.control(code, 'delete');
        expect(await host.watch(code).first, isNull);
      },
    );
  }
  test('nama panggilan: mesej ralat dalam Bahasa Melayu', () {
    expect(
      () => validateNickname('x'),
      throwsA(
        isA<StateError>().having(
          (e) => e.message,
          'mesej',
          contains('nama panggilan'),
        ),
      ),
    );
  });
  for (final count in [20, 50]) {
    testWidgets('$count pelajar muat pada projektor 1280x720', (tester) async {
      tester.view.physicalSize = const Size(1280, 720);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                height: 480,
                child: RaceBoard(
                  room: RaceRoom(
                    code: 'ABC234',
                    hostId: 'host',
                    level: 1,
                    players: List.generate(
                      count,
                      (i) => RacePlayer(
                        id: '$i',
                        nickname: 'Pelajar $i',
                        avatar: i % 4,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pump(const Duration(seconds: 1));
      expect(find.byType(LiveAvatarMarker), findsNWidgets(count));
      expect(
        tester.getBottomRight(find.byType(LiveAvatarMarker).last).dy,
        lessThanOrEqualTo(504),
      );
      expect(tester.takeException(), isNull);
    });
  }
}
