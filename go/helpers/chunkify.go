package helpers

import (
	"errors"
	"os"
)

const CHUNK_COUNT = 12

func Chunkify(fPath string) ([CHUNK_COUNT]int, error) {
	chunks := [CHUNK_COUNT]int{}
	fInfo, err := os.Stat(fPath)
	if err != nil {
		return chunks, err
	}

	fSize := int(fInfo.Size())
	// fmt.Println("File size:", fSize)
	chunkify(fSize, &chunks)

	err = adjustChunk(fPath, &chunks)
	if err != nil {
		return chunks, err
	}

	return chunks, nil
}

func chunkify(fSize int, chunks *[CHUNK_COUNT]int) {
	chunkCount := CHUNK_COUNT
	for i := chunkCount; i > 0; i-- {
		chunk := fSize / i
		chunks[chunkCount-i] = int(chunk)
		fSize -= chunk
	}
}

func adjustChunk(fPath string, chunks *[CHUNK_COUNT]int) error {
	f, err := os.Open(fPath)
	if err != nil {
		return err
	}
	defer f.Close()

	buffer := [32]byte{}

	offset := chunks[0]
	for i := 1; i < len(chunks); i++ {
		f.Seek(int64(offset), 0)
		_, rErr := f.Read(buffer[:])
		if rErr != nil {
			return rErr
		}

		lineBreakIndex := getLineBreakIndex(&buffer)
		if lineBreakIndex == -1 {
			return errors.New("WTF how is this happening.")
		}

		offset += chunks[i]
		chunks[i-1] += lineBreakIndex + 1
		chunks[i] -= lineBreakIndex + 1
	}
	return nil
}

func getLineBreakIndex(buffer *[32]byte) int {
	for index := 0; index < len(buffer); index++ {
		if buffer[index] == 10 {
			return index
		}
	}
	return -1
}
