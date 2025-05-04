function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

function mulberry32(a) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t ^ (t >>> 14));
        return (t >>> 0) / 4294967296;
    }
}

function isNear(r1, g1, b1, r2, g2, b2, tolerance = 20) {
    return Math.abs(r1 - r2) < tolerance &&
           Math.abs(g1 - g2) < tolerance &&
           Math.abs(b1 - b2) < tolerance;
}

function getMetallicBaseColor(rng) {
    const palette = [
        [200, 200, 220], // silver
        [180, 180, 255], // bluish silver
        [255, 100, 100], // red steel
        [255, 215, 0],   // gold
        [80, 80, 90],    // dark metal
    ];
    const idx = Math.floor(rng() * palette.length);
    return palette[idx];
}

export function drawCharacterImage(name, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = 'warrior_base.png';

    img.onload = function() {
        const originalWidth = img.width;
        const originalHeight = img.height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        const imageData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
        const data = imageData.data;

        const partMask = new Uint8Array(originalWidth * originalHeight);

        const bgIdx = 0;
        const bgR = data[bgIdx];
        const bgG = data[bgIdx + 1];
        const bgB = data[bgIdx + 2];

        const rngHelmet = mulberry32(hashString(name + 'helmet'));
        const rngArmor = mulberry32(hashString(name + 'armor'));
        const rngShield = mulberry32(hashString(name + 'shield'));
        const rngSword = mulberry32(hashString(name + 'sword'));

        const helmetBase = getMetallicBaseColor(rngHelmet);
        const armorBase = getMetallicBaseColor(rngArmor);
        const shieldBase = getMetallicBaseColor(rngShield);
        const swordBase = getMetallicBaseColor(rngSword);

        for (let y = 0; y < originalHeight; y++) {
            for (let x = 0; x < originalWidth; x++) {
                const idx = (y * originalWidth + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                if (isNear(r, g, b, bgR, bgG, bgB, 20)) {
                    data[idx + 3] = 0;
                    continue;
                }

                let baseColor, gradientFactor;
                let isTargetPart = false;
                if (isNear(r, g, b, 100, 100, 120)) {
                    baseColor = helmetBase;
                    gradientFactor = ((originalWidth - x) + (originalHeight - y)) / (originalWidth + originalHeight);
                    isTargetPart = true;
                } else if (isNear(r, g, b, 90, 110, 70)) {
                    baseColor = armorBase;
                    gradientFactor = ((originalWidth - x) + y) / (originalWidth + originalHeight);
                } else if (
                    isNear(r, g, b, 172, 90, 56) ||
                    isNear(r, g, b, 160, 85, 50) ||
                    isNear(r, g, b, 180, 95, 60)
                ) {
                    baseColor = shieldBase;
                    gradientFactor = (x + (originalHeight - y)) / (originalWidth + originalHeight);
                    isTargetPart = true;
                } else if (isNear(r, g, b, 200, 200, 200)) {
                    baseColor = swordBase;
                    gradientFactor = (x + y) / (originalWidth + originalHeight);
                    isTargetPart = true;
                }

                if (baseColor) {
                    const metallicFactor = 0.4 + Math.abs(gradientFactor - 0.5) * 2.4;

                    data[idx] = Math.min(255, Math.floor(baseColor[0] * metallicFactor));
                    data[idx + 1] = Math.min(255, Math.floor(baseColor[1] * metallicFactor));
                    data[idx + 2] = Math.min(255, Math.floor(baseColor[2] * metallicFactor));
                }

                if (isTargetPart) {
                    partMask[y * originalWidth + x] = 1;
                }
            }
        }

        tempCtx.putImageData(imageData, 0, 0);

        const scale = 0.1;
        const smallWidth = Math.floor(originalWidth * scale);
        const smallHeight = Math.floor(originalHeight * scale);

        canvas.width = smallWidth;
        canvas.height = smallHeight;
        canvas.style.width = smallWidth + 'px';
        canvas.style.height = smallHeight + 'px';

        ctx.clearRect(0, 0, smallWidth, smallHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight, 0, 0, smallWidth, smallHeight);

        let animationOffset = 0;
        let frameCounter = 0;
        let startTime = performance.now();

        function animateGoldWave(timestamp) {
            if (timestamp - startTime >= 2000) return; // 停止条件: 10秒間

            frameCounter++;
            if (frameCounter % 3 !== 0) {
                requestAnimationFrame(animateGoldWave);
                return;
            }

            ctx.clearRect(0, 0, smallWidth, smallHeight);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, originalWidth, originalHeight, 0, 0, smallWidth, smallHeight);

            const waveImageData = ctx.getImageData(0, 0, smallWidth, smallHeight);
            const waveData = waveImageData.data;

            for (let y = 0; y < smallHeight; y++) {
                for (let x = 0; x < smallWidth; x++) {
                    const idx = (y * smallWidth + x) * 4;
                    const maskIdx = Math.floor(y / smallHeight * originalHeight) * originalWidth + Math.floor(x / smallWidth * originalWidth);

                    if (partMask[maskIdx] === 1) {
                        const wave = Math.sin((x + y + animationOffset) * 0.1);
                        if (wave > 0.5) {
                            waveData[idx] = Math.min(255, waveData[idx] + 80);
                            waveData[idx + 1] = Math.min(255, waveData[idx + 1] + 60);
                        }
                    }
                }
            }

            ctx.putImageData(waveImageData, 0, 0);

            animationOffset += 1;
            if (animationOffset > smallWidth + smallHeight) animationOffset = 0;

            requestAnimationFrame(animateGoldWave);
        }

        requestAnimationFrame(animateGoldWave);
    };
}
