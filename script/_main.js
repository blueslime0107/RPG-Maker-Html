
class EditorMain {
    constructor() {
        this.tilesetData = null;

        this.map = null;
        this.mapInfo = null;
        this.images = new Map();

        this.mapInfos = [];
        this.mapDatas = {}
        this.tilesets = []
1
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
        this.mapInfo = this.mapInfos[id]
        this.mapManager.loadMap(this.map)
        this.eventManager.loadEvent(this.map)

        // 현재 맵 ID를 localStorage에 저장
        localStorage.setItem('lastMapId', id);

        // 오버레이 캔버스 크기 조정 로직 포함
        this.editorUI.updateMouseOverlay()

        const mapInfo = this.mapInfos.find(m => m && m.id === id);
        document.getElementById('map-info').innerText =
            `${mapInfo ? mapInfo.name : 'Unknown'} (${this.map.width}x${this.map.height})`;
        // 리스트에서 선택 상태 표시를 위해 리렌더링
        this.editorUI.renderMapList();
        this.editorUI.drawTileset()
    }
}

class EditorUI {
    constructor() {
        this.selectedTile = null
        this.selectedTilesetTab = 'A'
        this.canvas = document.getElementById('map-canvas');
        this.overlay = document.getElementById('map-overlay-canvas');
        
        // 인스펙터 리사이저 초기화
        this.initInspectorResizer();
    }

    // script/main.js 내 EditorUI 클래스에 추가/수정

    init() {
        this.initMouseOverlay();
        this.initTilesetEvents();
        this.initTabEvents();
        this.initMapPaintEvents();
        this.drawTileset(this.selectedTilesetTab);
    }

    // 인스펙터 리사이저 초기화
    initInspectorResizer() {
        const resizer = document.getElementById('inspector-resizer');
        const inspectorPanel = document.getElementById('inspector-panel');
        let isResizing = false;
        let lastX = 0;

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

    // 타일셋 뷰
    initTabEvents() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // UI 상태 변경
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 타일셋 이미지 변경 및 렌더링 (MapManager에 요청)
                this.selectedTilesetTab = tab.dataset.tab; // A, B, C, D, E
                this.drawTileset();
            });
        });
    }

    drawTileset(tabName) {
        tabName = tabName || this.selectedTilesetTab
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

        // A탭(index 0~4)은 일단 첫 번째(0)를 기준으로 하거나 루프가 필요하지만, 
        // 요청하신 구조에 맞춰 해당 인덱스의 이미지를 가져옵니다.
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

        // --- 우클릭(컨텍스트 메뉴) 이벤트 추가 ---
        item.oncontextmenu = (e) => {
            e.preventDefault();   // 브라우저 기본 메뉴 방지
            e.stopPropagation();  // 상위 노드로 이벤트 전파 방지

            // 메뉴를 표시하는 함수 호출 (좌표와 노드 정보를 넘김)
            this.showMapContextMenu(e.pageX, e.pageY, node);
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
        // 기존 메뉴가 있다면 제거
        let menu = document.getElementById('map-context-menu');
        if (menu) menu.remove();

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
                action: () => this.openEditModal(node) // 편집창을 여는 함수 호출
            },
            { label: '복사', action: () => console.log('복사:', node.id) },
            { label: '삭제', action: () => console.log('삭제:', node.id), color: '#ff6666' }
        ];

        options.forEach(opt => {
            const div = document.createElement('div');
            div.innerText = opt.label;
            Object.assign(div.style, {
                padding: '6px 20px',
                cursor: 'pointer'
            });
            if (opt.color) div.style.color = opt.color;

            div.onmouseover = () => div.style.backgroundColor = '#444';
            div.onmouseout = () => div.style.backgroundColor = 'transparent';
            div.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation(); console.log("click");
                if (typeof opt.action === 'function') {
                    opt.action();
                }
                menu.remove();
            };
            menu.appendChild(div);
        });

        document.body.appendChild(menu);

        // 다른 곳 클릭 시 메뉴 닫기
        const closeMenu = () => {
            if (menu) menu.remove();
            document.removeEventListener('mousedown', closeMenu);
        };
        // showMapContextMenu 함수 맨 마지막 부분 수정
        setTimeout(() => {
            const closeMenu = (e) => {
                // 클릭한 대상이 메뉴 내부가 아닐 때만 제거
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    openEditModal(node) {
        // 1. 기존 모달이 있으면 제거
        if (document.getElementById('edit-modal')) {
            document.getElementById('edit-modal').remove();
        }

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
            borderRadius: '4px', border: '1px solid #555', width: '300px'
        });

        content.innerHTML = `
        <h3 style="margin-top: 0;">맵 설정</h3>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-size: 12px;">이름:</label>
            <input type="text" id="new-map-name" value="${node.name}" 
                style="width: 100%; background: #1a1a1a; border: 1px solid #444; color: white; padding: 5px; box-sizing: border-box;">
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
            if (newName) {
                this.updateMapName(node.id, newName);
                modal.remove();
            }
        };

        // 취소 버튼 클릭 시
        document.getElementById('cancel-edit').onclick = () => modal.remove();
    }

    updateMapName(mapId, newName) {
        // 1. main.mapInfos(원본 데이터)에서 해당 맵 찾기
        const mapInfo = main.mapInfos.find(info => info && info.id === mapId);

        if (mapInfo) {
            mapInfo.name = newName; // 이름 변경

            // 2. 만약 현재 로드된 맵과 이름이 같다면 UI 제목 등도 갱신 필요
            if (main.map && main.map.id === mapId) {
                main.map.name = newName;
            }

            // 3. 좌측 맵 목록 다시 그리기
            this.renderMapList();

            console.log(`${mapId}번 맵의 이름이 '${newName}'으로 변경되었습니다.`);
        }
    }

    // 맵 뷰
    // EditorUI 클래스 내의 initMouseOverlay 메서드 수정

    initMouseOverlay() {
        const canvas = this.canvas;
        const overlay = this.overlay;
        const ctx = overlay.getContext('2d');

        canvas.addEventListener('mousemove', (e) => {
            // 1. CSS 등으로 결정된 실제 화면상의 크기를 가져와서 대입
            const rect = canvas.getBoundingClientRect();
            overlay.width = rect.width;
            overlay.height = rect.height;

            // 2. 만약 스타일이 깨진다면 CSS도 강제로 맞춰줍니다
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';
            overlay.style.position = 'absolute';
            overlay.style.top = canvas.offsetTop + 'px';
            overlay.style.left = canvas.offsetLeft + 'px';
            overlay.style.pointerEvents = 'none'; // 중요: 오버레이가 마우스 이벤트를 가로채지 않게 함
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const tileX = Math.floor(x / 48);
            const tileY = Math.floor(y / 48);

            // 1. 오버레이 지우기
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            // 2. 선택된 타일의 크기 가져오기 (없으면 1x1)
            const tw = this.selectedTile ? this.selectedTile.w : 1;
            const th = this.selectedTile ? this.selectedTile.h : 1;

            // 3. 하이라이트 그리기 (선택된 크기만큼)
            ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
            ctx.lineWidth = 2;
            // 외곽선: 선택된 타일 개수만큼 곱해줌
            ctx.strokeRect(tileX * 48, tileY * 48, tw * 48, th * 48);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(tileX * 48, tileY * 48, tw * 48, th * 48);

            // 추가: 다중 선택 시 내부 격자 가이드 (선택 사항)
            if (tw > 1 || th > 1) {
                ctx.beginPath();
                ctx.setLineDash([4, 4]); // 점선
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                // 가로선
                for (let i = 1; i < th; i++) {
                    ctx.moveTo(tileX * 48, (tileY + i) * 48);
                    ctx.lineTo((tileX + tw) * 48, (tileY + i) * 48);
                }
                // 세로선
                for (let i = 1; i < tw; i++) {
                    ctx.moveTo((tileX + i) * 48, tileY * 48);
                    ctx.lineTo((tileX + i) * 48, (tileY + th) * 48);
                }
                ctx.stroke();
                ctx.setLineDash([]); // 점선 초기화
            }
        });

        canvas.addEventListener('mouseleave', () => {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
        });
    }

    updateMouseOverlay() {
        const canvas = document.getElementById('map-canvas');
        const overlay = document.getElementById('map-overlay-canvas');
        if (overlay) {
            overlay.width = canvas.width;
            overlay.height = canvas.height;
        }
    }

    initMapPaintEvents() {
        const canvas = this.canvas;
        let isPainting = false;

        const paint = (e) => {
            if (!this.selectedTile) return; // 선택된 타일이 없으면 무시

            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / 48);
            const y = Math.floor((e.clientY - rect.top) / 48);

            // 맵 범위 체크
            if (x < 0 || x >= main.map.width || y < 0 || y >= main.map.height) return;

            // 이벤트가 있는 위치는 페인팅하지 않음 (드래그 우선)
            const hasEvent = main.eventManager.events.some(ev => ev.x === x && ev.y === y);
            if (hasEvent) return;

            // MapManager에게 타일 데이터 변경 요청 (현재는 간단히 레이어 0번에 그리는 것으로 가정)
            main.mapManager.setTile(x, y, 1, this.selectedTile);
        };

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 왼쪽 클릭만
            
            // 이벤트가 있는 위치는 페인팅 시작하지 않음
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / 48);
            const y = Math.floor((e.clientY - rect.top) / 48);
            const hasEvent = main.eventManager.events.some(ev => ev.x === x && ev.y === y);
            
            if (!hasEvent && this.selectedTile) {
                isPainting = true;
                paint(e);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isPainting) paint(e);
        });

        window.addEventListener('mouseup', () => {
            isPainting = false;
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