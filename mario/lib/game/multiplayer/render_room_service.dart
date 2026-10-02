import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/race_state.dart';
import '../utils/browser.dart';
import 'room_service.dart';

/// Bercakap dengan pelayan Dart mod kelas (server/bin/main.dart) melalui satu
/// WebSocket. Protokol didokumenkan di bahagian atas fail itu. Permintaan
/// dipadankan melalui "id" yang bertambah; pelayan juga menolak mesej
/// {"op":"room",...} kepada setiap sambungan yang "watch" kod bilik.
///
/// Jika sambungan terputus (cth pelayan percuma tidur, rangkaian terputus),
/// perkhidmatan ini cuba bersambung semula dan menonton semula bilik serta
/// menyertai semula sebagai pelajar yang sama.
class RenderRoomService implements RoomService {
  final String url;
  WebSocketChannel _channel;
  @override
  final String userId;
  int _nextId = 1;
  bool _disposed = false, _reconnecting = false;
  final Map<int, Completer<Map<String, dynamic>>> _pending = {};
  final Map<String, StreamController<RaceRoom?>> _roomControllers = {};
  // Bilik yang disertai sebagai pelajar: kod -> (nama, avatar), untuk sertai semula.
  final Map<String, (String, int)> _joined = {};
  final _connectionController = StreamController<bool>.broadcast();
  StreamSubscription<dynamic>? _sub;

  RenderRoomService._(this.url, this._channel, this.userId) {
    _listen();
  }

  static Future<RenderRoomService> open(
    String url, {
    Duration timeout = const Duration(seconds: 90),
  }) async {
    final id = sessionRead('tayammum_render_id') ?? 'user_${roomCode()}';
    sessionWrite('tayammum_render_id', id);
    final channel = WebSocketChannel.connect(Uri.parse(url));
    await channel.ready.timeout(
      timeout,
      onTimeout: () {
        channel.sink.close();
        throw StateError('Pelayan kelas tidak menjawab.');
      },
    );
    return RenderRoomService._(url, channel, id);
  }

  void _listen() {
    _connectionController.add(true);
    _sub = _channel.stream.listen(
      _onMessage,
      onDone: _onClosed,
      onError: (_) => _onClosed(),
      cancelOnError: true,
    );
  }

  void _onClosed() {
    if (_disposed) return;
    _connectionController.add(false);
    for (final c in _pending.values) {
      if (!c.isCompleted) {
        c.completeError(StateError('Sambungan ke pelayan kelas terputus.'));
      }
    }
    _pending.clear();
    unawaited(_reconnect());
  }

  Future<void> _reconnect() async {
    if (_reconnecting || _disposed) return;
    _reconnecting = true;
    var delay = 1;
    while (!_disposed) {
      await Future<void>.delayed(Duration(seconds: delay));
      if (_disposed) break;
      try {
        final channel = WebSocketChannel.connect(Uri.parse(url));
        await channel.ready.timeout(const Duration(seconds: 30));
        await _sub?.cancel();
        _channel = channel;
        _listen();
        // Sertai semula (menandakan pelajar dalam talian) dan tonton semula.
        for (final e in _joined.entries) {
          try {
            await _send({
              'op': 'join',
              'userId': userId,
              'code': e.key,
              'nickname': e.value.$1,
              'avatar': e.value.$2,
            });
          } catch (_) {}
        }
        for (final code in _roomControllers.keys.toList()) {
          try {
            await _send({'op': 'watch', 'code': code});
          } catch (_) {}
        }
        break;
      } catch (_) {
        delay = (delay * 2).clamp(1, 10);
      }
    }
    _reconnecting = false;
  }

  void _onMessage(dynamic data) {
    final msg = jsonDecode(data as String) as Map<String, dynamic>;
    if (msg['op'] == 'room') {
      final code = msg['code'] as String;
      final room = msg['room'];
      _roomControllers[code]?.add(
        room == null ? null : RaceRoom.fromJson(code, room),
      );
      return;
    }
    final id = msg['id'];
    final completer = id is int ? _pending.remove(id) : null;
    completer?.complete(msg);
  }

  Future<Map<String, dynamic>> _send(Map<String, dynamic> fields) {
    final id = _nextId++;
    final completer = Completer<Map<String, dynamic>>();
    _pending[id] = completer;
    try {
      _channel.sink.add(jsonEncode({'id': id, ...fields}));
    } catch (_) {
      _pending.remove(id);
      return Future.error(StateError('Sambungan ke pelayan kelas terputus.'));
    }
    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        _pending.remove(id);
        throw StateError('Tiada jawapan daripada pelayan kelas.');
      },
    );
  }

  Future<Map<String, dynamic>> _sendOk(Map<String, dynamic> fields) async {
    final reply = await _send(fields);
    if (reply['ok'] != true) {
      throw StateError(reply['error'] as String? ?? 'Permintaan gagal.');
    }
    return reply;
  }

  @override
  String get label => 'KELAS LANGSUNG';
  @override
  bool get isDemo => false;
  @override
  int get nowMs => DateTime.now().millisecondsSinceEpoch;
  @override
  Stream<bool> get connection => _connectionController.stream;

  @override
  Future<String> create(int level) async {
    final reply = await _sendOk({
      'op': 'create',
      'userId': userId,
      'level': level,
    });
    return reply['code'] as String;
  }

  @override
  Future<void> join(String code, String nickname, int avatar) async {
    await _sendOk({
      'op': 'join',
      'userId': userId,
      'code': code,
      'nickname': nickname,
      'avatar': avatar,
    });
    _joined[code] = (nickname, avatar);
  }

  @override
  Stream<RaceRoom?> watch(String code, {bool ownOnly = false}) {
    final controller = _roomControllers.putIfAbsent(
      code,
      () => StreamController<RaceRoom?>.broadcast(),
    );
    _sendOk({
      'op': 'watch',
      'code': code,
    }).catchError((_) => <String, dynamic>{});
    return controller.stream;
  }

  @override
  Future<void> publish(String code, int round, RunState state) => _sendOk({
    'op': 'publish',
    'userId': userId,
    'code': code,
    'round': round,
    'state': state.toJson(),
  });

  @override
  Future<void> control(
    String code,
    String action, {
    int? level,
    String? playerId,
  }) => _sendOk({
    'op': 'control',
    'userId': userId,
    'code': code,
    'action': action,
    'level': ?level,
    'playerId': ?playerId,
  });

  @override
  Future<void> leave(String code) {
    _joined.remove(code);
    return _sendOk({'op': 'leave', 'userId': userId, 'code': code});
  }

  @override
  Future<void> dispose() async {
    _disposed = true;
    await _sub?.cancel();
    for (final c in _roomControllers.values) {
      await c.close();
    }
    await _connectionController.close();
    await _channel.sink.close();
  }
}
