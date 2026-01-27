

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
        // this.initToolbarButtons();
        this.tileEditor.init()
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

    // 데이터베이스 패널 초기화
    initDatabasePanel() {
        const toggleBtn = document.getElementById('database-toggle-btn');
        const closeBtn = document.getElementById('database-close-btn');
        const panel = document.getElementById('database-panel');
        
        if (!toggleBtn || !closeBtn || !panel) return;
        
        // 데이터베이스 열기
        toggleBtn.addEventListener('click', () => {
            this.openDatabasePanel();
        });
        
        // 데이터베이스 닫기 (하단 버튼)
        closeBtn.addEventListener('click', () => {
            this.closeDatabasePanel();
        });
        
        // 탭 전환 이벤트
        const tabButtons = document.querySelectorAll('.db-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchDatabaseTab(btn.dataset.tab);
            });
        });
    }
    
    openDatabasePanel() {
        const panel = document.getElementById('database-panel');
        const toggleBtn = document.getElementById('database-toggle-btn');
        if (!panel) return;
        
        panel.classList.remove('closing');
        panel.style.display = 'flex';
        
        // 톱니 버튼 숨기기
        if (toggleBtn) {
            toggleBtn.classList.add('hidden');
        }
        
        // 현재 활성화된 탭의 데이터 로드
        const activeTab = document.querySelector('.db-tab.active');
        if (activeTab) {
            this.loadDatabaseTabData(activeTab.dataset.tab);
        }
    }
    
    closeDatabasePanel() {
        const panel = document.getElementById('database-panel');
        const toggleBtn = document.getElementById('database-toggle-btn');
        if (!panel) return;
        
        // 닫기 애니메이션 적용
        panel.classList.add('closing');
        
        // 애니메이션 완료 후 숨기기
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('closing');
            
            // 톱니 버튼 다시 표시
            if (toggleBtn) {
                toggleBtn.classList.remove('hidden');
            }
        }, 300);
    }
    
    switchDatabaseTab(tabName) {
        // 탭 버튼 활성화 상태 변경
        const tabButtons = document.querySelectorAll('.db-tab');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 탭 컨텐츠 표시 변경
        const tabContents = document.querySelectorAll('.db-tab-content');
        tabContents.forEach(content => {
            if (content.id === `db-${tabName}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // 해당 탭의 데이터 로드
        this.loadDatabaseTabData(tabName);
    }
    
    loadDatabaseTabData(tabName) {
        switch(tabName) {
            case 'resources':
                this.loadResourcesTab();
                break;
            case 'actors':
                this.loadActorsTab();
                break;
            case 'items':
                this.loadItemsTab();
                break;
            case 'animations':
                this.loadAnimationsTab();
                break;
            case 'tilesets':
                this.loadTilesetsTab();
                break;
            case 'commonevents':
                this.loadCommonEventsTab();
                break;
            case 'system':
                this.loadSystemTab();
                break;
        }
    }
    
    loadResourcesTab() {
        // 서브탭 전환 이벤트 초기화
        this.initResourceSubtabs();
        
        // 기본적으로 이미지 탭 로드
        this.loadImagesSubtab();
    }
    
    loadActorsTab() {
        const list = document.getElementById('db-actors-list');
        if (!list || !main.actorsData) return;
        
        list.innerHTML = '';
        main.actorsData.forEach((actor, index) => {
            if (!actor || index === 0) return; // null이거나 인덱스 0은 스킵
            
            const item = document.createElement('div');
            item.className = 'db-list-item';
            item.innerHTML = `
                <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                <span class="db-list-item-name">${actor.name || '(이름 없음)'}</span>
            `;
            list.appendChild(item);
        });
    }
    
    loadItemsTab() {
        const list = document.getElementById('db-items-list');
        if (!list || !main.itemsData) return;
        
        list.innerHTML = '';
        main.itemsData.forEach((item, index) => {
            if (!item || index === 0) return;
            
            const elem = document.createElement('div');
            elem.className = 'db-list-item';
            elem.innerHTML = `
                <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                <span class="db-list-item-name">${item.name || '(이름 없음)'}</span>
            `;
            list.appendChild(elem);
        });
    }
    
    loadAnimationsTab() {
        const list = document.getElementById('db-animations-list');
        if (!list || !main.animationsData) return;
        
        list.innerHTML = '';
        main.animationsData.forEach((anim, index) => {
            if (!anim || index === 0) return;
            
            const item = document.createElement('div');
            item.className = 'db-list-item';
            item.innerHTML = `
                <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                <span class="db-list-item-name">${anim.name || '(이름 없음)'}</span>
            `;
            list.appendChild(item);
        });
    }
    
    loadTilesetsTab() {
        const list = document.getElementById('db-tilesets-list');
        if (!list || !main.tilesets) return;
        
        list.innerHTML = '';
        main.tilesets.forEach((tileset, index) => {
            if (!tileset || index === 0) return;
            
            const item = document.createElement('div');
            item.className = 'db-list-item';
            item.innerHTML = `
                <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                <span class="db-list-item-name">${tileset.name || '(이름 없음)'}</span>
            `;
            list.appendChild(item);
        });
    }
    
    loadCommonEventsTab() {
        const list = document.getElementById('db-commonevents-list');
        if (!list || !main.commonEventsData) return;
        
        list.innerHTML = '';
        main.commonEventsData.forEach((event, index) => {
            if (!event || index === 0) return;
            
            const item = document.createElement('div');
            item.className = 'db-list-item';
            item.innerHTML = `
                <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                <span class="db-list-item-name">${event.name || '(이름 없음)'}</span>
            `;
            
            // 클릭 이벤트 추가
            item.addEventListener('click', () => {
                // 선택 상태 변경
                document.querySelectorAll('#db-commonevents-list .db-list-item').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // 이벤트 코드 표시 - EventEditor 사용
                this.displayCommonEventCommands(event);
            });
            
            list.appendChild(item);
        });
    }
    
    // 공통이벤트 코드 표시
    displayCommonEventCommands(event) {
        const commandsDiv = document.getElementById('db-commonevent-commands');
        if (!commandsDiv) return;
        
        // 공통이벤트용 EventEditor 사용 - main에서 직접 접근
        if (main.commonEventEditor) {
            main.commonEventEditor.displayCommandList(event.list, commandsDiv);
        }
    }
    
    loadSystemTab() {
        if (!main.systemData) return;
        
        // 게임 제목
        const titleInput = document.getElementById('db-game-title');
        if (titleInput) {
            titleInput.value = main.systemData.gameTitle || '';
        }
        
        // 스위치 목록
        const switchList = document.getElementById('db-switches-list');
        if (switchList && main.systemData.switches) {
            switchList.innerHTML = '';
            main.systemData.switches.forEach((switchName, index) => {
                if (index === 0) return;
                
                const item = document.createElement('div');
                item.className = 'db-list-item';
                item.innerHTML = `
                    <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                    <span class="db-list-item-name">${switchName || '(이름 없음)'}</span>
                `;
                switchList.appendChild(item);
            });
        }
        
        // 변수 목록
        const varList = document.getElementById('db-variables-list');
        if (varList && main.systemData.variables) {
            varList.innerHTML = '';
            main.systemData.variables.forEach((varName, index) => {
                if (index === 0) return;
                
                const item = document.createElement('div');
                item.className = 'db-list-item';
                item.innerHTML = `
                    <span class="db-list-item-id">#${index.toString().padStart(4, '0')}</span>
                    <span class="db-list-item-name">${varName || '(이름 없음)'}</span>
                `;
                varList.appendChild(item);
            });
        }
    }
    
    // 리소스 서브탭 초기화
    initResourceSubtabs() {
        const subtabButtons = document.querySelectorAll('.resource-subtab');
        subtabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchResourceSubtab(btn.dataset.subtab);
            });
        });
        
        // 오디오 타입 버튼 초기화
        const audioTypeBtns = document.querySelectorAll('.audio-type-btn');
        audioTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectAudioType(btn.dataset.type);
            });
        });
    }
    
    switchResourceSubtab(subtabName) {
        // 서브탭 버튼 활성화 상태 변경
        const subtabButtons = document.querySelectorAll('.resource-subtab');
        subtabButtons.forEach(btn => {
            if (btn.dataset.subtab === subtabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 서브탭 컨텐츠 표시 변경
        const subtabContents = document.querySelectorAll('.resource-subtab-content');
        subtabContents.forEach(content => {
            if (content.id === `resource-${subtabName}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // 해당 서브탭의 데이터 로드
        switch(subtabName) {
            case 'images':
                this.loadImagesSubtab();
                break;
            case 'audio':
                this.loadAudioSubtab();
                break;
            case 'plugins':
                this.loadPluginsSubtab();
                break;
        }
    }
    
    // 이미지 서브탭 로드
    loadImagesSubtab() {
        const foldersList = document.getElementById('image-folders-list');
        if (!foldersList) return;
        
        foldersList.innerHTML = '';
        
        // img 폴더 내 폴더 목록
        const imageFolders = [
            'animations', 'battlebacks1', 'battlebacks2', 'characters',
            'enemies', 'faces', 'parallaxes', 'pictures',
            'sv_actors', 'sv_enemies', 'system', 'tilesets', 'titles1', 'titles2'
        ];
        
        imageFolders.forEach(folderName => {
            const item = document.createElement('div');
            item.className = 'folder-item';
            item.textContent = folderName;
            item.addEventListener('click', () => {
                this.selectImageFolder(folderName, item);
            });
            foldersList.appendChild(item);
        });
    }
    
    selectImageFolder(folderName, folderElement) {
        // 폴더 선택 상태 변경
        document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('selected'));
        folderElement.classList.add('selected');
        
        // 해당 폴더의 이미지 파일 목록 로드
        this.loadImageFiles(folderName);
    }
    
    async loadImageFiles(folderName) {
        const filesList = document.getElementById('image-files-list');
        if (!filesList) return;
        
        filesList.innerHTML = '<div style="padding: 12px; color: #666;">로딩 중...</div>';
        
        try {
            const response = await fetch(`project/img/${folderName}/`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            const imageFiles = [];
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const isImage = imageExtensions.some(ext => href.toLowerCase().endsWith(ext));
                    if (isImage) {
                        const raw = href.split('/').pop();
                        const decoded = decodeURIComponent(raw);
                        imageFiles.push(decoded);
                    }
                }
            });
            
            filesList.innerHTML = '';
            
            if (imageFiles.length === 0) {
                filesList.innerHTML = '<div style="padding: 12px; color: #666;">이미지 파일이 없습니다</div>';
                return;
            }
            
            imageFiles.sort();
            imageFiles.forEach(fileName => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.textContent = fileName;
                item.addEventListener('click', () => {
                    this.selectImageFile(folderName, fileName, item);
                });
                filesList.appendChild(item);
            });
        } catch (error) {
            console.error('[loadImageFiles] 이미지 파일 로드 실패:', error);
            filesList.innerHTML = '<div style="padding: 12px; color: #c0392b;">로드 실패</div>';
        }
    }
    
    selectImageFile(folderName, fileName, fileElement) {
        // 파일 선택 상태 변경
        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
        fileElement.classList.add('selected');
        
        // 이미지 미리보기 표시
        this.showImagePreview(folderName, fileName);
    }
    
    showImagePreview(folderName, fileName) {
        const previewArea = document.getElementById('image-preview-area');
        if (!previewArea) return;
        
        previewArea.innerHTML = '';
        
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.src = `project/img/${folderName}/${fileName}`;
        img.alt = fileName;
        
        img.onerror = () => {
            previewArea.innerHTML = '<div class="preview-empty">이미지 로드 실패</div>';
        };
        
        previewArea.appendChild(img);
    }
    
    // 오디오 서브탭 로드
    loadAudioSubtab() {
        // 기본적으로 BGM 타입 선택
        this.selectAudioType('bgm');
    }
    
    selectAudioType(audioType) {
        // 오디오 타입 버튼 활성화 상태 변경
        const typeBtns = document.querySelectorAll('.audio-type-btn');
        typeBtns.forEach(btn => {
            if (btn.dataset.type === audioType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 해당 타입의 오디오 파일 목록 로드
        this.loadAudioFiles(audioType);
    }
    
    async loadAudioFiles(audioType) {
        const filesList = document.getElementById('audio-files-list');
        if (!filesList) return;
        
        filesList.innerHTML = '<div style="padding: 12px; color: #666;">로딩 중...</div>';
        
        try {
            const response = await fetch(`project/audio/${audioType}/`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            const audioFiles = [];
            const audioExtensions = ['.ogg', '.m4a', '.mp3', '.wav'];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const isAudio = audioExtensions.some(ext => href.toLowerCase().endsWith(ext));
                    if (isAudio) {
                        const raw = href.split('/').pop();
                        const decoded = decodeURIComponent(raw);
                        audioFiles.push(decoded);
                    }
                }
            });
            
            filesList.innerHTML = '';
            
            if (audioFiles.length === 0) {
                filesList.innerHTML = '<div style="padding: 12px; color: #666;">오디오 파일이 없습니다</div>';
                return;
            }
            
            audioFiles.sort();
            audioFiles.forEach(fileName => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.textContent = fileName;
                item.addEventListener('click', () => {
                    this.selectAudioFile(audioType, fileName, item);
                });
                filesList.appendChild(item);
            });
        } catch (error) {
            console.error('[loadAudioFiles] 오디오 파일 로드 실패:', error);
            filesList.innerHTML = '<div style="padding: 12px; color: #c0392b;">로드 실패</div>';
        }
    }
    
    selectAudioFile(audioType, fileName, fileElement) {
        // 파일 선택 상태 변경
        document.querySelectorAll('#audio-files-list .file-item').forEach(el => el.classList.remove('selected'));
        fileElement.classList.add('selected');
        
        // 선택된 파일명 표시
        const selectedName = document.getElementById('audio-selected-name');
        if (selectedName) {
            selectedName.textContent = fileName;
            selectedName.style.color = '#fff';
        }
        
        // 재생 버튼 활성화 (실제 재생 기능은 나중에 구현)
        const playBtn = document.getElementById('btn-play-audio');
        const stopBtn = document.getElementById('btn-stop-audio');
        
        if (playBtn) {
            playBtn.onclick = () => {
                console.log(`[재생] ${audioType}/${fileName}`);
                // TODO: 실제 오디오 재생 구현
                alert(`오디오 재생 기능은 나중에 구현됩니다.\n파일: ${fileName}`);
            };
        }
        
        if (stopBtn) {
            stopBtn.onclick = () => {
                console.log(`[정지] ${audioType}/${fileName}`);
                // TODO: 실제 오디오 정지 구현
            };
        }
    }
    
    // 플러그인 서브탭 로드
    loadPluginsSubtab() {
        const pluginsList = document.getElementById('plugins-list');
        if (!pluginsList || !main.systemData) return;
        
        pluginsList.innerHTML = '';
        
        const plugins = main.systemData.plugins || [];
        const activePlugins = plugins.filter(p => p && p.status);
        
        if (activePlugins.length === 0) {
            pluginsList.innerHTML = '<div style="padding: 12px; color: #666;">활성화된 플러그인이 없습니다</div>';
            return;
        }
        
        activePlugins.forEach(plugin => {
            const item = document.createElement('div');
            item.className = 'plugin-item';
            item.innerHTML = `
                <div class="plugin-item-name">${plugin.name}</div>
                <div class="plugin-item-status">활성화</div>
            `;
            pluginsList.appendChild(item);
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