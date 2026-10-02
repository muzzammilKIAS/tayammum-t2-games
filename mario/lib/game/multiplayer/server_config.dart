import '../utils/browser.dart';

/// URL WebSocket lalai pelayan mod kelas (servis Render `tayammum-mario-server`).
const defaultServerUrl = 'wss://tayammum-mario-server.onrender.com/ws';

/// Nilai masa binaan: --dart-define=GAME_SERVER_WS_URL=wss://hos/ws
const buildServerUrl = String.fromEnvironment(
  'GAME_SERVER_WS_URL',
  defaultValue: defaultServerUrl,
);

/// Nilai khas untuk memaksa pratonton tempatan (satu pelayar sahaja).
const localServerKeyword = 'local';

const storageKey = 'tayammum_server_url';

/// Menormalkan nilai yang ditaip pengguna. Mengembalikan null jika tidak sah.
/// Terima wss://, ws://, https:// (jadi wss://) dan http:// (jadi ws://);
/// jika tiada laluan, tambah /ws; jika tiada skema, anggap wss://.
String? normalizeServerUrl(String? raw) {
  var value = raw?.trim() ?? '';
  if (value.isEmpty) return null;
  if (value.toLowerCase() == localServerKeyword) return localServerKeyword;
  if (!value.contains('://')) value = 'wss://$value';
  final uri = Uri.tryParse(value);
  if (uri == null || uri.host.isEmpty) return null;
  final scheme = switch (uri.scheme.toLowerCase()) {
    'wss' || 'https' => 'wss',
    'ws' || 'http' => 'ws',
    _ => '',
  };
  if (scheme.isEmpty) return null;
  final path = (uri.path.isEmpty || uri.path == '/') ? '/ws' : uri.path;
  return Uri(
    scheme: scheme,
    host: uri.host,
    port: uri.hasPort ? uri.port : null,
    path: path,
  ).toString();
}

/// Mengambil parameter `server` daripada query atau hash (#/game/host?server=...).
String? serverParamFrom(Uri base) {
  final fromQuery = base.queryParameters['server'];
  if (fromQuery != null && fromQuery.isNotEmpty) return fromQuery;
  final fragment = base.fragment;
  final q = fragment.indexOf('?');
  if (q >= 0) {
    final params = Uri.splitQueryString(fragment.substring(q + 1));
    final v = params['server'];
    if (v != null && v.isNotEmpty) return v;
  }
  return null;
}

/// Susunan keutamaan: parameter URL (disimpan dalam localStorage) >
/// localStorage > --dart-define > nilai lalai terbina dalam.
String resolveServerUrl({
  Uri? base,
  String? stored,
  String build = buildServerUrl,
}) {
  final fromParam = normalizeServerUrl(
    base == null ? null : serverParamFrom(base),
  );
  if (fromParam != null) return fromParam;
  final fromStore = normalizeServerUrl(stored);
  if (fromStore != null) return fromStore;
  return normalizeServerUrl(build) ?? defaultServerUrl;
}

class ServerConfig {
  /// URL pelayan yang digunakan oleh halaman ini.
  final String url;

  /// True jika URL datang daripada parameter URL atau localStorage
  /// (bukan nilai binaan), supaya pautan sertai membawa URL yang sama.
  final bool overridden;
  const ServerConfig(this.url, this.overridden);
  bool get isLocal => url == localServerKeyword;

  static ServerConfig current() {
    final param = normalizeServerUrl(serverParamFrom(Uri.base));
    if (param != null) {
      localWrite(storageKey, param);
      return ServerConfig(param, true);
    }
    final stored = normalizeServerUrl(localRead(storageKey));
    if (stored != null) return ServerConfig(stored, true);
    return ServerConfig(
      normalizeServerUrl(buildServerUrl) ?? defaultServerUrl,
      false,
    );
  }

  /// Padam penimpaan yang disimpan (kembali kepada nilai lalai).
  static void clearOverride() => localWrite(storageKey, '');
}
