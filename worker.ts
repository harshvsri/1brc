import { WeatherInfo } from "./script.ts";

self.onmessage = async (e) => {
  const { offset, chunkSize, filePath } = e.data;

  const res = await readCSV(offset, chunkSize, filePath);
  self.postMessage(res);
  self.close();
};

async function readCSV(offset: number, chunkSize: number, filePath: string) {
  const buffer = new Uint8Array(chunkSize);
  const file = await Deno.open(filePath, { read: true });
  await file.seek(offset, Deno.SeekMode.Start);
  await file.read(buffer);
  file.close();

  const data = new TextDecoder().decode(buffer);
  const tempMap = new Map<string, WeatherInfo>(); // [key: {min, max, sum, len}]
  for (const line of data.split("\n")) {
    if (line.length === 0) continue;
    const [city, tempStr] = line.split(";");
    const temp = parseInt(tempStr);

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
  return tempMap;
}
