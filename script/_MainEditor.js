

class MainEditor {
    constructor() {

        this.loadMapId = 1; // 기본 로드 맵 ID
        this.map = null;
        this.mapInfo = null;
        this.events = [];


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
        this.mapviewer.init()
        this.mapListEditor.init()
    }
    
    loadMap(id) {
        this.map = main.data.maps[id]
        this.mapInfo = main.data.mapInfos[id]
        this.events = this.map.events.filter(x => x != null);

        this.tileEditor.update()
        this.mapviewer.update()
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

    getTilesetFromMap(mapData) {
        return main.data.tilesets[mapData.tilesetId]
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
        if (this.map) {
            const mapName = this.mapInfo ? this.mapInfo.name : 'Map000';
            const mapSize = `${this.map.width}x${this.map.height}`;
            const zoomPercent = (this.mapviewer.mapZoom * 100).toFixed(0);
            mapInfo.textContent = `${mapName} (${mapSize}) - ${zoomPercent}%`;
        }
    }



}