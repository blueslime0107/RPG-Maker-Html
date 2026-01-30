

const A1_AUTOTILE_TYPE_MAP = [
    ['floor', 'floor', 'floor', 'fixed', 'floor', 'floor', 'floor', 'floor'], // 첫 번째 행
    ['floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor']  // 두 번째 행
];

const FLOOR_AUTOTILE_TABLE = [
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

const WALL_AUTOTILE_TABLE = [
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

const WATERFALL_AUTOTILE_TABLE = [
    [[2, 0], [1, 0], [2, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]],
    [[0, 0], [3, 0], [0, 1], [3, 1]]
];

const TILE_ID_B = 0;
const TILE_ID_C = 256;
const TILE_ID_D = 512;
const TILE_ID_E = 768;
const TILE_ID_A5 = 1536;
const TILE_ID_A1 = 2048;
const TILE_ID_A2 = 2816;
const TILE_ID_A3 = 4352;
const TILE_ID_A4 = 5888;
const TILE_ID_MAX = 8192;
        // 상수
const TILE_SIZE = 48

class MainEditor {
    constructor() {

        this.loadMapId = 1; // 기본 로드 맵 ID
        this.map = null;
        this.mapInfo = null;
        this.events = [];

        // 타일 ID 상수


        // 인스턴스
        this.mapviewer = new MapViewer();
        this.tileEditor = new TileEditor();
        this.mapListEditor = new MapListEditor();
        this.mapviewer = new MapViewer();
        this.eventEditor = new EventEditor();
        this.databaseEditor = new DatabaseEditor();

        this.contextSelf = null;
        this.contextWhenClose = null;
        return
        this.selectedTile = null
        this.selectedTilesetTab = 'A'
        this.selectedLayer = 'auto'; // 레이어 선택: 'auto', 0, 1, 2, 3
        this.selectedTool = 'pen'; // 현재 선택된 툴: 'pen', 'eraser', 'fill', 'rect'
        this.canvas = document.getElementById('map-canvas');
        this.overlay = document.getElementById('map-overlay-canvas');
        this.mapClipboard = null; // 맵 복사/붙여넣기용 클립보드
        
        
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

    // 특정 좌표의 레이어 타일값 조회 함수
    getTileIndex(x, y, layerIdx) {
        return (layerIdx * this.map.width * this.map.height) + (y * this.map.width) + x;
    }

    getEventAndPlayer(x, y, exception=null) {
        if(this.mapInfo.id == main.data.system.startMapId && main.playerX == x && main.playerY == y && exception?.isPlayer !== true){
            return {isPlayer:true}
        }
        return this.getEvent(x, y, exception)
    }
    getEvent(x, y, exception=null) {
        return this.events.find(ev => ev.x === x && ev.y === y && ev.id !== (exception ? exception.id : null));
    }

    // 통합 맵 데이터 접근 헬퍼 (읽기)
    getMapData(x, y, layerIdx) {
        return this.map.data[this.getTileIndex(x, y, layerIdx)];
    }

    // 통합 맵 데이터 설정 헬퍼 (쓰기)
    setMapData(x, y, layerIdx, value) {
        this.map.data[this.getTileIndex(x, y, layerIdx)] = value;
    }

    isNotOnMap(x, y) {
        return x < 0 || x >= this.map.width || y < 0 || y >= this.map.height
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

    showContextMenu(self,e, options,whenClose){
        this.closeContextMenu();
        this.contextSelf = self;
        const menu = document.createElement('div');
        menu.id = 'event-context-menu';
        Object.assign(menu.style, {
            position: 'fixed',
            left: `${e.pageX}px`,
            top: `${e.pageY}px`,
            backgroundColor: '#2b2b2b',
            color: '#eee',
            border: '1px solid #555',
            padding: '4px 0',
            zIndex: '9999',
            fontSize: '13px',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.4)',
            minWidth: '150px'
        });

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
        document.addEventListener('click', (e) => this.closeContextMenu(e));
        document.addEventListener('wheel', (e) => this.closeContextMenu(e));
        if(whenClose){
            this.contextWhenClose = whenClose;
        }
    }
    closeContextMenu() {
        const menu = document.getElementById('event-context-menu');
        if (menu) menu.remove();
        if(this.contextWhenClose){
            this.contextWhenClose.bind(this.contextSelf)();            
            this.contextWhenClose = null;
        }
    }

    drawCharacter(ctx, info, dx, dy) {
        const img = main.images.characters.get(info.characterName);
        // $로 시작하면 단일 캐릭터(3x4), 아니면 8인용(12x8)
        const isBig = info.characterName.includes('$');

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

    // 타일 분류 메소드
    isAutotile(tileId) {
        return tileId >= TILE_ID_A1;
    }

    isTileA1(tileId) {
        return tileId >= TILE_ID_A1 && tileId < TILE_ID_A2;
    }

    isTileA2(tileId) {
        return tileId >= TILE_ID_A2 && tileId < TILE_ID_A3;
    }

    isTileA3(tileId) {
        return tileId >= TILE_ID_A3 && tileId < TILE_ID_A4;
    }

    isTileA4(tileId) {
        return tileId >= TILE_ID_A4 && tileId < TILE_ID_MAX;
    }

    isTileA5(tileId) {
        return tileId >= TILE_ID_A5 && tileId < TILE_ID_A1;
    }

    isTileB(tileId) {
        return tileId >= TILE_ID_B && tileId < TILE_ID_C;
    }

    isTileC(tileId) {
        return tileId >= TILE_ID_C && tileId < TILE_ID_D;
    }

    isTileD(tileId) {
        return tileId >= TILE_ID_D && tileId < TILE_ID_E;
    }

    isTileE(tileId) {
        return tileId >= TILE_ID_E && tileId < TILE_ID_A5;
    }

    getAutotileKind(tileId) {
        return Math.floor((tileId - TILE_ID_A1) / 48);
    }

    getAutotileShape(tileId) {
        return (tileId - TILE_ID_A1) % 48;
    }
    // 오토타일의 base ID 추출
    getAutotileBaseId(tileId) {
        if (this.isAutotile(tileId)) {
            return Math.floor((tileId - TILE_ID_A1) / 48) * 48 + TILE_ID_A1;
        }
        return tileId;
    }
    // A1 타일의 오토타일 타입 반환 ('floor', 'wall', 'waterfall', 'fixed')
    getA1AutotileType(tileId) {
        if (this.isTileA1(tileId)) {
            const tileIndex = Math.floor((tileId - TILE_ID_A1) / 48);
            const row = Math.floor(tileIndex / 8);
            const col = tileIndex % 8;

            if (row < 2 && col < 8) {
                return A1_AUTOTILE_TYPE_MAP[row][col];
            }
        }
        return 'floor'; // 기본값
    }

    isShadowingTile(tileId) {
        return this.isTileA3(tileId) || this.isTileA4(tileId);
    }

}