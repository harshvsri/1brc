use std::{
    fs::File,
    io::{Read, Seek, SeekFrom},
};

pub fn chunkify(size: u64, parts: u64) -> Vec<u64> {
    (1..=parts)
        .rev()
        .scan(size, |state, remaining_parts| {
            let chunksize = *state / remaining_parts;
            *state -= chunksize;
            Some(chunksize)
        })
        .collect::<Vec<_>>()
}

pub fn adjust_chunk(chunks: &mut Vec<u64>) {
    let mut start: u64 = 0;

    for val in chunks.iter_mut() {
        let curr = *val;
        *val = start;
        start += curr;
    }
    chunks.push(start);
}

pub fn adjust_chunk_offset(path: &str, chunks: &mut Vec<u64>) {
    let mut file = File::open(path).expect(
        "File name should be valid with proper permissions and must be present in root dir.",
    );
    let mut buf = vec![0u8; 50];

    let len = chunks.len();
    for offset in chunks.iter_mut().skip(1).take(len - 2) {
        file.seek(SeekFrom::Start(*offset))
            .expect("Failed to seek file from offset.");
        let _ = file.read_exact(&mut buf);

        for (idx, val) in buf.iter().enumerate() {
            if *val == 10 {
                *offset += (idx + 1) as u64;
                break;
            }
        }
    }
}

pub fn _read_chunks(path: &str, chunks: &mut Vec<u64>) {
    let mut file = File::open(path).expect(
        "File name should be valid with proper permissions and must be present in root dir.",
    );

    for pair in chunks.windows(2) {
        let mut buf = vec![0; (pair[1] - pair[0]) as usize];

        file.seek(SeekFrom::Start(pair[0]))
            .expect("Failed to seek file from offset.");
        let _ = file.read_exact(&mut buf);

        let content =
            String::from_utf8(buf).expect("Buffer should contain only valid utf8 characters.");
        println!("{}", content);
    }
}
