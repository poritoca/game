// キャラクター画像生成（名前からランダムなドット絵）
export function drawCharacterImage(name, canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const size = 32;
  const block = 4;
  const blockSize = size / block;

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  const seed = hashString(name);
  const rng = mulberry32(seed);

  function mulberry32(a) {
    return function () {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < block; y++) {
    for (let x = 0; x < block / 2; x++) {
      const r = Math.floor(rng() * 256);
      const g = Math.floor(rng() * 256);
      const b = Math.floor(rng() * 256);
      ctx.fillStyle = `rgb(${r},${g},${b})`;

      const x0 = x * blockSize;
      const y0 = y * blockSize;
      const x1 = x0 + blockSize;
      const y1 = y0 + blockSize;

      ctx.fillRect(x0, y0, blockSize, blockSize);
      // ミラー描画（左右対称に配置）
      const mx0 = (block - x - 1) * blockSize;
      ctx.fillRect(mx0, y0, blockSize, blockSize);
    }
  }
}