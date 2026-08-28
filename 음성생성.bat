@echo off
cd /d "%~dp0"
echo 질문 음성(mp3) 일괄 생성을 시작합니다. 인터넷 연결이 필요합니다.
node tools\export-texts.mjs
python tools\generate_audio.py
echo.
echo 완료! 앱을 새로고침하면 자연스러운 음성이 적용됩니다.
pause
