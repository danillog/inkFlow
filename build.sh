#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "Compiling C++ to WebAssembly..."

source /home/danillo/emsdk/emsdk_env.sh


# Get the directory of the script itself
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Define paths relative to the script's location
WASM_SRC_DIR="$SCRIPT_DIR/wasm"
OUTPUT_DIR="$SCRIPT_DIR/src/wasm-modules"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Remove previous build artifacts
rm -f "$OUTPUT_DIR"/ink_engine.wasm "$OUTPUT_DIR"/ink_engine.js

# Compile ink_engine.cpp
# The -o path must be relative to the current working directory, or absolute.
# We will use the absolute path defined in OUTPUT_DIR.
emcc "$WASM_SRC_DIR"/ink_engine.cpp -o "$OUTPUT_DIR"/ink_engine.js \
    -s WASM=1 \
    -s EXPORT_ES6=1 \
    --bind \
    -O3

echo "Compilation finished. Check the '$OUTPUT_DIR' directory for ink_engine.wasm and ink_engine.js."
