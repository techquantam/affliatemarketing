@echo off
rem Wrapper to run maven wrapper from the backend directory
cd /d "%~dp0backend"
call mvnw.cmd %*
