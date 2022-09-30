# This file is used for testing only

# To perform the test, run `cmake .` at the root of the project tree followed
# by `ctest .`

cmake_minimum_required(VERSION 3.0)

# Do not check any compiler
project(editorconfig-core-js NONE)
find_program(NODE node DOC "Node.js command")

enable_testing()

set(EDITORCONFIG_CMD ${NODE} ${PROJECT_SOURCE_DIR}/bin/editorconfig)
add_subdirectory(tests)
