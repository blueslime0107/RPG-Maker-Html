
class TileEditor {
    constructor() {
        this.tile = null
        this.tool = 'pen' // pen, fill, select
        this.layer = 'auto'
        this.tab = 'A'
        this.selectRect = document.getElementById('tileset-selection-rect');
        this.tabsBtn = document.querySelectorAll('.tab-btn');
        this.tilesetViewer = new TilesetViewer('tileset-canvas');
    }

    init(){
        this.initTabEvents()
        this.initLayerEvents()
        this.initToolEvents()
        this.initTilesetEvents()
    }

    update(){
        this.tilesetViewer.drawTileset(main.data.tilesets[editor.map.tilesetId].tilesetNames,this.tab);
    }
    // 타일셋 뷰
    initTabEvents() {
        this.tabsBtn.forEach(tab => {
            tab.addEventListener('click', () => {
                // UI 상태 변경
                this.tabsBtn.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 타일셋 이미지 변경 및 렌더링 (MapManager에 요청)
                this.tab = tab.dataset.tab; // A, B, C, D, E, R
                if (this.tab === 'R') {
                    this.tilesetViewer.drawRegionTileset();
                } else {
                    this.tilesetViewer.drawTileset(main.data.tilesets[editor.map.tilesetId].tilesetNames,this.tab);
                }
                this.updateTilesetSelection(-1)
                selectionRect.style.width = '48px';
                selectionRect.style.height = '48px';
            });
        });
    }
    // 레이어 선택 이벤트
    initLayerEvents() {
        const layerBtns = document.querySelectorAll('.layer-btn');
        layerBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI 상태 변경
                layerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 레이어 선택 값 업데이트
                this.layer = btn.dataset.layer; // 'auto', '0', '1', '2', '3'
                console.log(`레이어 선택: ${this.layer}`);
                
                // MapLoader의 하이라이트 모드 변경
                mapViewer.loader.setHighlightMode(this.layer);
            });
        });
    }
    // 툴 버튼 이벤트
    initToolEvents() {
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                
                // reset-zoom은 즉시 실행
                if (tool === 'reset-zoom') {
                    editor.resetMapZoom();
                    return;
                }
                
                // UI 상태 변경
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.tool = tool;
                console.log(`툴 선택: ${this.tool}`);
            });
        });
    }

    initTilesetEvents() {
        const tsCanvas = document.getElementById('tileset-canvas');

        let isDragging = false;
        let startX = 0;
        let startY = 0;

        tsCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = tsCanvas.getBoundingClientRect();
            startX = Math.floor((e.clientX - rect.left) / 48);
            startY = Math.floor((e.clientY - rect.top) / 48);

            this.updateTilesetSelection(startX, startY, startX, startY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = tsCanvas.getBoundingClientRect();

            // 마우스가 타일셋 영역 안에 있을 때만 계산
            const currentX = Math.floor((e.clientX - rect.left) / 48);
            const currentY = Math.floor((e.clientY - rect.top) / 48);

            // 8칸 고정이므로 X축 범위 제한 (0~7)
            const clampedX = Math.max(0, Math.min(7, currentX));
            const clampedY = Math.max(0, currentY);

            this.updateTilesetSelection(startX, startY, clampedX, clampedY);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // 우클릭으로 선택 1칸으로 초기화
        tsCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // 기본 컨텍스트 메뉴 방지
            
            const rect = tsCanvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / 48);
            const y = Math.floor((e.clientY - rect.top) / 48);
            
            // 8칸 고정이므로 X축 범위 제한 (0~7)
            const clampedX = Math.max(0, Math.min(7, x));
            const clampedY = Math.max(0, y);
            
            // 1칸 선택으로 초기화 (선택 사각형은 유지)
            this.updateTilesetSelection(clampedX, clampedY, clampedX, clampedY);
        });
    }  
    // 선택된 타일범위 표시
    updateTilesetSelection(x1, y1, x2, y2) {
        if(x1 == -1){ // 리셋
            this.updateSelectedTile(-1)
            return
        }
        // 시작점과 끝점 중 작은 값을 왼쪽 위 좌표로 사용
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const right = Math.max(x1, x2);
        const bottom = Math.max(y1, y2);

        const width = (right - left + 1);
        const height = (bottom - top + 1);

        // 시각적 업데이트
        this.updateSelectedTile(left, top, width, height);
    }

    updateSelectedTile(x,y,w,h){
        if(x == -1){ // 리셋
            this.tile = null
            this.selectRect.style.display = 'none';
            this.selectRect.style.width = 0
            this.selectRect.style.height = 0
            return
        }
        this.tile = {x,y,w,h};

        this.selectRect.style.display = 'block';
        this.selectRect.style.left = (x * 48 ) + 'px'; // 테두리 두께 보정
        this.selectRect.style.top = (y * 48 ) + 'px';
        this.selectRect.style.width = (w * 48 ) + 'px';
        this.selectRect.style.height = (h * 48 ) + 'px';
    }


    // 맵 그리기 섹션

    paintTile(x,y){
        if (!this.tile) return; // 선택된 타일이 없으면 무시
        // 툴에 따라 다른 동작
        this.setTile(x, y);
    }
    setTile(mapX, mapY) {
        for (let h = 0; h < this.tile.h; h++) {
            for (let w = 0; w < this.tile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                const tileId = this.getTileId(w, h);

                // R 탭(리전)은 항상 Layer 5에 배치
                let layerIdx;
                if (this.tab === 'R') {
                    layerIdx = 5;
                } else if (this.layer === 'auto') {
                    layerIdx = this.determineAutoLayer(targetX, targetY, tileId, this.tab);
                } else {
                    layerIdx = parseInt(this.layer);
                }

                // 오토타일인 경우 주변 타일 검사 후 패턴 결정
                let finalTileId = tileId;
                if (editor.isAutotile(tileId)) {
                    finalTileId = this.calculateAutotilePattern(targetX, targetY, layerIdx, tileId);
                }

                editor.setMapData(targetX, targetY, layerIdx, finalTileId);

                // 오토타일 전파: 주변 8칸 재계산 (항상 수행 - 인접 타일이 오토타일일 수 있음)
                // 레이어 0, 1에서만 오토타일 연결이 발생함
                this.propagateAutotile(targetX, targetY, layerIdx);
            }
        }
    }

    getTileId(offsetX, offsetY) {
        let baseId = 0;
        const x = this.tile.x + offsetX;
        const y = this.tile.y + offsetY;

        if (this.tab === 'A') {
            const tileX = this.tile.x + offsetX;

            // A1: 오토타일 (2048 + 타일 인덱스 * 48)
            if (y < 2) {
                const aMap = [
                    // A1:
                    [2048, 2096, 2144, 2192, 2240, 2288, 2336, 2384],
                    [2432, 2480, 2528, 2576, 2624, 2672, 2720, 2768]
                ]
                return aMap[y][x];
            }
            // A2: 오토타일 (2816 + 타일 인덱스 * 48)
            else if (y < 6) {
                const tileIndex = 2 * 8 + tileX;
                return 2816 + tileIndex * 48;
            }
            // A3: 오토타일 (4352 + 타일 인덱스 * 48)
            else if (y < 10) {
                const tileIndex = 6 * 8 + tileX;
                return 4352 + tileIndex * 48;
            }
            // A4: 오토타일 (5888 + 타일 인덱스 * 48)
            else if (y < 16) {
                const tileIndex = 10 * 8 + tileX;
                return 5888 + tileIndex * 48;
            }
            // A5: 일반 타일 (1536 + offset)
            else {
                baseId = 1536;
                return baseId + (16 + offsetY) * 8 + tileX;
            }
        } else if (this.tab === 'B') {
            baseId = 0;
        } else if (this.tab === 'C') {
            baseId = 256;
        } else if (this.tab === 'D') {
            baseId = 512;
        } else if (this.tab === 'E') {
            baseId = 768;
        } else if (this.tab === 'R') {
            // 리전은 Layer 5에 1-255 값 직접 저장
            return this.tile.regionId || 0;
        }

        return baseId + (this.tile.y + offsetY) * 8 + (this.tile.x + offsetX);
    }
    // 자동 레이어 결정 로직
    determineAutoLayer(x, y, tileId) {

        // A그룹: Layer 0-1 (하층)  
        if (this.tab === 'A') {
            let targetLayer = 0
            if (!editor.isTileA5(tileId)) {
                // A1 타일인 경우 메타데이터에 따라 레이어 결정
                const tileIndex = Math.floor((tileId - editor.TILE_ID_A1) / 48);
                const row = Math.floor(tileIndex / 8);
                const col = tileIndex % 8;
                if (editor.isTileA1(tileId)) {
                    targetLayer = 0; // this.A1_LAYER_MAP[row][col];
                }
                if (editor.isTileA2(tileId) && col >= 4) {
                    targetLayer = 1;
                }
            } else {
                targetLayer = 1;
            }
            if (targetLayer === 0) {
                editor.setMapData(x, y, 1, 0);
            }
            editor.setMapData(x, y, 2, 0);
            editor.setMapData(x, y, 3, 0);
            editor.setMapData(x, y, 4, 0);
            return targetLayer
        }

        // B~E그룹: Layer 2-3 (상층)
        const layer3Tile = editor.mapData(x, y, 3);

        // Layer 2가 비어있거나 같은 타일이면 Layer 2에 배치
        if (layer3Tile != 0) {
            editor.setMapData(x, y, 2, layer3Tile);
            return 3;
        }
        // Layer 2에 다른 타일이 있으면 Layer 3에 배치
        return 2;
    }
    // 오토타일 패턴 계산 (8방향 연결 검사)
    calculateAutotilePattern(x, y, layerIdx, baseTileId) {
        const baseId = editor.getAutotileBaseId(baseTileId);

        // 타일 타입 확인 및 적절한 autotile 테이블 선택
        let tileType = 'A1';
        let autotileType = '';
        let autotileTable = FLOOR_AUTOTILE_TABLE;

        if (editor.isTileA1(baseId)) {
            tileType = 'A1';
            autotileType = editor.getA1AutotileType(baseId);

            // A1은 타입에 따라 테이블 선택 (MapLoader.drawAutotile과 동일)
            if (autotileType === 'waterfall') {
                autotileTable = WATERFALL_AUTOTILE_TABLE;
            } else if (autotileType === 'wall') {
                autotileTable = WALL_AUTOTILE_TABLE;
            } else { // 'floor' 또는 'fixed'
                autotileTable = FLOOR_AUTOTILE_TABLE;
            }
        } else if (editor.isTileA2(baseId)) {
            tileType = 'A2';
            autotileTable = FLOOR_AUTOTILE_TABLE;
        } else if (editor.isTileA3(baseId)) {
            tileType = 'A3';
            autotileTable = WALL_AUTOTILE_TABLE;
        } else if (editor.isTileA4(baseId)) {
            tileType = 'A4';
            // A4는 짝수/홀수에 따라 다른 테이블 사용
            const kind = editor.getAutotileKind(baseId);
            const ty = Math.floor(kind / 8);
            if (ty % 2 === 1) {
                autotileTable = WALL_AUTOTILE_TABLE;
            } else {
                autotileTable = FLOOR_AUTOTILE_TABLE;
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
            if (!editor.isNotOnMap(checkX, checkY)) {
                const checkTileId = editor.mapData(checkX, checkY, layerIdx);
                const checkBaseId = editor.getAutotileBaseId(checkTileId);

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
    propagateAutotile(x, y, layerIdx) {

        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;

            if (editor.isNotOnMap(checkX, checkY)) continue;

            const checkTileId = editor.mapData(checkX, checkY, layerIdx);

            // 주변 타일이 오토타일이면 재계산
            if (editor.isAutotile(checkTileId)) {
                const baseId = editor.getAutotileBaseId(checkTileId);
                const newPattern = this.calculateAutotilePattern(checkX, checkY, layerIdx, baseId);
                editor.setMapData(checkX, checkY, layerIdx, newPattern);
            }
        }
    }
}

class TilesetViewer {
    constructor(canvas) {
        this.canvas = document.getElementById(canvas);
        this.ctx = this.canvas.getContext('2d');
    }
    drawTile(img,x,y,_dx,_dy){
        const sx = x * TILE_SIZE;
        const sy = y * TILE_SIZE;
        const dx = _dx * TILE_SIZE;
        const dy = _dy * TILE_SIZE;
        this.ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
    }

    drawTileset(tileset, tabName) {
        tabName = tabName || this.selectedTilesetTab
        
        // A 탭은 특수 처리
        if (tabName === 'A') {
            this.drawAutotileset(tileset);
            return;
        }

        const COLUMNS = 8; // 가로 8칸 고정
        const CANVAS_WIDTH = TILE_SIZE * COLUMNS; // 384px

        // 탭 이름에 따른 인덱스 설정
        let imgIndex = 0;
        if (tabName === 'B') imgIndex = 5;
        if (tabName === 'C') imgIndex = 6;
        if (tabName === 'D') imgIndex = 7;
        if (tabName === 'E') imgIndex = 8;

        const img = main.images.tilesets.get(tileset[imgIndex]); // 이미지 불러옴

        if (img) {
            // 1. 필요한 총 높이 계산
            // 가로가 8칸보다 넓다면, 그만큼 세로로 더 길게 그려야 함
            const imgCols = img.width / TILE_SIZE;
            const imgRows = img.height / TILE_SIZE;
            const horizontalChunks = Math.ceil(imgCols / COLUMNS); // 가로로 몇 배 더 넓은가?
            const totalRows = imgRows * horizontalChunks;

            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = totalRows * TILE_SIZE;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // clear

            // 2. 이미지를 8칸 단위로 쪼개서 그리기
            for (let r = 0; r < imgRows; r++) {
                for (let c = 0; c < imgCols; c++) {
                    // 대상 캔버스 좌표 (8칸마다 줄바꿈 발생)
                    // c % 8 은 가로 위치, (r + c/8의 몫 * 원본높이)는 세로 위치
                    this.drawTile(img,c,r,(c % COLUMNS),(r + Math.floor(c / COLUMNS) * imgRows))
                }
            }
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            console.warn(`${tabName} 탭(index:${imgIndex})에 해당하는 이미지가 없습니다.`);
        }
    }
    // A 탭 (오토타일) 특수 렌더링
    drawAutotileset(tileset) {

        // A1-A5 이미지 로드
        const imgA1 = main.images.tilesets.get(tileset[0]);
        const imgA2 = main.images.tilesets.get(tileset[1]);
        const imgA3 = main.images.tilesets.get(tileset[2]);
        const imgA4 = main.images.tilesets.get(tileset[3]);
        const imgA5 = main.images.tilesets.get(tileset[4]);
        // 캔버스 크기 계산
        let totalHeight = 0;
        if (imgA1) totalHeight += 2 * TILE_SIZE; // A1: 2행
        if (imgA2) totalHeight += 4 * TILE_SIZE; // A2: 4행
        if (imgA3) totalHeight += 4 * TILE_SIZE; // A3: 4행
        if (imgA4) totalHeight += 6 * TILE_SIZE; // A4: 6행
        if (imgA5) totalHeight += 16 * TILE_SIZE; // A5: 16행 (일반 타일)

        this.canvas.width = 8 * TILE_SIZE;
        this.canvas.height = totalHeight;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let currentY = 0;

        // A1 렌더링
        if (imgA1) {
            const coords = [
                [0,0], [6,0], [8,0], [14,0], [0,3], [6,3], [8,3], [14,3],
                [0,6], [6,6], [8,6], [14,6], [0,9], [6,9], [8,9], [14,9]
            ];
            coords.forEach((coord, i) => {
                this.drawTile(imgA1,coord[0],coord[1],(i % 8),Math.floor(i / 8))
            });
            currentY += 2 * TILE_SIZE;
        }

        // A2 렌더링
        if (imgA2) {
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA2,col * 2,row * 3,col,currentY/TILE_SIZE + row)
                }
            }
            currentY += 4 * TILE_SIZE;
        }

        // A3 렌더링
        if (imgA3) {
            const yCoords = [0, 2, 4, 6];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA3,col * 2,yIdx,col,currentY/TILE_SIZE + row)
                }
            });
            currentY += 4 * TILE_SIZE;
        }

        // A4 렌더링
        if (imgA4) {
            const yCoords = [0, 3, 5, 8, 10, 13];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA4,col * 2,yIdx,col,currentY/TILE_SIZE + row)
                }
            });
            currentY += 6 * TILE_SIZE;
        }

        // A5 렌더링 (일반 타일처럼)
        if (imgA5) {
            const imgCols = imgA5.width / TILE_SIZE;
            const imgRows = imgA5.height / TILE_SIZE;
            for (let r = 0; r < imgRows; r++) {
                for (let c = 0; c < imgCols; c++) {
                    this.drawTile(imgA5,c,r,(c % 8),currentY/TILE_SIZE + (r + Math.floor(c / 8) * imgRows))
                }
            }
        }
    }
    // R 탭 (지역번호) 그리기
    drawRegionTileset() {
        
        // 16x16 그리드 (256칸, 0~255)
        this.canvas.width = 8 * TILE_SIZE;
        this.canvas.height = 32 * TILE_SIZE;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 색상 배열 (빨주노연초청하파남보자핑)
        const colors = [
            '#ff5353', // 빨
            '#ffa64c', // 주
            '#ffff43', // 노
            '#a8ff51', // 연
            '#33ff3d', // 초
            '#57ff8f', // 청
            '#3db1ff', // 하
            '#3e3bff', // 파
            '#6034ff', // 남
            '#a443ff', // 보
            '#ff5b7e', // 자
            '#ff9fcf'  // 핑
        ];
        
        // 1~255 타일 그리기 (0은 비워둠)
        for (let i = 1; i <= 255; i++) {
            const x = (i % 8);
            const y = Math.floor(i / 8);
            const dx = x * TILE_SIZE;
            const dy = y * TILE_SIZE;
            
            // 색상 배경
            const colorIdx = (i - 1) % colors.length;
            this.ctx.fillStyle = colors[colorIdx];
            this.ctx.fillRect(dx + 2, dy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            
            // 숫자 표시
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(i.toString(), dx + TILE_SIZE / 2, dy + TILE_SIZE / 2);
        }
    }
}