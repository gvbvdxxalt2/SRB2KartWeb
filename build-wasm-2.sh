#!/bin/bash
source ./load-emsdk.sh

# Get absolute path for the project root
ROOT_DIR=$(pwd)

# Define toolchain and vcpkg paths
EM_TOOLCHAIN="$ROOT_DIR/emsdk/upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake"
VCPKG_INC="$ROOT_DIR/vcpkg_installed/wasm32-emscripten/include"
VCPKG_LIB="$ROOT_DIR/vcpkg_installed/wasm32-emscripten/lib"

# Clean old build cache completely
# rm -rf build-wasm
mkdir -p build-wasm
cd build-wasm

emcmake cmake .. \
    --log-level=VERBOSE \
    -DEMSCRIPTEN=1 \
    -DCMAKE_TOOLCHAIN_FILE="$EM_TOOLCHAIN" \
    -DCMAKE_C_COMPILER="$ROOT_DIR/emsdk/upstream/emscripten/emcc" \
    -DCMAKE_CXX_COMPILER="$ROOT_DIR/emsdk/upstream/emscripten/em++" \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_GME=1 -DUSE_OPENMPT=1 -DUSE_UPNP=0 -DUSE_SDL2_NET=1 -DUSE_PHYSFS=0 -DUSE_ZLIB=1 -DUSE_LIBPNG=1 -DUSE_CURL=0 \
    -DSRB2_CONFIG_HAVE_CURL=OFF \
    -DCMAKE_EXECUTABLE_SUFFIX=".js" \
    "-DCMAKE_C_FLAGS=-DEMSCRIPTEN -flto -msimd128 -DMASTERSERVER -DHAVE_SDLNET -std=gnu17 -s USE_SDL=2 -s SDL2_MIXER_FORMATS=['ogg','wav'] -s USE_SDL_MIXER=2 -s USE_SDL_IMAGE=2 -s USE_SDL_TTF=2 -s USE_SDL_NET=2 -s USE_ZLIB=1 -I$VCPKG_INC" \
    "-DCMAKE_CXX_FLAGS=-DEMSCRIPTEN -O3 -flto -msimd128 -s USE_SDL=2 -s SDL2_MIXER_FORMATS=['ogg','wav'] -s USE_SDL_MIXER=2 -s USE_SDL_IMAGE=2 -s USE_SDL_TTF=2 -s USE_SDL_NET=2 -s USE_ZLIB=1 -I$VCPKG_INC" \
    "-DCMAKE_EXE_LINKER_FLAGS=-O3 -flto -msimd128 --trace -s EMBIND_STD_STRING_IS_UTF8=1 -s SDL2_MIXER_FORMATS=['ogg','wav'] -o bin/srb2kart.js -DEMSCRIPTEN -DHAVE_SDLNET -s STACK_SIZE=5242880 -s USE_SDL=2 -s USE_SDL_IMAGE=2 -s USE_SDL_MIXER=2 -s USE_SDL_TTF=2 -s USE_ZLIB=1 -s USE_SDL_NET=1 -s USE_LIBPNG=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString','stringToUTF8','lengthBytesUTF8','intArrayFromString','FS','stackAlloc','callMain','wasmMemory'] -s ENVIRONMENT=web,node -lidbfs.js -L$VCPKG_LIB" \
    -DZLIB_FOUND=TRUE \
    -DZLIB_LIBRARY=z \
    -DPNG_FOUND=TRUE \
    -DPNG_LIBRARY=png \
    -DZLIB_FOUND=TRUE -DZLIB_INCLUDE_DIR="$ROOT_DIR/emsdk/upstream/emscripten/cache/sysroot/include" \
    -DPNG_FOUND=TRUE -DPNG_PNG_INCLUDE_DIR="$ROOT_DIR/emsdk/upstream/emscripten/cache/sysroot/include" \
    -DSDL2_FOUND=TRUE -DSDL2_LIBRARIES=SDL2 -DSDL2_DIR="$ROOT_DIR/emsdk/upstream/emscripten/cache/sysroot/lib/cmake/SDL2" \
    -DSDL2_CONFIG_INCLUDE_DIR="$ROOT_DIR/emsdk/upstream/emscripten/cache/sysroot/include"

emmake make -j$(nproc)