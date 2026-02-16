export interface ImageDiffResult {
  diffCanvas: HTMLCanvasElement;
  changedPixels: number;
  totalPixels: number;
  percentChanged: number;
}

function comparePixels(
  leftData: Uint8ClampedArray,
  rightData: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance: number
): { diffData: Uint8ClampedArray; changedPixels: number; totalPixels: number; percentChanged: number } {
  const diffData = new Uint8ClampedArray(width * height * 4);
  let changedPixels = 0;
  const totalPixels = width * height;

  for (let i = 0; i < leftData.length; i += 4) {
    const rDiff = Math.abs(leftData[i] - rightData[i]);
    const gDiff = Math.abs(leftData[i + 1] - rightData[i + 1]);
    const bDiff = Math.abs(leftData[i + 2] - rightData[i + 2]);

    if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) {
      diffData[i] = 255;
      diffData[i + 1] = 0;
      diffData[i + 2] = 0;
      diffData[i + 3] = 200;
      changedPixels++;
    } else {
      diffData[i] = leftData[i];
      diffData[i + 1] = leftData[i + 1];
      diffData[i + 2] = leftData[i + 2];
      diffData[i + 3] = 60;
    }
  }

  return {
    diffData,
    changedPixels,
    totalPixels,
    percentChanged: totalPixels > 0 ? (changedPixels / totalPixels) * 100 : 0,
  };
}

export async function computeImageDiff(
  leftFile: File,
  rightFile: File,
  tolerance: number = 10
): Promise<ImageDiffResult> {
  const [leftImg, rightImg] = await Promise.all([
    loadImage(leftFile),
    loadImage(rightFile),
  ]);

  const width = Math.max(leftImg.width, rightImg.width);
  const height = Math.max(leftImg.height, rightImg.height);

  // Use canvas drawImage for resizing (avoids pica's internal web workers
  // which break under Turbopack)
  const leftResized = document.createElement("canvas");
  leftResized.width = width;
  leftResized.height = height;
  const leftCtx = leftResized.getContext("2d")!;
  leftCtx.drawImage(leftImg, 0, 0, width, height);

  const rightResized = document.createElement("canvas");
  rightResized.width = width;
  rightResized.height = height;
  const rightCtx = rightResized.getContext("2d")!;
  rightCtx.drawImage(rightImg, 0, 0, width, height);

  const leftData = leftCtx.getImageData(0, 0, width, height);
  const rightData = rightCtx.getImageData(0, 0, width, height);

  const result = comparePixels(leftData.data, rightData.data, width, height, tolerance);

  const diffCanvas = document.createElement("canvas");
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext("2d")!;
  const diffImgData = new ImageData(result.diffData, width, height);
  diffCtx.putImageData(diffImgData, 0, 0);

  return {
    diffCanvas,
    changedPixels: result.changedPixels,
    totalPixels: result.totalPixels,
    percentChanged: result.percentChanged,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function drawToCanvas(
  img: HTMLImageElement,
  w: number,
  h: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}
