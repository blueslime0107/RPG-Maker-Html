
class MapViewer {
    constructor() {
        this.mapCanvas = document.getElementById('map-canvas');
        this.mapGrid = document.getElementById('map-grid-container');
        this.mapOverlay = document.getElementById('map-overlay-canvas');
        this.mapEditor = document.getElementById('map-editor');
        this.eventCanvas = document.getElementById('event-overlay-canvas');
        this.ctx = this.mapCanvas.getContext('2d');
        this.mapOverlayCtx = this.mapOverlay.getContext('2d');
        this.eventCtx = this.eventCanvas.getContext('2d');

        this.events = [];
        this.mousePos = {x:0,y:0}
        this.mapZoom = 1
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.selectTilePos = null;
        this.rectSelectPos = null;
        this.isPainting = false;

        this.isDragging = false
        this.draggedEvent = null
        this.dragStartPos = null

        this.loader = new MapLoader(this.mapCanvas,this.ctx);
    }

    get x(){return this.mousePos ? this.mousePos.x : -1}
    get y(){return this.mousePos ? this.mousePos.y : -1}

    get map(){return editor.map}

    get selectedLayer(){return editor.tileEditor.layer}
    get selectedTile(){return editor.tileEditor.tile}
    get selectedTool(){return editor.tileEditor.tool}



    ///////////////////////////////
    // 기본 초기화
    ///////////////////////////////

    init() {
        this.initEventListeners()
    }

    setCanvasSize(width, height) {
        this.mapCanvas.width = width;
        this.mapCanvas.height = height;
        this.mapOverlay.width = this.mapCanvas.width;
        this.mapOverlay.height = this.mapCanvas.height;
        this.eventCanvas.width = this.mapCanvas.width;
        this.eventCanvas.height = this.mapCanvas.height;
    }
    initEventListeners() {
        this.mapCanvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // 가운데 버튼 (휠 클릭)
                e.preventDefault();
                this.mouseMiddle_mapTransform(e);
                return;
            }

            if (e.button !== 0) return; // 왼쪽 클릭만

            this.mouseDown_tilePaint()
            this.mouseDown_eventDrag()
        });
        // 마우스가 맵 위에서 움직일때 선택범위, 파란원 그리기
        window.addEventListener('mousemove', (e) => {
            const { x: tileX, y: tileY } = this.getMapCoordinates(e.clientX, e.clientY);
            this.mousePos = { x: tileX, y: tileY };
            const mousePosInfo = document.getElementById('mouse-pos-info');
            mousePosInfo.textContent = `MousePos ${tileX},${tileY}`;


            if(this.isPainting && !this.rectSelectPos){
                this.paintTile(this.x,this.y)
            }
            this.mouseMove_mapTransform(e)
            this.mouseMove_eventDrag()
            
            this.updateMapOverlay(tileX,tileY)
        });
        // 마우스 뗌
        window.addEventListener('mouseup', (e) => {
            this.mouseUp_mapTransform(e)
            
            if(this.rectSelectPos){
                for(let i = Math.min(this.rectSelectPos.x, this.x); i <= Math.max(this.rectSelectPos.x, this.x); i++){
                    for(let j = Math.min(this.rectSelectPos.y, this.y); j <= Math.max(this.rectSelectPos.y, this.y); j++){
                        console.log(i,j)
                        this.paintTile(i, j);
                    }
                }
                this.rectSelectPos = null;
            }
            this.isPainting = false;
            this.mouseUp_eventDrag()
            this.updateMapOverlay(this.x,this.y)
        });
        // 우클릭 이벤트: 선택 범위 1칸으로 초기화 및 파란원 그리기
        this.mapCanvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // 맵 범위 체크
            if (editor.isNotOnMap(this.x, this.y)) return;

            // 선택된 타일이 있으면 1칸으로 초기화
            if (this.selectedTile) {editor.tileEditor.updateSelectedTile(editor.tileEditor.selectedTile.x,editor.tileEditor.selectedTile.y,1,1)}
            this.updateMapOverlay(this.x,this.y)
            // 해당 좌표의 이벤트 찾기
            const event = editor.getEvent(this.x,this.y)

            if (event) {
                editor.showContextMenu(this,e, [
                {
                    label: '편집',
                    action: () => eventEditor.showInspector(event)
                },
                {
                    label: '복사 (Ctrl+C)',
                    action: () => this.copyEvent(event)
                },
                {
                    label: '삭제 (Del)',
                    action: () => this.deleteEvent(event),
                    color: '#ff6666'
                }
                ],() => {
                    this.selectTilePos = null;
                    this.updateMapOverlay(this.x,this.y)
                })
            } else {
                editor.showContextMenu(this,e, [
                    {
                        label: '플레이어',
                        action: () => this.setPlayerStart(this.selectTilePos.x, this.selectTilePos.y)
                    },
                    {
                        label: '이벤트 생성',
                        action: () => this.createEvent(this.selectTilePos.x, this.selectTilePos.y)
                    },
                    {
                        label: '붙여넣기 (Ctrl+V)',
                        action: () => this.pasteEvent(this.selectTilePos.x, this.selectTilePos.y),
                        disabled: !editor.clipboard
                    }
                ],() => {
                    this.selectTilePos = null;
                    this.updateMapOverlay(this.x,this.y)
                })
            }
            this.selectTilePos = {x: this.x, y: this.y};
        });
        // 마우스 휠 이벤트: 확대/축소
        this.mapCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.mouseWheel_mapTransform(e)
        });
        // 맵에서 나가면 파란원이 있으면 그리고 나머진 지우기
        this.mapCanvas.addEventListener('mouseleave', () => {
            this.updateMapOverlay(-1,-1)
        });

    }

    update() {
        this.loader.setup(this.map);
        this.renderMap();
        this.renderEvent()
    }



    ///////////////////////////////
    // 맵 오버레이 그리기
    ///////////////////////////////

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
        if (!this.selectTilePos) {return}
        const ctx = this.mapOverlay.getContext('2d');
        const centerX = this.selectTilePos.x * 48 + 24;
        const centerY = this.selectTilePos.y * 48 + 24;
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




    ///////////////////////////////
    // 맵 확대/축소 및 패닝
    ////////////////////////////////

    mouseMove_mapTransform(e){
        if (!this.isPanning) {return}
        // map-editor 기준 좌표로 계산
        const editorRect = this.mapEditor.getBoundingClientRect();
        const editorX = e.clientX - editorRect.left;
        const editorY = e.clientY - editorRect.top;

        this.mapPanX = (editorX - this.panStartX) / this.mapZoom;
        this.mapPanY = (editorY - this.panStartY) / this.mapZoom;
        this.applyMapTransform();
        return;
    }
    mouseMiddle_mapTransform(e){
        this.isPanning = true;
        // map-editor 기준 좌표 계산
        const editorRect = this.mapEditor.getBoundingClientRect();
        const editorX = e.clientX - editorRect.left;
        const editorY = e.clientY - editorRect.top;

        this.panStartX = editorX - this.mapPanX * this.mapZoom;
        this.panStartY = editorY - this.mapPanY * this.mapZoom;
        this.mapCanvas.style.cursor = 'grabbing';
    }
    mouseUp_mapTransform(){
        if (this.isPanning) {
            this.isPanning = false;
            this.mapCanvas.style.cursor = '';
            return;
        }
    }
    mouseWheel_mapTransform(e){
        const delta = e.deltaY > 0 ? 0.9 : 1.1; // 휠 아래: 축소, 휠 위: 확대
        const newZoom = Math.max(0.1, Math.min(5.0, this.mapZoom * delta)); // 0.1 ~ 5.0 배
        
        if (newZoom == this.mapZoom) {return}
        const editorRect = this.mapEditor.getBoundingClientRect();
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
    }
    // 맵 변환 적용
    applyMapTransform() {
        const container = document.getElementById('map-grid-container');
        if (container) {
            container.style.transform = `scale(${this.mapZoom}) translate(${this.mapPanX}px, ${this.mapPanY}px)`;
            container.style.transformOrigin = '0 0';
        }
        // 줌 레벨 표시 업데이트
        const mapInfo = document.getElementById('map-info');
        if (this.map) {
            const mapName = this.mapInfo ? this.mapInfo.name : 'Map000';
            const mapSize = `${this.map.width}x${this.map.height}`;
            const zoomPercent = (this.mapZoom * 100).toFixed(0);
            mapInfo.textContent = `${mapName} (${mapSize}) - ${zoomPercent}%`;
        }
    }
    // 맵 확대/축소 초기화
    resetMapZoom() {
        this.mapZoom = 1.0;
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.applyMapTransform();
        console.log('맵 확대/축소 초기화');
    }




    ///////////////////////////////
    // 맵 관련
    ///////////////////////////////

    mouseDown_tilePaint(){
        // 이벤트 있는 위치에선 시작 안함
        const hasEvent = editor.getEvent(this.x,this.y)
        if (hasEvent) return;

        this.isPainting = true;
        if (tileEditor.tool === 'rect') {
            // 사각형 툴: 시작점 기록
            this.rectSelectPos = { x:this.x, y:this.y };
        } else {
            this.paintTile(this.mousePos.x, this.mousePos.y);
        }
    }
    renderMap() {
        this.loader.render();
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
    paintTile(x,y){
        if (editor.isNotOnMap(x, y)) return;
        tileEditor.paintTile(x, y);
        this.renderMap();
    }




    ///////////////////////////////
    // 이벤트 관련
    ////////////////////////////////

    mouseDown_eventDrag(){
        const clickedEvent = editor.getEventAndPlayer(this.x,this.y)
        if (clickedEvent) {
            this.isDragging = true;
            this.draggedEvent = clickedEvent;
            if(this.draggedEvent.isPlayer){
                this.dragStartPos = { x: main.playerX, y: main.playerY };
            }else{
                this.dragStartPos = { x: clickedEvent.x, y: clickedEvent.y };
            }
        }
    }
    mouseMove_eventDrag(){
        if(!this.isDragging) return;
        if (this.x !== this.dragStartPos.x || this.y !== this.dragStartPos.y) {
            // 맵 범위 체크
            if (editor.isNotOnMap(this.x, this.y)) return;
            if(this.draggedEvent.isPlayer){
                this.setPlayerStart(this.x,this.y);
            }else{
                this.draggedEvent.x = this.x;
                this.draggedEvent.y = this.y;
                this.renderEvent();
            }
        }
    }
    mouseUp_eventDrag(){
        if (!this.isDragging) return;

        // 다른 이벤트와 충돌 체크 (자기 자신 제외)
        const collidingEvent = editor.getEventAndPlayer(this.x,this.y,this.draggedEvent)

        if (collidingEvent) {
            if(this.draggedEvent.isPlayer){
                this.setPlayerStart(this.dragStartPos.x,this.dragStartPos.y);
            }else{
                this.draggedEvent.x = this.dragStartPos.x;
                this.draggedEvent.y = this.dragStartPos.y;
                this.renderEvent();
            }
        }

        this.isDragging = false;
        this.draggedEvent = null;
        this.dragStartPos = null;
    }
    renderEvent() {
        const ctx = this.eventCanvas.getContext('2d');

        ctx.clearRect(0, 0, this.eventCanvas.width, this.eventCanvas.height);
        // 이벤트 렌더링
        this.drawPlayer();
        for (const event of editor.events) {
            if(!event){continue;}
            this.drawCharacter(event);
        }
    }
    // 플레이어 시작 위치 설정
    setPlayerStart(x, y) {
        main.data.system.startMapId = editor.mapInfo.id;
        main.data.system.startX = x;
        main.data.system.startY = y;
        this.renderEvent();
    }
    drawPlayer() {
        const ctx = this.eventCtx
        // 플레이어가 현재 맵에 있는지 확인
        if (editor.mapInfo.id !== main.data.system.startMapId) {
            return; // 플레이어가 현재 맵에 없음
        }

        const x = main.data.system.startX;
        const y = main.data.system.startY;

        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        // 파티 첫 번째 멤버의 캐릭터 정보 가져오기
        const actor = main.data.actors[main.data.system.partyMembers[0]];

        const characterName = actor.characterName;
        const characterIndex = actor.characterIndex;

        // 캐릭터 이미지 그리기
        if (characterName) {
            editor.drawCharacter(this.eventCtx,{characterName,characterIndex},dx,dy)
        }

        // 빨간색 테두리
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 플레이어 표시
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('P', dx + 4, dy + 14);
    }
    drawCharacter(event) {
        const dx = event.x * TILE_SIZE;
        const dy = event.y * TILE_SIZE;
        const info = event.pages[0].image
        const ctx = this.eventCtx

        let img = null
        if (info.tileId) {
            const tile = editor.getNormalTile(info.tileId)
            ctx.drawImage(
                tile.img,
                tile.sx, tile.sy, TILE_SIZE, TILE_SIZE,
                dx, // 가로 중앙 정렬
                dy,       // 발끝을 타일 바닥에 맞춤
                TILE_SIZE, TILE_SIZE
            );
        }
        else if (info.characterName) {
            editor.drawCharacter(ctx,info,dx,dy)
        }
        ctx.strokeStyle = 'rgba(0, 140, 255, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 이벤트 ID 표시
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.fillText(event.id, dx + 4, dy + 14);
    }
    // 이벤트 생성
    createEvent(x, y) {
        const newId = editor.getNextEventId();
        const newEvent = {
            id: newId,
            name: "EVENT",
            note: "",
            pages: [{
                conditions: {
                    actorId: 1,
                    actorValid: false,
                    itemId: 1,
                    itemValid: false,
                    selfSwitchCh: "A",
                    selfSwitchValid: false,
                    switch1Id: 1,
                    switch1Valid: false,
                    switch2Id: 1,
                    switch2Valid: false,
                    variableId: 1,
                    variableValid: false,
                    variableValue: 0
                },
                directionFix: false,
                image: {
                    characterIndex: 0,
                    characterName: "",
                    direction: 2,
                    pattern: 0,
                    tileId: 0
                },
                list: [{ code: 0, indent: 0, parameters: [] }],
                moveFrequency: 3,
                moveRoute: {
                    list: [{ code: 0, parameters: [] }],
                    repeat: true,
                    skippable: false,
                    wait: false
                },
                moveSpeed: 3,
                moveType: 0,
                priorityType: 1,
                stepAnime: false,
                through: false,
                trigger: 0,
                walkAnime: true
            }],
            x: x,
            y: y
        };

        editor.events[newId] = newEvent;
        this.renderEvent();
        eventEditor.showInspector(newEvent);
        console.log(`이벤트 생성: ID ${newId}, (${x}, ${y})`);
    }
    // 이벤트 복사
    copyEvent(event) {
        editor.clipboard = JSON.parse(JSON.stringify(event));
        console.log('이벤트 복사:', event.id);
    }
    // 이벤트 붙여넣기
    pasteEvent(x, y) {
        if (!editor.clipboard) return;

        const newId = editor.getNextEventId();
        const newEvent = JSON.parse(JSON.stringify(editor.clipboard));
        newEvent.id = newId;
        newEvent.x = x;
        newEvent.y = y;

        editor.events[newId] = newEvent;
        this.renderEvent();
        console.log(`이벤트 붙여넣기: ID ${newId}, (${x}, ${y})`);
    }


    // 이벤트 삭제
    deleteEvent(event) {

        editor.events[event.id] = null;
        eventEditor.hideInspector()
        this.renderEvent();
        console.log('이벤트 삭제:', event.id);
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


    drawNormal(ctx, tileId, x, y) {
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        const tile = editor.getNormalTile(tileId)
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