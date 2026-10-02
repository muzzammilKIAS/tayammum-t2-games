class AdventureLevel {
  final int id;
  final String title;
  final String group;
  final List<int> topics;
  final List<String> zones;
  const AdventureLevel(
    this.id,
    this.title,
    this.group,
    this.topics,
    this.zones,
  );
  bool get isFinal => id == adventureLevels.length;
}

/// Zon (0-2) bagi satu pintu, dibahagi sama rata mengikut bilangan pintu.
int zoneForGate(int checkpoint, int gates) =>
    gates <= 0 ? 0 : (checkpoint * 3 ~/ gates).clamp(0, 2);

const adventureLevels = [
  AdventureLevel(
    1,
    'Asas Tayammum',
    'Kesan tahap — semua pelajar',
    [1],
    ['Padang Pasir', 'Oasis Dalil', 'Khemah Syarat'],
  ),
  AdventureLevel(
    2,
    'Tebus Langkah Tayammum',
    'Pemulihan — pelajar yang perlu mengukuhkan asas',
    [2],
    ['Bukit Pasir', 'Lembah Rukun', 'Jalan Tertib'],
  ),
  AdventureLevel(
    3,
    'Klinik Hukum Tayammum',
    'Pengayaan KBAT — pelajar yang telah menguasai asas',
    [3],
    ['Perkhemahan', 'Perigi Keputusan', 'Mahligai Hikmah'],
  ),
];

const avatarNames = [
  'Pelajar • Adam',
  'Pelajar • Hana',
  'Perantau • Rayyan',
  'Perantau • Maryam',
];

enum QuestionType {
  multipleChoice,
  arabicToMalay,
  malayToArabic,
  matchWord,
  matchPhrase,
  completeSentence,
  wordClass,
  gender,
  number,
  demonstrative,
  relativePronoun,
  pastTense,
  presentTense,
  preposition,
  adverb,
  adjective,
  derivation,
  pattern,
  terminology,
  reading,
}

class KnowledgeQuestion {
  final String id,
      questionArabic,
      questionMalay,
      correctAnswer,
      explanation,
      sourceReference;
  final int topicId, levelId;
  final QuestionType type;
  final List<String> options;
  final Map<String, String> pairs;
  final String difficulty;
  const KnowledgeQuestion({
    required this.id,
    required this.topicId,
    required this.levelId,
    required this.type,
    required this.questionArabic,
    required this.questionMalay,
    required this.options,
    required this.correctAnswer,
    required this.explanation,
    required this.sourceReference,
    this.pairs = const {},
    this.difficulty = 'normal',
  });
  bool get isMatching =>
      type == QuestionType.matchWord || type == QuestionType.matchPhrase;
}
