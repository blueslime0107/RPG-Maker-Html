
class EditorMain {
    constructor() {
        this.tilesetData = null;

        this.map = null;
        this.mapInfo = null;
        this.images = new Map();

        this.mapInfos = [];
        this.mapDatas = {}
        this.tilesets = []

        // 게임 데이터
        this.systemData = null;
        this.actorsData = [];
        this.animationsData = [];
        this.commonEventsData = [];
        this.itemsData = [];
        this.weaponsData = [];
        this.armorsData = [];
        this.mapsData = {};

        // 모듈 인스턴스 생성 (나중에 구현)
        this.mapManager = new MapManager();
        this.eventManager = new EventManager();
        this.editorUI = new EditorUI()


        // 앱 시작
        this.init();
    }

    async init() {
        try {
            console.log("에디터 초기화 중...");
            await this.loadImages();
            await this.loadAllMaps()
            await this.loadAllDatas()
            await this.loadCharactersList();
            await this.loadPicturesList();
            await this.loadEffectsList();
            await this.loadAudioList();

        } catch (error) {
            console.error("초기화 중 오류 발생:", error);
            //alert("프로젝트 파일을 찾을 수 없습니다. 경로를 확인해주세요.");
        }
        // 마지막으로 본 맵 ID 불러오기
        const lastMapId = localStorage.getItem('lastMapId');
        const mapIdToLoad = lastMapId ? parseInt(lastMapId) : 1;
        this.loadMap(mapIdToLoad)
        this.editorUI.init()
        
        // 기본 폰트 크기 설정 (11px)
        const contentsList = document.getElementById('ins-contents-list');
        if (contentsList) {
            contentsList.style.fontSize = '11px';
        }
        const inspectorMain = document.getElementById('inspector-main');
        if (inspectorMain) {
            inspectorMain.style.fontSize = '11px';
        }
        
        // 모든 UI 준비 완료 후 설정 불러오기 및 적용
        setTimeout(() => {
            this.loadAndApplySettings();
        }, 50);
    }

    // 설정 로드 및 바로 적용
    loadAndApplySettings() {
        try {
            const stored = localStorage.getItem('editorSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                console.log('[loadAndApplySettings] 저장된 설정:', settings);
                
                // 폰트 크기 설정 적용
                if (settings.fontsize) {
                    const slider = document.getElementById('inspector-font-size');
                    
                    if (slider) {
                        // 슬라이더 값 설정
                        slider.value = parseInt(settings.fontsize);
                        console.log('[loadAndApplySettings] 슬라이더 값 설정:', settings.fontsize);
                        
                        // 슬라이더 input 이벤트 트리거 (이벤트 리스너의 핸들러 함수 실행)
                        slider.dispatchEvent(new Event('input', { bubbles: true }));
                        console.log('[loadAndApplySettings] 슬라이더 input 이벤트 트리거됨');
                    }
                }
            } else {
                console.log('[loadAndApplySettings] 저장된 설정 없음');
            }
        } catch (error) {
            console.error('[loadAndApplySettings] 설정 로드 실패:', error);
        }
    }


    async loadAllMaps() {
        // 1. MapInfos.json 로드하여 전체 맵 목록 파악
        const infoRes = await fetch('project/data/MapInfos.json');
        this.mapInfos = await infoRes.json();

        // 2. 유효한 맵 ID 추출 (null인 항목 제외)
        const loadPromises = this.mapInfos
            .filter(info => info !== null)
            .map(async (info) => {
                const mapId = info.id.toString().padStart(3, '0');
                try {
                    const res = await fetch(`project/data/Map${mapId}.json`);
                    const data = await res.json();
                    this.mapDatas[info.id] = data;
                    return data;
                } catch (e) {
                    console.error(`Map${mapId}.json 로드 실패:`, e);
                    return null;
                }
            });

        await Promise.all(loadPromises);
        this.editorUI.renderMapList(); // 데이터 로드 후 UI 출력
    }

    async loadAllDatas() {
        try {
            // System.json 로드
            const systemRes = await fetch('project/data/System.json');
            this.systemData = await systemRes.json();
            console.log('[loadAllDatas] System.json 로드 완료');

            // Faces 이미지 목록 로드
            await this.loadFacesList();

            // Actors.json 로드
            const actorsRes = await fetch('project/data/Actors.json');
            this.actorsData = await actorsRes.json();
            console.log('[loadAllDatas] Actors.json 로드 완료:', this.actorsData.length, '개');

            // Animations.json 로드
            const animationsRes = await fetch('project/data/Animations.json');
            this.animationsData = await animationsRes.json();
            console.log('[loadAllDatas] Animations.json 로드 완료:', this.animationsData.length, '개');

            // CommonEvents.json 로드
            const commonEventsRes = await fetch('project/data/CommonEvents.json');
            this.commonEventsData = await commonEventsRes.json();
            console.log('[loadAllDatas] CommonEvents.json 로드 완료:', this.commonEventsData.length, '개');

            // Items.json 로드
            const itemsRes = await fetch('project/data/Items.json');
            this.itemsData = await itemsRes.json();
            console.log('[loadAllDatas] Items.json 로드 완료:', this.itemsData.length, '개');

            // Weapons.json 로드
            const weaponsRes = await fetch('project/data/Weapons.json');
            this.weaponsData = await weaponsRes.json();
            console.log('[loadAllDatas] Weapons.json 로드 완료:', this.weaponsData.length, '개');

            // Armors.json 로드
            const armorsRes = await fetch('project/data/Armors.json');
            this.armorsData = await armorsRes.json();
            console.log('[loadAllDatas] Armors.json 로드 완료:', this.armorsData.length, '개');

            // MapInfos에서 맵 이름 매핑
            this.mapInfos.forEach(info => {
                if (info) {
                    this.mapsData[info.id] = info;
                }
            });
            console.log('[loadAllDatas] 맵 정보 매핑 완료');

            console.log('[loadAllDatas] 모든 데이터 로드 완료!');
        } catch (error) {
            console.error('[loadAllDatas] 데이터 로드 중 오류 발생:', error);
        }
    }

    // 설정 저장
    async saveSettings(settings) {
        try {
            const response = await fetch('project/settings.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                console.log('[saveSettings] 설정 저장 완료');
                // localStorage에도 저장 (브라우저 내 백업)
                localStorage.setItem('editorSettings', JSON.stringify(settings));
            } else {
                console.warn('[saveSettings] 서버 저장 실패, localStorage에만 저장됨');
                localStorage.setItem('editorSettings', JSON.stringify(settings));
            }
        } catch (error) {
            console.warn('[saveSettings] 서버 통신 오류, localStorage에만 저장:', error);
            localStorage.setItem('editorSettings', JSON.stringify(settings));
        }
    }

    // 설정 로드
    // Faces 이미지 목록 로드
    async loadFacesList() {
        try {
            const response = await fetch('project/img/faces/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            this.facesList = [];
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.endsWith('.png') || href.endsWith('.jpg'))) {
                    // 경로에서 파일명만 추출하고 확장자 제거
                    const filename = href.split('/').pop().replace(/\.(png|jpg)$/i, '');
                    this.facesList.push(filename);
                }
            });
            
            console.log('[loadFacesList] Faces 이미지 목록 로드 완료:', this.facesList.length, '개');
        } catch (error) {
            console.warn('[loadFacesList] Faces 목록 로드 실패, 수동 목록 사용:', error);
            // 폴백: 일반적인 파일명들
            this.facesList = [
                'Actor1', 'Actor2', 'Actor3', 'Evil', 'LAD', 'Monster',
                'Nature', 'Nature2', 'ParSL', 'People1', 'People2',
                'People3', 'People4', 'REC', 'RET', 'SF_Actor1',
                'SF_Actor2', 'SF_Actor3', 'SF_Monster', 'SF_People1',
                'TRI', '윰'
            ];
        }
    }

    // Characters 이미지 목록 로드
    async loadCharactersList() {
        try {
            const response = await fetch('project/img/characters/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            this.charactersList = [];
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href.endsWith('.png') || href.endsWith('.jpg'))) {
                    const raw = href.split('/').pop();
                    const decoded = decodeURIComponent(raw);
                    const filename = decoded.replace(/\.(png|jpg)$/i, '');
                    this.charactersList.push(filename);
                }
            });
            
            console.log('[loadCharactersList] Characters 이미지 목록 로드 완료:', this.charactersList.length, '개');
        } catch (error) {
            console.warn('[loadCharactersList] Characters 목록 로드 실패:', error);
            this.charactersList = [];
        }
    }

    async loadPicturesList() {
        try {
            const response = await fetch('project/img/pictures/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            this.picturesList = [];
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const isImage = imageExtensions.some(ext => href.toLowerCase().endsWith(ext));
                    if (isImage) {
                        const raw = href.split('/').pop();
                        const decoded = decodeURIComponent(raw);
                        const filename = decoded.replace(/\.(png|jpg|jpeg|gif|bmp|webp)$/i, '');
                        this.picturesList.push(filename);
                    }
                }
            });
            
            this.picturesList.sort();
            console.log('[loadPicturesList] Pictures 이미지 목록 로드 완료:', this.picturesList.length, '개');
        } catch (error) {
            console.warn('[loadPicturesList] Pictures 목록 로드 실패:', error);
            this.picturesList = [];
        }
    }

    async loadEffectsList() {
        try {
            const response = await fetch('project/effects/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            this.effectsList = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.toLowerCase().endsWith('.efkefc')) {
                    const raw = href.split('/').pop();
                    const decoded = decodeURIComponent(raw);
                    const filename = decoded.replace(/\.efkefc$/i, '');
                    this.effectsList.push(filename);
                }
            });
            
            this.effectsList.sort();
            console.log('[loadEffectsList] Effects 목록 로드 완료:', this.effectsList.length, '개');
        } catch (error) {
            console.warn('[loadEffectsList] Effects 목록 로드 실패:', error);
            this.effectsList = [];
        }
    }

    async loadAudioList() {
        try {
            // BGM 로드
            this.bgmList = await this.loadAudioFilesFromFolder('project/audio/bgm');
            console.log('[loadAudioList] BGM 목록 로드 완료:', this.bgmList.length, '개');
            
            // BGS 로드
            this.bgsList = await this.loadAudioFilesFromFolder('project/audio/bgs');
            console.log('[loadAudioList] BGS 목록 로드 완료:', this.bgsList.length, '개');
            
            // SE 로드
            this.seList = await this.loadAudioFilesFromFolder('project/audio/se');
            console.log('[loadAudioList] SE 목록 로드 완료:', this.seList.length, '개');
            
            // ME 로드
            this.meList = await this.loadAudioFilesFromFolder('project/audio/me');
            console.log('[loadAudioList] ME 목록 로드 완료:', this.meList.length, '개');
        } catch (error) {
            console.warn('[loadAudioList] 오디오 목록 로드 실패:', error);
            this.bgmList = [];
            this.bgsList = [];
            this.seList = [];
            this.meList = [];
        }
    }

    async loadAudioFilesFromFolder(folderPath) {
        try {
            const response = await fetch(folderPath + '/');
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            const audioFiles = [];
            const audioExtensions = ['.mp3', '.ogg', '.wav', '.m4a', '.wma'];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const isAudio = audioExtensions.some(ext => href.toLowerCase().endsWith(ext));
                    if (isAudio) {
                        const raw = href.split('/').pop();
                        const decoded = decodeURIComponent(raw);
                        const filename = decoded.replace(/\.(mp3|ogg|wav|m4a|wma)$/i, '');
                        audioFiles.push(filename);
                    }
                }
            });
            
            return audioFiles.sort();
        } catch (error) {
            console.warn(`[loadAudioFilesFromFolder] ${folderPath} 로드 실패:`, error);
            return [];
        }
    }

    async loadSettings() {
        try {
            let settings = null;

            // 1. 서버에서 settings.json 로드 시도
            try {
                const response = await fetch('project/settings.json');
                if (response.ok) {
                    settings = await response.json();
                    console.log('[loadSettings] 서버에서 설정 로드 완료');
                }
            } catch (e) {
                console.log('[loadSettings] 서버 로드 실패, localStorage 확인');
            }

            // 2. 서버 로드 실패시 localStorage 사용
            if (!settings) {
                const stored = localStorage.getItem('editorSettings');
                if (stored) {
                    settings = JSON.parse(stored);
                    console.log('[loadSettings] localStorage에서 설정 로드 완료');
                }
            }

            // 3. 설정 적용
            if (settings) {
                this.applySettings(settings);
            } else {
                console.log('[loadSettings] 저장된 설정 없음, 기본값 사용');
            }
        } catch (error) {
            console.error('[loadSettings] 설정 로드 중 오류:', error);
        }
    }

    // 설정 적용
    applySettings(settings) {
        if (settings.fontsize) {
            const slider = document.getElementById('inspector-font-size');
            const display = document.getElementById('font-size-display');
            const inspector = document.getElementById('inspector-main');
            const fontsize = parseInt(settings.fontsize);
            
            console.log('[applySettings] 폰트 크기 적용:', fontsize);
            
            if (slider) {
                slider.value = fontsize;
                console.log('[applySettings] 슬라이더 값 설정:', fontsize);
            }
            
            if (display) {
                display.textContent = `${fontsize}px`;
            }
            
            // 인스펙터 요소가 존재하면 실제 폰트 크기 적용
            if (inspector && this.eventManager && typeof this.eventManager.setInspectorFontSize === 'function') {
                this.eventManager.setInspectorFontSize(fontsize);
                console.log('[applySettings] 인스펙터에 폰트 크기 적용 완료:', fontsize);
            } else {
                console.warn('[applySettings] 인스펙터 또는 eventManager 사용 불가');
            }
        }
        console.log('[applySettings] 설정 적용 완료');
    }

    // 개별 설정 저장
    async updateSetting(key, value) {
        // 기존 설정 로드
        let settings = {};
        const stored = localStorage.getItem('editorSettings');
        if (stored) {
            settings = JSON.parse(stored);
        }

        // 새 값 업데이트
        settings[key] = value;

        // 저장
        await this.saveSettings(settings);
    }

    async loadImages(){
        await this.loadTilesetImages()
        await this.loadAllCharacterImages()
    }

    async loadTilesetImages() {
        const tilesetRes = await fetch('project/data/Tilesets.json');
        this.tilesets = await tilesetRes.json();

        for (let tileset of this.tilesets) {
            if (!tileset) continue;

            const names = tileset.tilesetNames;
            const promises = names.map((name) => {
                if (!name) return Promise.resolve(null);

                if (this.images.has(name)) {
                    return Promise.resolve(this.images.get(name));
                }

                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = `project/img/tilesets/${name}.png`;
                    img.onload = () => {
                        this.images.set(name, img);
                        resolve(img);
                    };
                    img.onerror = () => {
                        console.error(`Failed to load: ${name}`);
                        resolve(null);
                    };
                });
            });

            await Promise.all(promises);
        }
    }

    async loadAllCharacterImages() {
        try {
            // 1. 서버에서 characters 디렉토리의 모든 파일 목록 조회
            const res = await fetch('project/img/characters/');
            const html = await res.text();

            // 2. HTML에서 파일명 추출 (간단한 정규표현식 사용)
            const fileRegex = /href=["']([^"']+\.png)["']/gi;
            const matches = html.matchAll(fileRegex);
            // href에서 추출된 경로에서 파일명만 추출 (마지막 / 이후 부분)
            const fileNames = Array.from(matches)
                .map(match => {
                    const raw = match[1].split('/').pop();
                    return decodeURIComponent(raw);
                })
                .filter(name => name && name.length > 0);

            // 3. 각 이미지 파일을 병렬로 로드
            if (fileNames.length > 0) {
                const promises = fileNames.map(fileName => 
                    this.loadCharacterImage(fileName)
                );
                await Promise.all(promises);
                console.log(`${fileNames.length}개의 캐릭터 이미지가 로드되었습니다.`);
            } else {
                console.warn('캐릭터 이미지를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.warn('캐릭터 이미지 자동 로드 실패 (서버에서 디렉토리 조회를 지원하지 않음):', error);
            // Fallback: 특정 캐릭터 이미지만 수동으로 로드
            const defaultCharacters = ['actor1', 'actor2', 'actor3', 'actor4', 'ParSL'];
            const promises = defaultCharacters.map(name => 
                this.loadCharacterImage(name)
            );
            await Promise.all(promises);
            console.log(`[loadAllCharacterImages Fallback] 로드된 이미지 목록:`, Array.from(this.images.keys()));
        }
    }

    async loadCharacterImage(name) {
        // 확장자 제거한 이름으로 저장될 키 생성
        const nameWithoutExt = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
        
        if (!nameWithoutExt) {
            console.warn(`[loadCharacterImage] 유효하지 않은 이름: ${name}`);
            return Promise.resolve(null);
        }
        
        if (this.images.has(nameWithoutExt)) {
            console.log(`[loadCharacterImage] 이미 로드됨: ${nameWithoutExt}`);
            return Promise.resolve(this.images.get(nameWithoutExt));
        }

        return new Promise((resolve) => {
            const img = new Image();
            // 로드할 때는 확장자 추가
            const imagePath = name.includes('.') ? name : name + '.png';
            img.src = `project/img/characters/${imagePath}`;
            img.onload = () => {
                // 확장자 없이 저장
                this.images.set(nameWithoutExt, img);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`[loadCharacterImage] 로드 실패: ${nameWithoutExt} (경로: project/img/characters/${imagePath})`);
                resolve(null);
            };
        });
    }

    loadMap(id) {
        this.map = this.mapDatas[id]
        if (this.map) {
            this.map.id = id; // 맵 객체에 ID 추가
        }
        this.mapInfo = this.mapInfos.find(m => m && m.id === id)
        
        this.mapManager.loadMap(this.map)

        // 맵 로드 후 캔버스 크기가 확정되면 오버레이 캔버스 크기 조정
        this.editorUI.updateMouseOverlay()
        this.eventManager.loadEvent(this.map)
        
        // 맵 정보 및 줌 레벨 표시
        this.editorUI.updateZoomDisplay();
        
        // 리스트에서 선택 상태 표시를 위해 리렌더링
        this.editorUI.renderMapList();
        this.editorUI.drawTileset();
        
        // 현재 맵 ID를 localStorage에 저장
        localStorage.setItem('lastMapId', id);
    }
}

class EditorUI {
    constructor() {
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
    }

    // script/main.js 내 EditorUI 클래스에 추가/수정

    init() {
        this.initMouseOverlay();
        this.initTilesetEvents();
        this.initTabEvents();
        this.initLayerEvents();
        this.initToolEvents();
        this.initMapPaintEvents();
        this.drawTileset(this.selectedTilesetTab);
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
    
    // 맵 변환 적용
    applyMapTransform() {
        const container = document.getElementById('map-grid-container');
        if (container) {
            container.style.transform = `scale(${this.mapZoom}) translate(${this.mapPanX}px, ${this.mapPanY}px)`;
            container.style.transformOrigin = '0 0';
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

    drawTileset(tabName) {
        tabName = tabName || this.selectedTilesetTab
        
        // A 탭은 특수 처리
        if (tabName === 'A') {
            this.drawAutotileset();
            return;
        }
        
        const canvas = document.getElementById('tileset-canvas');
        const ctx = canvas.getContext('2d');
        const TILE_SIZE = 48;
        const COLUMNS = 8; // 가로 8칸 고정
        const CANVAS_WIDTH = TILE_SIZE * COLUMNS; // 384px

        // 현재 맵의 타일셋 데이터 가져오기
        const tileset = main.mapManager.tileset;
        if (!tileset) return;

        // 탭 이름에 따른 인덱스 설정
        let imgIndex = 0;
        if (tabName === 'B') imgIndex = 5;
        if (tabName === 'C') imgIndex = 6;
        if (tabName === 'D') imgIndex = 7;
        if (tabName === 'E') imgIndex = 8;

        const img = main.images.get(tileset.tilesetNames[imgIndex]);

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
    drawAutotileset() {
        const canvas = document.getElementById('tileset-canvas');
        const ctx = canvas.getContext('2d');
        const TILE_SIZE = 48;
        const tileset = main.mapManager.tileset;
        if (!tileset) return;

        // A1-A5 이미지 로드
        const imgA1 = main.images.get(tileset.tilesetNames[0]);
        const imgA2 = main.images.get(tileset.tilesetNames[1]);
        const imgA3 = main.images.get(tileset.tilesetNames[2]);
        const imgA4 = main.images.get(tileset.tilesetNames[3]);
        const imgA5 = main.images.get(tileset.tilesetNames[4]);

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

    // R 탭 (지역번호) 그리기
    drawRegionTileset() {
        const canvas = document.getElementById('tileset-canvas');
        const ctx = canvas.getContext('2d');
        const TILE_SIZE = 48;
        
        // 16x16 그리드 (256칸, 0~255)
        canvas.width = 16 * TILE_SIZE;
        canvas.height = 16 * TILE_SIZE;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 색상 배열 (빨주노연초청하파남보자핑)
        const colors = [
            '#FF0000', // 빨
            '#FF7F00', // 주
            '#FFFF00', // 노
            '#7FFF00', // 연
            '#00FFFF', // 초
            '#0000FF', // 청
            '#4B0082', // 하
            '#9400D3', // 파
            '#8B0000', // 남
            '#9370DB', // 보
            '#800080', // 자
            '#FF69B4'  // 핑
        ];
        
        // 1~255 타일 그리기 (0은 비워둠)
        for (let i = 1; i <= 255; i++) {
            const x = (i % 16);
            const y = Math.floor(i / 16);
            const dx = x * TILE_SIZE;
            const dy = y * TILE_SIZE;
            
            // 색상 배경
            const colorIdx = (i - 1) % colors.length;
            ctx.fillStyle = colors[colorIdx];
            ctx.fillRect(dx + 2, dy + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            
            // 숫자 표시
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i.toString(), dx + TILE_SIZE / 2, dy + TILE_SIZE / 2);
        }
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

    updateTilesetSelection(x1, y1, x2, y2) {
        const selectionRect = document.getElementById('tileset-selection-rect');

        // 시작점과 끝점 중 작은 값을 왼쪽 위 좌표로 사용
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const right = Math.max(x1, x2);
        const bottom = Math.max(y1, y2);

        const width = (right - left + 1);
        const height = (bottom - top + 1);

        // 시각적 업데이트
        selectionRect.style.display = 'block';
        selectionRect.style.left = (left * 48 - 2) + 'px'; // 테두리 두께 보정
        selectionRect.style.top = (top * 48 - 2) + 'px';
        selectionRect.style.width = (width * 48) + 'px';
        selectionRect.style.height = (height * 48) + 'px';

        // 선택된 타일 정보 저장 (다중 타일 지원)
        this.selectedTile = {
            tab: this.selectedTilesetTab,
            x: left,
            y: top,
            w: width,
            h: height
        };

        // A 탭인 경우 섹션 정보 추가
        if (this.selectedTilesetTab === 'A') {
            this.selectedTile.aSection = this.determineASection(top);
        }

        // R 탭(리전)인 경우 regionId 추가
        if (this.selectedTilesetTab === 'R') {
            const regionId = top * 8 + left + 1; // 1-255 범위
            if (regionId >= 1 && regionId <= 255) {
                this.selectedTile.regionId = regionId;
            }
        }
    }

    // A 탭에서 선택한 Y 좌표로 A1/A2/A3/A4/A5 섹션 판단
    determineASection(y) {
        const tileset = main.mapManager.tileset;
        if (!tileset) return 'A5';

        const imgA1 = main.images.get(tileset.tilesetNames[0]);
        const imgA2 = main.images.get(tileset.tilesetNames[1]);
        const imgA3 = main.images.get(tileset.tilesetNames[2]);
        const imgA4 = main.images.get(tileset.tilesetNames[3]);

        let currentRow = 0;
        
        // A1: 2행
        if (imgA1) {
            if (y < currentRow + 2) {
                return { section: 'A1', localY: y - currentRow };
            }
            currentRow += 2;
        }
        
        // A2: 4행
        if (imgA2) {
            if (y < currentRow + 4) {
                return { section: 'A2', localY: y - currentRow };
            }
            currentRow += 4;
        }
        
        // A3: 4행
        if (imgA3) {
            if (y < currentRow + 4) {
                return { section: 'A3', localY: y - currentRow };
            }
            currentRow += 4;
        }
        
        // A4: 6행
        if (imgA4) {
            if (y < currentRow + 6) {
                return { section: 'A4', localY: y - currentRow };
            }
            currentRow += 6;
        }
        
        // A5: 나머지
        return { section: 'A5', localY: y - currentRow };
    }

    // 맵 리스트
    renderMapList() {
        const mapListElement = document.getElementById('map-list');
        if (!mapListElement) return;
        mapListElement.innerHTML = '';

        // 1. main.mapInfos 원본을 정렬 (정렬은 표시 순서를 위해 필요)
        const validInfos = main.mapInfos.filter(info => info !== null)
            .sort((a, b) => a.order - b.order);

        // 2. 트리 구조 생성 (원본 객체 참조 유지)
        const tree = this.buildMapTree(validInfos);

        // 3. 재귀적으로 DOM 생성
        const fragment = document.createDocumentFragment();
        tree.forEach(node => {
            fragment.appendChild(this.createMapNodeElement(node));
        });
        mapListElement.appendChild(fragment);
    }

    buildMapTree(infos) {
        const map = {};
        const roots = [];

        // 원본 객체에 직접 children 배열을 연결
        infos.forEach(info => {
            map[info.id] = info;
            map[info.id].children = [];
        });

        infos.forEach(info => {
            if (info.parentId !== 0 && map[info.parentId]) {
                map[info.parentId].children.push(map[info.id]);
            } else {
                roots.push(map[info.id]);
            }
        });
        return roots;
    }

    createMapNodeElement(node) {
        const container = document.createElement('div');
        container.className = 'map-node-container';

        const item = document.createElement('div');
        item.className = 'map-item';
        item.dataset.id = node.id;
        
        // 드래그 가능하도록 설정
        item.draggable = true;

        // --- 우클릭(컨텍스트 메뉴) 이벤트 추가 ---
        item.oncontextmenu = (e) => {
            e.preventDefault();   // 브라우저 기본 메뉴 방지
            e.stopPropagation();  // 상위 노드로 이벤트 전파 방지

            // 우클릭으로도 해당 맵을 선택하고 로드하도록 함
            if (typeof main.loadMap === 'function') main.loadMap(node.id);

            // 메뉴를 표시하는 함수 호출 (좌표와 노드 정보를 넘김)
            this.showMapContextMenu(e.pageX, e.pageY, node);
        };
        
        // 드래그 시작
        item.ondragstart = (e) => {
            e.stopPropagation();
            this.draggedMapId = node.id;
            item.style.opacity = '0.5';
        };
        
        // 드래그 종료
        item.ondragend = (e) => {
            item.style.opacity = '1';
            this.clearMapDropIndicator();
        };
        
        // 드래그 오버 (0.5 그리드 표시)
        item.ondragover = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.draggedMapId === node.id) return;
            
            const rect = item.getBoundingClientRect();
            const mouseY = e.clientY;
            const itemTop = rect.top;
            const itemHeight = rect.height;
            const relativeY = mouseY - itemTop;
            
            // 상단 1/3: 위에 삽입, 중간 1/3: 자식으로, 하단 1/3: 아래에 삽입
            if (relativeY < itemHeight / 3) {
                this.showMapDropIndicator(item, 'before');
                this.dropPosition = { targetId: node.id, position: 'before' };
            } else if (relativeY > itemHeight * 2 / 3) {
                this.showMapDropIndicator(item, 'after');
                this.dropPosition = { targetId: node.id, position: 'after' };
            } else {
                this.showMapDropIndicator(item, 'child');
                this.dropPosition = { targetId: node.id, position: 'child' };
            }
        };
        
        // 드롭
        item.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!this.draggedMapId || !this.dropPosition) return;
            
            this.moveMapNode(this.draggedMapId, this.dropPosition);
            this.draggedMapId = null;
            this.dropPosition = null;
            this.clearMapDropIndicator();
        };

        // main 전역 변수의 map 참조
        if (main.map && main.map.id === node.id) {
            item.classList.add('selected');
        }

        const toggle = document.createElement('span');
        toggle.className = 'toggle-icon';

        if (node.children && node.children.length > 0) {
            if (node.expanded === undefined) node.expanded = true;
            toggle.innerText = node.expanded ? '▼' : '▶';
            toggle.onclick = (e) => {
                e.stopPropagation();
                node.expanded = !node.expanded;
                this.renderMapList();
            };
        } else {
            toggle.style.visibility = 'hidden';
        }

        const label = document.createElement('span');
        label.className = 'map-label';
        label.innerText = `${node.id.toString().padStart(3, '0')}: ${node.name}`;

        item.appendChild(toggle);
        item.appendChild(label);

        item.onclick = () => main.loadMap(node.id);
        container.appendChild(item);

        if (node.children && node.children.length > 0 && node.expanded) {
            const childGroup = document.createElement('div');
            childGroup.className = 'map-children';
            node.children.forEach(child => {
                childGroup.appendChild(this.createMapNodeElement(child));
            });
            container.appendChild(childGroup);
        }

        return container;
    }

    showMapContextMenu(x, y, node) {
        let menu = document.getElementById('map-context-menu');
        if (menu) menu.remove();
        console.log("close")

        menu = document.createElement('div');
        menu.id = 'map-context-menu';
        // 에디터 스타일 CSS
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
            minWidth: '120px'
        });

        const options = [
            {
                label: '편집...',
                action: () => this.openEditModal(node)
            },
            { 
                label: '신규', 
                action: () => this.createNewChildMap(node.id) 
            },
            { 
                label: '복사', 
                action: () => this.copyMap(node.id) 
            },
            { 
                label: '붙여넣기', 
                action: () => this.pasteMap(node.id),
                disabled: !this.mapClipboard
            },
            { 
                label: '삭제', 
                action: () => this.deleteMap(node.id), 
                color: '#ff6666' 
            }
        ];

        options.forEach(opt => {
            const div = document.createElement('div');
            div.innerText = opt.label;
            Object.assign(div.style, {
                padding: '6px 20px',
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                color: opt.disabled ? '#666' : (opt.color || '#eee')
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

        // 다른 곳 클릭 시 메뉴 닫기
        setTimeout(() => {
            const closeMenu = (e) => {
        console.log("close")
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    createNewChildMap(parentId) {
        // 새 맵 ID 찾기
        let newId = 1;
        while (main.mapInfos.find(m => m && m.id === newId)) {
            newId++;
        }

        // 새 맵 정보 생성
        const newMapInfo = {
            id: newId,
            expanded: false,
            name: `새 맵 ${newId}`,
            order: newId,
            parentId: parentId,
            scrollX: 0,
            scrollY: 0
        };

        // 기본 맵 데이터 생성
        const defaultWidth = 17;
        const defaultHeight = 13;
        const newMapData = {
            autoplayBgm: false,
            autoplayBgs: false,
            battleback1Name: "",
            battleback2Name: "",
            bgm: { name: "", pan: 0, pitch: 100, volume: 90 },
            bgs: { name: "", pan: 0, pitch: 100, volume: 90 },
            disableDashing: false,
            displayName: "",
            encounterList: [],
            encounterStep: 30,
            height: defaultHeight,
            width: defaultWidth,
            note: "",
            parallaxLoopX: false,
            parallaxLoopY: false,
            parallaxName: "",
            parallaxShow: true,
            parallaxSx: 0,
            parallaxSy: 0,
            scrollType: 0,
            specifyBattleback: false,
            tilesetId: 1,
            data: new Array(defaultWidth * defaultHeight * 6).fill(0),
            events: [null] // 0번 인덱스는 null
        };

        // 데이터 추가
        main.mapInfos.push(newMapInfo);
        main.mapDatas[newId] = newMapData;

        // 맵 목록 갱신
        this.renderMapList();

        // 바로 편집 모달 열기
        this.openEditModal({ id: newId, name: newMapInfo.name });
    }

    copyMap(mapId) {
        const mapInfo = main.mapInfos.find(m => m && m.id === mapId);
        const mapData = main.mapDatas[mapId];

        if (mapInfo && mapData) {
            // 클립보드에 저장 (깊은 복사)
            this.mapClipboard = {
                info: JSON.parse(JSON.stringify(mapInfo)),
                data: JSON.parse(JSON.stringify(mapData))
            };
            console.log(`${mapId}번 맵이 복사되었습니다.`);
        }
    }

    pasteMap(parentId) {
        if (!this.mapClipboard) {
            console.log('복사된 맵이 없습니다.');
            return;
        }

        // 새 맵 ID 찾기
        let newId = 1;
        while (main.mapInfos.find(m => m && m.id === newId)) {
            newId++;
        }

        // 복사본 생성
        const newMapInfo = JSON.parse(JSON.stringify(this.mapClipboard.info));
        newMapInfo.id = newId;
        newMapInfo.name = newMapInfo.name + ' (복사본)';
        newMapInfo.parentId = parentId;
        newMapInfo.order = newId;

        const newMapData = JSON.parse(JSON.stringify(this.mapClipboard.data));

        // 데이터 추가
        main.mapInfos.push(newMapInfo);
        main.mapDatas[newId] = newMapData;

        // 맵 목록 갱신
        this.renderMapList();

        console.log(`${newId}번 맵으로 붙여넣기 완료`);
    }

    deleteMap(mapId) {
        if (mapId === 0) {
            alert('루트는 삭제할 수 없습니다.');
            return;
        }

        const mapInfo = main.mapInfos.find(m => m && m.id === mapId);
        if (!mapInfo) return;

        // 자식 맵이 있는지 확인
        const hasChildren = main.mapInfos.some(m => m && m.parentId === mapId);
        const confirmMsg = hasChildren 
            ? `'${mapInfo.name}' 맵과 하위 맵들을 모두 삭제하시겠습니까?`
            : `'${mapInfo.name}' 맵을 삭제하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        // 재귀적으로 자식 맵 삭제
        const deleteRecursive = (id) => {
            // 자식 맵 먼저 삭제
            const children = main.mapInfos.filter(m => m && m.parentId === id);
            children.forEach(child => deleteRecursive(child.id));

            // 현재 맵 삭제
            const index = main.mapInfos.findIndex(m => m && m.id === id);
            if (index !== -1) {
                main.mapInfos.splice(index, 1);
            }
            delete main.mapDatas[id];
        };

        deleteRecursive(mapId);

        // 현재 로드된 맵이 삭제된 경우 빈 맵으로
        if (main.map && main.map.id === mapId) {
            main.map = null;
            main.mapManager.renderMap();
        }

        // 맵 목록 갱신
        this.renderMapList();

        console.log(`${mapId}번 맵이 삭제되었습니다.`);
    }

    openEditModal(node) {
        // 1. 기존 모달이 있으면 제거
        if (document.getElementById('edit-modal')) {
            document.getElementById('edit-modal').remove();
        }

        // 맵 데이터 가져오기
        const mapData = main.mapDatas[node.id];
        const currentTilesetId = mapData ? mapData.tilesetId : 1;
        const currentWidth = mapData ? mapData.width : 17;
        const currentHeight = mapData ? mapData.height : 13;

        // 2. 모달 HTML 구조 생성
        const modal = document.createElement('div');
        modal.id = 'edit-modal';
        Object.assign(modal.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '10001'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            backgroundColor: '#2b2b2b', color: '#eee', padding: '20px',
            borderRadius: '4px', border: '1px solid #555', width: '400px'
        });

        // 타일셋 옵션 생성
        let tilesetOptions = '';
        main.tilesets.forEach((ts, idx) => {
            if (ts) {
                const selected = idx === currentTilesetId ? 'selected' : '';
                tilesetOptions += `<option value="${idx}" ${selected}>${ts.name}</option>`;
            }
        });

        content.innerHTML = `
        <h3 style="margin-top: 0;">맵 속성 편집</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 12px;">이름:</label>
            <input type="text" id="new-map-name" value="${node.name}" 
                style="width: 100%; background: #1a1a1a; border: 1px solid #444; color: white; padding: 5px; box-sizing: border-box;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 12px;">타일셋:</label>
            <select id="new-map-tileset" 
                style="width: 100%; background: #1a1a1a; border: 1px solid #444; color: white; padding: 5px; box-sizing: border-box;">
                ${tilesetOptions}
            </select>
        </div>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">넓이:</label>
                <input type="number" id="new-map-width" value="${currentWidth}" min="1" max="999"
                    style="width: 100%; background: #1a1a1a; border: 1px solid #444; color: white; padding: 5px; box-sizing: border-box;">
            </div>
            <div style="flex: 1;">
                <label style="display: block; margin-bottom: 5px; font-size: 12px;">높이:</label>
                <input type="number" id="new-map-height" value="${currentHeight}" min="1" max="999"
                    style="width: 100%; background: #1a1a1a; border: 1px solid #444; color: white; padding: 5px; box-sizing: border-box;">
            </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancel-edit" style="padding: 5px 15px; cursor: pointer; background: #444; color: white; border: none;">취소</button>
            <button id="save-edit" style="padding: 5px 15px; cursor: pointer; background: #3a5a3a; color: white; border: none;">확인</button>
        </div>
    `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // 3. 이벤트 연결
        const input = document.getElementById('new-map-name');
        input.focus();
        input.select(); // 텍스트 전체 선택

        // 저장 버튼 클릭 시
        document.getElementById('save-edit').onclick = () => {
            const newName = input.value.trim();
            const newTilesetId = parseInt(document.getElementById('new-map-tileset').value);
            const newWidth = parseInt(document.getElementById('new-map-width').value);
            const newHeight = parseInt(document.getElementById('new-map-height').value);
            
            if (newName && newWidth > 0 && newHeight > 0) {
                this.updateMapProperties(node.id, newName, newTilesetId, newWidth, newHeight);
                modal.remove();
            }
        };

        // 취소 버튼 클릭 시
        document.getElementById('cancel-edit').onclick = () => modal.remove();
        
        // ESC 키로 닫기
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.remove();
        });
    }

    updateMapProperties(mapId, newName, newTilesetId, newWidth, newHeight) {
        // 1. main.mapInfos(원본 데이터)에서 해당 맵 찾기
        const mapInfo = main.mapInfos.find(info => info && info.id === mapId);

        if (mapInfo) {
            mapInfo.name = newName; // 이름 변경
            
            // 2. 맵 데이터 업데이트
            const mapData = main.mapDatas[mapId];
            if (mapData) {
                const oldWidth = mapData.width;
                const oldHeight = mapData.height;
                
                mapData.tilesetId = newTilesetId;
                mapData.width = newWidth;
                mapData.height = newHeight;
                
                // 맵 크기가 변경되면 데이터 배열도 재생성
                if (oldWidth !== newWidth || oldHeight !== newHeight) {
                    const newData = new Array(newWidth * newHeight * 6).fill(0);
                    
                    // 기존 데이터 복사 (범위 내에서)
                    const copyWidth = Math.min(oldWidth, newWidth);
                    const copyHeight = Math.min(oldHeight, newHeight);
                    
                    for (let z = 0; z < 6; z++) {
                        for (let y = 0; y < copyHeight; y++) {
                            for (let x = 0; x < copyWidth; x++) {
                                const oldIndex = (z * oldHeight + y) * oldWidth + x;
                                const newIndex = (z * newHeight + y) * newWidth + x;
                                newData[newIndex] = mapData.data[oldIndex] || 0;
                            }
                        }
                    }
                    
                    mapData.data = newData;
                }
            }

            // 3. 만약 현재 로드된 맵이라면 다시 로드
            if (main.map && main.map === mapData) {
                main.loadMap(mapId);
            }

            // 4. 좌측 맵 목록 다시 그리기
            this.renderMapList();

            console.log(`${mapId}번 맵 속성이 변경되었습니다.`);
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
    
    // 드롭 인디케이터 표시
    showMapDropIndicator(element, position) {
        // 기존 인디케이터 제거
        this.clearMapDropIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'map-drop-indicator';
        indicator.style.position = 'absolute';
        indicator.style.backgroundColor = '#f1c40f'; // 노란색
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '1000';
        
        const rect = element.getBoundingClientRect();
        
        if (position === 'before') {
            // 위에 선 표시
            indicator.style.left = rect.left + 'px';
            indicator.style.top = rect.top + 'px';
            indicator.style.width = rect.width + 'px';
            indicator.style.height = '2px';
        } else if (position === 'after') {
            // 아래에 선 표시
            indicator.style.left = rect.left + 'px';
            indicator.style.top = (rect.bottom - 2) + 'px';
            indicator.style.width = rect.width + 'px';
            indicator.style.height = '2px';
        } else if (position === 'child') {
            // 전체 하이라이트
            indicator.style.left = rect.left + 'px';
            indicator.style.top = rect.top + 'px';
            indicator.style.width = rect.width + 'px';
            indicator.style.height = rect.height + 'px';
            indicator.style.backgroundColor = 'rgba(241, 196, 15, 0.3)';
            indicator.style.border = '2px solid #f1c40f';
        }
        
        document.body.appendChild(indicator);
    }
    
    // 드롭 인디케이터 제거
    clearMapDropIndicator() {
        const indicator = document.getElementById('map-drop-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // 맵 노드 이동
    moveMapNode(draggedId, dropInfo) {
        const { targetId, position } = dropInfo;
        
        if (draggedId === targetId) return;
        
        const draggedMap = main.mapInfos.find(m => m && m.id === draggedId);
        const targetMap = main.mapInfos.find(m => m && m.id === targetId);
        
        if (!draggedMap || !targetMap) return;
        
        // 자신의 자손에게는 이동 불가
        if (this.isDescendant(draggedId, targetId)) {
            alert('맵을 자신의 자손으로 이동할 수 없습니다.');
            return;
        }
        
        if (position === 'child') {
            // 자식으로 이동
            draggedMap.parentId = targetId;
            // order는 마지막으로
            const siblings = main.mapInfos.filter(m => m && m.parentId === targetId && m.id !== draggedId);
            draggedMap.order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;
        } else {
            // before 또는 after: 형제로 이동
            draggedMap.parentId = targetMap.parentId;
            
            // 같은 부모의 형제들 가져오기
            const siblings = main.mapInfos
                .filter(m => m && m.parentId === targetMap.parentId)
                .sort((a, b) => a.order - b.order);
            
            // 타겟의 order 찾기
            const targetIndex = siblings.findIndex(s => s.id === targetId);
            
            if (position === 'before') {
                // 타겟 앞에 삽입
                const newOrder = targetIndex > 0 ? siblings[targetIndex - 1].order + 1 : targetMap.order - 1;
                draggedMap.order = newOrder;
            } else {
                // 타겟 뒤에 삽입
                const newOrder = targetIndex < siblings.length - 1 ? siblings[targetIndex + 1].order - 1 : targetMap.order + 1;
                draggedMap.order = newOrder;
            }
            
            // order 재정렬
            this.reorderMaps(draggedMap.parentId);
        }
        
        // 리렌더링
        this.renderMapList();
        console.log(`맵 ${draggedId}를 ${targetId} ${position}로 이동`);
    }
    
    // 자손 체크 (순환 참조 방지)
    isDescendant(ancestorId, descendantId) {
        let current = main.mapInfos.find(m => m && m.id === descendantId);
        while (current && current.parentId !== 0) {
            if (current.parentId === ancestorId) return true;
            current = main.mapInfos.find(m => m && m.id === current.parentId);
        }
        return false;
    }
    
    // 같은 부모의 맵들 order 재정렬
    reorderMaps(parentId) {
        const siblings = main.mapInfos
            .filter(m => m && m.parentId === parentId)
            .sort((a, b) => a.order - b.order);
        
        siblings.forEach((map, index) => {
            map.order = index;
        });
    }
}

/** @type {EditorMain} */
var main
/** @type {EventManager} */
var em
// 에디터 실행
window.onload = () => {
    window.main = new EditorMain();
    window.em = main.eventManager
};