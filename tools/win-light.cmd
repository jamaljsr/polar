@echo off

:: This script is needed to run electron on windows with dark mode. There's currently a bug in
:: electron v6 when used on Win10 with dark mode enabled and react/redux devtools installed.
:: The electron window is never displayed.
:: See https://github.com/electron/electron/issues/19468#issuecomment-532147413
:: This file can be removed when the electron bug is fixed

:: Use "win-light.bat 1" to switch to light mode
:: Use "win-light.bat 0" to switch to dark mode
SET VAL=%1

IF "%VAL%" == "" GOTO END
IF "%VAL%" == "0" ECHO Enabling Windows Dark Mode
IF "%VAL%" == "1" ECHO Disbling Windows Dark Mode

REG ADD HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme /t REG_DWORD /d %VAL% /f

:END
