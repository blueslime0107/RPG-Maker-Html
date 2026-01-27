
class Main {
    constructor() {

        // 게임 데이터
        this.data = {
            actors: [],
            items: [],
            animations: [],
            tilesets: [],
            commonEvents: [],
            system: {},
            mapInfos: [],
            maps: {}
        }

        this.images = {
            characters: new Map(),
            faces: new Map(),
            parallaxes: new Map(),
            pictures: new Map(),
            system: new Map(),
            tilesets: new Map(),
            titles: new Map()
        }

        this.audios = {
            bgm: new Map(),
            bgs: new Map(),
            me: new Map(),
            se: new Map()
        }

        this.editor = new MainEditor();
        this.init();

        // 상수
        this.TILE_SIZE = 48
    }

    async init() {
        console.log("데이터 불러오는 중...");
        await this.loadResources()
        console.log("설정 불러오는 중...");
        await this.loadEditorSetting()

        this.editor.init()
        this.editor.loadMap(this.loadMapId)
    }

    async loadResources() {
        await this.loadAllDatas();
        await this.loadAllImgandAudio();
    }

    async loadData(fileName){
        const res = await fetch(`project/data/${fileName}.json`);
        const data = await res.json();
        return data
    }
    async loadAllDatas() {
        this.data.mapInfos = await this.loadData('MapInfos');
        this.data.system = await this.loadData('System');
        this.data.actors = await this.loadData('Actors');
        this.data.animations = await this.loadData('Animations');
        this.data.commonEvents = await this.loadData('CommonEvents');
        this.data.items = await this.loadData('Items');
        this.data.tilesets = await this.loadData('Tilesets');
        await Promise.all(this.data.mapInfos.filter(x => x != null).map(async (x) => {
            this.data.maps[x.id] = await this.loadData(`Map${x.id.toString().padStart(3, '0')}`)
        }))
    }
    async loadResource(filePath, extensions){
        try {
            const response = await fetch(`project/${filePath}/`);
            const html = await response.text();
            const parser = new DOMParser();
            const links = parser.parseFromString(html, 'text/html').querySelectorAll('a');

            const resourceMap = new Map();
            const fileList = [];
            
            // 파일명 목록 수집
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const isValid = extensions.some(ext => href.toLowerCase().endsWith(ext));
                    if (isValid) {
                        const raw = href.split('/').pop();
                        const decoded = decodeURIComponent(raw);
                        fileList.push(decoded);
                    }
                }
            });

            // 이미지/오디오 타입 구분
            const isImage = extensions.some(ext => ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext));
            const isAudio = extensions.some(ext => ['.mp3', '.ogg', '.wav', '.m4a', '.wma'].includes(ext));

            // 각 파일을 병렬로 로드
            const promises = fileList.map(file => {
                const nameWithoutExt = file.replace(new RegExp(`(${extensions.map(e => e.replace('.', '\\.')).join('|')})$`, 'i'), '');
                
                return new Promise((resolve) => {
                    if (isImage) {
                        const img = new Image();
                        img.src = `project/${filePath}/${file}`;
                        img.onload = () => {
                            resourceMap.set(nameWithoutExt, img);
                            resolve();
                        };
                        img.onerror = () => {
                            console.warn(`[loadResource] 이미지 로드 실패: ${file}`);
                            resolve();
                        };
                    } else if (isAudio) {
                        const audio = new Audio();
                        audio.src = `project/${filePath}/${file}`;
                        audio.oncanplaythrough = () => {
                            resourceMap.set(nameWithoutExt, audio);
                            resolve();
                        };
                        audio.onerror = () => {
                            console.warn(`[loadResource] 오디오 로드 실패: ${file}`);
                            resolve();
                        };
                    } else {
                        resolve();
                    }
                });
            });

            await Promise.all(promises);
            console.log(`[loadResource] ${filePath} 로드 완료: ${resourceMap.size}개 파일`);
            return resourceMap;
        } catch (error) {
            console.warn(`[loadResource] ${filePath} 로드 실패:`, error);
            return new Map();
        }
    }
    async loadAllImgandAudio(){
        // 이미지
        this.images.characters = await this.loadResource('img/characters',['.png','.jpg'])
        this.images.faces = await this.loadResource('img/faces',['.png','.jpg'])
        this.images.parallaxes = await this.loadResource('img/parallaxes',['.png','.jpg'])
        this.images.pictures = await this.loadResource('img/pictures',['.png','.jpg'])
        this.images.system = await this.loadResource('img/system',['.png','.jpg'])
        this.images.tilesets = await this.loadResource('img/tilesets',['.png','.jpg'])
        this.images.titles = await this.loadResource('img/titles1',['.png','.jpg'])
        // 오디오
        // this.audios.bgm = await this.loadResource('audio/bgm',['.ogg'])
        // this.audios.bgs = await this.loadResource('audio/bgs',['.ogg'])
        // this.audios.me = await this.loadResource('audio/me',['.ogg'])
        // this.audios.se = await this.loadResource('audio/se',['.ogg'])
    }

    async loadEditorSetting(){
        // 마지막으로 본 맵 ID 불러오기
        const lastMapId = localStorage.getItem('lastMapId');
        this.loadMapId = lastMapId ? parseInt(lastMapId) : 1;

        // 기본 폰트 크기 설정 (11px)
        const contentsList = document.getElementById('ins-contents-list');
        contentsList.style.fontSize = '11px';
        const inspectorMain = document.getElementById('inspector-main');
        inspectorMain.style.fontSize = '11px';
    }

    // 프로젝트 저장
    saveProject() {
        console.log('프로젝트 저장 시작...');
        
        // 저장할 파일 목록
        const filesToSave = [];

        // maps키를 제외하고 모든 데이터 저장
        Object.keys(this.data).forEach(dataKey => {
            if (dataKey !== 'maps') {
                filesToSave.push({
                    filename: `${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}.json`,
                    data: this.data[dataKey]
                });
            }
        });
        
        // 2. 모든 맵 데이터 저장
        Object.keys(this.data.maps).forEach(mapId => {
            const mapIdStr = mapId.toString().padStart(3, '0');
            filesToSave.push({
                filename: `Map${mapIdStr}.json`,
                data: this.data.maps[mapId]
            });
        });
        
        // 4. 각 파일 다운로드
        filesToSave.forEach(file => {this.downloadJSON(file.filename, file.data);});
        
        console.log(`${filesToSave.length}개 파일 저장 완료`);
        alert(`${filesToSave.length}개의 데이터 파일이 다운로드되었습니다.\nproject/data/ 폴더에 복사해주세요.`);
    }
    
    // JSON 파일 다운로드 헬퍼
    downloadJSON(filename, data) {
        const json = JSON.stringify(data, null, 0); // 압축된 JSON (줄바꿈 없음)
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

/** @type {Main} */
var main
/** @type {MainEditor} */
var editor
/** @type {EventManager} */
var em
// 에디터 실행
window.onload = () => {
    window.main = new Main();
    window.editor = main.editor;
    window.em = main.eventManager
};