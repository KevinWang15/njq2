#!/usr/bin/env sh
NJQ2_OUTPUT_FORMAT=yaml njq2 "input" package.json
NJQ2_OUTPUT_FORMAT=yaml njq2 "input" package.json package-lock.json
NJQ2_OUTPUT_DOCUMENT_SEPARATOR="=====" NJQ2_OUTPUT_FORMAT=yaml njq2 "input" package.json package-lock.json
cat package.json | njq2 "input"
cat package.json | njq2 ".dependencies"
cat package.json | NJQ2_MODE=JsonMergePatch njq2 '{"dependencies":{"yaml":"xx","AA":"123"}}'
NJQ2_OUTPUT_FORMAT=yaml NJQ2_MODE=JsonMergePatch njq2 '{"dependencies":{"yaml":"xx","AA":"123"}}' package.json
