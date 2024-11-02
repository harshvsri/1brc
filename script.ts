function chunkify(fileSize: number, chunkCount: number): number[] {
  const chunks: number[] = [];
  for (let i = chunkCount; i > 0; i--) {
    const chunk = Math.round(fileSize / i);
    chunks.push(chunk);
    fileSize -= chunk;
  }
  return chunks;
}

// Now we need to adjust the chunk size.
async function adjustChunk(chunks: number[], filePath: string) {
  let offset = 0;
  for (const [index, chunkSize] of chunks.entries()) {
    if (index === 0) {
      offset += chunkSize; // Not inclusive.
      continue;
    }

    // File I/O
    const file = await Deno.open(filePath, { read: true });
    const buffer = new Uint8Array(chunkSize);
    await file.seek(offset, Deno.SeekMode.Start);
    await file.read(buffer);
    file.close();

    // Now we need to find \n ie 10 in ASCII.
    const newlineIndex = buffer.indexOf(10);
    if (newlineIndex === -1) {
      console.warn(`No newline found in chunk ${index}`);
      offset += chunkSize;
      continue;
    }
    const adjustment = newlineIndex + 1; // Include the newline character
    chunks[index - 1] += adjustment;
    chunks[index] -= adjustment;

    offset += chunkSize;
  }
}

async function _readContent(chunks: number[], filePath: string) {
  let offset = 0;
  for (const chunkSize of chunks) {
    using file = await Deno.open(filePath, { read: true });
    const buffer = new Uint8Array(chunkSize);
    await file.seek(offset, Deno.SeekMode.Start);
    await file.read(buffer);

    const text = new TextDecoder().decode(buffer);
    console.log(text);

    offset += chunkSize;
  }
}

// Global map to store aggregated results
export interface WeatherInfo {
  min: number;
  max: number;
  sum: number;
  count: number;
}
const globalTempMap = new Map<string, WeatherInfo>();

// Function to merge worker results into global map
function mergeIntoGlobalMap(subMap: Map<string, WeatherInfo>) {
  for (const [city, { min, max, sum, count }] of subMap) {
    if (globalTempMap.has(city)) {
      const prevInfo = globalTempMap.get(city)!;
      globalTempMap.set(city, {
        min: Math.min(prevInfo.min, min),
        max: Math.max(prevInfo.max, max),
        sum: prevInfo.sum + sum,
        count: prevInfo.count + count,
      });
    } else {
      globalTempMap.set(city, { min, max, sum, count });
    }
  }
}

async function execTaskInParallel(chunks: number[], filePath: string) {
  let offset = 0;
  const workers: Worker[] = [];

  const workerPromises = chunks.map((chunkSize) => {
    return new Promise<void>((resolve) => {
      const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
        type: "module",
      });

      worker.postMessage({ offset, chunkSize, filePath });

      worker.onmessage = (e) => {
        const subTempMap = e.data;
        mergeIntoGlobalMap(subTempMap);
        resolve();
        worker.terminate();
      };

      workers.push(worker);
      offset += chunkSize;
    });
  });

  await Promise.allSettled(workerPromises);
  return globalTempMap;
}

Deno.bench({
  name: "1mrc: 1 Million Row Challenge",
  fn: async () => {
    const filePath = "measurements.txt";
    const fileInfo = await Deno.stat(filePath);
    const fileSize = fileInfo.size;
    const chunks = chunkify(fileSize, 6);
    await adjustChunk(chunks, filePath);

    await execTaskInParallel(chunks, filePath);
  },
});
