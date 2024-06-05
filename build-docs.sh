#!/usr/bin/env bash

npm i -g gitbook-summary

## copy our summary to a tmp
cp docs/src/SUMMARY.md docs/src/SUMMARY.tmp.md
rm docs/src/SUMMARY.md

## pipe up to the api reference cutoff
awk '/## API Reference/ {print; print ""; exit} {print}' docs/src/SUMMARY.tmp.md > docs/src/SUMMARY.md
rm docs/src/SUMMARY.tmp.md

# typedoc generates api reference to the reference folder
typedoc

# we generate a summary of the reference folder
cd docs/src/reference && book sm 

# we append the reference summary to the main summary correcting the relative link
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -E -i '' 's/\]\(([^)]+)\)/\](\.\/reference\/\1)/g' SUMMARY.md
    sed -i '' '/^-/ s/-/#/g' SUMMARY.md
else
    sed -E -i 's/\]\(([^)]+)\)/\](\.\/reference\/\1)/g' SUMMARY.md
    sed -i '/^-/ s/-/#/g' SUMMARY.md
fi
sed 1,2d SUMMARY.md >> ../SUMMARY.md
rm SUMMARY.md