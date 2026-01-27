
class DatabaseEditor {
    constructor() {
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

}