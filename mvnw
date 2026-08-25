#!/bin/sh
# Wrapper to run maven wrapper from the backend directory
cd "$(dirname "$0")/backend" && ./mvnw "$@"
