@echo off
rem Launch the Vite dev server for FCSifier.
rem Run from anywhere; this script cd's into its own folder first.
pushd "%~dp0"
call npm run dev
popd
