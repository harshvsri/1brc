pub mod chunk;
pub mod process;

use chunk::{adjust_chunk, adjust_chunk_offset, chunkify};
use process::process_chunk;
use rayon::prelude::*;
use std::{fs, thread};

fn main() {
    let cpu_count = thread::available_parallelism().unwrap().get();
    println!("CPU count: {}", cpu_count);

    let path = "measurements.txt";
    let file_info = fs::metadata(path)
        .expect("Failed to read file metadata, measurements.txt must be present in the root.");
    println!("File size: {:?}B", file_info.len());

    let mut chunks = chunkify(file_info.len(), cpu_count as u64);
    println!("{:<25} {:?}", "Chunks after offset adj:", chunks);

    adjust_chunk(&mut chunks);
    println!("{:<25} {:?}", "Chunks after chunkify:", chunks);

    adjust_chunk_offset(path, &mut chunks);
    println!("{:<25} {:?}", "Chunks after adjustment:", chunks);

    // let mut threads = Vec::new();
    //
    // for idx in 0..cpu_count {
    //     let (start, end) = (chunks[idx], chunks[idx + 1]);
    //
    //     let t = thread::spawn(move || {
    //         process_chunk(start, end, path);
    //         println!("Exitting thread[{}]", idx);
    //     });
    //     threads.push(t);
    // }
    //
    // for t in threads {
    //     t.join().unwrap();
    // }

    chunks.par_windows(2).enumerate().for_each(|(idx, window)| {
        let (start, end) = (window[0], window[1]);
        process_chunk(start, end, path);
        println!("Exiting thread[{}]", idx);
    });
    println!("Exitting main thread.")
}
