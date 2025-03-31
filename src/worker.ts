// eslint-disable-next-line @typescript-eslint/no-var-requires
import { worker } from 'workerpool';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { createWriteStream } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as Konva from 'konva';
import { Paragraphs, WorkerpoolService } from './queue/workerpool.service';
import { AnimationsType, animationType } from './animations';
import { Rect } from 'konva/lib/shapes/Rect';
import { Text, TextConfig } from 'konva/lib/shapes/Text';
import { Layer } from 'konva/lib/Layer';
import { Group } from 'konva/lib/Group';
import { Stage } from 'konva/lib/Stage';

const textNodeSize = {
  width: 800,
  wraps: 2,
};

const textStyle: TextConfig = {
  fontSize: 34,
  fill: '#fff',
  fontFamily: 'Arial',
  align: 'center',
  lineHeight: 1,
  width: textNodeSize.width,
  // stroke: "#000",
  // strokeWidth: 2,
  shadowOffset: {
    x: 0,
    y: 5,
  },
  shadowEnabled: true,
  shadowOpacity: 0.7,
  shadowBlur: 10,
  shadowColor: '#000',
  wrap: 'word',
  padding: 0,
  // fontVariant: "small-caps"
  // verticalAlign: "middle",
  // textDecoration: "underline"
};

const stage: Stage = new (Konva as any).Stage({
  width: 1920,
  height: 1080,
});

const layer: Layer = new (Konva as any).Layer();
const group: Group = new (Konva as any).Group({
  // rotation: 20,
});
const rectNode: Rect = new (Konva as any).Rect({
  fill: '#681da8',
  opacity: 1,
  cornerRadius: 6,
});
const textNode: Text = new (Konva as any).Text(textStyle);

group.add(rectNode, textNode);
layer.add(group);
stage.add(layer);

const parseTime = (timeString: string): number => {
  const parts = timeString.split(':');
  const secondsParts = parts[2].split('.');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = parseInt(secondsParts[1], 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

const readSubtitles = (time: number, paragraphs: Paragraphs[]) => {
  const res: any = paragraphs.reduce((result: any, paragraph: any) => {
    if (
      parseTime(paragraph.start) <= time &&
      parseTime(paragraph.end) >= time
    ) {
      if (paragraph.words.length) {
        const wordRes = paragraph.words.reduce(
          (ret: any, word: any, ind: number) => {
            if (parseTime(word.start) <= time && parseTime(word.end) >= time) {
              return {
                word: word.text,
                number: ind,
                timeStart: parseTime(word.start),
                timeEnd: parseTime(word.end),
              };
            } else if (
              parseTime(word.start) > time &&
              parseTime(paragraph.words[ind - 1].end) < time
            ) {
              return {
                word: ind != 0 ? paragraph.words[ind - 1].text : word.text,
                number: ind != 0 ? ind - 1 : 0,
                timeStart:
                  ind != 0
                    ? parseTime(paragraph.words[ind - 1].start)
                    : parseTime(word.start),
                timeEnd:
                  ind != 0
                    ? parseTime(paragraph.words[ind - 1].end)
                    : parseTime(word.end),
              };
            }
            return ret;
          },
          {},
        );
        return {
          text: paragraph.text,
          ...wordRes,
        };
      }
      return {
        text: paragraph.text,
        word: '',
        number: 0,
      };
    }
    return result;
  }, '');
  // console.log(res.text);
  res.text ? textNode.text(res.text) : textNode.text('');
  textNode.setAttrs({
    height: textNodeSize.wraps * textNode.textHeight,
  });
  calculateWordPosition(res, time);
  return res;
};

const calculateWordPosition = (obj: any, time: number) => {
  if (obj.text !== undefined) {
    const wordsList = textNode.textArr.reduce(
      (result: any, arr: any, line: any) => {
        const wordList = arr.text.split(' ').reduce((res: any, word: any) => {
          return [
            ...res,
            {
              word: word,
              line: line,
              wordWidth: textNode.measureSize(word).width,
              lineWidth: arr.width,
              positionX: res.length
                ? res.reduce((a: any, b: any) => {
                    if (line == b.line) {
                      return a + b.wordWidth + textNode.measureSize(' ').width;
                    }
                    return a;
                  }, 0)
                : 0,
              lastWordWidth: res.length
                ? res.reduce((a: any, b: any) => {
                    if (line == b.line) {
                      return b.wordWidth;
                    }
                    return a;
                  }, 0)
                : 0,
              lastWordPositionX: res.length
                ? res.reduce((a: any, b: any) => {
                    if (line == b.line) {
                      return b.positionX;
                    }
                    return a;
                  }, 0) +
                  (textNode.width() - arr.width) / 2
                : 0 + (textNode.width() - arr.width) / 2,
              offset: {
                x: (textNode.width() - arr.width) / 2,
                y: textNode.textHeight * line,
              },
            },
          ];
        }, result);
        return [...wordList];
      },
      [],
    );
    if (wordsList[obj.number] === undefined) {
      return;
    }

    rectNode?.setAttrs({
      opacity: 1,
      ...animationType(AnimationsType.changes, {
        rectNode: rectNode,
        textNode: textNode,
        obj: obj,
        currentStyle: {
          x: textNode.getAttr('x'),
          y: textNode.getAttr('y'),
          height: textNode.textHeight,
          width: wordsList[obj.number].wordWidth,
          scaleX: 1,
          scaleY: 1,
          offset: {
            x: wordsList[obj.number].offset.x + wordsList[obj.number].positionX,
            y: wordsList[obj.number].offset.y * wordsList[obj.number].line,
          },
        },
        curTime: time,
        lastWord: {
          lastWordWidth: wordsList[obj.number].lastWordWidth,
          lastWordPositionX: wordsList[obj.number].lastWordPositionX,
        },
      }),
    });
    return;
  }
  rectNode.setAttrs({
    opacity: 0,
  });
};

// function bounceEaseOut(t) {
//   const s = 7.5625;
//   const p = 2.75;
//   if (t < 1 / p) {
//     return s * t * t;
//   } else if (t < 2 / p) {
//     return s * (t -= 1.5 / p) * t + 0.75;
//   } else if (t < 2.5 / p) {
//     return s * (t -= 2.25 / p) * t + 0.9375;
//   } else {
//     return s * (t -= 2.625 / p) * t + 0.984375;
//   }
// }

// function applyChanges(rect, obj, currentStyle, curTime) {
//   const transitionDuration = 3; // 100% - duration 0

//   const transitionStartTime = obj.timeStart;
//   const speed = (obj.timeEnd - obj.timeStart) / transitionDuration;
//   const transitionEndTime = obj.timeStart + speed;

//   const t = (curTime - transitionStartTime) / speed;
//   const bounceT = bounceEaseOut(t);
//   const scale = {
//     start: currentStyle.scaleX - 0.8,
//     finish: currentStyle.scaleX,
//   };
//   // console.log(rectGroupRef.current)
//   if (curTime >= transitionStartTime && curTime <= transitionEndTime) {
//     const newScaleX = scale.start + bounceT * (scale.finish - scale.start);
//     const newScaleY = scale.start + bounceT * (scale.finish - scale.start);
//     // console.log(currentStyle)
//     return {
//       ...currentStyle,
//       x: currentStyle.offset.x + currentStyle.width / 2,
//       y: currentStyle.offset.y + currentStyle.height / 2,
//       offset: {
//         x: currentStyle.width / 2,
//         y: currentStyle.height / 2,
//       },
//       scaleX: newScaleX,
//       scaleY: newScaleY,
//     };
//   }
//   if (curTime > transitionEndTime) {
//     return {
//       ...currentStyle,
//       offset: {
//         x: -currentStyle.offset.x,
//         y: -currentStyle.offset.y,
//       },
//     };
//   }
// }
// // eslint-disable-next-line @typescript-eslint/no-unused-vars

function animate(
  timeVideo: WorkerpoolService['timeVideo'],
  paragraphs: Paragraphs[],
) {
  readSubtitles(timeVideo, paragraphs);
}

async function sliceImage(
  index: number,
  paragraphs: Paragraphs[],
  timeVideo: WorkerpoolService['timeVideo'],
  frameRate: WorkerpoolService['frameRate'],
) {
  return new Promise((resolve, reject) => {
    stage.setAttrs({
      width: 1920,
      height: 1080,
    });
    const time = (index * timeVideo) / (timeVideo * frameRate);
    animate(time, paragraphs);

    const canvas = group.toCanvas();
    const out = createWriteStream(`tmp/frame_${index}.png`);
    const stream = (canvas as any).createPNGStream();
    stream.pipe(out);

    out.on('finish', () =>
      resolve({
        attrs: {
          x: stage.width() / 2 - textNode.width() / 2,
          y: stage.height() - textNode.height() - 200,
          image: `tmp/frame_${index}.png`,
          index: index,
        },
      }),
    );
    out.on('error', reject);
  });
}

worker({
  sliceImage: sliceImage,
});
