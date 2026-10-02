import 'package:flutter/material.dart';
import '../models/curriculum.dart';
import '../services/progress_store.dart';
import '../widgets/adventure_style.dart';
import '../widgets/world_thumbnail.dart';

class AdventureHomeScreen extends StatelessWidget {
  const AdventureHomeScreen({super.key});
  @override
  Widget build(BuildContext context) => GameFrame(
    title: 'PENGEMBARAAN TAYAMMUM',
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 1160),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            AdventureCard(
              color: navy,
              padding: EdgeInsets.all(
                MediaQuery.sizeOf(context).width < 480 ? 24 : 32,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TINGKATAN 2  •  PENDIDIKAN ISLAM  •  SK 4.10',
                    style: TextStyle(
                      color: gold,
                      letterSpacing: 3,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Pengembaraan\nTayammum',
                    style: TextStyle(
                      color: cream,
                      fontSize: MediaQuery.sizeOf(context).width < 480
                          ? 34
                          : 44,
                      height: 1.1,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Tiga tahap. Satu pengembaraan.\nBerlari merentas padang pasir dan buka setiap pintu soalan dengan ilmu tayammum.',
                    style: TextStyle(color: sky, fontSize: 15, height: 1.7),
                  ),
                  const SizedBox(height: 28),
                  Row(
                    children: List.generate(
                      4,
                      (i) => Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: AvatarBadge(i, size: 60),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth > 800
                    ? (constraints.maxWidth - 32) / 3
                    : constraints.maxWidth;
                return Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    _mode(
                      context,
                      width,
                      Icons.explore_outlined,
                      'MAIN SENDIRI',
                      'Pilih perantau dan mulakan tahap mengikut keperluan anda.',
                      '/game/solo',
                      action: 'Main sendiri →',
                    ),
                    _mode(
                      context,
                      width,
                      Icons.cast_for_education_outlined,
                      'MOD KELAS (GURU)',
                      'Paparkan perlumbaan langsung di projektor. Pelajar menyertai dengan kod atau QR.',
                      '/game/host',
                      action: 'Buka bilik kelas →',
                    ),
                    _mode(
                      context,
                      width,
                      Icons.qr_code_scanner_outlined,
                      'SERTAI DENGAN KOD',
                      'Pelajar: masukkan kod bilik daripada guru dan sertai perlumbaan kelas.',
                      '/game/join',
                      action: 'Masukkan kod →',
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),
            const Text(
              'ILMU ADALAH KEKUATAN ANDA',
              style: TextStyle(
                color: emerald,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.5,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Lompat jurang, kutip permata dan buka pintu soalan. Jawapan yang betul jauh lebih bernilai daripada permata. Setiap perantau boleh sampai ke garisan penamat.',
              style: TextStyle(color: navy, height: 1.7),
            ),
          ],
        ),
      ),
    ),
  );
  Widget _mode(
    BuildContext context,
    double width,
    IconData icon,
    String title,
    String description,
    String? route, {
    VoidCallback? onTap,
    String action = 'Jom mula →',
  }) => SizedBox(
    width: width,
    child: AdventureCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: emerald, size: 34),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w800, color: navy),
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: const TextStyle(height: 1.6, color: Colors.blueGrey),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: onTap ?? () => Navigator.pushNamed(context, route!),
            child: Text(action),
          ),
        ],
      ),
    ),
  );
}

class SoloScreen extends StatefulWidget {
  const SoloScreen({super.key});
  @override
  State<SoloScreen> createState() => _SoloScreenState();
}

class _SoloScreenState extends State<SoloScreen> {
  ProgressStore? _store;
  int _avatar = 0;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final store = await ProgressStore.load();
    if (mounted) setState(() => _store = store);
  }

  Future<void> _play(int level) async {
    await Navigator.pushNamed(
      context,
      '/game/play?level=$level&avatar=$_avatar',
    );
    await _load();
  }

  @override
  Widget build(BuildContext context) => GameFrame(
    title: 'PETA PENGEMBARAAN ANDA',
    child: _store == null
        ? const Center(child: CircularProgressIndicator())
        : Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 940),
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  const Text(
                    'Pilih perantau anda.',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: navy,
                    ),
                  ),
                  const SizedBox(height: 18),
                  AvatarPicker(
                    value: _avatar,
                    onChanged: (value) => setState(() => _avatar = value),
                  ),
                  const SizedBox(height: 28),
                  // Setiap level terbuka: a class can start at any topic.
                  ...adventureLevels.map((level) {
                    final best = _store!.best(level.id);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: WorldCard(
                        level: level.id,
                        avatar: _avatar,
                        stars: (best['stars'] as num?)?.toInt() ?? 0,
                        title: level.title,
                        zones: '${level.group}\n${level.zones.join('  →  ')}',
                        best: best.isEmpty
                            ? null
                            : 'Terbaik ${best['score']} mata  •  ${(best['time'] as num).toInt() ~/ 1000}s',
                        action: FilledButton(
                          onPressed: () => _play(level.id),
                          child: Text(
                            _store!.resume(level.id)?.finished == false
                                ? 'Sambung di pusat semak →'
                                : 'Mulakan tahap →',
                          ),
                        ),
                      ),
                    );
                  }),
                  if (_mastery.isNotEmpty)
                    AdventureCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'PENGUASAAN SK ANDA',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: navy,
                              letterSpacing: 1.2,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ..._mastery.map(
                            (entry) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 84,
                                    child: Text(
                                      'SK 4.10.${entry.$1}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: navy,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: LinearProgressIndicator(
                                        value: entry.$2,
                                        minHeight: 9,
                                        backgroundColor: sky.withValues(
                                          alpha: .55,
                                        ),
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              entry.$2 >= .7 ? emerald : gold,
                                            ),
                                      ),
                                    ),
                                  ),
                                  SizedBox(
                                    width: 46,
                                    child: Text(
                                      '${(entry.$2 * 100).round()}%',
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: navy,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
  );
  List<(String, double)> get _mastery =>
      ((_store?.data['mastery'] as Map?) ?? {}).entries
          .map((e) => ('${e.key}', (e.value as num).toDouble().clamp(0.0, 1.0)))
          .toList()
        ..sort((a, b) => (int.tryParse(a.$1) ?? 0) - (int.tryParse(b.$1) ?? 0));
}

class AvatarPicker extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;
  const AvatarPicker({super.key, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 12,
    runSpacing: 12,
    children: List.generate(
      4,
      (i) => Semantics(
        selected: i == value,
        button: true,
        label: avatarNames[i],
        child: InkWell(
          onTap: () => onChanged(i),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: i == value ? sky : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: i == value ? emerald : Colors.transparent,
                width: 2,
              ),
            ),
            child: Column(
              children: [
                AvatarBadge(i, size: 64),
                const SizedBox(height: 8),
                Text(
                  avatarNames[i],
                  style: const TextStyle(fontSize: 11, color: navy),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
