
class TileEditor {
    constructor() {
        this.selectedTilesetTab = 'A'
        this.tilesetViewer = new TilesetViewer('tileset-canvas');
        this.tabs = document.querySelectorAll('.tab-btn');
    }

    init(){
        this.initTabEvents()
        this.initLayerEvents()
        this.initToolEvents()
    }

    // 타일셋 뷰
    initTabEvents() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // UI 상태 변경
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 타일셋 이미지 변경 및 렌더링 (MapManager에 요청)
                this.selectedTilesetTab = tab.dataset.tab; // A, B, C, D, E, R
                if (this.selectedTilesetTab === 'R') {
                    this.tilesetViewer.drawRegionTileset();
                } else {
                    this.tilesetViewer.drawTileset(main.data.tilesets[editor.map.tilesetId].tilesetNames,this.selectedTilesetTab);
                }
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
                this.selectedLayer = btn.dataset.layer; // 'auto', '0', '1', '2', '3'
                console.log(`레이어 선택: ${this.selectedLayer}`);
                
                // MapLoader의 하이라이트 모드 변경
                if (main.mapManager && main.mapManager.loader) {
                    main.mapManager.loader.setHighlightMode(this.selectedLayer);
                }
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
                    this.resetMapZoom();
                    return;
                }
                
                // UI 상태 변경
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.selectedTool = tool;
                console.log(`툴 선택: ${this.selectedTool}`);
            });
        });
    }
    
    update(){
        this.tilesetViewer.drawTileset(main.data.tilesets[editor.map.tilesetId].tilesetNames,this.selectedTilesetTab);
    }
}

class TilesetViewer {
    constructor(canvas) {
        this.canvas = document.getElementById(canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    drawTile(img,x,y,_dx,_dy){
        const sx = x * main.TILE_SIZE;
        const sy = y * main.TILE_SIZE;
        const dx = _dx * main.TILE_SIZE;
        const dy = _dy * main.TILE_SIZE;
        this.ctx.drawImage(img, sx, sy, main.TILE_SIZE, main.TILE_SIZE, dx, dy, main.TILE_SIZE, main.TILE_SIZE);
    }

    drawTileset(tileset, tabName) {
        tabName = tabName || this.selectedTilesetTab
        
        // A 탭은 특수 처리
        if (tabName === 'A') {
            this.drawAutotileset(tileset);
            return;
        }

        const COLUMNS = 8; // 가로 8칸 고정
        const CANVAS_WIDTH = main.TILE_SIZE * COLUMNS; // 384px

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
            const imgCols = img.width / main.TILE_SIZE;
            const imgRows = img.height / main.TILE_SIZE;
            const horizontalChunks = Math.ceil(imgCols / COLUMNS); // 가로로 몇 배 더 넓은가?
            const totalRows = imgRows * horizontalChunks;

            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = totalRows * main.TILE_SIZE;

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
        if (imgA1) totalHeight += 2 * main.TILE_SIZE; // A1: 2행
        if (imgA2) totalHeight += 4 * main.TILE_SIZE; // A2: 4행
        if (imgA3) totalHeight += 4 * main.TILE_SIZE; // A3: 4행
        if (imgA4) totalHeight += 6 * main.TILE_SIZE; // A4: 6행
        if (imgA5) totalHeight += 16 * main.TILE_SIZE; // A5: 16행 (일반 타일)

        this.canvas.width = 8 * main.TILE_SIZE;
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
            currentY += 2 * main.TILE_SIZE;
        }

        // A2 렌더링
        if (imgA2) {
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA2,col * 2,row * 3,col,currentY/main.TILE_SIZE + row)
                }
            }
            currentY += 4 * main.TILE_SIZE;
        }

        // A3 렌더링
        if (imgA3) {
            const yCoords = [0, 2, 4, 6];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA3,col * 2,yIdx,col,currentY/main.TILE_SIZE + row)
                }
            });
            currentY += 4 * main.TILE_SIZE;
        }

        // A4 렌더링
        if (imgA4) {
            const yCoords = [0, 3, 5, 8, 10, 13];
            yCoords.forEach((yIdx, row) => {
                for (let col = 0; col < 8; col++) {
                    this.drawTile(imgA4,col * 2,yIdx,col,currentY/main.TILE_SIZE + row)
                }
            });
            currentY += 6 * main.TILE_SIZE;
        }

        // A5 렌더링 (일반 타일처럼)
        if (imgA5) {
            const imgCols = imgA5.width / main.TILE_SIZE;
            const imgRows = imgA5.height / main.TILE_SIZE;
            for (let r = 0; r < imgRows; r++) {
                for (let c = 0; c < imgCols; c++) {
                    this.drawTile(imgA5,c,r,(c % 8),currentY/main.TILE_SIZE + (r + Math.floor(c / 8) * imgRows))
                }
            }
        }
    }
    // R 탭 (지역번호) 그리기
    drawRegionTileset() {
        
        // 16x16 그리드 (256칸, 0~255)
        this.canvas.width = 8 * main.TILE_SIZE;
        this.canvas.height = 32 * main.TILE_SIZE;
        
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
            const dx = x * main.TILE_SIZE;
            const dy = y * main.TILE_SIZE;
            
            // 색상 배경
            const colorIdx = (i - 1) % colors.length;
            this.ctx.fillStyle = colors[colorIdx];
            this.ctx.fillRect(dx + 2, dy + 2, main.TILE_SIZE - 4, main.TILE_SIZE - 4);
            
            // 숫자 표시
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(i.toString(), dx + main.TILE_SIZE / 2, dy + main.TILE_SIZE / 2);
        }
    }
}