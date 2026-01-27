
class MapViewer {
    constructor() {
    }
    updateMouseOverlay() {
        const canvas = document.getElementById('map-canvas');
        const overlay = document.getElementById('map-overlay-canvas');
        const eventOverlay = document.getElementById('event-overlay-canvas');
        if (overlay) {
            overlay.width = canvas.width;
            overlay.height = canvas.height;
        }
        if (eventOverlay) {
            eventOverlay.width = canvas.width;
            eventOverlay.height = canvas.height;
        }   
    }

    initMapPaintEvents() {
        const canvas = this.canvas;
        let isPainting = false;
        let rectStartX = null, rectStartY = null; // 사각형 툴용 시작점
        
        const paint = (e) => {
            const { x, y } = this.getMapCoordinates(e.clientX, e.clientY);

            // 맵 범위 체크
            if (x < 0 || x >= main.map.width || y < 0 || y >= main.map.height) return;

            // 툴에 따라 다른 동작
            if (this.selectedTool === 'pen') {
                if (!this.selectedTile) return;
                main.mapManager.setTile(x, y, this.selectedLayer, this.selectedTile);
            } else if (this.selectedTool === 'eraser') {
                // 선택된 레이어의 타일 삭제
                this.eraseTileAtPosition(x, y);
            }
        };

        canvas.addEventListener('mousedown', (e) => {
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
                canvas.style.cursor = 'grabbing';
                return;
            }
            
            if (e.button !== 0) return; // 왼쪽 클릭만
            
            const { x, y } = this.getMapCoordinates(e.clientX, e.clientY);
            
            // 이벤트가 있는 위치 체크
            const hasEvent = main.eventManager.events.some(ev => ev.x === x && ev.y === y);
            if (hasEvent) return;
            
            if (this.selectedTool === 'rect') {
                // 사각형 툴: 시작점 기록
                rectStartX = x;
                rectStartY = y;
                isPainting = true;
            } else {
                // 펜, 지우개: 일반 페인팅
                isPainting = true;
                paint(e);
            }
        });
        
        // 우클릭 이벤트: 선택 범위 1칸으로 초기화 및 파란원 그리기
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const { x, y } = this.getMapCoordinates(e.clientX, e.clientY);
            
            // 맵 범위 체크
            if (x < 0 || x >= main.map.width || y < 0 || y >= main.map.height) return;
            
            // 선택된 타일이 있으면 1칸으로 초기화
            if (this.selectedTile) {
                this.selectedTile.w = 1;
                this.selectedTile.h = 1;
                
                // 타일셋뷰의 선택 사각형도 업데이트
                const selectionRect = document.getElementById('tileset-selection-rect');
                if (selectionRect) {
                    selectionRect.style.width = '48px';
                    selectionRect.style.height = '48px';
                }
            }
            
            // 파란원 그리기
            this.drawBlueCircle(x, y);
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                // 팬 중일 때 컨텍스트 메뉴 닫기
                
                // map-editor 기준 좌표로 계산
                const mapEditor = document.getElementById('map-editor');
                const editorRect = mapEditor.getBoundingClientRect();
                const editorX = e.clientX - editorRect.left;
                const editorY = e.clientY - editorRect.top;
                
                this.mapPanX = (editorX - this.panStartX) / this.mapZoom;
                this.mapPanY = (editorY - this.panStartY) / this.mapZoom;
                this.applyMapTransform();
                return;
            }
            
            if (isPainting) {
                if (this.selectedTool === 'rect' && rectStartX !== null) {
                    // 사각형 툴: 드래그 중 미리보기 표시
                    this.drawRectPreview(rectStartX, rectStartY, e.clientX, e.clientY);
                } else {
                    paint(e);
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.isPanning) {
                this.isPanning = false;
                canvas.style.cursor = '';
                return;
            }
            
            if (isPainting && this.selectedTool === 'rect') {
                // 사각형 툴: 드래그 종료 시 사각형 그리기
                const { x: endX, y: endY } = this.getMapCoordinates(e.clientX, e.clientY);
                this.drawRect(rectStartX, rectStartY, endX, endY);
                // 미리보기 클리어
                const overlay = document.getElementById('map-overlay-canvas');
                const ctx = overlay.getContext('2d');
                ctx.clearRect(0, 0, overlay.width, overlay.height);
            }
            
            isPainting = false;
            rectStartX = null;
            rectStartY = null;
        });
        
        // 마우스 휠 이벤트: 확대/축소
        canvas.addEventListener('wheel', (e) => {
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
                this.updateZoomDisplay();
            }
        });
    }
    
    // 타일 지우기
    eraseTileAtPosition(x, y) {
        if (main.mapManager.isOutofMap(x, y)) return;
        
        if (this.selectedLayer === 'auto') {
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
            const layerIdx = parseInt(this.selectedLayer);
            const oldTileId = main.mapManager.mapData(x, y, layerIdx);
            main.mapManager.setMapData(x, y, layerIdx, 0);
            
            // 오토타일이면 주변 전파
            if (main.mapManager.isAutotile(oldTileId)) {
                main.mapManager.propagateAutotile(x, y, layerIdx);
            }
        }
        
        main.mapManager.renderMap();
    }
    
    // 사각형 그리기
    drawRect(startX, startY, endX, endY) {
        if (!this.selectedTile) return;
        
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (!main.mapManager.isOutofMap(x, y)) {
                    main.mapManager.setTile(x, y, this.selectedLayer, this.selectedTile);
                }
            }
        }
        
        console.log(`사각형 그리기: (${minX},${minY}) ~ (${maxX},${maxY})`);
    }
    
    // 사각형 미리보기
    drawRectPreview(startX, startY, clientX, clientY) {
        const { x: endX, y: endY } = this.getMapCoordinates(clientX, clientY);
        
        const overlay = document.getElementById('map-overlay-canvas');
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        // 미리보기 사각형 그리기 (변환 적용 안 함 - 캔버스 좌표로 직접)
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(minX * 48, minY * 48, (maxX - minX + 1) * 48, (maxY - minY + 1) * 48);
        ctx.fillRect(minX * 48, minY * 48, (maxX - minX + 1) * 48, (maxY - minY + 1) * 48);
    }
    
    // 파란원 그리기 (우클릭 위치 표시)
    drawBlueCircle(x, y) {
        console.log("?",x,y)
        const overlay = document.getElementById('map-overlay-canvas');
        const ctx = overlay.getContext('2d');
        
        this.blueCircleVisible = true;
        this.blueCirclePosition = { x, y };
        
        // 전체 다시 그리기
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        
        // 2. 파란원 그리기
        const centerX = x * 48 + 24;
        const centerY = y * 48 + 24;
        const radius = 20;
        
        ctx.strokeStyle = 'rgba(52, 152, 219, 1)';
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    // 파란원 제거
    clearBlueCircle() {
        this.blueCircleVisible = false;
        this.blueCirclePosition = null;
        
        const overlay = document.getElementById('map-overlay-canvas');
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    
    // 컨텍스트 메뉴 닫기
    closeContextMenu() {
        const menu = document.getElementById('map-context-menu');
        if (menu) {
            menu.remove();
        }
    }
    // 맵 변환 적용
    applyMapTransform() {
        const container = document.getElementById('map-grid-container');
        if (container) {
            container.style.transform = `scale(${this.mapZoom}) translate(${this.mapPanX}px, ${this.mapPanY}px)`;
            container.style.transformOrigin = '0 0';
        }
    }
    
}