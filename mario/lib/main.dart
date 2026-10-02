import 'package:flutter/material.dart';
import 'game/data/question_bank.dart';
import 'game/game_routes.dart';
import 'game/screens/home_screen.dart';
import 'game/widgets/ms_localizations.dart';
import 'game/widgets/adventure_style.dart';

/// Pengembaraan Tayammum: game platform solo dan mod kelas langsung
/// (guru memaparkan perlumbaan, pelajar sertai dengan kod/QR; pelayan di
/// mario/server). Soalan daripada assets/data/bank_tayammum.json
/// (Tingkatan 2, DSKP KSSM SK 4.10).
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await QuestionBank.ensureLoaded();
  runApp(const TayammumApp());
}

class TayammumApp extends StatelessWidget {
  const TayammumApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Pengembaraan Tayammum',
    debugShowCheckedModeBanner: false,
    theme: adventureTheme(),
    locale: const Locale('ms'),
    supportedLocales: const [Locale('ms')],
    localizationsDelegates: const [
      MsMaterialLocalizations.delegate,
      DefaultWidgetsLocalizations.delegate,
    ],
    onGenerateRoute: adventureRoute,
    home: const AdventureHomeScreen(),
  );
}
