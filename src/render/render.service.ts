// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Injectable } from '@nestjs/common';

// import Konva from 'konva';
// const Konva = require('konva/cmj').default;
// import { createCanvas } from 'canvas';
// import { writeFileSync } from 'fs';
// import * as path from 'path';
import Konva from 'konva';

@Injectable()
export class RenderService {
  async getHello(): Promise<any> {
    const stage: any = new Konva.Stage({
      container: null,
      width: 500,
      height: 500,
    });
    console.log(stage);
    // const layer = new Konva.Layer();
    // const rect1 = new Konva.Rect({
    //   x: 20,
    //   y: 20,
    //   width: 100,
    //   height: 50,
    //   fill: 'green',
    //   stroke: 'black',
    //   strokeWidth: 4,
    // });
    // layer.add(rect1);
    // stage.add(layer);
    // const dataURL = stage.toDataURL();
    // const filePath = path.join(__dirname, '..', 'public', 'image.png');
    // writeFileSync(filePath, dataURL);
    // const width = 800;
    // const height = 600;
    // const canvas = createCanvas(width, height);
    // const ctx = canvas.getContext('2d');

    // // Отрисовка на canvas
    // ctx.fillStyle = '#fff';
    // ctx.fillRect(0, 0, width, height);

    // ctx.fillStyle = '#000';
    // ctx.font = '30px Arial';
    // ctx.fillText('Hello, Canvas!', 50, 50);

    // // Сохранение в файл
    // const buffer = canvas.toBuffer('image/png');
    // const filePath = path.join(__dirname, '..', 'public', 'image.png');
    // writeFileSync(filePath, buffer);

    // Отправка файла в ответе
    // res.sendFile(filePath);
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/todos/2',
    );
    const result = await response.json();
    return result;
  }
}
