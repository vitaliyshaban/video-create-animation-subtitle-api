import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { Text } from 'konva/lib/shapes/Text';

export enum AnimationsType {
  default = 'default',
  changes = 'changes',
  changesFly = 'changesFly',
}
export interface AnimationOptions {
  rectNode?: Rect;
  textNode?: Text;
  obj?: any;
  currentStyle: RectConfig;
  curTime?: number;
  lastWord?: LastWord;
}
export interface LastWord {
  lastWordWidth: number;
  lastWordPositionX: number;
}

export const animationType = (
  type: AnimationsType,
  options: AnimationOptions,
) => {
  switch (type) {
    case AnimationsType.default:
      return applyDefault(options);
    case AnimationsType.changes:
      return applyChanges(options);
    case AnimationsType.changesFly:
      return applyChangesFly(options);
    default:
      return applyDefault(options);
  }
};

const applyDefault = ({ currentStyle }: AnimationOptions) => {
  return {
    ...currentStyle,
    width: currentStyle.width,
    offset: {
      x: -currentStyle.offset!.x,
      y: -currentStyle.offset!.y,
    },
  };
};

function applyChangesFly(options: AnimationOptions) {
  const { obj, currentStyle, curTime, lastWord } = options;

  const transitionDuration = 5;

  const transitionStartTime = obj.timeStart;
  const speed = (obj.timeEnd - obj.timeStart) / transitionDuration;
  const transitionEndTime = obj.timeStart + speed;

  if (curTime! >= transitionStartTime && curTime! <= transitionEndTime) {
    const timeProgress = (curTime! - transitionStartTime) / speed;

    const newWidth =
      lastWord?.lastWordWidth +
      timeProgress * (currentStyle.width - lastWord?.lastWordWidth);
    const newOffsetX =
      lastWord?.lastWordPositionX +
      timeProgress * (currentStyle.offset!.x - lastWord?.lastWordPositionX);
    // const newOffsetY = currentStyle.offset.y + timeProgress * (currentStyle.offset.y - currentStyle.offset.y);
    return {
      ...currentStyle,
      width: newWidth,
      offset: {
        x: -newOffsetX,
        y: -currentStyle.offset!.y,
      },
    };
  }
  if (curTime! > transitionEndTime) {
    return {
      ...currentStyle,
      width: currentStyle.width,
      offset: {
        x: -currentStyle.offset!.x,
        y: -currentStyle.offset!.y,
      },
    };
  }
  return currentStyle;
}

function bounceEaseOut(t: number) {
  const s = 1.70158;
  return 1 + Math.pow(t - 1, 3) * ((s + 1) * (t - 1) + s);
}
const applyChanges = (options: AnimationOptions) => {
  const { obj, currentStyle, curTime } = options;

  const transitionDuration = 0.8;

  const transitionStartTime = obj.timeStart;
  const speed = (obj.timeEnd - obj.timeStart) / transitionDuration;
  const transitionEndTime = obj.timeStart + speed;

  const t = (curTime! - transitionStartTime) / speed;
  const bounceT = bounceEaseOut(t);
  const scale = {
    start: currentStyle.scaleX! - 0.3,
    finish: currentStyle.scaleX!,
  };
  // console.log(rectGroupRef.current)
  if (curTime! >= transitionStartTime && curTime! <= transitionEndTime) {
    const newScaleX = scale.start + bounceT * (scale.finish - scale.start);
    const newScaleY = scale.start + bounceT * (scale.finish - scale.start);
    // console.log(currentStyle)
    return {
      ...currentStyle,
      x: currentStyle.offset!.x + currentStyle.width! / 2,
      y: currentStyle.offset!.y + currentStyle.height! / 2,
      offset: {
        x: currentStyle.width! / 2,
        y: currentStyle.height! / 2,
      },
      scaleX: newScaleX,
      scaleY: newScaleY,
    };
  }
  if (curTime! > transitionEndTime) {
    return {
      ...currentStyle,
      x: currentStyle.offset!.x + currentStyle.width! / 2,
      y: currentStyle.offset!.y + currentStyle.height! / 2,
      offset: {
        x: currentStyle.width! / 2,
        y: currentStyle.height! / 2,
      },
    };
  }
};
