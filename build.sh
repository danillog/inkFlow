#!/bin/bash
echo "Compiling C++ to WebAssembly..."

# Define the output directory within src
OUTPUT_DIR="inkflow/src/wasm-modules"
mkdir -p "$OUTPUT_DIR"

# Remove previous build artifacts from the new location
rm -f "$OUTPUT_DIR"/ink_engine.wasm "$OUTPUT_DIR"/ink_engine.js

# Compile ink_engine.cpp
emcc wasm/ink_engine.cpp -o "$OUTPUT_DIR"/ink_engine.js \
    -s WASM=1 \
    -s EXPORT_ES6=1 \
    --bind \
    -O3

echo "Compilation finished. Check the '$OUTPUT_DIR' directory for ink_engine.wasm and ink_engine.js."
