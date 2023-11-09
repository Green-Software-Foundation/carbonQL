#!/bin/bash

echo "Starting impact tests"
prefix="examples/impls/test/";
for file in examples/impls/test/*;
do
echo ""
echo executing $file, outfile is ${file#"$prefix"}
echo ""
npx ts-node impact-engine.ts --impl $file --ompl examples/ompls/${file#"$prefix"}
done
exit 0
