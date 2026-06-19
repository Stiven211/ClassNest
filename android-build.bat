@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "GRADLE_OPTS=-Dorg.gradle.java.home=%JAVA_HOME%"
echo JAVA_HOME=%JAVA_HOME%
cd android
gradlew clean assembleDebug --no-daemon --stacktrace
pause