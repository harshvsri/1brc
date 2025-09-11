import os from "node:os";
import { adjustChunk, chunkify } from "./chunk.ts";
const CPU_COUNT = os.cpus().length;
console.log("CPU Count:", CPU_COUNT);

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
            workers.push(worker);
            offset += chunkSize;

            worker.onmessage = (e) => {
                const subTempMap = e.data;
                mergeIntoGlobalMap(subTempMap);
                resolve();
                worker.terminate();
            };
        });
    });

    await Promise.allSettled(workerPromises);
    return globalTempMap;
}

async function main() {
    const defaultPath = "measurements.txt";
    let filePath = Deno.args[0];
    if (!filePath) {
        filePath = defaultPath;
        console.log(`No path provided, defaulting to ${defaultPath}.`);
    }

    const fileInfo = await Deno.stat(filePath);
    const fileSize = fileInfo.size;

    const chunks = chunkify(fileSize, CPU_COUNT);
    await adjustChunk(chunks, filePath);
    const globalTempMap = await execTaskInParallel(chunks, filePath);

    for (const [key, { min, max, sum, count }] of globalTempMap) {
        console.log(`${key}: min(${min}) max(${max}) average(${Math.floor(sum / count)})`)
    }
}
main();
