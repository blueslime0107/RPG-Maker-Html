
class MapViewer {
    constructor() {
        this.mapCanvas = document.getElementById('map-canvas');
        this.mapGrid = document.getElementById('map-grid-container');
        this.mapOverlay = document.getElementById('map-overlay-canvas');
        this.mapEditor = document.getElementById('map-editor');
        this.eventCanvas = document.getElementById('event-overlay-canvas');
        this.ctx = this.mapCanvas.getContext('2d');
        this.mapOverlayCtx = this.mapOverlay.getContext('2d');
        this.tileset = null;
        this.tilesets = null;

        this.events = [];
        this.mousePos = {x:0,y:0}
        this.mapZoom = 1
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.blueCirclePosition = null;
        this.rectSelectPos = null;
        this.isPainting = false;

        this.loader = new MapLoader(this.mapCanvas,this.ctx);
    }

    get x(){return this.mousePos.x}
    get y(){return this.mousePos.y}

    get map(){return editor.map}

    get selectedLayer(){return editor.tileEditor.layer}
    get selectedTile(){return editor.tileEditor.tile}
    get selectedTool(){return editor.tileEditor.tool}

    init() {
        this.initEventListeners()
    }

    initEventListeners() {
        this.mapCanvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // 가운데 버튼 (휠 클릭)
                e.preventDefault();
                this.isPanning = true;

                // map-editor 기준 좌표 계산
                const mapEditor = document.getElementById('map-editor');
                const editorRect = mapEditor.getBoundingClientRect();
                const editorX = e.clientX - editorRect.left;
                const editorY = e.clientY - editorRect.top;

                this.panStartX = editorX - this.mapPanX * this.mapZoom;
                this.panStartY = editorY - this.mapPanY * this.mapZoom;
                this.mapCanvas.style.cursor = 'grabbing';
                return;
            }

            if (e.button !== 0) return; // 왼쪽 클릭만


            // 이벤트가 있는 위치 체크
            const hasEvent = editor.events.some(ev => ev.x === this.x && ev.y === this.y);
            if (hasEvent) return;

            if (tileEditor.tool === 'rect') {
                // 사각형 툴: 시작점 기록
                this.rectSelectPos = { x:this.x, y:this.y };
                this.isPainting = true;
            } else {
                // 펜, 지우개: 일반 페인팅
                this.isPainting = true;
                this.paintTile(this.mousePos.x, this.mousePos.y);
            }
        });
        // 마우스가 맵 위에서 움직일때 선택범위, 파란원 그리기
        this.mapCanvas.addEventListener('mousemove', (e) => {
            const { x: tileX, y: tileY } = this.getMapCoordinates(e.clientX, e.clientY);
            this.mousePos = { x: tileX, y: tileY };

            if (this.isPanning) { // 맵 이동중일때
                // 팬 중일 때 컨텍스트 메뉴 닫기

                // map-editor 기준 좌표로 계산
                const editorRect = this.mapEditor.getBoundingClientRect();
                const editorX = e.clientX - editorRect.left;
                const editorY = e.clientY - editorRect.top;

                this.mapPanX = (editorX - this.panStartX) / this.mapZoom;
                this.mapPanY = (editorY - this.panStartY) / this.mapZoom;
                this.applyMapTransform();
                return;
            }

            if(this.isPainting && !this.rectSelectPos){
                this.paintTile(this.x,this.y)
            }

            this.updateMapOverlay(tileX,tileY)
        });
        // 마우스 뗌
        window.addEventListener('mouseup', (e) => {
            const { x, y } = this.getMapCoordinates(e.clientX, e.clientY);
            if (this.isPanning) {
                this.isPanning = false;
                this.mapCanvas.style.cursor = '';
                return;
            }
            if(this.rectSelectPos){
                for(let i = Math.min(this.rectSelectPos.x, x); i <= Math.max(this.rectSelectPos.x, x); i++){
                    for(let j = Math.min(this.rectSelectPos.y, y); j <= Math.max(this.rectSelectPos.y, y); j++){
                        console.log(i,j)
                        this.paintTile(i, j);
                    }
                }
                this.rectSelectPos = null;
            }
            this.isPainting = false;
            this.updateMapOverlay(x,y)
        });
        // 우클릭 이벤트: 선택 범위 1칸으로 초기화 및 파란원 그리기
        this.mapCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // 맵 범위 체크
            if (editor.isNotOnMap(this.x, this.y)) return;

            // 선택된 타일이 있으면 1칸으로 초기화
            if (this.selectedTile) {editor.tileEditor.updateSelectedTile(editor.tileEditor.selectedTile.x,editor.tileEditor.selectedTile.y,1,1)}
            this.updateMapOverlay(this.x,this.y)
            this.showMapContextMenu(e.clientX, e.clientY, this.x, this.y);
        });
        // 마우스 휠 이벤트: 확대/축소
        this.mapCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // 줌 중일 때 컨텍스트 메뉴 닫기
            this.closeContextMenu();

            const delta = e.deltaY > 0 ? 0.9 : 1.1; // 휠 아래: 축소, 휠 위: 확대
            const newZoom = Math.max(0.1, Math.min(5.0, this.mapZoom * delta)); // 0.1 ~ 5.0 배

            if (newZoom !== this.mapZoom) {
                // 마우스 위치를 중심으로 확대/축소
                const mapEditor = document.getElementById('map-editor');
                const editorRect = mapEditor.getBoundingClientRect();
                const container = document.getElementById('map-grid-container');

                // 마우스의 map-editor 내부 좌표
                const mouseX = e.clientX - editorRect.left - container.offsetLeft;
                const mouseY = e.clientY - editorRect.top - container.offsetTop;

                // 현재 마우스가 가리키는 맵 상의 점 계산
                const mapPointX = (mouseX / this.mapZoom) - this.mapPanX;
                const mapPointY = (mouseY / this.mapZoom) - this.mapPanY;

                // 줌 변경
                this.mapZoom = newZoom;

                // 같은 맵 포인트가 여전히 마우스 위치에 오도록 pan 조정
                this.mapPanX = (mouseX / newZoom) - mapPointX;
                this.mapPanY = (mouseY / newZoom) - mapPointY;

                this.applyMapTransform();
                editor.updateZoomDisplay();
            }
        });
        // 맵에서 나가면 파란원이 있으면 그리고 나머진 지우기
        this.mapCanvas.addEventListener('mouseleave', () => {
            this.mousePos = null;
            this.updateMapOverlay(-1,-1)
        });

    }
    // 선택범위, 파란원 그리기
    updateMapOverlay(x,y){
        const ctx = this.mapOverlayCtx;
        ctx.clearRect(0, 0, this.mapOverlay.width, this.mapOverlay.height);
        this.drawBlueCircle();
        if (editor.isNotOnMap(x, y)) {return}
        if(this.rectSelectPos !== null){
            const distX = x - this.rectSelectPos.x;
            const distY = y - this.rectSelectPos.y;
            // 0을 포함하여 양수면 +1, 음수면 -1을 더함
            const sizeX = distX >= 0 ? distX + 1 : distX - 1;
            const sizeY = distY >= 0 ? distY + 1 : distY - 1;
            this.drawSelectRect(this.rectSelectPos.x, this.rectSelectPos.y, sizeX, sizeY);
        }else if(this.selectedTile){
            // 시작점 & 너비높이으로 그리기
            this.drawSelectRect(x, y,this.selectedTile.w,this.selectedTile.h);
        }else{
            this.drawSelectRect(x, y,1,1);
        }
    }
    drawBlueCircle(){
        if (!this.blueCirclePosition) {return}
        const ctx = this.mapOverlay.getContext('2d');
        const centerX = this.blueCirclePosition.x * 48 + 24;
        const centerY = this.blueCirclePosition.y * 48 + 24;
        const radius = 20;
        
        ctx.strokeStyle = 'rgba(52, 152, 219, 1)';
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    drawSelectRect(x, y,endX,endY){
        const ctx = this.mapOverlayCtx;
        if(endX < 0){x += 1}
        if(endY < 0){y += 1}

        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * 48, y * 48, endX * 48, endY * 48);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x * 48, y * 48, endX * 48, endY * 48);
    }
    update() {
        this.loader.setup(this.map);
        this.renderMap();
        this.renderEvent()
    }
    setCanvasSize(width, height) {
        this.mapCanvas.width = width;
        this.mapCanvas.height = height;
        this.mapOverlay.width = this.mapCanvas.width;
        this.mapOverlay.height = this.mapCanvas.height;
        this.eventCanvas.width = this.mapCanvas.width;
        this.eventCanvas.height = this.mapCanvas.height;
    }

    renderMap() {
        this.loader.render();
    }
    renderEvent() {
        console.log("renderStart")
        const ctx = this.eventCanvas.getContext('2d');

        ctx.clearRect(0, 0, this.eventCanvas.width, this.eventCanvas.height);
        // 이벤트 렌더링
        // this.drawPlayer();
        for (const event of editor.events) {
            this.drawCharacter(event);
        }
    }
    drawCharacter(event) {
        const dx = event.x * TILE_SIZE;
        const dy = event.y * TILE_SIZE;
        const info = event.pages[0].image
        const ctx = this.eventCanvas.getContext('2d');

        let img = null
        if (info.tileId) {
            const tile = main.mapManager.loader.getNormalTile(info.tileId)
            ctx.drawImage(
                tile.img,
                tile.sx, tile.sy, TILE_SIZE, TILE_SIZE,
                dx, // 가로 중앙 정렬
                dy,       // 발끝을 타일 바닥에 맞춤
                TILE_SIZE, TILE_SIZE
            );
        }
        else if (info.characterName) {
            img = main.images.characters.get(info.characterName);
            // $로 시작하면 단일 캐릭터(3x4), 아니면 8인용(12x8)
            const isBig = info.characterName.startsWith('$');

            // 전체 이미지 크기를 기준으로 한 칸의 크기 계산
            const charW = isBig ? img.width / 3 : img.width / 12;
            const charH = isBig ? img.height / 4 : img.height / 8;

            // characterIndex(0~7)에 따른 시트 내 시작 위치 (X: 0~3, Y: 0~1)
            const col = isBig ? 0 : (info.characterIndex % 4);
            const row = isBig ? 0 : Math.floor(info.characterIndex / 4);

            // 방향(direction)과 애니메이션 패턴(pattern)
            // pattern: 0(왼발), 1(중앙), 2(오른발)
            // direction: 2(하), 4(좌), 6(우), 8(상) -> 각각 시트의 0, 1, 2, 3번째 줄
            const pattern = info.pattern !== undefined ? info.pattern : 1;
            const direction = info.direction !== undefined ? info.direction : 2;
            const sx = (col * 3 + pattern) * charW;
            const sy = (row * 4 + (direction / 2 - 1)) * charH;
            ctx.drawImage(
                img,
                sx, sy, charW, charH,
                dx + (TILE_SIZE - charW) / 2, // 가로 중앙 정렬
                dy + TILE_SIZE - charH,       // 발끝을 타일 바닥에 맞춤
                charW, charH
            );
        }
        ctx.strokeStyle = 'rgba(0, 140, 255, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 이벤트 ID 표시
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.fillText(event.id, dx + 4, dy + 14);
    }



    // 화면 좌표를 맵 좌표로 변환 (확대/축소/패닝 반영)
    getMapCoordinates(clientX, clientY) {
        // map-editor의 화면 위치
        const editorRect = this.mapEditor.getBoundingClientRect();

        // container의 offset (map-editor 내부에서의 위치)
        const containerOffsetX = this.mapGrid.offsetLeft;
        const containerOffsetY = this.mapGrid.offsetTop;

        // 마우스의 map-editor 내부 좌표
        const mouseInEditor = {
            x: clientX - editorRect.left,
            y: clientY - editorRect.top
        };

        // container 기준으로 변환 (container의 offset 제거)
        let x = mouseInEditor.x - containerOffsetX;
        let y = mouseInEditor.y - containerOffsetY;

        // transform 역변환
        // CSS: scale(zoom) translate(panX, panY)
        // 이는 point' = zoom * (point + pan)와 동일
        // 역변환: point = (point' / zoom) - pan
        x = (x / this.mapZoom) - this.mapPanX;
        y = (y / this.mapZoom) - this.mapPanY;

        // 타일 좌표로 변환
        return {
            x: Math.floor(x / 48),
            y: Math.floor(y / 48)
        };
    }

    // 타일 지우기
    eraseTileAtPosition(x, y) {
        if (editor.isNotOnMap(x, y)) return;

        if (tileEditor.layer === 'auto') {
            // 오토 모드: 모든 레이어(0-3) 지우기
            for (let layerIdx = 0; layerIdx < 4; layerIdx++) {
                const oldTileId = main.mapManager.mapData(x, y, layerIdx);
                main.mapManager.setMapData(x, y, layerIdx, 0);

                // 오토타일이면 주변 전파
                if (main.mapManager.isAutotile(oldTileId)) {
                    main.mapManager.propagateAutotile(x, y, layerIdx);
                }
            }
        } else {
            // 특정 레이어만 지우기
            const layerIdx = parseInt(tileEditor.layer);
            const oldTileId = main.mapManager.mapData(x, y, layerIdx);
            main.mapManager.setMapData(x, y, layerIdx, 0);

            // 오토타일이면 주변 전파
            if (main.mapManager.isAutotile(oldTileId)) {
                main.mapManager.propagateAutotile(x, y, layerIdx);
            }
        }

        main.mapManager.renderMap();
    }

    // 맵 변환 적용
    applyMapTransform() {
        const container = document.getElementById('map-grid-container');
        if (container) {
            container.style.transform = `scale(${this.mapZoom}) translate(${this.mapPanX}px, ${this.mapPanY}px)`;
            container.style.transformOrigin = '0 0';
        }
    }

    paintTile(x,y){
        if (editor.isNotOnMap(x, y)) return;
        tileEditor.paintTile(x, y);
        this.renderMap();
    }
    // 빈 공간 우클릭 메뉴
    showMapContextMenu(x, y, tileX, tileY) {
        console.log("tileX", tileX, "tileY", tileY)
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'event-context-menu';
        Object.assign(menu.style, {
            position: 'fixed',
            left: `${x}px`,
            top: `${y}px`,
            backgroundColor: '#2b2b2b',
            color: '#eee',
            border: '1px solid #555',
            padding: '4px 0',
            zIndex: '9999',
            fontSize: '13px',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.4)',
            minWidth: '150px'
        });

        const options = [
            {
                label: '플레이어',
                action: () => this.setPlayerStart(tileX, tileY)
            },
            {
                label: '이벤트 생성',
                action: () => this.createEvent(tileX, tileY)
            },
            {
                label: '붙여넣기 (Ctrl+V)',
                action: () => this.pasteEvent(tileX, tileY),
                disabled: !this.clipboard
            }
        ];

        options.forEach(opt => {
            const div = document.createElement('div');
            div.innerText = opt.label;
            Object.assign(div.style, {
                padding: '6px 20px',
                cursor: opt.disabled ? 'default' : 'pointer',
                opacity: opt.disabled ? '0.4' : '1'
            });

            if (!opt.disabled) {
                div.onmouseover = () => div.style.backgroundColor = '#444';
                div.onmouseout = () => div.style.backgroundColor = 'transparent';
                div.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof opt.action === 'function') {
                        opt.action();
                    }
                    menu.remove();
                };
            }
            menu.appendChild(div);
        });

        document.body.appendChild(menu);
        this.setupMenuClose(menu);
    }

    closeContextMenu() {
        const menu = document.getElementById('event-context-menu');
        if (menu) menu.remove();
        const cmdMenu = document.getElementById('command-context-menu');
        if (cmdMenu) cmdMenu.remove();
    }
}


class MapLoader {
    constructor(canvas,ctx) {
        this.canvas = canvas
        this.ctx = ctx
        this.tilesetData = null
        this.flags = null
        // 레이어별 캔버스 시스템
        this.layerCanvases = [];
        this.layerContexts = [];
    }

    get width() {
        return this.mapData.width
    }
    get height() {
        return this.mapData.height
    }


    /**
     * @param {Object} mapData - Map001.json 내용
     */
    setup(mapData) {
        this.mapData = mapData;
        this.tilesetData = editor.getTilesetFromMap(mapData);
        this.flags = this.tilesetData.flags

        // 1. 캔버스 크기 설정 (타일 개수 * 48px)
        mapViewer.setCanvasSize(this.mapData.width * TILE_SIZE, this.mapData.height * TILE_SIZE);

        // 2. 레이어별 캔버스 생성 (처음 한 번만)
        if (this.layerCanvases.length === 0) {
            this.createLayerCanvases();
        } else {
            // 캔버스 크기만 업데이트
            this.layerCanvases.forEach(canvas => {
                canvas.width = this.mapData.width * TILE_SIZE;
                canvas.height = this.mapData.height * TILE_SIZE;
            });
        }
    }

    createLayerCanvases() {
        const container = this.canvas.parentNode;

        // 레이어 0~3 + 그림자 레이어 (총 5개)
        for (let i = 0; i < 5; i++) {
            const layerCanvas = document.createElement('canvas');
            layerCanvas.width = this.mapData.width * TILE_SIZE;
            layerCanvas.height = this.mapData.height * TILE_SIZE;
            layerCanvas.style.position = 'absolute';
            layerCanvas.style.left = '0';
            layerCanvas.style.top = '0';
            layerCanvas.style.pointerEvents = 'none';
            layerCanvas.style.zIndex = (5 + i).toString(); // 5-9: map-overlay(10), event-overlay(100) 아래
            layerCanvas.style.display = 'none'; // 기본은 숨김

            this.layerCanvases.push(layerCanvas);
            this.layerContexts.push(layerCanvas.getContext('2d'));

            // 바로 DOM에 추가
            container.appendChild(layerCanvas);
        }
    }

    setHighlightMode() {
        this.render();
    }

    render() {
        if (!this.mapData) return;

        // 기존 메인 캔버스는 항상 깨끗하게
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 자동 모드: 모든 레이어를 메인 캔버스에 정상 렌더링
        if (tileEditor.layer === 'auto') {
            this.renderAllLayersNormal();
            // 레이어 캔버스들 숨기기
            this.layerCanvases.forEach(canvas => {
                canvas.style.display = 'none';
            });
        } else {
            // 특정 레이어 선택 모드: 레이어별로 분리하여 렌더링
            this.renderLayersSeparately();
            // 레이어 캔버스들 보이기
            this.layerCanvases.forEach(canvas => {
                canvas.style.display = 'block';
            });
        }
    }

    renderAllLayersNormal() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId0 = this.readMapData(x, y, 0);
                const tileId1 = this.readMapData(x, y, 1);
                const shadowBits = this.readMapData(x, y, 4);
                const upperTileId1 = this.readMapData(x, y - 1, 1);

                this.drawTile(this.ctx, tileId0, x, y);
                this.drawTile(this.ctx, tileId1, x, y);
                this.drawTile(this.ctx, this.readMapData(x, y, 2), x, y);
                this.drawTile(this.ctx, this.readMapData(x, y, 3), x, y);
                this.drawShadow(this.ctx, shadowBits, x, y);
                if (this.isTableTile(upperTileId1) && !this.isTableTile(tileId1)) {
                    if (!this.isShadowingTile(tileId0)) {
                        this.drawTableEdge(this.ctx, upperTileId1, x, y);
                    }
                }
            }
        }
    }

    renderLayersSeparately() {
        const selectedLayer = parseInt(tileEditor.layer);

        // 모든 레이어 캔버스 초기화
        this.layerContexts.forEach(ctx => {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        });

        // 레이어별로 렌더링
        for (let layer = 0; layer < 4; layer++) {
            const ctx = this.layerContexts[layer];

            // 레이어별 강조 효과 설정
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;

            // 레이어 타일 그리기
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileId = this.readMapData(x, y, layer);
                    if (tileId > 0) {
                        this.drawTile(ctx, tileId, x, y);
                    }
                }
            }

            // 선택되지 않은 레이어에 파란색 오버레이 적용
            if (layer !== selectedLayer) {
                ctx.globalCompositeOperation = 'source-atop';
                if (layer < selectedLayer) {
                    // 아래 레이어: 진한 파란색
                    ctx.fillStyle = 'rgba(0, 100, 255, 0.5)';
                } else {
                    // 위 레이어: 투명한 파란색
                    ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
                }
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // 컨텍스트 설정 초기화
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
        }

        // 그림자 레이어 렌더링 (레이어 4)
        const shadowCtx = this.layerContexts[4];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const shadowBits = this.readMapData(x, y, 4);
                const tileId1 = this.readMapData(x, y, 1);
                const upperTileId1 = this.readMapData(x, y - 1, 1);

                this.drawShadow(shadowCtx, shadowBits, x, y);
                if (this.isTableTile(upperTileId1) && !this.isTableTile(tileId1)) {
                    const tileId0 = this.readMapData(x, y, 0);
                    if (!this.isShadowingTile(tileId0)) {
                        this.drawTableEdge(shadowCtx, upperTileId1, x, y);
                    }
                }
            }
        }
    }

    readMapData(x, y, z) {
        return this.mapData.data[(z * this.mapData.height + y) * this.mapData.width + x] || 0;
    }

    isTableTile(tileId) {
        return editor.isTileA2(tileId) && this.flags[tileId] & 0x80;
    };

    drawTile(ctx, tileId, dx, dy) {
        if (editor.isAutotile(tileId)) {
            this.drawAutotile(ctx, tileId, dx, dy);
        } else {
            this.drawNormal(ctx, tileId, dx, dy);
        }
    }

    drawAutotile(ctx, tileId, x, y) {
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        const kind = editor.getAutotileKind(tileId)
        const shape = editor.getAutotileShape(tileId)
        const tx = kind % 8;
        const ty = Math.floor(kind / 8);
        let tileTypeIndex = 0;
        let bx = 0;
        let by = 0;
        let autotileTable = FLOOR_AUTOTILE_TABLE;
        let isTable = false;

        if (editor.isTileA1(tileId)) {
            const row = Math.floor(kind / 8);
            const col = kind % 8;

            const tileTypeStr = (row < 2 && col < 8) ? A1_AUTOTILE_TYPE_MAP[row][col] : 'floor';
            // 타일셋 상의 위치 계산
            bx = [0, 6, 8, 14][col % 4];
            by = [0, 3, 6, 9][Math.floor(col / 4) + (row * 2)];

            // 오토타일 타입에 따라 테이블 선택
            if (tileTypeStr === 'fixed') {
                // 고정 타일은 항상 같은 모양 (패턴 0)
                autotileTable = FLOOR_AUTOTILE_TABLE;
            } else if (tileTypeStr === 'waterfall') {
                autotileTable = WATERFALL_AUTOTILE_TABLE;
            } else { // 'floor'
                autotileTable = FLOOR_AUTOTILE_TABLE;
            }
        } else if (editor.isTileA2(tileId)) {
            tileTypeIndex = 1;
            bx = tx * 2;
            by = (ty - 2) * 3;
            isTable = this.isTableTile(tileId);
        } else if (editor.isTileA3(tileId)) {
            tileTypeIndex = 2;
            bx = tx * 2;
            by = (ty - 6) * 2;
            autotileTable = WALL_AUTOTILE_TABLE;
        } else if (editor.isTileA4(tileId)) {
            tileTypeIndex = 3;
            bx = tx * 2;
            by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0));
            if (ty % 2 === 1) {
                autotileTable = WALL_AUTOTILE_TABLE;
            }
        }
        const img = main.images.tilesets.get(this.tilesetData.tilesetNames[tileTypeIndex]);

        const table = autotileTable[shape];
        const w1 = TILE_SIZE / 2;
        const h1 = TILE_SIZE / 2;
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
                ctx.drawImage(img, sx2, sy2, w1, h1, dx1, dy1, w1, h1);
                ctx.drawImage(img, sx1, sy1, w1, h1 / 2, dx1, dy1 + h1 / 2, w1, h1 / 2);
            } else {
                ctx.drawImage(img, sx1, sy1, w1, h1, dx1, dy1, w1, h1);
            }
        }
    }


    getNormalTile(tileId) {
        const s = TILE_SIZE;;
        const sx = ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * s;
        const sy = (Math.floor((tileId % 256) / 8) % 16) * s;

        let tileTypeIndex = 4
        if (editor.isTileB(tileId)) { tileTypeIndex = 5 }
        else if (editor.isTileC(tileId)) { tileTypeIndex = 6 }
        else if (editor.isTileD(tileId)) { tileTypeIndex = 7 }
        else if (editor.isTileE(tileId)) { tileTypeIndex = 8 }
        const img = main.images.tilesets.get(this.tilesetData.tilesetNames[tileTypeIndex]);

        return { img, sx, sy }
    }

    drawNormal(ctx, tileId, x, y) {
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        const tile = this.getNormalTile(tileId)
        if (!tile.img) {
            return
        }

        ctx.drawImage(tile.img, tile.sx, tile.sy, 48, 48, dx, dy, 48, 48);
    }

    drawShadow(ctx, shadowBits, x, y) {
        if (shadowBits & 0x0f) {
            const w1 = TILE_SIZE / 2;
            const h1 = TILE_SIZE / 2;
            for (let i = 0; i < 4; i++) {
                if (shadowBits & (1 << i)) {
                    const dx1 = x * TILE_SIZE + (i % 2) * w1;
                    const dy1 = y * TILE_SIZE + Math.floor(i / 2) * h1;
                    ctx.fillStyle = 'rgba(0,0,0,0.5)'
                    ctx.fillRect(dx1, dy1, w1, h1)
                }
            }
        }
    }

    drawTableEdge(ctx, tileId, x, y) {
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;
        if (editor.isTileA2(tileId)) {
            const autotileTable = this.FLOOR_AUTOTILE_TABLE;
            const kind = editor.getAutotileKind(tileId);
            const shape = editor.getAutotileShape(tileId);
            const tx = kind % 8;
            const ty = Math.floor(kind / 8);
            const bx = tx * 2;
            const by = (ty - 2) * 3;
            const table = autotileTable[shape];
            const w1 = TILE_SIZE / 2;
            const h1 = TILE_SIZE / 2;
            for (let i = 0; i < 2; i++) {
                const qsx = table[2 + i][0];
                const qsy = table[2 + i][1];
                const sx1 = (bx * 2 + qsx) * w1;
                const sy1 = (by * 2 + qsy) * h1 + h1 / 2;
                const dx1 = dx + (i % 2) * w1;
                const dy1 = dy + Math.floor(i / 2) * h1;
                const img = main.images.tilesets.get(this.tilesetData.tilesetNames[1]);
                ctx.drawImage(img, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2);
            }
        }
    }


}