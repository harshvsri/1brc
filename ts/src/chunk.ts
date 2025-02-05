export function chunkify(fileSize: number, chunkCount: number): number[] {
    const chunks: number[] = [];
    for (let i = chunkCount; i > 0; i--) {
        const chunk = Math.round(fileSize / i);
        chunks.push(chunk);
        fileSize -= chunk;
    }
    return chunks;
}

// Now we need to adjust the chunk size.
export async function adjustChunk(chunks: number[], filePath: string) {
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

export async function readChunks(chunks: number[], filePath: string) {
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
