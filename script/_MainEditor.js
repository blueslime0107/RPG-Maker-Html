

class MainEditor {
    constructor() {

        this.loadMapId = 1; // 기본 로드 맵 ID
        this.map = null;
        this.mapInfo = null;


        // 인스턴스
        this.mapviewer = new MapViewer();
        this.tileEditor = new TileEditor();
        this.mapListEditor = new MapListEditor();
        this.mapviewer = new MapViewer();
        this.eventEditor = new EventEditor();
        this.databaseEditor = new DatabaseEditor();
        return
        this.selectedTile = null
        this.selectedTilesetTab = 'A'
        this.selectedLayer = 'auto'; // 레이어 선택: 'auto', 0, 1, 2, 3
        this.selectedTool = 'pen'; // 현재 선택된 툴: 'pen', 'eraser', 'fill', 'rect'
        this.canvas = document.getElementById('map-canvas');
        this.overlay = document.getElementById('map-overlay-canvas');
        this.mapClipboard = null; // 맵 복사/붙여넣기용 클립보드
        
        // 확대/축소 및 패닝 상태
        this.mapZoom = 1.0;
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.currentMouseTile = null; // 현재 마우스 위치 (타일 좌표)
        this.blueCircleVisible = false; // 파란원 표시 여부
        this.blueCirclePosition = null; // 파란원 위치 { x, y }
        
        // 리사이저 초기화
        this.initInspectorResizer();
        this.initTilesetMapResizer();



        //this.eventManager = new EventManager();
        //this.commonEventEditor = new EventEditor(document.getElementById('db-commonevent-commands')); // 공통이벤트용 별도 에디터
        // 앱 시작
    }

    // script/main.js 내 EditorUI 클래스에 추가/수정

    init() {
        // this.initMouseOverlay();
        // this.initTilesetEvents();
        // this.initTabEvents();
        // this.initLayerEvents();
        // this.initToolEvents();
        // this.initMapPaintEvents();
        // this.initDatabasePanel();
        this.initToolbarButtons()
        this.initInspectorResizer();
        this.initTilesetMapResizer();
        this.tileEditor.init()
        this.mapListEditor.init()
    }
    
    loadMap(id) {
        this.map = main.data.maps[id]
        this.mapInfo = main.data.mapInfos[id]

        this.tileEditor.update()
        // this.mapManager.loadMap(this.map)

        // // 맵 로드 후 캔버스 크기가 확정되면 오버레이 캔버스 크기 조정
        // this.editorUI.updateMouseOverlay()
        // this.eventManager.loadEvent(this.map)
        
        // // 맵 정보 및 줌 레벨 표시
        // this.editorUI.updateZoomDisplay();
        
        // // 리스트에서 선택 상태 표시를 위해 리렌더링
        // this.editorUI.renderMapList();
        
        // 현재 맵 ID를 localStorage에 저장
        localStorage.setItem('lastMapId', id);
    }

    // 툴바 버튼 이벤트 초기화
    initToolbarButtons() {
        // 게임 실행 버튼
        const runGameBtn = document.getElementById('btn-run-game');
        if (runGameBtn) {
            runGameBtn.addEventListener('click', () => {
                const width = 816;
                const height = 624;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`;
                window.open('project/index.html', 'RPG_Game', features);
            });
        }
        
        // 프로젝트 저장 버튼
        const saveBtn = document.getElementById('btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                main.saveProject();
            });
        }
    }

    // 인스펙터 리사이저 초기화 (오른쪽 이벤트 인스펙터)
    initInspectorResizer() {
        const resizer = document.getElementById('inspector-resizer');
        const inspectorPanel = document.getElementById('inspector-panel');
        let isResizing = false;
        let lastX = 0;

        if (!resizer || !inspectorPanel) return;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            lastX = e.clientX;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaX = lastX - e.clientX; // 음수면 오른쪽으로 드래그 (패널 확대)
            const currentWidth = inspectorPanel.offsetWidth;
            const newWidth = currentWidth + deltaX;

            // 최소/최대 너비 제한 (최소 200px, 최대 800px)
            if (newWidth >= 200 && newWidth <= 800) {
                inspectorPanel.style.width = newWidth + 'px';
                lastX = e.clientX;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        });
    }
    // 타일셋과 맵 관리 사이 리사이저 초기화
    initTilesetMapResizer() {
        const resizer = document.getElementById('tileset-map-resizer');
        const tilesetWindow = document.getElementById('tileset-window');
        const mapManagement = document.getElementById('map-management');
        let isResizing = false;
        let lastY = 0;

        if (!resizer || !tilesetWindow || !mapManagement) return;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            lastY = e.clientY;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaY = e.clientY - lastY;
            
            // flex 비율 대신 명시적 높이 설정
            const currentHeight = tilesetWindow.offsetHeight;
            const newHeight = currentHeight + deltaY;

            // 최소/최대 높이 제한 (최소 200px, 최대는 부모 높이의 80%)
            const parentHeight = tilesetWindow.parentElement.offsetHeight;
            if (newHeight >= 200 && newHeight <= parentHeight * 0.8) {
                tilesetWindow.style.flex = 'none';
                tilesetWindow.style.height = newHeight + 'px';
                lastY = e.clientY;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        });
    }



    
    // 맵 확대/축소 초기화
    resetMapZoom() {
        this.mapZoom = 1.0;
        this.mapPanX = 0;
        this.mapPanY = 0;
        this.applyMapTransform();
        this.updateZoomDisplay();
        console.log('맵 확대/축소 초기화');
    }
    
    // 줌 레벨 표시 업데이트
    updateZoomDisplay() {
        const mapInfo = document.getElementById('map-info');
        if (mapInfo && main.map) {
            const mapName = main.mapInfo ? main.mapInfo.name : 'Map000';
            const mapSize = `${main.map.width}x${main.map.height}`;
            const zoomPercent = (this.mapZoom * 100).toFixed(0);
            mapInfo.textContent = `${mapName} (${mapSize}) - ${zoomPercent}%`;
        }
    }


    // 맵 뷰
    // EditorUI 클래스 내의 initMouseOverlay 메서드 수정

    initMouseOverlay() {
        const canvas = this.canvas;
        const overlay = this.overlay;
        const ctx = overlay.getContext('2d');

        canvas.addEventListener('mousemove', (e) => {
            // overlay 캔버스 크기를 map-canvas와 동일하게 유지
            if (overlay.width !== canvas.width || overlay.height !== canvas.height) {
                overlay.width = canvas.width;
                overlay.height = canvas.height;
            }
            
            // zoom/pan을 고려한 타일 좌표 계산
            const { x: tileX, y: tileY } = this.getMapCoordinates(e.clientX, e.clientY);
            
            // 현재 마우스 위치 저장
            this.currentMouseTile = { x: tileX, y: tileY };
            
            // 맵 범위 밖이면 선택범위 안 그림
            const isInMap = main.map && tileX >= 0 && tileX < main.map.width && tileY >= 0 && tileY < main.map.height;
            
            // 전체 지우기
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            
            // 1. 선택범위 그리기 (마우스가 맵 안에 있을 때)
            if (isInMap) {
                const tw = this.selectedTile ? this.selectedTile.w : 1;
                const th = this.selectedTile ? this.selectedTile.h : 1;

                ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
                ctx.lineWidth = 2;
                ctx.strokeRect(tileX * 48, tileY * 48, tw * 48, th * 48);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(tileX * 48, tileY * 48, tw * 48, th * 48);

                // 다중 선택 시 내부 격자 가이드
                if (tw > 1 || th > 1) {
                    ctx.beginPath();
                    ctx.setLineDash([4, 4]);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 1;
                    for (let i = 1; i < th; i++) {
                        ctx.moveTo(tileX * 48, (tileY + i) * 48);
                        ctx.lineTo((tileX + tw) * 48, (tileY + i) * 48);
                    }
                    for (let i = 1; i < tw; i++) {
                        ctx.moveTo((tileX + i) * 48, tileY * 48);
                        ctx.lineTo((tileX + i) * 48, (tileY + th) * 48);
                    }
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
            
            // 2. 파란원 그리기 (바로가기 메뉴가 있을 때)
            if (this.blueCircleVisible && this.blueCirclePosition) {
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
        });

        canvas.addEventListener('mouseleave', () => {
            // 마우스가 맵 밖으로 나가면 무조건 선택 사각형 제거
            this.currentMouseTile = null;
            
            // 전체 다시 그리기
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            
            // 파란원만 다시 그리기 (바로가기 메뉴가 있으면)
            if (this.blueCircleVisible && this.blueCirclePosition) {
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
        });
    }


    // 화면 좌표를 맵 좌표로 변환 (확대/축소/패닝 반영)
    getMapCoordinates(clientX, clientY) {
        const canvas = this.canvas;
        const container = document.getElementById('map-grid-container');
        const mapEditor = document.getElementById('map-editor');
        
        // map-editor의 화면 위치
        const editorRect = mapEditor.getBoundingClientRect();
        
        // container의 offset (map-editor 내부에서의 위치)
        const containerOffsetX = container.offsetLeft;
        const containerOffsetY = container.offsetTop;
        
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
}