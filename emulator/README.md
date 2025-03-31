export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
export FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199"

lsof -ti:8085 | xargs kill

firebase emulators:start

go run start.go

ffmpeg -i /Users/vitaliyshaban/Home/a46bfefbbeb06d8ac6de0e0d1933fc164933ebc0d8a187a00d2a6bc634289cdc.mp4 -vn -ar 16000 -ac 2 -ab 192k -f mp3 audio.flac