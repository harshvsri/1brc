# 1BRC - A Polyglot Adventure

My attempt at tackling the [1 Billion Row Challenge](https://github.com/gunnarmorling/1brc) across multiple languages - because why solve it once when you can solve it multiple times?

## What is 1BRC?

The 1 Billion Row Challenge is a fun exploration of how fast we can aggregate one billion rows of temperature data. The task: parse a file containing temperature measurements and compute the min, mean, and max temperature per weather station.

## Implementations

- **Go** - `go/`
- **Python** - `python/`
- **Rust** - `rust/`
- **TypeScript (Deno)** - `ts/`

## Generating Test Data

The test data generator is located in `.data/CreateMeasurements.java`.

```bash
cd .data
java CreateMeasurements.java 1000000000
```

This will generate approximately **14 GB** of data, the output file will be created in the `.data/` directory.
