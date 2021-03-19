@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION

REM Reads the configuration file line by line
REM and convert any export statements into set statements
REM (allows reuse of variables)
FOR /F "tokens=*" %%A IN (configuration) DO CALL :convertExportToSet %%A 

IF NOT EXIST %QUARTO_PACKAGE_DIR% (
	MKDIR %QUARTO_PACKAGE_DIR%
) 
PUSHD %QUARTO_PACKAGE_DIR%

IF NOT EXIST %QUARTO_DIST_DIR% (
	MKDIR %QUARTO_DIST_DIR%
)
PUSHD %QUARTO_DIST_DIR%

IF NOT EXIST %QUARTO_BIN_DIR% (
	MKDIR %QUARTO_BIN_DIR% 
)
PUSHD %QUARTO_BIN_DIR%

ECHO Copying Quarto command...
REM Create quarto cmd
COPY ..\..\scripts\windows\quarto.cmd quarto.cmd
ECHO.

ECHO Downloading Dependencies...
ECHO Deno
REM Download Deno
SET DENO_FILE="deno-x86_64-pc-windows-msvc.zip"
SET DENO_URL="https://github.com/denoland/deno/releases/download/%DENO%/%DENO_FILE%"
CURL --fail -L %DENO_URL% -o %DENO_FILE%
TAR -xvf %DENO_FILE%
DEL %DENO_FILE%
ECHO .

ECHO Pandoc
REM download Pandoc
SET PANDOC_FILE="pandoc-%PANDOC%-windows-x86_64.zip"
SET PANDOC_URL="https://github.com/jgm/pandoc/releases/download/%PANDOC%/%PANDOC_FILE%"
CURL --fail -L %PANDOC_URL% -o %PANDOC_FILE%
TAR -xvf %PANDOC_FILE%
MOVE /Y pandoc-%PANDOC%\pandoc.exe pandoc.exe
DEL %PANDOC_FILE%
RMDIR/S /Q pandoc-%PANDOC%
ECHO.
ECHO.

ECHO Dart-Sass
REM download Dart-Sass
SET DART_SASS_DIR="dart-sass"
SET DART_SASS_FILE="dart-sass-%DARTSASS%-windows-x64.zip"
SET DART_SASS_URL="https://github.com/sass/dart-sass/releases/download/%DARTSASS%/%DART_SASS_FILE%"
CURL --fail -L %DART_SASS_URL% -o %DART_SASS_FILE%
RMDIR/S /Q %DART_SASS_DIR%
TAR -xvf %DART_SASS_FILE%
DEL %DART_SASS_FILE%
ECHO.
ECHO.

SET FINAL_BIN_PATH=%cd%

POPD
POPD
POPD

SET QUARTO_DENO_EXTRA_OPTIONS="--reload"
%FINAL_BIN_PATH%\quarto --version

ECHO NOTE: To use quarto please use quarto-cmd (located in this folder) or add the following path to your PATH
ECHO %FINAL_BIN_PATH%


GOTO :eof

REM Reads each line of a file and converts any exports into SETs
:convertExportToSet
SET LINE=%*
SET FIND=export 
SET REPLACE=

IF "%LINE:~0,7%"=="%FIND%" (
	CALL SET LINE=%%LINE:!FIND!=!REPLACE!%%
	CALL SET %%LINE%%
)



:eof