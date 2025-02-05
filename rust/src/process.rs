use core::str;
use std::{
    collections::HashMap,
    fs::File,
    io::{BufRead, BufReader, Seek, SeekFrom},
};

pub fn process_chunk(start: u64, end: u64, path: &str) {
    let mut file = File::open(path).expect(
        "File name should be valid with proper permissions and must be present in root dir.",
    );
    file.seek(SeekFrom::Start(start)).unwrap();

    let mut reader = BufReader::new(file);
    let mut buf = Vec::new();

    let mut temp_map: HashMap<String, (i32, i32, i32, i32)> = HashMap::new();
    let mut bytes_to_read = end - start;

    while bytes_to_read > 0 {
        let bytes_read = reader.read_until(b'\n', &mut buf).unwrap();
        bytes_to_read -= bytes_read as u64;

        let line = str::from_utf8(&buf[..bytes_read - 1]).unwrap();

        let (city, temp) = line.split_once(";").unwrap();
        let temp = {
            let (before, after) = temp.split_once(".").unwrap();
            let before = before.parse::<i32>().unwrap();
            let after = after.parse::<i32>().unwrap();
            (before * 10) + after
        };

        temp_map
            .entry(city.to_string())
            .and_modify(|(low, high, sum, count)| {
                *low = temp.min(*low);
                *high = temp.max(*high);
                *sum += temp;
                *count += 1;
            })
            .or_insert((1000, -1000, 0, 1));

        buf.clear();
    }

    let count = temp_map
        .iter()
        .fold(0, |acc, (_, (_, _, _, count))| acc + count);
    println!("Total computed item: {}", count);
}
