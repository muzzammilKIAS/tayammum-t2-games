import 'dart:async';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import '../engine/adventure_game.dart';
import '../models/curriculum.dart';
import '../models/race_state.dart';
import '../services/progress_store.dart';
import '../widgets/adventure_style.dart';
import '../widgets/question_gate.dart';
import 'results_screen.dart';

class PlayScreen extends StatefulWidget {
  final int level, avatar;
  final List<KnowledgeQuestion> questions;
  final RunState? restored;
  final bool paused, multiplayer;
  final String? cover;
  final Future<void> Function(RunState)? onPublish;
  const PlayScreen({
    super.key,
    required this.level,
    required this.questions,
    this.avatar = 0,
    this.restored,
    this.paused = false,
    this.multiplayer = false,
    this.cover,
    this.onPublish,
  });
  @override
  State<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> with WidgetsBindingObserver {
  late final RunState run;
  late final AdventureGame game;
  final FocusNode _focus = FocusNode();
  Timer? _timer;
  ProgressStore? _store;
  int? _gate;
  bool _manualPause = false, _saving = false;
  String? _saveError;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    run = widget.restored ?? RunState();
    game = AdventureGame(
      run: run,
      gates: widget.questions.length,
      avatar: widget.avatar,
      level: widget.level,
      onGate: (index) {
        if (mounted) setState(() => _gate = index);
      },
      onChanged: () {},
      onFinish: () {
        if (mounted) setState(() {});
        unawaited(_save());
      },
    );
    game.frozen = widget.paused;
    if (!widget.multiplayer) {
      ProgressStore.load().then((s) {
        _store = s;
      });
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {});
        unawaited(_save());
      }
    });
  }

  Future<void> _save() async {
    if (_saving) return;
    _saving = true;
    try {
      if (widget.multiplayer) {
        if (!widget.paused) await widget.onPublish?.call(run);
      } else {
        await _store?.saveSolo(widget.level, run);
      }
      _saveError = null;
    } catch (_) {
      _saveError = 'Penyimpanan kemajuan tertangguh…';
    } finally {
      _saving = false;
    }
  }

  @override
  void didUpdateWidget(PlayScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    game.frozen = widget.paused || _manualPause;
    if (game.frozen) game.clearInput();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) {
      game.clearInput();
      if (!widget.multiplayer) {
        setState(() {
          _manualPause = true;
          game.frozen = true;
        });
      }
      unawaited(_save());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (run.finished) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            ResultsView(
              players: [
                RacePlayer(
                  id: 'solo',
                  nickname: 'Anda',
                  avatar: widget.avatar,
                  run: run,
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (widget.multiplayer)
              const Text(
                'Keputusan anda telah disimpan. Menunggu pusingan seterusnya.',
              )
            else
              FilledButton(
                onPressed: () async {
                  await _save();
                  if (context.mounted) Navigator.pop(context);
                },
                child: const Text('Kembali ke peta pengembaraan'),
              ),
          ],
        ),
      );
    }
    final zone = zoneForGate(run.checkpoint, widget.questions.length);
    return Column(
      children: [
        Container(
          color: navy,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              AvatarBadge(widget.avatar, size: 38),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      adventureLevels[widget.level - 1].zones[zone],
                      style: const TextStyle(
                        color: cream,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                    Text(
                      'Pintu ${run.checkpoint}/${widget.questions.length} • ${run.score} mata • ${formatTime(run.elapsedMs)}',
                      style: const TextStyle(color: gold, fontSize: 12),
                    ),
                  ],
                ),
              ),
              if (!widget.multiplayer)
                IconButton(
                  tooltip: 'Jeda',
                  color: cream,
                  onPressed: () => setState(() {
                    _manualPause = !_manualPause;
                    game.frozen = _manualPause;
                    game.clearInput();
                  }),
                  icon: Icon(_manualPause ? Icons.play_arrow : Icons.pause),
                ),
            ],
          ),
        ),
        if (_saveError != null)
          Text(_saveError!, style: const TextStyle(color: Colors.deepOrange)),
        Expanded(
          child: Stack(
            children: [
              Positioned.fill(
                child: GameWidget(
                  game: game,
                  focusNode: _focus,
                  autofocus: true,
                ),
              ),
              if (_gate != null)
                Positioned.fill(
                  child: ColoredBox(
                    color: navy.withValues(alpha: .65),
                    child: QuestionGate(
                      key: ValueKey(_gate),
                      question: widget.questions[_gate!],
                      onComplete: (correct, ms) {
                        if (widget.paused) return;
                        run.answer(
                          widget.questions[_gate!].topicId,
                          correct,
                          ms,
                        );
                        setState(() => _gate = null);
                        game.releaseGate(correct);
                        _focus.requestFocus();
                        unawaited(_save());
                      },
                    ),
                  ),
                ),
              if (widget.cover != null || _manualPause)
                Positioned.fill(
                  child: ColoredBox(
                    color: navy.withValues(alpha: .9),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                widget.cover ?? 'Pengembaraan dijeda',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: gold,
                                  fontSize: 40,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (_manualPause)
                            FilledButton(
                              onPressed: () => setState(() {
                                _manualPause = false;
                                game.frozen = widget.paused;
                                _focus.requestFocus();
                              }),
                              child: const Text('Sambung'),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        Container(
          color: navy,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Row(
            children: [
              _HoldControl(
                icon: Icons.arrow_back_rounded,
                label: 'Kiri',
                onDown: () => game.left = true,
                onUp: () => game.left = false,
              ),
              const SizedBox(width: 12),
              _HoldControl(
                icon: Icons.arrow_forward_rounded,
                label: 'Kanan',
                onDown: () => game.right = true,
                onUp: () => game.right = false,
              ),
              const Spacer(),
              if (MediaQuery.sizeOf(context).width >= 600) ...[
                const Text(
                  'A / D  •  SPAS',
                  style: TextStyle(color: sky, fontSize: 10),
                ),
                const SizedBox(width: 12),
              ],
              _HoldControl(
                icon: Icons.keyboard_double_arrow_up,
                label: 'Lompat',
                onDown: game.jump,
                onUp: () {},
                jump: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HoldControl extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onDown, onUp;
  final bool jump;
  const _HoldControl({
    required this.icon,
    required this.label,
    required this.onDown,
    required this.onUp,
    this.jump = false,
  });
  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    child: Listener(
      onPointerDown: (_) => onDown(),
      onPointerUp: (_) => onUp(),
      onPointerCancel: (_) => onUp(),
      child: Container(
        width: jump ? 84 : 62,
        height: 56,
        decoration: BoxDecoration(
          color: jump ? gold : const Color(0xFF315568),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Icon(icon, color: jump ? navy : cream, size: 30),
      ),
    ),
  );
}
