package main

import (
	"1brc-go/helpers"
	"fmt"
	"os"
	"sync"
)

func main() {
	// Get the file ie to be parsed.
	args := os.Args
	if len(args) == 1 {
		panic("File path required.")
	}
	fPath := args[1]

	// Chunkify the data.
	chunks, err := helpers.Chunkify(fPath)
	if err != nil {
		fmt.Println(err)
		return
	}
	// fmt.Println("Chunks:", chunks)

	wg := sync.WaitGroup{}
	start, end := 0, 0
	for _, chunk := range chunks {
		end = start + chunk
		wg.Add(1)
		go helpers.ReadFile(fPath, start, end, &wg)
		start = end
	}
	wg.Wait()

	fmt.Println("File processing done.")
}
