
class MapManager {
    constructor() {
        this.canvas = document.getElementById('map-canvas'); // 맵 캔버스로 수정 (기존 tileset-canvas 오타 수정)
        this.ctx = this.canvas.getContext('2d');
        this.tileset = null;
        this.tilesets = null;
        this.loader = new MapLoader();
        
        // A1 타일셋 메타데이터 (8x2 배열)
        // 레이어: 0=땅(Ground), 1=바닥(Floor)
        this.A1_LAYER_MAP = [
            [0, 0, 1, 1, 0, 0, 0, 0], // 첫 번째 행
            [0, 0, 0, 1, 0, 1, 0, 1]  // 두 번째 행
        ];
        
        // 오토타일 타입: 'floor'=바닥, 'wall'=벽, 'waterfall'=폭포, 'fixed'=고정
        this.A1_AUTOTILE_TYPE_MAP = [
            ['floor', 'floor', 'fixed', 'fixed', 'floor', 'waterfall', 'floor', 'waterfall'], // 첫 번째 행
            ['floor', 'waterfall', 'floor', 'fixed', 'floor', 'fixed', 'floor', 'fixed']  // 두 번째 행
        ];
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


    setTile(mapX, mapY, layerMode, selectedTile) {
        
        if (!main.map) return;

        const width = main.map.width;
        const height = main.map.height;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (targetX >= width || targetY >= height) continue;

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

                const index = (layerIdx * width * height) + (targetY * width) + targetX;
                main.map.data[index] = finalTileId;

                // 오토타일 전파: 주변 8칸 재계산 (항상 수행 - 인접 타일이 오토타일일 수 있음)
                // 레이어 0, 1에서만 오토타일 연결이 발생함
                if (layerIdx <= 1) {
                    this.propagateAutotile(targetX, targetY, layerIdx);
                }
            }
        }
        this.renderMap();
    }

    // 특정 좌표의 레이어 타일값 조회 함수
    getTileAt(x, y, layerIdx) {
        if (!main.map) return 0;
        const width = main.map.width;
        const height = main.map.height;
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        const index = (layerIdx * width * height) + (y * width) + x;
        return main.map.data[index] || 0;
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
        let tileType = 'A타일';
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
            [-1,  0],          [1,  0],   // 좌우
            [-1,  1], [0,  1], [1,  1]    // 아래쪽 3칸
        ];

        let pattern = 0;
        let bit = 1;

        for (let i = 0; i < 8; i++) {
            const [dx, dy] = directions[i];
            const checkX = x + dx;
            const checkY = y + dy;

            // 맵 범위 밖은 연결되지 않은 것으로 간주
            if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
                const checkIndex = (layerIdx * width * height) + (checkY * width) + checkX;
                const checkTileId = main.map.data[checkIndex] || 0;
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
        const T  = (bitPattern >> 1) & 1;  // Top (위)
        const TR = (bitPattern >> 2) & 1;  // Top-Right (우상단 코너)
        const L  = (bitPattern >> 3) & 1;  // Left (왼쪽)
        const R  = (bitPattern >> 4) & 1;  // Right (오른쪽)
        const BL = (bitPattern >> 5) & 1;  // Bottom-Left (좌하단 코너)
        const B  = (bitPattern >> 6) & 1;  // Bottom (아래)
        const BR = (bitPattern >> 7) & 1;  // Bottom-Right (우하단 코너)
        
        // RPG Maker MZ 표준 인덱스 계산
        let index = 0;
        
        // WALL 타입 테이블 (16개) - 벽 타일
        // RPG Maker MZ 공식 알고리즘: L=1, R=2, T=4, B=8
        if (autotileTable.length === 16) {
            // 패턴: 오른쪽만 연결
            // □□□
            // □ㅇ■
            // □□□
            if (!T && R && !B && !L) return 11;
            // 패턴: 위만 연결
            // □■□
            // □ㅇ□
            // □□□
            if (T && !R && !B && !L) return 13;
            // 패턴: 아래만 연결
            // □□□
            // □ㅇ□
            // □■□
            if (!T && !R && B && !L) return 7;
            
            // 패턴: 왼쪽만 연결
            // □□□
            // ■ㅇ□
            // □□□
            if (!T && !R && !B && L) return 14;
            // 패턴: 왼쪽+오른쪽만 연결
            // □□□
            // ■ㅇ■
            // □□□
            if (!T && R && !B && L) return 10;




            // 패턴: 4방향 모두 연결
            // ■■■
            // ■ㅇ■
            // ■■■
            if (T && R && B && L) return 0;
            
            
            
            
            
            
            // 패턴: 위+오른쪽+아래 연결
            // □■□
            // □ㅇ■
            // □■□
            if (T && R && B && !L) return 1; // # 완벽
            // 패턴: 왼쪽+오른쪽+아래 연결
            // □□□
            // ■ㅇ■
            // □■□
            if (!T && R && B && L) return 2; // # 완벽
            // 패턴: 오른쪽+아래 연결
            // □□□
            // □ㅇ■
            // □■□
            if (!T && R && B && !L) return 3; // # 완벽
            // 패턴: 위+왼쪽+아래 연결
            // □■□
            // ■ㅇ□
            // □■□
            if (T && !R && B && L) return 4; 
            // 패턴: 위+아래만 연결
            // □■□
            // □ㅇ□
            // □■□
            if (T && !R && B && !L) return 5;
            
            // 패턴: 왼쪽+아래 연결
            // □□□
            // ■ㅇ□
            // □■□
            if (!T && !R && B && L) return 6; // # 완벽
            
            
            // 패턴: 위+오른쪽 연결
            // □■□
            // □ㅇ■
            // □□□
            if (T && R && !B && !L) return 9; // # 완벽
            
            // 패턴: 위+왼쪽+오른쪽 연결
            // □■□
            // ■ㅇ■
            // □□□
            if (T && R && !B && L) return 8; // # 완벽
            // 패턴: 위+왼쪽 연결
            // □■□
            // ■ㅇ□
            // □□□
            if (T && !R && !B && L) return 12; // # 완벽
            
            
            
            
            // 패턴: 고립 (아무것도 연결 안됨)
            // □□□
            // □ㅇ□
            // □□□
            return 15;
        }
        
        // WATERFALL 타입 테이블 (4개) - 폭포 타일
        if (autotileTable.length === 4) {
            // 폭포 타입: 좌우만 고려
            if (L) index |= 0x01;
            if (R) index |= 0x02;
            return index;
        }
        
        // FLOOR 타입 테이블 (48개) - 바닥 타일
         
        
        // ========================================
        // 4방향 모두 연결 (0-15): 코너 조합
        // ========================================
        if (T && R && L && B) {
            // 패턴: 4방향 연결, 우측+하단 3코너
            // □■■
            // ■ㅇ■
            // ■■■
            if (!TL && TR && BL && BR) return 1; //# 완벽
            // 패턴: 4방향 연결, 좌측+하단 3코너
            // ■■□
            // ■ㅇ■
            // ■■■
            if (TL && !TR && BL && BR) return 2; //# 완벽
            // 패턴: 4방향 연결, 하단 양쪽 코너
            // □■□
            // ■ㅇ■
            // ■■■
            if (!TL && !TR && BL && BR) return 3; //# 완벽
            // 패턴: 4방향 연결, 상단+좌하단 3코너
            // ■■■
            // ■ㅇ■
            // ■■□
            if (TL && TR && BL && !BR) return 4; //# 완벽
            // 패턴: 4방향 연결, 상단+우하단 3코너
            // 패턴: 4방향 연결, 우상단+좌하단 대각선
            // □■■
            // ■ㅇ■
            // ■■□
            if (!TL && TR && BL && !BR) return 5; //# 완벽
            // 패턴: 4방향 연결, 좌측 양쪽 코너
            // ■■□
            // ■ㅇ■
            // ■■□
            if (TL && !TR && BL && !BR) return 6; //# 완벽
            // 패턴: 4방향 연결, 좌하단 코너만
            // □■□
            // ■ㅇ■
            // ■■□
            if (!TL && !TR && BL && !BR) return 7; //# 완벽
            // ■■■
            // ■ㅇ■
            // □■■
            if (TL && TR && !BL && BR) return 8; //# 완벽
            // 패턴: 4방향 연결, 우측 양쪽 코너
            // □■■
            // ■ㅇ■
            // □■■
            if (!TL && TR && !BL && BR) return 9; //# 완벽
            // 패턴: 4방향 연결, 좌상단+우하단 대각선
            // ■■□
            // ■ㅇ■
            // □■■
            if (TL && !TR && !BL && BR) return 10; //# 완벽
            // 패턴: 4방향 연결, 우하단 코너만
            // □■□
            // ■ㅇ■
            // □■■
            if (!TL && !TR && !BL && BR) return 11; //# 완벽
            // 패턴: 4방향 연결, 상단 양쪽 코너
            // ■■■
            // ■ㅇ■
            // □■□
            if (TL && TR && !BL && !BR) return 12; //# 완벽
            // 패턴: 4방향 연결, 우상단 코너만
            // □■■
            // ■ㅇ■
            // □■□
            if (!TL && TR && !BL && !BR) return 13; //# 완벽
            // 패턴: 4방향 연결, 좌상단 코너만
            // ■■□
            // ■ㅇ■
            // □■□
            if (TL && !TR && !BL && !BR) return 14; //# 완벽
            // 패턴: 4방향 연결, 코너 없음
            // □■□
            // ■ㅇ■
            // □■□
            if (!TL && !TR && !BL && !BR) return 15;
            // 패턴: 4방향 연결, 모든 코너
            // ■■■
            // ■ㅇ■
            // ■■■
            return 0;
        }
        
        // ========================================
        // 3방향 연결 패턴
        // ========================================
        
        // 패턴: 위+아래+오른쪽 연결
        // □■□
        // □ㅇ■
        // □■□
        if (T && R && !L && B) {
            if (TR && BR) return 16;   // 우측 양쪽 코너 // # 완벽
            if (!TR && BR) return 17;  // 우하단 코너만
            if (TR && !BR) return 18;  // 우상단 코너만
            return 19;                  // 코너 없음
        }
        // 패턴: 아래+좌+우 연결
        // □□□
        // ■ㅇ■
        // □■□
        if (!T && R && L && B) {
            if (BL && BR) return 20;   // 하단 양쪽 코너 
            if (BL && !BR) return 21;  // 좌하단 코너만 // # 완벽
            if (!BL && BR) return 22;  // 우하단 코너만 // # 완벽
            return 23;                  // 코너 없음
        }
        // 패턴: 위+아래+왼쪽 연결
        // □■□
        // ■ㅇ□
        // □■□
        if (T && !R && L && B) {
            if (TL && BL) return 24;   // 좌측 양쪽 코너
            if (TL && !BL) return 25;  // 좌상단 코너만
            if (!TL && BL) return 26;  // 좌하단 코너만
            return 27;                   // 코너 없음
        }
        // 패턴: 위+왼쪽+오른쪽 연결
        // □■□
        // ■ㅇ■
        // □□□
        if (T && R && L && !B) {
            if (TL && TR) return 28;   // 상단 양쪽 코너
            if (!TL && TR) return 29;  // 우상단 코너만
            if (TL && !TR) return 30;  // 좌상단 코너만
            return 31;                   // 코너 없음
        }
        
        // ========================================
        // 2방향 연결 (반대편)
        // ========================================
        
        // 패턴: 위+아래만 연결 (세로)
        // □■□
        // □ㅇ□
        // □■□
        if (T && !R && !L && B) {
            return 32;
        }
        
        // 패턴: 왼쪽+오른쪽만 연결 (가로)
        // □□□
        // ■ㅇ■
        // □□□
        if (!T && R && L && !B) {
            return 33;
        }
        
        // ========================================
        // 2방향 연결 (인접)
        // ========================================
        
        // 패턴: 아래+오른쪽 연결
        // □□□
        // □ㅇ■
        // □■□
        if (!T && R && !L && B) {
            if (BR) return 34;  // 우하단 코너
            return 35;            // 코너 없음
        }
        // 패턴: 아래+왼쪽 연결
        // □□□
        // ■ㅇ□
        // □■□
        if (!T && !R && L && B) {
            if (BL) return 36;  // 좌하단 코너
            return 37;            // 코너 없음
        }
        // 패턴: 위+왼쪽 연결
        // □■□
        // ■ㅇ□
        // □□□
        if (T && !R && L && !B) {
            if (TL) return 38;  // 좌상단 코너
            return 39;            // 코너 없음
        }
        
        // 패턴: 위+오른쪽 연결
        // □■□
        // □ㅇ■
        // □□□
        if (T && R && !L && !B) {
            if (TR) return 40;  // 우상단 코너
            return 41;           // 코너 없음
        }
        
        // ========================================
        // 1방향만 연결
        // ========================================

        // 패턴: 아래만 연결
        // □□□
        // □ㅇ□
        // □■□
        if (!T && !R && !L && B) {
            return 42;
        }
        // 패턴: 오른쪽만 연결
        // □□□
        // □ㅇ■
        // □□□
        if (!T && R && !L && !B) {
            return 43;
        }
        // 패턴: 위만 연결
        // □■□
        // □ㅇ□
        // □□□
        if (T && !R && !L && !B) {
            return 44;
        }
        // 패턴: 왼쪽만 연결
        // □□□
        // ■ㅇ□
        // □□□
        if (!T && !R && L && !B) {
            return 45;
        }
        // 기본값 (고립)
        // 패턴: 고립 타일 (아무것도 연결 안됨)
        // □□□
        // □ㅇ□
        // □□□
        return 47;
    }

    // 오토타일 전파: 주변 8칸 재계산
    propagateAutotile(x, y, layerIdx) {
        const width = main.map.width;
        const height = main.map.height;

        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];

        for (const [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;

            if (checkX < 0 || checkX >= width || checkY < 0 || checkY >= height) continue;

            const checkIndex = (layerIdx * width * height) + (checkY * width) + checkX;
            const checkTileId = main.map.data[checkIndex];

            // 주변 타일이 오토타일이면 재계산
            if (this.isAutotile(checkTileId)) {
                const baseId = this.getAutotileBaseId(checkTileId);
                const newPattern = this.calculateAutotilePattern(checkX, checkY, layerIdx, baseId);
                main.map.data[checkIndex] = newPattern;
            }
        }
    }

    // 타일 지우기
    eraseTile(mapX, mapY, layerMode, selectedTile) {
        if (!main.map) return;

        const width = main.map.width;
        const height = main.map.height;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (targetX >= width || targetY >= height) continue;

                // R 탭(리전)은 Layer 5 지우기
                if (selectedTile.tab === 'R') {
                    const index = (5 * width * height) + (targetY * width) + targetX;
                    main.map.data[index] = 0;
                    continue;
                }

                // 자동 모드: 타일 그룹에 따라 레이어 결정
                if (layerMode === 'auto') {
                    if (selectedTile.tab === 'A') {
                        // A 그룹: Layer 1 → Layer 0 순으로 지우기
                        const layer1Index = (1 * width * height) + (targetY * width) + targetX;
                        if (main.map.data[layer1Index] !== 0) {
                            const oldTileId = main.map.data[layer1Index];
                            main.map.data[layer1Index] = 0;
                            // 오토타일이었다면 주변 전파
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 1);
                            }
                        } else {
                            const layer0Index = (0 * width * height) + (targetY * width) + targetX;
                            const oldTileId = main.map.data[layer0Index];
                            main.map.data[layer0Index] = 0;
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 0);
                            }
                        }
                    } else {
                        // B~E 그룹: Layer 3 → Layer 2 순으로 지우기
                        const layer3Index = (3 * width * height) + (targetY * width) + targetX;
                        if (main.map.data[layer3Index] !== 0) {
                            main.map.data[layer3Index] = 0;
                        } else {
                            const layer2Index = (2 * width * height) + (targetY * width) + targetX;
                            main.map.data[layer2Index] = 0;
                        }
                    }
                } else {
                    // 수동 모드: 선택한 레이어만 지우기
                    const layerIdx = parseInt(layerMode);
                    const index = (layerIdx * width * height) + (targetY * width) + targetX;
                    const oldTileId = main.map.data[index];
                    main.map.data[index] = 0;
                    
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
        const width = main.map.width;
        const height = main.map.height;

        // 비교를 위해 타일 ID를 Base ID로 변환
        const targetBaseId = this.getAutotileBaseId(tileId);

        // A그룹: Layer 0-1 (하층)
        if (tab === 'A') {
            // A1 타일인 경우 메타데이터에 따라 레이어 결정
            if (this.loader.isTileA1(tileId)) {
                const tileIndex = Math.floor((tileId - this.loader.TILE_ID_A1) / 48);
                const row = Math.floor(tileIndex / 8);
                const col = tileIndex % 8;
                // console.log(row,col)
                
                if (row < 2 && col < 8) {
                    const targetLayer = this.A1_LAYER_MAP[row][col];
                    
                    // 땅(Layer 0)을 배치하는 경우, 위의 모든 레이어 삭제
                    if (targetLayer === 0) {
                        const index1 = (1 * width * height) + (y * width) + x;
                        const index2 = (2 * width * height) + (y * width) + x;
                        const index3 = (3 * width * height) + (y * width) + x;
                        const index4 = (4 * width * height) + (y * width) + x;
                        main.map.data[index1] = 0;
                        main.map.data[index2] = 0;
                        main.map.data[index3] = 0;
                        main.map.data[index4] = 0;
                    }
                    
                    return targetLayer;
                }
            }
            
            // A1이 아닌 A 타일의 기존 로직
            const layer0Index = (0 * width * height) + (y * width) + x;
            const layer0Tile = main.map.data[layer0Index] || 0;
            const layer0BaseId = this.getAutotileBaseId(layer0Tile);
            
            // Layer 0이 비어있거나 같은 종류의 타일이면 Layer 0에 배치 (중복 쌓기 방지)
            if (layer0Tile === 0 || layer0BaseId === targetBaseId) {
                return 0;
            }
            // Layer 0에 다른 종류의 타일이 있으면 Layer 1에 배치
            return 1;
        }
        
        // B~E그룹: Layer 2-3 (상층)
        const layer2Index = (2 * width * height) + (y * width) + x;
        const layer2Tile = main.map.data[layer2Index] || 0;
        
        // Layer 2가 비어있거나 같은 타일이면 Layer 2에 배치
        if (layer2Tile === 0 || layer2Tile === tileId) {
            return 2;
        }
        // Layer 2에 다른 타일이 있으면 Layer 3에 배치
        return 3;
    }

    calculateTileId(selectedTile, offsetX, offsetY) {
        let baseId = 0;
        const tab = selectedTile.tab;
        const x = selectedTile.x + offsetX;
        const y = selectedTile.y + offsetY;

        if(!main["test"]){
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
                    [2048,2432, 2192, 2576,2240,2384,2624,2768],
                    [2100],
                    // A2:
                    [2816,2864, 2912,2976,3016,3064,3112,3160],
                    [3208,3256, 3304,3368,3408,3456,3504,3552],
                    [3600,3648, 3696,3760,3800,3848,3896,3944],
                    [3992,4040, 4088,4152,4192,4240,4288,4336],
                    // // 48씩 8길이
                    // [4264,4648, 4416, 4800,4456,4600,4840,4984],
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
            // A1 타일 처리: 타일 위치에 따라 타입 결정
            tileType = 'A1';
            const row = Math.floor(kind / 8);
            const col = kind % 8;
            
            
            const tileTypeStr = (row < 2 && col < 8) ? main.mapManager.A1_AUTOTILE_TYPE_MAP[row][col] : 'floor';
            
            // 타일셋 상의 위치 계산
            bx = col * 2;
            by = row * 3;
            
            // 오토타일 타입에 따라 테이블 선택
            if (tileTypeStr === 'fixed') {
                // 고정 타일은 항상 같은 모양 (패턴 0)
                autotileTable = this.FLOOR_AUTOTILE_TABLE;
            } else if (tileTypeStr === 'waterfall') {
                autotileTable = this.WATERFALL_AUTOTILE_TABLE;
            } else { // 'floor'
                autotileTable = this.FLOOR_AUTOTILE_TABLE;
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
        if(!tile.img){
            return
        }

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