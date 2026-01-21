
class MapManager {
    constructor() {
        this.canvas = document.getElementById('map-canvas'); // 맵 캔버스로 수정 (기존 tileset-canvas 오타 수정)
        this.ctx = this.canvas.getContext('2d');
        this.tileset = null;
        this.tilesets = null;
        this.loader = new MapLoader();
    }


    // loadMap 메서드 보완
    async loadMap(map) {
        this.tileset = main.tilesets[map.tilesetId];

        // 2. 타일셋 설정 및 렌더링
        const names = this.tileset.tilesetNames;
        this.loader.setup(
            main.map,
            this.tileset,
            {
                "A1": main.images.get(names[0]),
                "A2": main.images.get(names[1]),
                "A3": main.images.get(names[2]),
                "A4": main.images.get(names[3]),
                "A5": main.images.get(names[4]),
                "B": main.images.get(names[5]),
                "C": main.images.get(names[6]),
                "D": main.images.get(names[7]),
                "E": main.images.get(names[8])
            }
        );

        this.renderMap();
    }

    // 전체 맵 렌더링 (타일 + 이벤트)
    renderMap() {
        if (!main.map) return;
        this.loader.render(); // MapLoader를 통한 타일 렌더링
        main.eventManager.render(); // 이벤트 렌더링
    }


    setTile(mapX, mapY, layerIdx, selectedTile) {
        if (!main.map) return;

        const width = main.map.width;
        const height = main.map.height;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (targetX >= width || targetY >= height) continue;

                const tileId = this.calculateTileId(selectedTile, w, h);
                const index = (layerIdx * width * height) + (targetY * width) + targetX;
                main.map.data[index] = tileId;
            }
        }
        this.renderMap();
    }

    calculateTileId(selectedTile, offsetX, offsetY) {
        let baseId = 0;
        const tab = selectedTile.tab;

        if (tab === 'B') baseId = 0;
        else if (tab === 'C') baseId = 256;
        else if (tab === 'D') baseId = 512;
        else if (tab === 'E') baseId = 768;

        return baseId + (selectedTile.y + offsetY) * 8 + (selectedTile.x + offsetX);
    }
}

class MapLoader {
    constructor() {
        this.canvas = document.getElementById('map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 48; // MZ 기본 타일 크기

        this.TILE_ID_B = 0;
        this.TILE_ID_C = 256;
        this.TILE_ID_D = 512;
        this.TILE_ID_E = 768;
        this.TILE_ID_A5 = 1536;
        this.TILE_ID_A1 = 2048;
        this.TILE_ID_A2 = 2816;
        this.TILE_ID_A3 = 4352;
        this.TILE_ID_A4 = 5888;
        this.TILE_ID_MAX = 8192;

        // prettier-ignore
        this.FLOOR_AUTOTILE_TABLE = [
            [[2, 4], [1, 4], [2, 3], [1, 3]],
            [[2, 0], [1, 4], [2, 3], [1, 3]],
            [[2, 4], [3, 0], [2, 3], [1, 3]],
            [[2, 0], [3, 0], [2, 3], [1, 3]],
            [[2, 4], [1, 4], [2, 3], [3, 1]],
            [[2, 0], [1, 4], [2, 3], [3, 1]],
            [[2, 4], [3, 0], [2, 3], [3, 1]],
            [[2, 0], [3, 0], [2, 3], [3, 1]],
            [[2, 4], [1, 4], [2, 1], [1, 3]],
            [[2, 0], [1, 4], [2, 1], [1, 3]],
            [[2, 4], [3, 0], [2, 1], [1, 3]],
            [[2, 0], [3, 0], [2, 1], [1, 3]],
            [[2, 4], [1, 4], [2, 1], [3, 1]],
            [[2, 0], [1, 4], [2, 1], [3, 1]],
            [[2, 4], [3, 0], [2, 1], [3, 1]],
            [[2, 0], [3, 0], [2, 1], [3, 1]],
            [[0, 4], [1, 4], [0, 3], [1, 3]],
            [[0, 4], [3, 0], [0, 3], [1, 3]],
            [[0, 4], [1, 4], [0, 3], [3, 1]],
            [[0, 4], [3, 0], [0, 3], [3, 1]],
            [[2, 2], [1, 2], [2, 3], [1, 3]],
            [[2, 2], [1, 2], [2, 3], [3, 1]],
            [[2, 2], [1, 2], [2, 1], [1, 3]],
            [[2, 2], [1, 2], [2, 1], [3, 1]],
            [[2, 4], [3, 4], [2, 3], [3, 3]],
            [[2, 4], [3, 4], [2, 1], [3, 3]],
            [[2, 0], [3, 4], [2, 3], [3, 3]],
            [[2, 0], [3, 4], [2, 1], [3, 3]],
            [[2, 4], [1, 4], [2, 5], [1, 5]],
            [[2, 0], [1, 4], [2, 5], [1, 5]],
            [[2, 4], [3, 0], [2, 5], [1, 5]],
            [[2, 0], [3, 0], [2, 5], [1, 5]],
            [[0, 4], [3, 4], [0, 3], [3, 3]],
            [[2, 2], [1, 2], [2, 5], [1, 5]],
            [[0, 2], [1, 2], [0, 3], [1, 3]],
            [[0, 2], [1, 2], [0, 3], [3, 1]],
            [[2, 2], [3, 2], [2, 3], [3, 3]],
            [[2, 2], [3, 2], [2, 1], [3, 3]],
            [[2, 4], [3, 4], [2, 5], [3, 5]],
            [[2, 0], [3, 4], [2, 5], [3, 5]],
            [[0, 4], [1, 4], [0, 5], [1, 5]],
            [[0, 4], [3, 0], [0, 5], [1, 5]],
            [[0, 2], [3, 2], [0, 3], [3, 3]],
            [[0, 2], [1, 2], [0, 5], [1, 5]],
            [[0, 4], [3, 4], [0, 5], [3, 5]],
            [[2, 2], [3, 2], [2, 5], [3, 5]],
            [[0, 2], [3, 2], [0, 5], [3, 5]],
            [[0, 0], [1, 0], [0, 1], [1, 1]]
        ];

        // prettier-ignore
        this.WALL_AUTOTILE_TABLE = [
            [[2, 2], [1, 2], [2, 1], [1, 1]],
            [[0, 2], [1, 2], [0, 1], [1, 1]],
            [[2, 0], [1, 0], [2, 1], [1, 1]],
            [[0, 0], [1, 0], [0, 1], [1, 1]],
            [[2, 2], [3, 2], [2, 1], [3, 1]],
            [[0, 2], [3, 2], [0, 1], [3, 1]],
            [[2, 0], [3, 0], [2, 1], [3, 1]],
            [[0, 0], [3, 0], [0, 1], [3, 1]],
            [[2, 2], [1, 2], [2, 3], [1, 3]],
            [[0, 2], [1, 2], [0, 3], [1, 3]],
            [[2, 0], [1, 0], [2, 3], [1, 3]],
            [[0, 0], [1, 0], [0, 3], [1, 3]],
            [[2, 2], [3, 2], [2, 3], [3, 3]],
            [[0, 2], [3, 2], [0, 3], [3, 3]],
            [[2, 0], [3, 0], [2, 3], [3, 3]],
            [[0, 0], [3, 0], [0, 3], [3, 3]]
        ];

        // prettier-ignore
        this.WATERFALL_AUTOTILE_TABLE = [
            [[2, 0], [1, 0], [2, 1], [1, 1]],
            [[0, 0], [1, 0], [0, 1], [1, 1]],
            [[2, 0], [3, 0], [2, 1], [3, 1]],
            [[0, 0], [3, 0], [0, 1], [3, 1]]
        ];
    }

    get width() {
        return this.mapData.width
    }
    get height() {
        return this.mapData.height
    }
    get flags() {
        return this.tilesetData.flags
    }


    /**
     * @param {Object} mapData - Map001.json 내용
     * @param {Object} tilesetData - Tilesets.json 내의 해당 타일셋 정보
     * @param {Object} images - TileManager가 로드한 이미지 객체들 { 'B': img, ... }
     */
    setup(mapData, tilesetData, images) {
        this.mapData = mapData;
        this.tilesetData = tilesetData;
        this.images = images;

        // 1. 캔버스 크기 설정 (타일 개수 * 48px)
        this.canvas.width = this.mapData.width * this.tileSize;
        this.canvas.height = this.mapData.height * this.tileSize;

        this.render();
    }

    render() {
        if (!this.mapData) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId0 = this.readMapData(x, y, 0)
                const tileId1 = this.readMapData(x, y, 1)
                const shadowBits = this.readMapData(x, y, 4)
                const upperTileId1 = this.readMapData(x, y - 1, 1);

                this.drawTile(tileId0, x, y);
                this.drawTile(tileId1, x, y);
                this.drawTile(this.readMapData(x, y, 2), x, y);
                this.drawTile(this.readMapData(x, y, 3), x, y);
                this.drawShadow(shadowBits, x, y);
                if (this.isTableTile(upperTileId1) && !this.isTableTile(tileId1)) {
                    if (!this.isShadowingTile(tileId0)) {
                        this.drawTableEdge(upperTileId1, x, y);
                    }
                }
            }
        }
    }

    readMapData(x, y, z) {
        return this.mapData.data[(z * this.mapData.height + y) * this.mapData.width + x] || 0;
    }

    // script/MapEditor.js 수정

    isAutotile(tileId) {
        return tileId >= this.TILE_ID_A1;
    };

    isTileA1(tileId) {
        return tileId >= this.TILE_ID_A1 && tileId < this.TILE_ID_A2;
    };

    isTileA2(tileId) {
        return tileId >= this.TILE_ID_A2 && tileId < this.TILE_ID_A3;
    };

    isTileA3(tileId) {
        return tileId >= this.TILE_ID_A3 && tileId < this.TILE_ID_A4;
    };

    isTileA4(tileId) {
        return tileId >= this.TILE_ID_A4 && tileId < this.TILE_ID_MAX;
    };

    isTileA5(tileId) {
        return tileId >= this.TILE_ID_A5 && tileId < this.TILE_ID_A1;
    };
    isTileB(tileId) {
        return tileId >= this.TILE_ID_B && tileId < this.TILE_ID_C;
    };
    isTileC(tileId) {
        return tileId >= this.TILE_ID_C && tileId < this.TILE_ID_D;
    };
    isTileD(tileId) {
        return tileId >= this.TILE_ID_D && tileId < this.TILE_ID_E;
    };
    isTileE(tileId) {
        return tileId >= this.TILE_ID_E && tileId < this.TILE_ID_A5;
    };

    getAutotileKind(tileId) {
        return Math.floor((tileId - this.TILE_ID_A1) / 48);
    };

    getAutotileShape(tileId) {
        return (tileId - this.TILE_ID_A1) % 48;
    };

    isTableTile(tileId) {
        return this.isTileA2(tileId) && this.flags[tileId] & 0x80;
    };

    isShadowingTile(tileId) {
        return this.isTileA3(tileId) || this.isTileA4(tileId);
    }

    drawTile(tileId, dx, dy) {
        if (this.isAutotile(tileId)) {
            this.drawAutotile(tileId, dx, dy);
        } else {
            this.drawNormal(tileId, dx, dy);
        }
    }

    drawAutotile(tileId, x, y) {
        const dx = x * this.tileSize
        const dy = y * this.tileSize

        const kind = this.getAutotileKind(tileId)
        const shape = this.getAutotileShape(tileId)
        const tx = kind % 8;
        const ty = Math.floor(kind / 8);
        let tileType = 'A1';
        let bx = 0;
        let by = 0;
        let autotileTable = this.FLOOR_AUTOTILE_TABLE;
        let isTable = false;

        if (this.isTileA1(tileId)) {
            // this.animationFrame
            const waterSurfaceIndex = 0;
            tileType = 'A1';
            if (kind === 0) {
                bx = waterSurfaceIndex * 2;
                by = 0;
            } else if (kind === 1) {
                bx = waterSurfaceIndex * 2;
                by = 3;
            } else if (kind === 2) {
                bx = 6;
                by = 0;
            } else if (kind === 3) {
                bx = 6;
                by = 3;
            } else {
                bx = Math.floor(tx / 4) * 8;
                by = ty * 6 + (Math.floor(tx / 2) % 2) * 3;
                if (kind % 2 === 0) {
                    bx += waterSurfaceIndex * 2;
                } else {
                    bx += 6;
                    autotileTable = this.WATERFALL_AUTOTILE_TABLE;
                    by += this.animationFrame % 3;
                }
            }
        } else if (this.isTileA2(tileId)) {
            tileType = 'A2';
            bx = tx * 2;
            by = (ty - 2) * 3;
            isTable = this.isTableTile(tileId);
        } else if (this.isTileA3(tileId)) {
            tileType = 'A3';
            bx = tx * 2;
            by = (ty - 6) * 2;
            autotileTable = this.WALL_AUTOTILE_TABLE;
        } else if (this.isTileA4(tileId)) {
            tileType = 'A4';
            bx = tx * 2;
            by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
            if (ty % 2 === 1) {
                autotileTable = this.WALL_AUTOTILE_TABLE;
            }
        }
        const img = this.images[tileType];

        const table = autotileTable[shape];
        const w1 = this.tileSize / 2;
        const h1 = this.tileSize / 2;
        for (let i = 0; i < 4; i++) {
            const qsx = table[i][0];
            const qsy = table[i][1];
            const sx1 = (bx * 2 + qsx) * w1;
            const sy1 = (by * 2 + qsy) * h1;
            const dx1 = dx + (i % 2) * w1;
            const dy1 = dy + Math.floor(i / 2) * h1;
            if (isTable && (qsy === 1 || qsy === 5)) {
                const qsx2 = qsy === 1 ? (4 - qsx) % 4 : qsx;
                const qsy2 = 3;
                const sx2 = (bx * 2 + qsx2) * w1;
                const sy2 = (by * 2 + qsy2) * h1;
                this.ctx.drawImage(img, sx2, sy2, w1, h1, dx1, dy1, w1, h1);
                this.ctx.drawImage(img, sx1, sy1, w1, h1 / 2, dx1, dy1 + h1 / 2, w1, h1 / 2);
            } else {
                this.ctx.drawImage(img, sx1, sy1, w1, h1, dx1, dy1, w1, h1);
            }
        }
    }

    
    getNormalTile(tileId) {
        const s = this.tileSize;
        const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * s;
        const sy = (Math.floor((tileId % 256) / 8) % 16) * s;

        let tileType = 'A5'
        if (this.isTileB(tileId)) { tileType = 'B' }
        else if (this.isTileC(tileId)) { tileType = 'C' }
        else if (this.isTileD(tileId)) { tileType = 'D' }
        else if (this.isTileE(tileId)) { tileType = 'E' }
        const img = this.images[tileType];

        return {img,sx,sy}
    }

    drawNormal(tileId, x, y) {
        const dx = x * this.tileSize
        const dy = y * this.tileSize

        const tile = this.getNormalTile(tileId)

        this.ctx.drawImage(tile.img, tile.sx, tile.sy, 48, 48, dx, dy, 48, 48);
    }

    drawShadow = function (shadowBits, x, y) {
        if (shadowBits & 0x0f) {
            const w1 = this.tileSize / 2;
            const h1 = this.tileSize / 2;
            for (let i = 0; i < 4; i++) {
                if (shadowBits & (1 << i)) {
                    const dx1 = x * this.tileSize + (i % 2) * w1;
                    const dy1 = y * this.tileSize + Math.floor(i / 2) * h1;
                    this.ctx.fillStyle = 'rgba(0,0,0,0.5)'
                    this.ctx.fillRect(dx1, dy1, w1, h1)
                }
            }
        }
    };

    drawTableEdge = function (tileId, x, y) {
        const dx = x * this.tileSize
        const dy = y * this.tileSize
        if (this.isTileA2(tileId)) {
            const autotileTable = this.FLOOR_AUTOTILE_TABLE;
            const kind = this.getAutotileKind(tileId);
            const shape = this.getAutotileShape(tileId);
            const tx = kind % 8;
            const ty = Math.floor(kind / 8);
            const bx = tx * 2;
            const by = (ty - 2) * 3;
            const table = autotileTable[shape];
            const w1 = this.tileSize / 2;
            const h1 = this.tileSize / 2;
            for (let i = 0; i < 2; i++) {
                const qsx = table[2 + i][0];
                const qsy = table[2 + i][1];
                const sx1 = (bx * 2 + qsx) * w1;
                const sy1 = (by * 2 + qsy) * h1 + h1 / 2;
                const dx1 = dx + (i % 2) * w1;
                const dy1 = dy + Math.floor(i / 2) * h1;
                const img = this.images['A2']
                this.ctx.drawImage(img, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
            }
        }
    };
}