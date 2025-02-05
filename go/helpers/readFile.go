package helpers

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"sync"
)

func ReadFile(fPath string, start int, end int, wg *sync.WaitGroup) {
	defer wg.Done()
	f, err := os.Open(fPath)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer f.Close()

	f.Seek(int64(start), 0) //io.SeekStart
	r := bufio.NewReader(f)

	tempMap := make(map[string][4]int)
	bytesToRead := end - start
	bytesRead := 0
	for bytesRead < bytesToRead {
		line, err := r.ReadString(10)
		if err != nil {
			fmt.Println(err)
			return
		}

		bytesRead += len(line)
		breakIdx := strings.Index(line, ";")

		city := line[:breakIdx]
		temp := stringToIntParser(line[breakIdx+1 : len(line)-1])

		v, exists := tempMap[city]
		if !exists {
			tempMap[city] = [4]int{temp, temp, temp, 1}
		} else {
			prevMin, prevMax, prevSum, prevCount := v[0], v[1], v[2], v[3]
			tempMap[city] = [4]int{min(prevMin, temp), max(prevMax, temp), prevSum + temp, prevCount + 1}
		}
	}

	// fmt.Printf("Parsed %vB [start:%v, end:%v]\n", end-start, start, end)
	return
}

func stringToIntParser(input string) (output int) {
	var isNegativeNumber bool
	if input[0] == '-' {
		isNegativeNumber = true
		input = input[1:]
	}

	// subtracting int('0') is the ascii correction
	switch len(input) {
	case 3:
		output = int(input[0])*10 + int(input[2]) - int('0')*11
	case 4:
		output = int(input[0])*100 + int(input[1])*10 + int(input[3]) - (int('0') * 111)
	}

	if isNegativeNumber {
		return -output
	}
	return
}
