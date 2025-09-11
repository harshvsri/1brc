import { WeatherInfo } from "./script.ts";

declare var self: Worker;
self.onmessage = async (e) => {
    const { offset, chunkSize, filePath } = e.data;

    const res = await readCSV(offset, chunkSize, filePath);
    self.postMessage(res);
    self.close();
};

async function readCSV(offset: number, chunkSize: number, filePath: string) {
    const file = await Deno.open(filePath, { read: true });
    await file.seek(offset, Deno.SeekMode.Start);
    const buffer = new Uint8Array(1024); // Make it 1KB
    const decoder = new TextDecoder();

    const tempMap = new Map<string, WeatherInfo>(); // [key: {min, max, sum, len}]
    let currText = "";
    let bytesRead: number | null = 0;

    function updateTemperatureData(text: string): void {
        if (text.length === 0) return;
        const seperatorIndex = text.indexOf(";");
        const city = text.slice(0, seperatorIndex);
        const temp = parseInt(text.slice(seperatorIndex + 1));

        if (tempMap.has(city)) {
            const { min, max, sum, count } = tempMap.get(city)!;
            tempMap.set(city, {
                min: Math.min(min, temp),
                max: Math.max(max, temp),
                sum: sum + temp,
                count: count + 1,
            });
        } else {
            tempMap.set(city, { min: temp, max: temp, sum: temp, count: 1 });
        }
    }

    while (true) {
        bytesRead = await file.read(buffer);
        if (bytesRead === null) break;
        chunkSize -= bytesRead ?? 0;
        // We only need to read stream till chunkSize
        if (chunkSize < bytesRead) bytesRead = chunkSize;

        const text = currText + decoder.decode(buffer.slice(0, bytesRead));
        const lines = text.split("\n");
        currText = lines.pop() ?? "";

        for (const line of lines) {
            updateTemperatureData(line);
        }
    }
    // We need to check currText since it may have data.
    updateTemperatureData(currText);
    file.close();

    return tempMap;
}
