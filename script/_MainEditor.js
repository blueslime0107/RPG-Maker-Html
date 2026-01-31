

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
        this.tileEditor = new TileEditor();
        this.mapListEditor = new MapListEditor();
        this.mapviewer = new MapViewer();
        this.eventEditor = new EventEditor();
        this.databaseEditor = new DatabaseEditor();

        this.contextSelf = null;
        this.contextWhenClose = null;

        this.clipboard = null
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
        this.eventEditor.init()
    }
    
    loadMap(id) {
        this.map = main.data.maps[id]
        this.mapInfo = main.data.mapInfos[id]
        this.events = this.map.events

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
        return this.events.find(
            ev => ev !== null && 
            ev.x === x && 
            ev.y === y && 
            ev.id !== (exception ? exception.id : null)
        );
    }

    // 통합 맵 데이터 접근 헬퍼 (읽기)
    getMapData(x, y, layerIdx) {
        return this.map.data[this.getTileIndex(x, y, layerIdx)];
    }
    // 다음 이벤트 ID 찾기 (null 슬롯 재사용)
    getNextEventId() {
        // 0번 인덱스는 항상 null이므로 1부터 시작
        for (let i = 1; i < this.events.length; i++) {
            if (this.events[i] === null) {
                return i;
            }
        }
        // null이 없으면 배열 끝에 추가
        return this.events.length;
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
                opacity: opt.disabled ? '0.4' : '1',
                color: opt.color ? opt.color : '#eee'
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


    


    // 스위치 이름 가져오기
    getSwitchName(switchId) {
        const switchName = main.data.system.switches[switchId];
        return switchName || '';
    }
    // 스위치 선택 모달
    showSwitchSelector(currentSwitchId, onSelect) {
        // 모달 오버레이
        const overlay = document.createElement('div');
        overlay.id = 'switch-selector-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 11000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

        // 모달 컨테이너
        const modalContainer = document.createElement('div');
        modalContainer.style.cssText = `
        background-color: #3a3a3a;
        border: 2px solid #0066cc;
        border-radius: 6px;
        width: 500px;
        height: auto;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
    `;

        // 제목
        const title = document.createElement('div');
        title.textContent = '스위치 선택';
        title.style.cssText = `
        padding: 12px 16px;
        background: linear-gradient(90deg, #0066cc 0%, #0052a3 100%);
        border-bottom: 1px solid #004499;
        color: white;
        font-size: 16px;
        font-weight: bold;
        flex-shrink: 0;
    `;
        modalContainer.appendChild(title);

        // System.json에서 스위치 데이터 로드
        const switches = main.data.system.switches || [];

        let selectedSwitchId = currentSwitchId || 1;
        let currentRangeStart = 1;

        // 컨텐츠 영역
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
        display: flex;
        flex: 1;
        overflow: hidden;
        gap: 12px;
        padding: 12px;
        min-height: 0;
    `;

        // 좌측: 범위 선택 버튼
        const rangeButtonContainer = document.createElement('div');
        rangeButtonContainer.style.cssText = `
        flex: 0 0 80px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
    `;

        const createRangeButtons = () => {
            rangeButtonContainer.innerHTML = '';
            for (let i = 1; i <= 500; i += 20) {
                const endNum = Math.min(i + 19, 500);
                const btn = document.createElement('button');
                btn.textContent = String(endNum).padStart(4, '0');
                btn.dataset.rangeStart = i;
                btn.style.cssText = `
                padding: 6px 8px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 2px;
                color: #ddd;
                cursor: pointer;
                font-size: 11px;
                transition: all 0.2s;
            `;

                if (selectedSwitchId >= i && selectedSwitchId < i + 20) {
                    btn.style.backgroundColor = '#0066cc';
                    btn.style.borderColor = '#0052a3';
                    btn.style.color = 'white';
                }

                btn.addEventListener('click', () => {
                    currentRangeStart = i;
                    renderSwitchList();
                });

                btn.addEventListener('mouseenter', () => {
                    if (!(selectedSwitchId >= i && selectedSwitchId < i + 20)) {
                        btn.style.backgroundColor = '#2a2a2a';
                        btn.style.borderColor = '#555';
                    }
                });

                btn.addEventListener('mouseleave', () => {
                    if (!(selectedSwitchId >= i && selectedSwitchId < i + 20)) {
                        btn.style.backgroundColor = '#1a1a1a';
                        btn.style.borderColor = '#333';
                    }
                });

                rangeButtonContainer.appendChild(btn);
            }
        };

        // 중앙: 스위치 목록
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    `;

        const rangeLabel = document.createElement('div');
        rangeLabel.style.cssText = `
        background: #2a2a2a;
        padding: 8px 12px;
        font-size: 12px;
        color: #aaa;
        border: 1px solid #444;
        border-radius: 2px;
        margin-bottom: 8px;
        text-align: center;
    `;
        listContainer.appendChild(rangeLabel);

        const switchList = document.createElement('ul');
        switchList.style.cssText = `
        list-style: none;
        margin: 0;
        padding: 6px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 2px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    `;
        listContainer.appendChild(switchList);

        // 스위치 이름 수정 텍스트 박스
        const renameContainer = document.createElement('div');
        renameContainer.style.cssText = `
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    `;

        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.placeholder = '선택한 스위치의 이름을 입력하세요';
        renameInput.style.cssText = `
        padding: 6px 8px;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 2px;
        color: #ddd;
        font-size: 12px;
        outline: none;
    `;
        renameInput.addEventListener('focus', () => {
            renameInput.style.borderColor = '#0066cc';
        });
        renameInput.addEventListener('blur', () => {
            renameInput.style.borderColor = '#444';
            // 포커스를 벗어날 때 변경사항 저장 (렌더링은 하지 않음)
            switches[selectedSwitchId] = renameInput.value;
        });
        renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                switches[selectedSwitchId] = renameInput.value;
                renderSwitchList();
            }
        });
        renameContainer.appendChild(renameInput);
        listContainer.appendChild(renameContainer);

        const renderSwitchList = () => {
            switchList.innerHTML = '';
            const rangeEnd = Math.min(currentRangeStart + 19, 500);
            rangeLabel.textContent = `[ ${String(currentRangeStart).padStart(4, '0')} - ${String(rangeEnd).padStart(4, '0')} ]`;

            for (let i = currentRangeStart; i <= rangeEnd; i++) {
                const li = document.createElement('li');
                li.dataset.switchId = i;
                li.style.cssText = `
                padding: 6px 8px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 2px;
                cursor: pointer;
                font-size: 12px;
                color: #ddd;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                transition: all 0.2s;
            `;

                const switchName = switches[i] || '';
                const displayId = String(i).padStart(4, '0');
                const displayText = switchName ? `${displayId} ${switchName}` : displayId;

                li.textContent = displayText;

                if (i === selectedSwitchId) {
                    li.style.backgroundColor = '#0066cc';
                    li.style.borderColor = '#0052a3';
                    li.style.color = 'white';
                    li.style.fontWeight = 'bold';
                }

                li.addEventListener('mouseenter', () => {
                    if (i !== selectedSwitchId) {
                        li.style.backgroundColor = '#2a2a2a';
                        li.style.borderColor = '#555';
                    }
                });

                li.addEventListener('mouseleave', () => {
                    if (i !== selectedSwitchId) {
                        li.style.backgroundColor = '#1a1a1a';
                        li.style.borderColor = '#333';
                    }
                });

                li.addEventListener('click', () => {
                    // 이전 선택의 변경사항 저장
                    switches[selectedSwitchId] = renameInput.value;

                    selectedSwitchId = i;

                    // 텍스트 박스 업데이트
                    renameInput.value = switches[selectedSwitchId] || '';

                    // UI 전체 갱신
                    renderSwitchList();

                    // 범위 버튼 업데이트
                    rangeButtonContainer.querySelectorAll('button').forEach(btn => {
                        const rangeStart = parseInt(btn.dataset.rangeStart);
                        if (selectedSwitchId >= rangeStart && selectedSwitchId < rangeStart + 20) {
                            btn.style.backgroundColor = '#0066cc';
                            btn.style.borderColor = '#0052a3';
                            btn.style.color = 'white';
                        } else {
                            btn.style.backgroundColor = '#1a1a1a';
                            btn.style.borderColor = '#333';
                            btn.style.color = '#ddd';
                        }
                    });
                });

                switchList.appendChild(li);
            }
        };

        createRangeButtons();
        renderSwitchList();

        // 초기 선택된 스위치의 이름 표시
        renameInput.value = switches[selectedSwitchId] || '';

        contentArea.appendChild(rangeButtonContainer);
        contentArea.appendChild(listContainer);
        modalContainer.appendChild(contentArea);

        // 버튼 영역
        const buttonArea = document.createElement('div');
        buttonArea.style.cssText = `
        display: flex;
        gap: 8px;
        padding: 12px 16px;
        background: #2a2a2a;
        border-top: 1px solid #444;
        flex-shrink: 0;
        justify-content: flex-end;
    `;

        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
        padding: 6px 16px;
        background: #0066cc;
        color: white;
        border-color: #0052a3;
        border: 1px solid #0052a3;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    `;
        okBtn.addEventListener('click', () => {
            // 모달 닫기 전 변경사항 저장
            switches[selectedSwitchId] = renameInput.value;
            onSelect(selectedSwitchId);
            document.body.removeChild(overlay);
        });
        okBtn.addEventListener('mouseover', () => {
            okBtn.style.background = '#0052a3';
        });
        okBtn.addEventListener('mouseout', () => {
            okBtn.style.background = '#0066cc';
        });
        buttonArea.appendChild(okBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `
        padding: 6px 16px;
        background: #3a3a3a;
        color: #ddd;
        border-color: #555;
        border: 1px solid #555;
        border-radius: 2px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    `;
        cancelBtn.addEventListener('click', () => {
            // 취소 시에도 변경사항 저장
            switches[selectedSwitchId] = renameInput.value;
            document.body.removeChild(overlay);
        });
        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.background = '#4a4a4a';
        });
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.background = '#3a3a3a';
        });
        buttonArea.appendChild(cancelBtn);

        modalContainer.appendChild(buttonArea);

        // ESC 키로 닫기
        const escListener = (e) => {
            if (e.key === 'Escape') {
                // ESC로 닫을 때도 변경사항 저장
                switches[selectedSwitchId] = renameInput.value;
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        overlay.appendChild(modalContainer);
        document.body.appendChild(overlay);
    }

}