package helpers

import (
	"fmt"
	"os"
	"strings"
)

func Verify(fPath string, chunks *[12]int) error {
	f, err := os.Open(fPath)
	if err != nil {
		return err
	}

	for _, chunk := range chunks {
		buffer := make([]byte, chunk)
		f.Read(buffer)
		fmt.Printf("Buffer len:%v and Linebreak index:%v\n", len(buffer), strings.Index(string(buffer), "\n"))
		fmt.Println(string(buffer))
		fmt.Println()
	}
	return nil
}
