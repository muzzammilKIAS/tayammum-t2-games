import 'dart:async';
import '../models/race_state.dart';
// roomCode, cleanCode, validateNickname, newMetadata dan controlChanges berada
// dalam game_shared supaya pelayan kelas menguatkuasakan peraturan bilik yang
// sama (bukan salinan berasingan).
export 'package:game_shared/room_logic.dart';

abstract class RoomService {
  String get userId;
  String get label;
  bool get isDemo;
  Stream<bool> get connection;
  int get nowMs;
  Future<String> create(int level);
  Future<void> join(String code, String nickname, int avatar);
  Stream<RaceRoom?> watch(String code, {bool ownOnly = false});
  Future<void> publish(String code, int round, RunState state);
  Future<void> control(
    String code,
    String action, {
    int? level,
    String? playerId,
  });
  Future<void> leave(String code);
  Future<void> dispose();
}
