import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// Label kebolehcapaian dan tooltip Material dalam Bahasa Melayu, supaya tiada
/// teks Inggeris (cth "Dismiss", "Back", "Copy") muncul kepada pengguna atau
/// pembaca skrin. Ditumpangkan pada MaterialLocalizations lalai.
class MsMaterialLocalizations extends DefaultMaterialLocalizations {
  const MsMaterialLocalizations();

  static const LocalizationsDelegate<MaterialLocalizations> delegate =
      _MsDelegate();

  @override
  String get modalBarrierDismissLabel => 'Tutup';
  @override
  String get scrimLabel => 'Latar';
  @override
  String scrimOnTapHint(String modalRouteContentName) =>
      'Tutup $modalRouteContentName';
  @override
  String get backButtonTooltip => 'Kembali';
  @override
  String get closeButtonTooltip => 'Tutup';
  @override
  String get closeButtonLabel => 'TUTUP';
  @override
  String get okButtonLabel => 'OK';
  @override
  String get cancelButtonLabel => 'BATAL';
  @override
  String get continueButtonLabel => 'TERUSKAN';
  @override
  String get showMenuTooltip => 'Tunjuk menu';
  @override
  String get moreButtonTooltip => 'Lagi';
  @override
  String get deleteButtonTooltip => 'Padam';
  @override
  String get clearButtonTooltip => 'Kosongkan';
  @override
  String get copyButtonLabel => 'Salin';
  @override
  String get cutButtonLabel => 'Potong';
  @override
  String get pasteButtonLabel => 'Tampal';
  @override
  String get selectAllButtonLabel => 'Pilih semua';
  @override
  String get lookUpButtonLabel => 'Cari';
  @override
  String get searchWebButtonLabel => 'Cari di web';
  @override
  String get shareButtonLabel => 'Kongsi';
  @override
  String get popupMenuLabel => 'Menu timbul';
  @override
  String get dialogLabel => 'Dialog';
  @override
  String get alertDialogLabel => 'Amaran';
  @override
  String get expandedIconTapHint => 'Runtuhkan';
  @override
  String get collapsedIconTapHint => 'Kembangkan';
  @override
  String get expandedHint => 'Diruntuhkan';
  @override
  String get collapsedHint => 'Dikembangkan';
  @override
  String get openAppDrawerTooltip => 'Buka menu navigasi';
  @override
  String get nextPageTooltip => 'Halaman seterusnya';
  @override
  String get previousPageTooltip => 'Halaman sebelumnya';
  @override
  String remainingTextFieldCharacterCount(int remaining) => switch (remaining) {
    0 => 'Tiada aksara berbaki',
    1 => '1 aksara berbaki',
    _ => '$remaining aksara berbaki',
  };
  @override
  String get refreshIndicatorSemanticLabel => 'Muat semula';
}

class _MsDelegate extends LocalizationsDelegate<MaterialLocalizations> {
  const _MsDelegate();
  @override
  bool isSupported(Locale locale) => true;
  @override
  Future<MaterialLocalizations> load(Locale locale) =>
      SynchronousFuture<MaterialLocalizations>(const MsMaterialLocalizations());
  @override
  bool shouldReload(_MsDelegate old) => false;
}
