
class MapManager {
    constructor() {
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
    }


    setTile(mapX, mapY, layerMode, selectedTile) {

        if (!main.map) return;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (this.isOutofMap(targetX, targetY)) continue;

                const tileId = this.calculateTileId(selectedTile, w, h);

                // R 탭(리전)은 항상 Layer 5에 배치
                let layerIdx;
                if (selectedTile.tab === 'R') {
                    layerIdx = 5;
                } else if (layerMode === 'auto') {
                    layerIdx = this.determineAutoLayer(targetX, targetY, tileId, selectedTile.tab);
                } else {
                    layerIdx = parseInt(layerMode);
                }

                // 오토타일인 경우 주변 타일 검사 후 패턴 결정
                let finalTileId = tileId;
                if (this.isAutotile(tileId)) {
                    finalTileId = this.calculateAutotilePattern(targetX, targetY, layerIdx, tileId);
                }

                this.setMapData(targetX, targetY, layerIdx, finalTileId);

                // 오토타일 전파: 주변 8칸 재계산 (항상 수행 - 인접 타일이 오토타일일 수 있음)
                // 레이어 0, 1에서만 오토타일 연결이 발생함
                this.propagateAutotile(targetX, targetY, layerIdx);
            }
        }
        this.renderMap();
    }

    // 특정 좌표의 레이어 타일값 조회 함수
    getTileIndex(x, y, layerIdx) {
        if (!main.map) return 0;
        const width = main.map.width;
        const height = main.map.height;
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        return (layerIdx * width * height) + (y * width) + x;
    }

    // 맵 범위 밖인지 검사
    isOutofMap(x, y) {
        if (!main.map) return true;
        return x < 0 || x >= main.map.width || y < 0 || y >= main.map.height;
    }

    // 통합 맵 데이터 접근 헬퍼 (읽기)
    mapData(x, y, layerIdx) {
        return main.map.data[this.getTileIndex(x, y, layerIdx)];
    }

    // 통합 맵 데이터 설정 헬퍼 (쓰기)
    setMapData(x, y, layerIdx, value) {
        main.map.data[this.getTileIndex(x, y, layerIdx)] = value;
    }

    // 오토타일 여부 확인
    isAutotile(tileId) {
        // A1~A4 범위
        return this.loader.isAutotile(tileId);
    }

    // A1 타일의 오토타일 타입 반환 ('floor', 'wall', 'waterfall', 'fixed')
    getA1AutotileType(tileId) {
        if (this.loader.isTileA1(tileId)) {
            const tileIndex = Math.floor((tileId - this.loader.TILE_ID_A1) / 48);
            const row = Math.floor(tileIndex / 8);
            const col = tileIndex % 8;

            if (row < 2 && col < 8) {
                return this.A1_AUTOTILE_TYPE_MAP[row][col];
            }
        }
        return 'floor'; // 기본값
    }

    // 오토타일의 base ID 추출
    getAutotileBaseId(tileId) {
        if (this.loader.isAutotile(tileId)) {
            return Math.floor((tileId - this.loader.TILE_ID_A1) / 48) * 48 + this.loader.TILE_ID_A1;
        }
        return tileId;
    }

    // 오토타일 패턴 계산 (8방향 연결 검사)
    calculateAutotilePattern(x, y, layerIdx, baseTileId) {
        const width = main.map.width;
        const height = main.map.height;
        const baseId = this.getAutotileBaseId(baseTileId);

        // 타일 타입 확인 및 적절한 autotile 테이블 선택
        let tileType = 'A1';
        let autotileType = '';
        let autotileTable = this.loader.FLOOR_AUTOTILE_TABLE;

        if (this.loader.isTileA1(baseId)) {
            tileType = 'A1';
            autotileType = this.getA1AutotileType(baseId);

            // A1은 타입에 따라 테이블 선택 (MapLoader.drawAutotile과 동일)
            if (autotileType === 'waterfall') {
                autotileTable = this.loader.WATERFALL_AUTOTILE_TABLE;
            } else if (autotileType === 'wall') {
                autotileTable = this.loader.WALL_AUTOTILE_TABLE;
            } else { // 'floor' 또는 'fixed'
                autotileTable = this.loader.FLOOR_AUTOTILE_TABLE;
            }
        } else if (this.loader.isTileA2(baseId)) {
            tileType = 'A2';
            autotileTable = this.loader.FLOOR_AUTOTILE_TABLE;
        } else if (this.loader.isTileA3(baseId)) {
            tileType = 'A3';
            autotileTable = this.loader.WALL_AUTOTILE_TABLE;
        } else if (this.loader.isTileA4(baseId)) {
            tileType = 'A4';
            // A4는 짝수/홀수에 따라 다른 테이블 사용
            const kind = this.loader.getAutotileKind(baseId);
            const ty = Math.floor(kind / 8);
            if (ty % 2 === 1) {
                autotileTable = this.loader.WALL_AUTOTILE_TABLE;
            } else {
                autotileTable = this.loader.FLOOR_AUTOTILE_TABLE;
            }
        }

        // 8방향 연결 상태 확인
        const directions = [
            [-1, -1], [0, -1], [1, -1],  // 위쪽 3칸
            [-1, 0], [1, 0],   // 좌우
            [-1, 1], [0, 1], [1, 1]    // 아래쪽 3칸
        ];

        let pattern = 0;
        let bit = 1;

        for (let i = 0; i < 8; i++) {
            const [dx, dy] = directions[i];
            const checkX = x + dx;
            const checkY = y + dy;

            // 맵 범위 밖은 연결되지 않은 것으로 간주
            if (!this.isOutofMap(checkX, checkY)) {
                const checkTileId = this.mapData(checkX, checkY, layerIdx);
                const checkBaseId = this.getAutotileBaseId(checkTileId);

                // 같은 base ID를 가진 타일이면 연결됨
                if (checkBaseId === baseId) {
                    pattern |= bit;
                }
            }
            bit <<= 1;
        }

        // 비트 패턴을 해당 테이블의 인덱스로 변환
        const patternIndex = this.bitPatternToIndex(pattern, autotileTable);

        return baseId + patternIndex;
    }


    // 비트 패턴을 autotile 테이블의 인덱스로 변환
    // RPG Maker MZ 표준 알고리즘 사용
    bitPatternToIndex(bitPattern, autotileTable) {
        // 비트 패턴 분해
        const TL = (bitPattern >> 0) & 1;  // Top-Left (좌상단 코너)
        const T = (bitPattern >> 1) & 1;  // Top (위)
        const TR = (bitPattern >> 2) & 1;  // Top-Right (우상단 코너)
        const L = (bitPattern >> 3) & 1;  // Left (왼쪽)
        const R = (bitPattern >> 4) & 1;  // Right (오른쪽)
        const BL = (bitPattern >> 5) & 1;  // Bottom-Left (좌하단 코너)
        const B = (bitPattern >> 6) & 1;  // Bottom (아래)
        const BR = (bitPattern >> 7) & 1;  // Bottom-Right (우하단 코너)

        // RPG Maker MZ 표준 인덱스 계산
        let index = 0;

        // WALL 타입 테이블 (16개) - 벽 타일
        // RPG Maker MZ 공식 알고리즘: L=1, R=2, T=4, B=8
        // WATERFALL 타입 테이블 (4개) - 폭포 타일

        if (autotileTable.length === 4) {
            // 폭포 타입: 좌우만 고려
            if (L) index |= 0x01;
            if (R) index |= 0x02;
            return index;
        }
        // WALL 타입 테이블 (16개) - 벽 타일
        if (autotileTable.length === 16) {
            if (T && R && B && L) return 0;
            if (T && R && B && !L) return 1;
            if (!T && R && B && L) return 2;
            if (!T && R && B && !L) return 3;
            if (T && !R && B && L) return 4;
            if (T && !R && B && !L) return 5;
            if (!T && !R && B && L) return 6;
            if (!T && !R && B && !L) return 7;
            if (T && R && !B && L) return 8;
            if (T && R && !B && !L) return 9;
            if (!T && R && !B && L) return 10;
            if (!T && R && !B && !L) return 11;
            if (T && !R && !B && L) return 12;
            if (T && !R && !B && !L) return 13;
            if (!T && !R && !B && L) return 14;
            return 15;
        }
        // FLOOR 타입 테이블 (48개) - 바닥 타일
        if (T && R && L && B) {
            if (!TL && TR && BL && BR) return 1;
            if (TL && !TR && BL && BR) return 2;
            if (!TL && !TR && BL && BR) return 3;
            if (TL && TR && BL && !BR) return 4;
            if (!TL && TR && BL && !BR) return 5;
            if (TL && !TR && BL && !BR) return 6;
            if (!TL && !TR && BL && !BR) return 7;
            if (TL && TR && !BL && BR) return 8;
            if (!TL && TR && !BL && BR) return 9;
            if (TL && !TR && !BL && BR) return 10;
            if (!TL && !TR && !BL && BR) return 11;
            if (TL && TR && !BL && !BR) return 12;
            if (!TL && TR && !BL && !BR) return 13;
            if (TL && !TR && !BL && !BR) return 14;
            if (!TL && !TR && !BL && !BR) return 15;
            return 0;
        }
        if (T && R && !L && B) {
            if (TR && BR) return 16; 
            if (!TR && BR) return 17; 
            if (TR && !BR) return 18;  
            return 19;                 
        }
        if (!T && R && L && B) {
            if (BL && BR) return 20;
            if (BL && !BR) return 21; 
            if (!BL && BR) return 22;
            return 23;                 
        }
        if (T && !R && L && B) {
            if (TL && BL) return 24;
            if (TL && !BL) return 25; 
            if (!TL && BL) return 26;  
            return 27; 
        }
        if (T && R && L && !B) {
            if (TL && TR) return 28;
            if (!TL && TR) return 29;
            if (TL && !TR) return 30;
            return 31;
        }
        if (T && !R && !L && B) {return 32;}
        if (!T && R && L && !B) {return 33;}
        if (!T && R && !L && B) {
            if (BR) return 34;  
            return 35;            
        }
        if (!T && !R && L && B) {
            if (BL) return 36;  
            return 37;           
        }
        if (T && !R && L && !B) {
            if (TL) return 38;  
            return 39; 
        }
        if (T && R && !L && !B) {
            if (TR) return 40; 
            return 41;
        }
        if (!T && !R && !L && B) {return 42;}
        if (!T && R && !L && !B) {return 43;}
        if (T && !R && !L && !B) {return 44;}
        if (!T && !R && L && !B) {return 45;}
        return 47;
    }

    // 오토타일 전파: 주변 8칸 재계산
    propagateAutotile(x, y, layerIdx) {

        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;

            if (this.isOutofMap(checkX, checkY)) continue;

            const checkTileId = this.mapData(checkX, checkY, layerIdx);

            // 주변 타일이 오토타일이면 재계산
            if (this.isAutotile(checkTileId)) {
                const baseId = this.getAutotileBaseId(checkTileId);
                const newPattern = this.calculateAutotilePattern(checkX, checkY, layerIdx, baseId);
                this.setMapData(checkX, checkY, layerIdx, newPattern);
            }
        }
    }

    // 타일 지우기
    eraseTile(mapX, mapY, layerMode, selectedTile) {
        if (!main.map) return;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (this.isOutofMap(targetX, targetY)) continue;

                // R 탭(리전)은 Layer 5 지우기
                if (selectedTile.tab === 'R') {
                    this.setMapData(targetX, targetY, 5, 0);
                    continue;
                }

                // 자동 모드: 타일 그룹에 따라 레이어 결정
                if (layerMode === 'auto') {
                    if (selectedTile.tab === 'A') {
                        // A 그룹: Layer 1 → Layer 0 순으로 지우기
                        if (this.mapData(targetX, targetY, 1) !== 0) {
                            const oldTileId = this.mapData(targetX, targetY, 1);
                            this.setMapData(targetX, targetY, 1, 0);
                            // 오토타일이었다면 주변 전파
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 1);
                            }
                        } else {
                            const oldTileId = this.mapData(targetX, targetY, 0);
                            this.setMapData(targetX, targetY, 0, 0);
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 0);
                            }
                        }
                    } else {
                        // B~E 그룹: Layer 3 → Layer 2 순으로 지우기
                        if (this.mapData(targetX, targetY, 3) !== 0) {
                            this.setMapData(targetX, targetY, 3, 0);
                        } else {
                            this.setMapData(targetX, targetY, 2, 0);
                        }
                    }
                } else {
                    // 수동 모드: 선택한 레이어만 지우기
                    const layerIdx = parseInt(layerMode);
                    const oldTileId = this.mapData(targetX, targetY, layerIdx);
                    this.setMapData(targetX, targetY, layerIdx, 0);

                    // 오토타일이었다면 주변 전파
                    if (this.isAutotile(oldTileId)) {
                        this.propagateAutotile(targetX, targetY, layerIdx);
                    }
                }
            }
        }
        this.renderMap();
    }

    // 자동 레이어 결정 로직
    determineAutoLayer(x, y, tileId, tab) {

        // A그룹: Layer 0-1 (하층)  
        if (tab === 'A') {
            let targetLayer = 0
            if (!this.loader.isTileA5(tileId)) {
                // A1 타일인 경우 메타데이터에 따라 레이어 결정
                const tileIndex = Math.floor((tileId - this.loader.TILE_ID_A1) / 48);
                const row = Math.floor(tileIndex / 8);
                const col = tileIndex % 8;
                if (this.loader.isTileA1(tileId)) {
                    targetLayer = this.A1_LAYER_MAP[row][col];
                }
                if (this.loader.isTileA2(tileId) && col >= 4) {
                    targetLayer = 1;
                }
            } else {
                targetLayer = 1;
            }
            if (targetLayer === 0) {
                this.setMapData(x, y, 1, 0);
            }
            this.setMapData(x, y, 2, 0);
            this.setMapData(x, y, 3, 0);
            this.setMapData(x, y, 4, 0);
            return targetLayer
        }

        // B~E그룹: Layer 2-3 (상층)
        const layer3Tile = this.mapData(x, y, 3);

        // Layer 2가 비어있거나 같은 타일이면 Layer 2에 배치
        if (layer3Tile != 0) {
            this.setMapData(x, y, 2, layer3Tile);
            return 3;
        }
        // Layer 2에 다른 타일이 있으면 Layer 3에 배치
        return 2;
    }

    calculateTileId(selectedTile, offsetX, offsetY) {
        let baseId = 0;
        const tab = selectedTile.tab;
        const x = selectedTile.x + offsetX;
        const y = selectedTile.y + offsetY;

        if (!main["test"]) {
            main["test"] = 0
        }

        if (tab === 'A') {
            const aSection = selectedTile.aSection;
            if (!aSection) return 0;

            const section = aSection.section;
            const localY = aSection.localY;
            const tileX = selectedTile.x + offsetX;

            // A1: 오토타일 (2048 + 타일 인덱스 * 48)
            if (section === 'A1') {
                const aMap = [
                    // A1:
                    [2048, 2096, 2144, 2192, 2240, 2288, 2336, 2384],
                    [2432, 2480, 2528, 2576, 2624, 2672, 2720, 2768]
                ]
                return aMap[y][x];
            }
            // A2: 오토타일 (2816 + 타일 인덱스 * 48)
            else if (section === 'A2') {
                const tileIndex = localY * 8 + tileX;
                return 2816 + tileIndex * 48;
            }
            // A3: 오토타일 (4352 + 타일 인덱스 * 48)
            else if (section === 'A3') {
                const tileIndex = localY * 8 + tileX;
                return 4352 + tileIndex * 48;
            }
            // A4: 오토타일 (5888 + 타일 인덱스 * 48)
            else if (section === 'A4') {
                const tileIndex = localY * 8 + tileX;
                return 5888 + tileIndex * 48;
            }
            // A5: 일반 타일 (1536 + offset)
            else if (section === 'A5') {
                baseId = 1536;
                return baseId + (localY + offsetY) * 8 + tileX;
            }
        } else if (tab === 'B') {
            baseId = 0;
        } else if (tab === 'C') {
            baseId = 256;
        } else if (tab === 'D') {
            baseId = 512;
        } else if (tab === 'E') {
            baseId = 768;
        } else if (tab === 'R') {
            // 리전은 Layer 5에 1-255 값 직접 저장
            return selectedTile.regionId || 0;
        }

        return baseId + (selectedTile.y + offsetY) * 8 + (selectedTile.x + offsetX);
    }
}
