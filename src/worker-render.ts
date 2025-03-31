import { worker } from 'workerpool';
import { unlinkSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'node:util';
import { WorkerpoolService } from './queue/workerpool.service';

const execPromise = promisify(exec);

async function overlayImagesOnChunk(
  chunk: string,
  _overlay: WorkerpoolService['overlayData'],
  frameRate: WorkerpoolService['frameRate'],
  segmentTime: WorkerpoolService['segmentTime'],
  videoResolution: WorkerpoolService['videoResolution'],
  chunkIndex: number,
) {
  const intermediateVideos = [];
  const startFrame = chunkIndex * (segmentTime * frameRate);
  const endFrame = startFrame + segmentTime * frameRate;

  const currentBatch = _overlay
    .sort((a, b) => a.index - b.index)
    .filter((image) => image.index >= startFrame && image.index < endFrame);

  const inputs = currentBatch.map((image) => `-i ${image.image}`).join(' ');
  let filterComplex = `[0:v]scale=${videoResolution},fps=${frameRate}[base];`;
  currentBatch.forEach((frame, i) => {
    const { x, y } = frame;
    const inputIndex = i + 1; // Индекс входного изображения (начинается с 1, потому что 0 - это видео)

    if (i === 0) {
      filterComplex += `[base][${inputIndex}:v]overlay=enable='between(n\\,${frame.index - startFrame}\\,${frame.index - startFrame})':x=${x}:y=${y}[v0];`;
    } else {
      filterComplex += `[v${i - 1}][${inputIndex}:v]overlay=enable='between(n\\,${frame.index - startFrame}\\,${frame.index - startFrame})':x=${x}:y=${y}[v${i}];`;
    }
  });
  const outputIndex = currentBatch.length > 0 ? currentBatch.length - 1 : 0;
  const intermediateOutput = `public/intermediate_chunk_${chunkIndex}.mp4`;
  intermediateVideos.push(intermediateOutput);
  const command = `ffmpeg -i ${chunk} ${inputs} -filter_complex "${filterComplex}" -map "[v${outputIndex}]" -map 0:a -c:a copy -y ${intermediateOutput} 2> public/error_log_chunk_${chunkIndex}.txt`;

  await execPromise(command);
  unlinkSync(`public/error_log_chunk_${chunkIndex}.txt`);
  unlinkSync(`${chunk}`);

  return intermediateOutput;
}

//ffmpeg -i ${chunk} ${inputs} -filter_complex "${filterComplex}" -map "[v${outputIndex}]" -map 0:a -c:v h264_nvenc -c:a copy ${intermediateOutput} 2> public/error_log_chunk_${chunkIndex}.txt

// Регистрируем функцию sliceImage как воркера
worker({
  overlayImagesOnChunk: overlayImagesOnChunk,
});
