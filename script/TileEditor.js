
class TileEditor {
    constructor() {
        this.selectedTilesetTab = 'A'
        this.tilesetViewer = new TilesetViewer('tileset-canvas');
    }

    init(){
    }

    update(){
        this.tilesetViewer.drawTileset(main.data.tilesets[editor.map.tilesetId].tilesetNames,this.selectedTilesetTab);
    }
}

class TilesetViewer {
    constructor(canvas) {
        this.canvas = document.getElementById(canvas);
    }

    drawTileset(tileset, tabName) {
        tabName = tabName || this.selectedTilesetTab
        
        // A 탭은 특수 처리
        if (tabName === 'A') {
            this.drawAutotileset(tileset);
            return;
        }

        const ctx = this.canvas.getContext('2d');
        const TILE_SIZE = 48;
        const COLUMNS = 8; // 가로 8칸 고정
        const CANVAS_WIDTH = TILE_SIZE * COLUMNS; // 384px

        // 탭 이름에 따른 인덱스 설정
        let imgIndex = 0;
        if (tabName === 'B') imgIndex = 5;
        if (tabName === 'C') imgIndex = 6;
        if (tabName === 'D') imgIndex = 7;
        if (tabName === 'E') imgIndex = 8;

        const img = main.images.tilesets.get(tileset[imgIndex]);

        if (img) {
            // 1. 필요한 총 높이 계산
            // 가로가 8칸보다 넓다면, 그만큼 세로로 더 길게 그려야 함
            const imgCols = img.width / TILE_SIZE;
            const imgRows = img.height / TILE_SIZE;
            const horizontalChunks = Math.ceil(imgCols / COLUMNS); // 가로로 몇 배 더 넓은가?
            const totalRows = imgRows * horizontalChunks;

            canvas.width = CANVAS_WIDTH;
            canvas.height = totalRows * TILE_SIZE;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 2. 이미지를 8칸 단위로 쪼개서 그리기
            for (let r = 0; r < imgRows; r++) {
                for (let c = 0; c < imgCols; c++) {
                    // 원본 소스 좌표 (img에서 뜯어올 위치)
                    const sx = c * TILE_SIZE;
                    const sy = r * TILE_SIZE;

                    // 대상 캔버스 좌표 (8칸마다 줄바꿈 발생)
                    // c % 8 은 가로 위치, (r + c/8의 몫 * 원본높이)는 세로 위치
                    const dx = (c % COLUMNS) * TILE_SIZE;
                    const dy = (r + Math.floor(c / COLUMNS) * imgRows) * TILE_SIZE;

                    ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
                }
            }
        } else {
            // 이미지가 없을 경우 캔버스 초기화
            canvas.width = CANVAS_WIDTH;
            canvas.height = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            console.warn(`${tabName} 탭(index:${imgIndex})에 해당하는 이미지가 없습니다.`);
        }
    }
    // A 탭 (오토타일) 특수 렌더링
    drawAutotileset(tileset) {
        const canvas = document.getElementById('tileset-canvas');
        const ctx = canvas.getContext('2d');
        const TILE_SIZE = 48;

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

        canvas.width = 8 * TILE_SIZE;
        canvas.height = totalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let currentY = 0;

        // A1 렌더링
        if (imgA1) {
            const coords = [
                [0,0], [6,0], [8,0], [14,0], [0,3], [6,3], [8,3], [14,3],
                [0,6], [6,6], [8,6], [14,6], [0,9], [6,9], [8,9], [14,9]
            ];
            coords.forEach((coord, i) => {
                const dx = (i % 8) * TILE_SIZE;
                const dy = currentY + Math.floor(i / 8) * TILE_SIZE;
                ctx.drawImage(imgA1, coord[0]*TILE_SIZE, coord[1]*TILE_SIZE, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
            });
            currentY += 2 * TILE_SIZE;
        }

        // A2 렌더링
        if (imgA2) {
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 8; col++) {
                    const sx = col * 2 * TILE_SIZE;
                    const sy = row * 3 * TILE_SIZE;
                    const dx = col * TILE_SIZE;
                    const dy = currentY + row * TILE_SIZE;
                    ctx.drawImage(imgA2, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
                }
            }
            currentY += 4 * TILE_SIZE;
        }

        // A3 렌더링
        if (imgA3) {
            const yCoords = [0, 2, 4, 6];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    const sx = col * 2 * TILE_SIZE;
                    const sy = yIdx * TILE_SIZE;
                    const dx = col * TILE_SIZE;
                    const dy = currentY + row * TILE_SIZE;
                    ctx.drawImage(imgA3, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
                }
            });
            currentY += 4 * TILE_SIZE;
        }

        // A4 렌더링
        if (imgA4) {
            const yCoords = [0, 3, 5, 8, 10, 13];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    const sx = col * 2 * TILE_SIZE;
                    const sy = yIdx * TILE_SIZE;
                    const dx = col * TILE_SIZE;
                    const dy = currentY + row * TILE_SIZE;
                    ctx.drawImage(imgA4, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
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
                    const sx = c * TILE_SIZE;
                    const sy = r * TILE_SIZE;
                    const dx = (c % 8) * TILE_SIZE;
                    const dy = currentY + (r + Math.floor(c / 8) * imgRows) * TILE_SIZE;
                    ctx.drawImage(imgA5, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    // 타일셋 뷰
    initTabEvents() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // UI 상태 변경
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 타일셋 이미지 변경 및 렌더링 (MapManager에 요청)
                this.selectedTilesetTab = tab.dataset.tab; // A, B, C, D, E, R
                if (this.selectedTilesetTab === 'R') {
                    this.drawRegionTileset();
                } else {
                    this.drawTileset();
                }
            });
        });
    }
}