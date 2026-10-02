# Konteks binaan ialah folder mario/ (lihat dockerContext dalam render.yaml di
# akar repo) supaya packages/game_shared, kebergantungan laluan bagi
# server/pubspec.yaml, boleh disalin.
FROM dart:stable AS build
WORKDIR /app
COPY packages/game_shared /app/packages/game_shared
COPY server/pubspec.yaml server/pubspec.lock* /app/server/
WORKDIR /app/server
RUN dart pub get
COPY server /app/server
RUN dart pub get --offline
RUN dart compile exe bin/main.dart -o /app/server/bin/game_server

# scratch (bukan debian-slim) supaya menyalin /runtime/ ke / tidak berlanggar
# dengan pautan simbolik merged-usr Debian. Pelayan tidak membuat panggilan
# HTTPS keluar, jadi sijil CA tidak diperlukan.
FROM scratch
COPY --from=build /runtime/ /
COPY --from=build /app/server/bin/game_server /app/game_server
EXPOSE 8080
CMD ["/app/game_server"]
