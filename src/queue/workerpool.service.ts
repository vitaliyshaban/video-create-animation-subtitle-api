import { Injectable } from '@nestjs/common';
import * as workerpool from 'workerpool';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
  // unlinkSync,
} from 'fs';
// import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';

const worker = require.resolve('../worker');
const workerRender = require.resolve('../worker-render');

export interface OverlayData {
  index: number;
  image: string;
  x: number;
  y: number;
}
export interface Paragraphs {
  text: string;
  start: string;
  end: string;
  score: number;
  words: ParagraphsWord[];
}
export interface ParagraphsWord {
  start: string;
  end: string;
  text: string;
  score: number;
}

@Injectable()
export class WorkerpoolService {
  private pool: workerpool.Pool;
  private poolRender: workerpool.Pool;
  private overlayData: OverlayData[];
  private frames: number;
  private timeVideo: number;
  private segmentTime: number;
  private video: string;
  private videoOutput: string;
  private videoResolution: string; // Разрешение выходного видео
  private frameRate: number; // Частота кадров видео

  constructor() {
    this.pool = workerpool.pool(worker, {
      workerType: 'thread',
      workerThreadOpts: {
        execArgv: /\.ts$/.test(worker)
          ? ['--require', 'ts-node/register']
          : undefined,
      },
    });
    this.poolRender = workerpool.pool(workerRender, {
      workerType: 'thread',
      workerThreadOpts: {
        execArgv: /\.ts$/.test(workerRender)
          ? ['--require', 'ts-node/register']
          : undefined,
      },
    });

    // this.cache = new Map();
    this.overlayData = [];
    this.frameRate = 30; // Частота кадров видео
    this.video = 'public/video_10_2.mp4'; // Частота кадров видео
    this.timeVideo = 112.875;
    this.segmentTime = 3;
    this.frames = this.frameRate * this.timeVideo;
    this.videoResolution = '1920:1080'; // Разрешение выходного видео
    this.videoOutput = `public/video_${this.videoResolution}_${this.frameRate}fps_${new Date().getTime().toString() + Math.floor(Math.random() * 1000000)}.mp4`; // Частота кадров видео
  }

  async addData({ x, y, image, index }: OverlayData) {
    this.overlayData.push({
      index: index,
      image: image,
      x: x,
      y: y,
    });
  }
  async clearOverlay() {
    this.overlayData.splice(0, this.overlayData.length);
  }

  async splitVideo(): Promise<string[]> {
    const videoChunks: string[] = [];
    const command = `ffmpeg -i ${this.video} -c copy -f segment -segment_time ${this.segmentTime} -reset_timestamps 1 -y public/chunk_%03d.mp4 2> public/error_log_segment.txt`;
    // const command = `ffmpeg -i ${this.video} -c:v libx264 -profile:v baseline -level 3.0 -start_number 0 -segment_time ${this.segmentTime} -g ${this.frameRate} -sc_threshold 0 -reset_timestamps 1 -f segment public/chunk_%03d.mp4 2> public/error_log_segment.txt`;
    await this.executeCommand(command);

    // console.log(`Executing: ${command}`);
    // Проверка наличия созданных файлов
    const files = readdirSync('public').filter(
      (file) => file.startsWith('chunk_') && file.endsWith('.mp4'),
    );
    files.forEach((file) => videoChunks.push(`public/${file}`));
    unlinkSync(`public/error_log_segment.txt`);
    return videoChunks;
  }

  async overlayImagesOnChunks(
    _overlay: OverlayData[],
    videoChunks: string[],
  ): Promise<string[]> {
    // const pool = workerpool.pool('./src/worker-render.js');
    const tasks = videoChunks.map((chunk, chunkIndex) => {
      return this.poolRender.exec('overlayImagesOnChunk', [
        chunk,
        _overlay,
        this.frameRate,
        this.segmentTime,
        this.videoResolution,
        chunkIndex,
      ]);
    });

    const intermediateVideos = await Promise.all(tasks);
    this.poolRender.terminate();

    return intermediateVideos;
  }
  async concatenateVideos(
    intermediateVideos: string[],
    outputVideo: string,
  ): Promise<void> {
    const concatFile = 'public/concat_list.txt';
    const concatContent = intermediateVideos
      .map((video) => `file '${video.split('/')[1]}'`)
      .join('\n');
    writeFileSync(concatFile, concatContent);

    const finalCommand = `ffmpeg -f concat -safe 0 -i ${concatFile} -c copy -y ${outputVideo} 2> public/error_log_concat.txt`;
    // ffmpeg -f concat -safe 0 -i public/concat_list.txt -c copy public/video_s.mp4 2> public/error_log_concat.txt
    // console.log(`Executing: ${finalCommand}`);
    await this.executeCommand(finalCommand);

    // Удаление промежуточных видеофайлов и списка файлов
    intermediateVideos.forEach((video) => unlinkSync(video));
    unlinkSync(`public/error_log_concat.txt`);
    unlinkSync(concatFile);
  }

  // Главная функция для выполнения всех шагов
  async createFinalVideo(_overlay: OverlayData[]): Promise<void> {
    try {
      console.time('created');
      // Шаг 1: Разрезание видео на части
      const videoChunks = await this.splitVideo();
      // Шаг 2: Вставка изображений в части видео
      const intermediateVideos = await this.overlayImagesOnChunks(
        _overlay,
        videoChunks,
      );

      // Шаг 3: Объединение частей в одно видео
      await this.concatenateVideos(intermediateVideos, this.videoOutput);
      this.clearOverlay();
      console.timeEnd('created');
      console.log('Video created successfully');
    } catch (error) {
      console.error('Error creating video:', error);
    }
  }

  private executeCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(command, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          reject(error);
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
        }
        resolve();
      });
    });
  }

  async processImage() {
    this.clearOverlay();
    const getParagraphs = await fetch(
      'http://127.0.0.1:3000/api/transcription',
    );
    const paragraphs = await getParagraphs.json();
    console.log('start Workers!');
    console.time('start');

    if (!existsSync('tmp')) {
      mkdirSync('tmp');
    }
    // Вызываем метод воркера через пул и передаем аргументы
    const tasks = Array.from({ length: this.frames }, async (_, index) => {
      const res = await this.pool.exec('sliceImage', [
        index,
        paragraphs.data,
        this.timeVideo,
        this.frameRate,
      ]);
      this.addData(res.attrs);
    });

    await Promise.all(tasks)
      .then(() => {
        this.pool.terminate(); // Завершаем пул
        console.timeEnd('start');
        // rmSync('tmp', { recursive: true, force: true });
        console.log('All frames have been saved.');
        // console.log(this.overlayData);
      })
      .catch((err) => {
        console.error(err);
        this.pool.terminate(); // Завершаем пул в случае ошибки
      });

    // await Promise.resolve(this.overlayCreat());
    return this.overlayData;
    // return result;
  }

  async close() {
    // Закрываем пул воркеров
    await this.pool.terminate();
  }
}

// ffmpeg -i public/video_10.mp4 -c:v libx264 -crf 22 -map 0:v -segment_time 3 -reset_timestamps 1 -g 60 -sc_threshold 0 -force_key_frames "expr:gte(t,n_forced*3)" -f segment public/chunk_%03d.mp4

// ffmpeg -i public/video_10.mp4 -c copy -f segment -segment_time 3 -reset_timestamps 1 public/chunk_%03d.mp4
// ffmpeg -i public/video_10_1.mp4 -c copy -f segment -segment_time 3 -reset_timestamps 1 public/chunk_%03d.mp4
// ffmpeg -i public/video_10_2.mp4 -c copy -f segment -segment_time 3 -reset_timestamps 1 public/chunk_%03d.mp4

// ffmpeg -i public/video_10.mp4 -force_key_frames "expr:gte(t,n_forced*3)" -c:v libx264 -preset fast -crf 18 -c:a copy -f segment -segment_time 10 -reset_timestamps 1 public/chunk_%03d.mp4

//!! ffmpeg -i public/video.mp4 -force_key_frames "expr:gte(t,n_forced*3)" -c:v libx264 -preset fast -crf 18 -c:a copy public/video_10_2.mp4

// ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/video_10_1.mp4
// ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of default=nokey=1:noprint_wrappers=1 public/video_10_1.mp4
