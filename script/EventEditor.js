
class EventEditor {
    constructor() {

        return
        this.events = null
        this.selectedCommand = null; // 선택된 커맨드
        this.selectedCommandElement = null; // 선택된 커맨드 DOM 요소
        this.selectedCommandElements = null; // 선택된 커맨드들 (여러 개)
        this.selectedCommandAnchor = undefined; // Shift+클릭 범위 선택의 기준점
        this.clipboard = null; // 이벤트 복사/붙여넣기 클립보드
        this.commandClipboard = null; // 커맨드 복사/붙여넣기 클립보드
        this.draggedEvent = null; // 드래그 중인 이벤트
        this.dragStartPos = null; // 드래그 시작 위치
        this.selectedEvent = null; // 현재 선택된 이벤트
        this.currentPageIndex = 0; // 현재 페이지 인덱스
        this.editor = new EventEditor(document.getElementById('ins-contents-list')); // EventEditor 인스턴스 (독립적으로 생성)
        this.initClickEvent()
        this.initDragEvent();
        this.initInspectorTabs();
        this.initInspectorButtons();
        this.initFontSizeControl();
    }


    loadEvent() {
        this.render()
    }

    // 맵에 있는 이벤트들을 불러와서 그리기
    render() {
        console.log("renderStart")
        this.events = this.map.events.filter(x => x != null);

        //이벤트 오버레이 캔버스 초기화
        const eventCanvas = document.getElementById('event-overlay-canvas');
        if (eventCanvas) {
            const ctx = eventCanvas.getContext('2d');
            ctx.clearRect(0, 0, eventCanvas.width, eventCanvas.height);
        }

        // 플레이어 렌더링
        this.drawPlayer();

        // 이벤트 렌더링
        for (const event of this.map.events) {
            console.log(event)
            if (!event || !event.pages || event.pages.length === 0) continue;

            const x = event.x;
            const y = event.y;
            const imgInfo = event.pages[0].image;

            this.drawCharacter(event, x, y);
        }
    }

    drawPlayer() {
        const canvas = document.getElementById('event-overlay-canvas');
        const ctx = canvas.getContext('2d');
        // 플레이어가 현재 맵에 있는지 확인
        if (main.mapInfo.id !== main.systemData.startMapId) {
            return; // 플레이어가 현재 맵에 없음
        }

        const x = main.systemData.startX;
        const y = main.systemData.startY;

        const TILE_SIZE = 48;
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        // 파티 첫 번째 멤버의 캐릭터 정보 가져오기
        const actorId = main.systemData.partyMembers[0];

        const actor = main.actorsData[actorId];
        if (!actor) {
            // 빨간색 테두리만 그리기
            ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
            ctx.lineWidth = 4;
            ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('P', dx + 4, dy + 14);
            return;
        }

        const characterName = actor.characterName;
        const characterIndex = actor.characterIndex;

        // 캐릭터 이미지 그리기
        if (characterName) {
            const img = main.images.get(characterName);

            if (!img || !img.complete || !img.naturalWidth) {
                // 이미지 없을 때 빨간 테두리만 표시
                ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
                ctx.lineWidth = 4;
                ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText('P', dx + 4, dy + 14);
                return;
            }



            const isBig = characterName.startsWith('$');
            const charW = isBig ? img.width / 3 : img.width / 12;
            const charH = isBig ? img.height / 4 : img.height / 8;

            const col = isBig ? 0 : (characterIndex % 4);
            const row = isBig ? 0 : Math.floor(characterIndex / 4);

            // 기본 방향: 아래(2), 패턴: 중앙(1)
            const pattern = 1;
            const direction = 2;
            const sx = (col * 3 + pattern) * charW;
            const sy = (row * 4 + (direction / 2 - 1)) * charH;

            ctx.drawImage(
                img,
                sx, sy, charW, charH,
                dx + (TILE_SIZE - charW) / 2,
                dy + TILE_SIZE - charH,
                charW, charH
            );
        }

        // 빨간색 테두리
        ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 플레이어 표시
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('P', dx + 4, dy + 14);
    }


    // 1. 우클릭 감지 초기화
    initClickEvent() {
        const canvas = document.getElementById('map-canvas');
        if (!canvas) return;
        // Enter 키 핸들러 추가
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                // 입력 요소에 포커스되어 있으면 무시
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                    return;
                }

                // 커맨드가 선택되어 있으면 무시 (커맨드 단축키 우선)
                if (this.selectedCommand) {
                    return;
                }

                // 맵 캔버스가 없으면 무시
                if (!canvas) return;

                // 마우스 위치 없으면 중앙에 생성
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const centerX = Math.floor(main.map.width / 2);
                const centerY = Math.floor(main.map.height / 2);
                this.createEvent(centerX, centerY);
            }
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // 브라우저 메뉴 차단
            console.log(e.clientX,e.clientY,main.editorUI.getMapCoordinates(e.clientX,e.clientY));
            const { x: tileX, y: tileY } = main.editorUI.getMapCoordinates(e.clientX,e.clientY);
            console.log("tileX, tileY", tileX, tileY);

            // 해당 좌표의 이벤트 찾기
            const clickedEvent = this.events.find(ev => ev.x === tileX && ev.y === tileY);

            if (clickedEvent) {
                this.showEventContextMenu(e.pageX, e.pageY, clickedEvent);
            } else {
                this.showMapContextMenu(e.pageX, e.pageY, tileX, tileY);
            }
        });
    }

    // 드래그 이벤트 초기화
    initDragEvent() {
        const canvas = document.getElementById('map-canvas');
        if (!canvas) return;

        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;

        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 왼쪽 클릭만

            const rect = canvas.getBoundingClientRect();
            const tileX = Math.floor((e.clientX - rect.left) / 48);
            const tileY = Math.floor((e.clientY - rect.top) / 48);

            // Ctrl 키가 눌려있고 타일셋이 선택되어 있으면 타일 그리기
            if (e.ctrlKey && main.editorUI && main.editorUI.selectedTile) {
                const layerMode = main.editorUI.selectedLayer; // 'auto', '0', '1', '2', '3'
                const tile = main.editorUI.selectedTile;

                // Shift+Ctrl: 타일 지우기
                if (e.shiftKey) {
                    main.mapManager.eraseTile(tileX, tileY, layerMode, tile);
                } else {
                    main.mapManager.setTile(tileX, tileY, layerMode, tile);
                }
                return;
            }

            // 해당 좌표의 이벤트 찾기
            const clickedEvent = this.events.find(ev => ev.x === tileX && ev.y === tileY);

            if (clickedEvent) {
                isDragging = true;
                this.draggedEvent = clickedEvent;
                this.dragStartPos = { x: clickedEvent.x, y: clickedEvent.y };
                dragStartX = tileX;
                dragStartY = tileY;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            // Ctrl 드래그로 타일 그리기
            if (e.ctrlKey && (e.buttons & 1) && main.editorUI && main.editorUI.selectedTile) {
                const rect = canvas.getBoundingClientRect();
                const tileX = Math.floor((e.clientX - rect.left) / 48);
                const tileY = Math.floor((e.clientY - rect.top) / 48);
                const layerMode = main.editorUI.selectedLayer; // 'auto', '0', '1', '2', '3'

                // 맵 범위 체크
                if (tileX >= 0 && tileX < this.map.width && tileY >= 0 && tileY < this.map.height) {
                    const tile = main.editorUI.selectedTile;

                    // Shift+Ctrl: 타일 지우기
                    if (e.shiftKey) {
                        main.mapManager.eraseTile(tileX, tileY, layerMode, tile);
                    } else {
                        main.mapManager.setTile(tileX, tileY, layerMode, tile);
                    }
                }
                return;
            }

            if (!isDragging || !this.draggedEvent) return;

            const rect = canvas.getBoundingClientRect();
            const tileX = Math.floor((e.clientX - rect.left) / 48);
            const tileY = Math.floor((e.clientY - rect.top) / 48);

            // 위치가 변경되었을 때만 업데이트
            if (tileX !== dragStartX || tileY !== dragStartY) {
                // 맵 범위 체크
                if (tileX >= 0 && tileX < this.map.width && tileY >= 0 && tileY < this.map.height) {
                    this.draggedEvent.x = tileX;
                    this.draggedEvent.y = tileY;
                    this.loadEvent();
                    dragStartX = tileX;
                    dragStartY = tileY;
                }
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging || !this.draggedEvent) return;

            const rect = canvas.getBoundingClientRect();
            const tileX = Math.floor((e.clientX - rect.left) / 48);
            const tileY = Math.floor((e.clientY - rect.top) / 48);

            // 다른 이벤트와 충돌 체크 (자기 자신 제외)
            const collidingEvent = this.events.find(ev =>
                ev !== this.draggedEvent && ev.x === tileX && ev.y === tileY
            );

            if (collidingEvent) {
                // 충돌 시 원래 위치로 복귀
                this.draggedEvent.x = this.dragStartPos.x;
                this.draggedEvent.y = this.dragStartPos.y;
                this.loadEvent();
            }

            isDragging = false;
            this.draggedEvent = null;
            this.dragStartPos = null;
        });
    }

    // 빈 공간 우클릭 메뉴
    showMapContextMenu(x, y, tileX, tileY) {
        console.log("tileX", tileX, "tileY", tileY)
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'event-context-menu';
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
            minWidth: '150px'
        });

        const options = [
            {
                label: '플레이어',
                action: () => this.setPlayerStart(tileX, tileY)
            },
            {
                label: '이벤트 생성',
                action: () => this.createEvent(tileX, tileY)
            },
            {
                label: '붙여넣기 (Ctrl+V)',
                action: () => this.pasteEvent(tileX, tileY),
                disabled: !this.clipboard
            }
        ];

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
        this.setupMenuClose(menu);
    }

    // 이벤트 우클릭 메뉴 표시
    showEventContextMenu(x, y, event) {
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'event-context-menu';
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
            minWidth: '150px'
        });

        const options = [
            {
                label: '편집',
                action: () => this.loadEventToInspector(event)
            },
            {
                label: '복사 (Ctrl+C)',
                action: () => this.copyEvent(event)
            },
            {
                label: '삭제 (Del)',
                action: () => this.deleteEvent(event),
                color: '#ff6666'
            }
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
                e.stopPropagation();
                if (typeof opt.action === 'function') {
                    opt.action();
                }
                menu.remove();
            };
            menu.appendChild(div);
        });

        document.body.appendChild(menu);
        this.setupMenuClose(menu);
    }

    closeContextMenu() {
        console.log("clear")
        main.editorUI.clearBlueCircle();
        const menu = document.getElementById('event-context-menu');
        if (menu) menu.remove();
        const cmdMenu = document.getElementById('command-context-menu');
        if (cmdMenu) cmdMenu.remove();
    }

    setupMenuClose(menu) {
        setTimeout(() => {
            const closeMenu = (e) => {
                console.log("closdfsdfsse")
                if (!menu.contains(e.target)) {
                    menu.remove();
                    main.editorUI.clearBlueCircle();
                    document.removeEventListener('click', closeMenu);
                    document.removeEventListener('wheel', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
            document.addEventListener('wheel', closeMenu);
        }, 0);
    }

    // 커맨드 컨텍스트 메뉴
    showCommandContextMenu(x, y, cmd, index, { list }) {
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.id = 'command-context-menu';
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
            minWidth: '180px'
        });

        const options = [
            {
                label: '편집',
                action: () => this.editor.editCommand(cmd, index, list)
            },
            {
                label: '추가 (Enter)',
                action: () => this.editor.showCommandList(index, list)
            },
            {
                label: '복사 (Ctrl+C)',
                action: () => this.editor.copyCommand(cmd, index)
            },
            {
                label: '붙여넣기 (Ctrl+V)',
                action: () => this.editor.pasteCommand(index, list),
                disabled: !this.commandClipboard
            },
            {
                label: '삭제 (Del)',
                action: () => this.editor.deleteCommand(index, list),
                color: '#ff6666',
                disabled: cmd.code === 0
            }
        ];

        options.forEach(opt => {
            const div = document.createElement('div');
            div.innerText = opt.label;
            Object.assign(div.style, {
                padding: '6px 20px',
                cursor: opt.disabled ? 'default' : 'pointer',
                opacity: opt.disabled ? '0.4' : '1'
            });
            if (opt.color) div.style.color = opt.color;

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
        this.setupMenuClose(menu);
    }

    // 플레이어 시작 위치 설정
    setPlayerStart(x, y) {
        main.systemData.startMapId = main.mapInfo.id;
        main.systemData.startX = x;
        main.systemData.startY = y;
        this.loadEvent();
        console.log(`플레이어 시작 위치 설정됨: 맵 ${main.mapInfo.id}, (${x}, ${y})`);
    }

    // 이벤트 생성
    createEvent(x, y) {
        const newId = this.getNextEventId();
        const newEvent = {
            id: newId,
            name: "EVENT",
            note: "",
            pages: [{
                conditions: {
                    actorId: 1,
                    actorValid: false,
                    itemId: 1,
                    itemValid: false,
                    selfSwitchCh: "A",
                    selfSwitchValid: false,
                    switch1Id: 1,
                    switch1Valid: false,
                    switch2Id: 1,
                    switch2Valid: false,
                    variableId: 1,
                    variableValid: false,
                    variableValue: 0
                },
                directionFix: false,
                image: {
                    characterIndex: 0,
                    characterName: "",
                    direction: 2,
                    pattern: 0,
                    tileId: 0
                },
                list: [{ code: 0, indent: 0, parameters: [] }],
                moveFrequency: 3,
                moveRoute: {
                    list: [{ code: 0, parameters: [] }],
                    repeat: true,
                    skippable: false,
                    wait: false
                },
                moveSpeed: 3,
                moveType: 0,
                priorityType: 1,
                stepAnime: false,
                through: false,
                trigger: 0,
                walkAnime: true
            }],
            x: x,
            y: y
        };

        this.map.events[newId] = newEvent;
        this.events = this.map.events.filter(x => x != null);
        this.loadEvent();
        this.loadEventToInspector(newEvent);
        console.log(`이벤트 생성: ID ${newId}, (${x}, ${y})`);
    }

    // 다음 이벤트 ID 찾기 (null 슬롯 재사용)
    getNextEventId() {
        // 0번 인덱스는 항상 null이므로 1부터 시작
        for (let i = 1; i < this.map.events.length; i++) {
            if (this.map.events[i] === null) {
                return i;
            }
        }
        // null이 없으면 배열 끝에 추가
        return this.map.events.length;
    }

    // 이벤트 복사
    copyEvent(event) {
        this.clipboard = JSON.parse(JSON.stringify(event));
        console.log('이벤트 복사:', event.id);
    }

    // 이벤트 붙여넣기
    pasteEvent(x, y) {
        if (!this.clipboard) return;

        const newId = this.getNextEventId();
        const newEvent = JSON.parse(JSON.stringify(this.clipboard));
        newEvent.id = newId;
        newEvent.x = x;
        newEvent.y = y;

        this.map.events[newId] = newEvent;
        this.events = this.map.events.filter(x => x != null);
        this.loadEvent();
        console.log(`이벤트 붙여넣기: ID ${newId}, (${x}, ${y})`);
    }

    // 이벤트 삭제
    deleteEvent(event) {
        if (!confirm(`이벤트 ${event.id}를 삭제하시겠습니까?`)) return;

        this.map.events[event.id] = null;
        this.events = this.map.events.filter(x => x != null);

        // 인스펙터가 삭제된 이벤트를 표시 중이면 초기화
        if (this.selectedEvent && this.selectedEvent.id === event.id) {
            this.selectedEvent = null;
            document.getElementById('inspector-main').style.display = 'none';
            document.getElementById('inspector-empty').style.display = 'block';
        }

        this.loadEvent();
        console.log('이벤트 삭제:', event.id);
    }

    // 2. 인스펙터에 데이터 로드
    loadEventToInspector(event) {
        this.selectedEvent = event; // 현재 선택된 이벤트 보관
        this.currentPageIndex = 0; // 현재 페이지 인덱스 초기화

        // UI 전환
        document.getElementById('inspector-empty').style.display = 'none';
        const editor = document.getElementById('inspector-main');
        editor.style.display = 'flex';

        // 기본 정보
        document.getElementById('ins-name').value = event.name || '';
        document.getElementById('ins-note').value = event.note || '';

        // 페이지 탭 생성
        this.createPageTabs(event);

        // 첫 번째 페이지 로드
        this.loadPageToInspector(event, 0);

        // 첫 번째 페이지의 이미지가 있으면 미리 로드 시도
        const firstPage = event.pages[0];
        if (firstPage && firstPage.image && firstPage.image.characterName) {
            const charName = firstPage.image.characterName.includes('.')
                ? firstPage.image.characterName.substring(0, firstPage.image.characterName.lastIndexOf('.'))
                : firstPage.image.characterName;
            if (!main.images.has(charName)) {
                console.log(`[loadEventToInspector] 이미지 사전 로드: ${charName}`);
                main.loadCharacterImage(charName).then(() => {
                    console.log(`[loadEventToInspector] 이미지 사전 로드 완료: ${charName}`);
                });
            }
        }
    }

    // 페이지 탭 생성
    createPageTabs(event) {
        const tabContainer = document.getElementById('ins-page-tab-container');
        tabContainer.innerHTML = '';

        const pages = event.pages || [];
        pages.forEach((page, index) => {
            const tab = document.createElement('button');
            tab.className = `ins-page-tab ${index === 0 ? 'active' : ''}`;
            tab.innerText = `페이지 ${index + 1}`;
            tab.onclick = () => this.switchPage(event, index);
            tabContainer.appendChild(tab);
        });
    }

    // 페이지 전환
    switchPage(event, pageIndex) {
        // 기존 탭 선택 제거
        document.querySelectorAll('.ins-page-tab[data-tab]').forEach(tab => {
            if (tab.getAttribute('data-tab') === undefined) {
                tab.classList.remove('active');
            }
        });

        // 새 탭 선택
        const pageTabs = document.querySelectorAll('.ins-page-tab');
        pageTabs[pageIndex].classList.add('active');

        // 해당 페이지 로드
        this.loadPageToInspector(event, pageIndex);
    }

    // 탭 전환 (페이지 설정 / 실행 내용)
    switchContentTab(tabName) {
        // 콘텐츠 탭 비활성화
        document.querySelectorAll('[data-tab]').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.ins-tab-content').forEach(content => content.style.display = 'none');

        // 선택된 탭 활성화
        if (tabName === 'setting') {
            document.getElementById('ins-setting-content').style.display = 'flex';
            document.querySelector('[data-tab="setting"]').classList.add('active');
        } else if (tabName === 'commands') {
            document.getElementById('ins-commands-content').style.display = 'flex';
            document.querySelector('[data-tab="commands"]').classList.add('active');

            // 커맨드 목록 업데이트
            if (this.selectedEvent && this.currentPageIndex !== undefined) {
                const page = this.selectedEvent.pages[this.currentPageIndex];
                if (page) {
                    this.editor.displayCommandList(page.list);
                }
            }
        }
    }

    // 탭 버튼 클릭 리스너 등록
    initInspectorTabs() {
        // HTML에 작성하신 탭 버튼들을 가져옵니다. 
        // 버튼에 data-tab="setting", data-tab="commands" 속성이 있다고 가정합니다.
        const settingBtn = document.querySelector('[data-tab="setting"]');
        const commandsBtn = document.querySelector('[data-tab="commands"]');

        if (settingBtn) {
            settingBtn.onclick = () => this.switchContentTab('setting');
        }
        if (commandsBtn) {
            commandsBtn.onclick = () => this.switchContentTab('commands');
        }
    }

    // 인스펙터 버튼 이벤트 초기화
    initInspectorButtons() {
        // 새로 만들기 버튼
        const newBtn = document.getElementById('ins-btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (!this.selectedEvent || this.currentPageIndex === undefined) return;
                const page = this.selectedEvent.pages[this.currentPageIndex];
                if (!page) return;
                const lastIndex = page.list.length - 1;
                this.editor.showCommandList(lastIndex, page.list);
            });
        }

        // 복사 버튼
        const copyBtn = document.getElementById('ins-btn-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (!this.selectedCommand) return;
                this.editor.copyCommand(this.selectedCommand.cmd, this.selectedCommand.index);
            });
        }

        // 붙여넣기 버튼
        const pasteBtn = document.getElementById('ins-btn-paste');
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => {
                if (!this.selectedCommand || !this.selectedEvent || this.currentPageIndex === undefined) return;
                const page = this.selectedEvent.pages[this.currentPageIndex];
                if (!page) return;
                this.editor.pasteCommand(this.selectedCommand.index, page.list);
            });
        }

        // 삭제 버튼
        const deleteBtn = document.getElementById('ins-btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (!this.selectedCommand || !this.selectedEvent || this.currentPageIndex === undefined) return;
                if (this.selectedCommand.cmd.code === 0) return; // 빈 코드는 삭제 불가
                const page = this.selectedEvent.pages[this.currentPageIndex];
                if (!page) return;
                this.editor.deleteCommand(this.selectedCommand.index, page.list);
            });
        }

        // 비우기 버튼
        const clearBtn = document.getElementById('ins-btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (!this.selectedEvent || this.currentPageIndex === undefined) return;
                const page = this.selectedEvent.pages[this.currentPageIndex];
                if (!page) return;
                if (!confirm('모든 실행 내용을 삭제하시겠습니까?')) return;
                page.list = [{ code: 0, indent: 0, parameters: [] }];
                this.editor.displayCommandList(page.list);
            });
        }
    }

    // 페이지 데이터 로드
    loadPageToInspector(event, pageIndex) {
        this.currentPageIndex = pageIndex;
        const page = event.pages[pageIndex];
        if (!page) return;

        // 조건 정보
        const conditions = page.conditions || {};

        // 스위치 1
        const switch1Check = document.getElementById('ins-switch1-check');
        const switch1Name = document.getElementById('ins-switch1-name');
        const switch1Selector = document.getElementById('ins-switch1-selector');
        switch1Check.checked = conditions.switch1Valid;

        // 스위치 1 이름 표시
        const updateSwitch1Name = () => {
            const id = conditions.switch1Id || 0;
            const switchName = this.getSwitchName(id);
            if (id > 0) {
                switch1Selector.textContent = `[${id}] ${switchName}`;
            } else {
                switch1Selector.textContent = '선택';
            }
            switch1Name.textContent = '';
        };
        updateSwitch1Name();

        // 스위치 1 선택 버튼
        if (switch1Selector) {
            switch1Selector.onclick = () => {
                const currentId = conditions.switch1Id || 1;
                this.showSwitchSelector(currentId, (switchId) => {
                    conditions.switch1Id = switchId;
                    updateSwitch1Name();
                });
            };
        }

        // 스위치 2
        const switch2Check = document.getElementById('ins-switch2-check');
        const switch2Name = document.getElementById('ins-switch2-name');
        const switch2Selector = document.getElementById('ins-switch2-selector');
        switch2Check.checked = conditions.switch2Valid;

        // 스위치 2 이름 표시
        const updateSwitch2Name = () => {
            const id = conditions.switch2Id || 0;
            const switchName = this.getSwitchName(id);
            if (id > 0) {
                switch2Selector.textContent = `[${id}] ${switchName}`;
            } else {
                switch2Selector.textContent = '선택';
            }
            switch2Name.textContent = '';
        };
        updateSwitch2Name();

        // 스위치 2 선택 버튼
        if (switch2Selector) {
            switch2Selector.onclick = () => {
                const currentId = conditions.switch2Id || 1;
                this.showSwitchSelector(currentId, (switchId) => {
                    conditions.switch2Id = switchId;
                    updateSwitch2Name();
                });
            };
        }

        // 셀프 스위치
        const selfSwitchCheck = document.getElementById('ins-self-switch-check');
        const selfSwitchInput = document.getElementById('ins-self-switch');
        selfSwitchCheck.checked = conditions.selfSwitchValid;
        selfSwitchInput.value = conditions.selfSwitchCh || 'A';
        selfSwitchInput.disabled = !conditions.selfSwitchValid;
        selfSwitchInput.style.opacity = conditions.selfSwitchValid ? '1' : '0.4';

        // 변수
        const variableCheck = document.getElementById('ins-variable-check');
        const variableValueInput = document.getElementById('ins-variable-value');
        const variableName = document.getElementById('ins-variable-name');
        const variableSelector = document.getElementById('ins-variable-selector');

        variableCheck.checked = conditions.variableValid;
        variableValueInput.value = conditions.variableValue || 0;
        variableValueInput.disabled = !conditions.variableValid;
        variableValueInput.style.opacity = conditions.variableValid ? '1' : '0.4';

        // 변수 이름 표시
        const updateVariableName = () => {
            const id = conditions.variableId || 0;
            const name = this.getVariableName(id);
            if (id > 0) {
                variableSelector.textContent = `[${id}] ${name}`;
            } else {
                variableSelector.textContent = '선택';
            }
            variableName.textContent = '';
        };
        updateVariableName();

        // 변수 선택 버튼
        if (variableSelector) {
            variableSelector.onclick = () => {
                const currentId = conditions.variableId || 1;
                this.showVariableSelector(currentId, (variableId) => {
                    conditions.variableId = variableId;
                    updateVariableName();
                });
            };
        }

        // 체크박스 변경 이벤트 리스너
        const updateConditionStates = () => {
            const switch1Checked = document.getElementById('ins-switch1-check').checked;
            const switch2Checked = document.getElementById('ins-switch2-check').checked;
            const selfSwitchChecked = document.getElementById('ins-self-switch-check').checked;
            const variableChecked = document.getElementById('ins-variable-check').checked;

            document.getElementById('ins-switch1-selector').disabled = !switch1Checked;
            document.getElementById('ins-switch1-selector').style.opacity = switch1Checked ? '1' : '0.4';

            document.getElementById('ins-switch2-selector').disabled = !switch2Checked;
            document.getElementById('ins-switch2-selector').style.opacity = switch2Checked ? '1' : '0.4';

            document.getElementById('ins-self-switch').disabled = !selfSwitchChecked;
            document.getElementById('ins-self-switch').style.opacity = selfSwitchChecked ? '1' : '0.4';

            document.getElementById('ins-variable-selector').disabled = !variableChecked;
            document.getElementById('ins-variable-value').disabled = !variableChecked;
            document.getElementById('ins-variable-selector').style.opacity = variableChecked ? '1' : '0.4';
            document.getElementById('ins-variable-value').style.opacity = variableChecked ? '1' : '0.4';
        };

        // 초기 상태 설정
        updateConditionStates();

        switch1Check.addEventListener('change', updateConditionStates);
        switch2Check.addEventListener('change', updateConditionStates);
        selfSwitchCheck.addEventListener('change', updateConditionStates);
        variableCheck.addEventListener('change', updateConditionStates);

        // 옵션 토글 버튼들
        const toggleButtons = document.querySelectorAll('.ins-toggle-btn');
        toggleButtons.forEach(btn => {
            const setting = btn.dataset.setting;
            const currentValue = page[setting];
            btn.textContent = currentValue ? 'ON' : 'OFF';
            btn.style.backgroundColor = currentValue ? '#2a5a2a' : '#1a1a1a';

            btn.addEventListener('click', () => {
                page[setting] = !page[setting];
                btn.textContent = page[setting] ? 'ON' : 'OFF';
                btn.style.backgroundColor = page[setting] ? '#2a5a2a' : '#1a1a1a';
            });
        });

        // 우선권
        const prioritySelect = document.getElementById('ins-priority');
        prioritySelect.value = page.priorityType || 0;

        // 발동
        const triggerSelect = document.getElementById('ins-trigger');
        triggerSelect.value = page.trigger || 0;

        // 이동 타입
        const moveTypeSelect = document.getElementById('ins-move-type');
        moveTypeSelect.value = page.moveType || 0;

        // 이동 루트 버튼
        const moveRouteBtn = document.getElementById('ins-move-route-btn');
        moveRouteBtn.disabled = (page.moveType !== 3); // 타입이 커스텀(3)일 때만 활성화
        moveRouteBtn.style.opacity = (page.moveType === 3) ? '1' : '0.5';

        // 이동 타입 변경 시 이동 루트 버튼 활성화/비활성화
        moveTypeSelect.addEventListener('change', () => {
            page.moveType = parseInt(moveTypeSelect.value);
            moveRouteBtn.disabled = (page.moveType !== 3);
            moveRouteBtn.style.opacity = (page.moveType === 3) ? '1' : '0.5';
        });

        // 이동 루트 버튼 클릭
        moveRouteBtn.addEventListener('click', () => {
            if (!page.moveRoute) {
                page.moveRoute = { list: [{ code: 0, parameters: [] }], repeat: false, skippable: false, wait: false };
            }
            this.showMoveRouteEditor(-1, page.moveRoute, (characterId, moveRoute) => {
                page.moveRoute = moveRoute;
            });
        });

        // 속도와 빈도
        const moveSpeedSelect = document.getElementById('ins-move-speed');
        moveSpeedSelect.value = page.moveSpeed || 3;

        const moveFreqSelect = document.getElementById('ins-move-freq');
        moveFreqSelect.value = page.moveFrequency || 3;

        // 변경 이벤트 리스너
        prioritySelect.addEventListener('change', () => {
            page.priorityType = parseInt(prioritySelect.value);
        });

        triggerSelect.addEventListener('change', () => {
            page.trigger = parseInt(triggerSelect.value);
        });

        moveSpeedSelect.addEventListener('change', () => {
            page.moveSpeed = parseInt(moveSpeedSelect.value);
        });

        moveFreqSelect.addEventListener('change', () => {
            page.moveFrequency = parseInt(moveFreqSelect.value);
        });

        // 이미지 미리보기
        const previewArea = document.getElementById('ins-preview');
        if (previewArea) {
            previewArea.style.cursor = 'pointer';

            // 기존 이벤트 리스너 제거 (새로운 previewArea로 교체)
            const newPreviewArea = previewArea.cloneNode(false);
            previewArea.parentNode.replaceChild(newPreviewArea, previewArea);

            // 새 previewArea에 대해 이벤트 등록
            const updatedPreviewArea = document.getElementById('ins-preview');
            updatedPreviewArea.innerHTML = '';

            // 클릭 시 선택 모달 열기
            updatedPreviewArea.addEventListener('click', () => {
                // 이미 열려있는 모달 확인
                if (document.getElementById('image-selector-overlay')) {
                    return;
                }

                // 현재 페이지 이미지 데이터를 항상 새로 생성 (매번 최신값 반영)
                const currentPageImage = {
                    type: 'character', // 기본값
                    ...page.image
                };

                // 타입 재결정 - tileId가 있으면 tileset
                if (page.image?.tileId) {
                    currentPageImage.type = 'tileset';
                } else if (page.image?.characterName) {
                    currentPageImage.type = 'character';
                }
                this.showImageSelector(currentPageImage, (newImage) => {

                    // 페이지 객체 업데이트
                    if (newImage.type === 'character') {
                        page.image = {
                            characterName: newImage.name,
                            characterIndex: newImage.index,
                            pattern: newImage.pattern || 0,
                            direction: newImage.direction || 2,
                            tileId: 0
                        };
                    } else if (newImage.type === 'tileset') {
                        page.image = {
                            characterName: '',
                            characterIndex: 0,
                            pattern: 0,
                            direction: 2,
                            tileId: newImage.tileId
                        };
                    }

                    // 미리보기 다시 그리기
                    this.drawInspectorPreview(event, pageIndex);
                });
            });
        }

        // 실행 내용 표시
        this.editor.displayCommandList(page.list);

        // 이미지 미리보기
        this.drawInspectorPreview(event, pageIndex);
    }

    // 조건 분기 텍스트
    getConditionalBranchText(parameters) {
        if (!parameters || parameters.length === 0) return '조건 분기';

        const conditionType = parameters[0] || 0;
        const typeMap = {
            0: '스위치',
            1: '변수',
            2: '타이머',
            3: '액터',
            4: '적',
            5: '캐릭터',
            6: '금전',
            7: '아이템',
            8: '무기',
            9: '방어구',
            10: '버튼',
            11: '스크립트',
            12: '비히클',
        };

        const type = typeMap[conditionType] || '알 수 없음';
        return `조건 분기 [${type}]`;
    }

    // 캐릭터 이름 가져오기
    getCharacterName(charId) {
        if (charId === -1) return '플레이어';
        if (charId === -2) return '이 이벤트';
        if (charId < -2) {
            const followerId = -charId - 2;
            return `팔로워 ${followerId}`;
        }
        if (charId >= 1) {
            // 1 이상의 이벤트 ID인 경우, 현재 맵에서 해당 이벤트의 이름을 찾음
            if (this.map && this.map.events && this.map.events[charId]) {
                return this.map.events[charId].name || `이벤트 ${charId}`;
            }
        }
        return `이벤트 ${charId}`;
    }

    // 맵 이름 가져오기
    getMapName(mapId) {
        if (!main.mapsData || !main.mapsData[mapId]) return `맵${mapId}`;
        const mapName = main.mapsData[mapId].name || '';
        return mapName || `맵${mapId}`;
    }

    // 공통 이벤트 이름 가져오기
    getCommonEventName(eventId) {
        if (!main.commonEventsData || !main.commonEventsData[eventId]) return `공통이벤트${eventId}`;
        const event = main.commonEventsData[eventId];
        const name = event.name || '';
        return name || `공통이벤트${eventId}`;
    }

    // 스위치 이름 가져오기
    getSwitchName(switchId) {
        const systemData = main?.systemData || main?.mapManager?.loader?.systemData || {};
        if (!systemData || !systemData.switches) return '';
        const switchName = systemData.switches[switchId] || '';
        return switchName || '';
    }

    // 변수 이름 가져오기
    getVariableName(variableId) {
        const systemData = main?.systemData || main?.mapManager?.loader?.systemData || {};
        if (!systemData || !systemData.variables) return '';
        const variableName = systemData.variables[variableId] || '';
        return variableName || '';
    }

    // 액터 이름 가져오기
    getActorName(actorId) {
        if (!main.actorsData || !main.actorsData[actorId]) return `액터${actorId}`;
        const actor = main.actorsData[actorId];
        if (!actor) return `액터${actorId}`;
        return actor.name || `액터${actorId}`;
    }

    // 아이템 이름 가져오기
    getItemName(itemId) {
        if (!main.itemsData || !main.itemsData[itemId]) return `아이템${itemId}`;
        const item = main.itemsData[itemId];
        if (!item) return `아이템${itemId}`;
        return item.name || `아이템${itemId}`;
    }

    // 무기 이름 가져오기
    getWeaponName(weaponId) {
        if (!main.weaponsData || !main.weaponsData[weaponId]) return `무기${weaponId}`;
        const weapon = main.weaponsData[weaponId];
        if (!weapon) return `무기${weaponId}`;
        return weapon.name || `무기${weaponId}`;
    }

    // 방어구 이름 가져오기
    getArmorName(armorId) {
        if (!main.armorsData || !main.armorsData[armorId]) return `방어구${armorId}`;
        const armor = main.armorsData[armorId];
        if (!armor) return `방어구${armorId}`;
        return armor.name || `방어구${armorId}`;
    }

    // 애니메이션 이름 가져오기
    getAnimationName(animationId) {
        if (!main.animationsData || !main.animationsData[animationId]) return `애니메이션${animationId}`;
        const animation = main.animationsData[animationId];
        if (!animation) return `애니메이션${animationId}`;
        return animation.name || `애니메이션${animationId}`;
    }

    // 3. 인스펙터용 이미지 미리보기 (작은 캔버스에 그리기)
    drawInspectorPreview(event, pageIndex) {
        const previewArea = document.getElementById('ins-preview');

        // 기존 캔버스 제거
        const oldCanvas = previewArea.querySelector('canvas');
        if (oldCanvas) oldCanvas.remove();

        const page = event.pages[pageIndex || 0];
        if (!page) return;

        const info = page.image;
        if (!info.characterName && !info.tileId) {
            previewArea.innerHTML = '<div style="color: #888;">이미지 없음</div>';
            return;
        }

        // 새 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        canvas.style.border = '1px solid #555';
        canvas.style.backgroundColor = '#1a1a1a';
        previewArea.innerHTML = '';
        previewArea.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log(info)
        if (info.characterName) {
            // 캐릭터 이미지 표시
            let characterName = info.characterName;
            // 확장자 제거 (만약 있다면)
            characterName = characterName.includes('.') ? characterName.substring(0, characterName.lastIndexOf('.')) : characterName;
            const img = main.images.get(characterName);


            if (img) {
                this.drawCharacterPreview(ctx, img, info);
            } else {
                // 이미지가 없으면 직접 로드 시도
                console.log(`[drawInspectorPreview] 이미지 로드 시도: ${characterName}`);
                main.loadCharacterImage(characterName).then(() => {
                    const img = main.images.get(characterName);
                    console.log(`[drawInspectorPreview] 로드 후 확인: ${characterName} = ${!!img}`);
                    if (img) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        this.drawCharacterPreview(ctx, img, info);
                    } else {
                        previewArea.innerHTML = '<div style="color: #888;">이미지 로드 실패</div>';
                    }
                }).catch(err => {
                    console.error(`[drawInspectorPreview] 로드 오류:`, err);
                    previewArea.innerHTML = '<div style="color: #888;">이미지 로드 오류</div>';
                });
                previewArea.innerHTML = '<div style="color: #888;">로딩 중...</div>';
            }
        } else if (info.tileId) {
            // 타일 미리보기
            try {
                const tile = main.mapManager.loader.getNormalTile(info.tileId);
                ctx.drawImage(tile.img, tile.sx, tile.sy, 48, 48, 24, 24, 48, 48);
            } catch (e) {
                console.error('[drawInspectorPreview] 타일 로드 오류:', e);
                previewArea.innerHTML = '<div style="color: #888;">타일 로드 실패</div>';
            }
        }
    }

    // 캐릭터 미리보기 그리기
    drawCharacterPreview(ctx, img, info) {
        let characterName = info.characterName;

        const isBig = characterName.includes('$');

        // direction과 pattern 반영
        const direction = info.direction || 2; // 기본값: 아래(2)
        const pattern = info.pattern !== undefined ? info.pattern : (isBig ? 0 : 1); // 단일칩은 0, 일반은 1

        if (isBig) {
            // 단일칩 처리: 3x4 (pattern x direction)
            const charW = img.width / 3;
            const charH = img.height / 4;

            const directionIndex = [2, 4, 6, 8].indexOf(direction);
            const sx = pattern * charW;
            const sy = directionIndex * charH;

            ctx.drawImage(img, sx, sy, charW, charH, -24, -24, charW, charH);
        } else {
            // 일반 캐릭터 처리: 12x8 (4x2 캐릭터 배치 × 3x4 패턴)
            const charW = img.width / 12;
            const charH = img.height / 8;
            const col = info.characterIndex % 4;
            const row = Math.floor(info.characterIndex / 4);

            const directionIndex = [2, 4, 6, 8].indexOf(direction);
            const sx = (col * 3 + pattern) * charW;
            const sy = (row * 4 + directionIndex) * charH;

            ctx.drawImage(img, sx, sy, charW, charH, 24, 24, 48, 48);
        }
    }

    // 폰트 크기 제어 초기화
    initFontSizeControl() {
        const fontSizeSlider = document.getElementById('inspector-font-size');
        const fontSizeDisplay = document.getElementById('font-size-display');

        if (!fontSizeSlider || !fontSizeDisplay) return;

        // 슬라이더 변경 이벤트
        fontSizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            this.setInspectorFontSize(size);
            fontSizeDisplay.textContent = `${size}px`;

            // 설정 저장
            if (main && typeof main.updateSetting === 'function') {
                main.updateSetting('fontsize', size);
            }
        });
    }

    // 인스펙터 폰트 크기 설정
    setInspectorFontSize(size) {
        // 인스펙터 패널의 모든 요소에 폰트 크기 적용
        const inspector = document.getElementById('inspector-main');
        if (!inspector) return;

        // 기본 폰트 크기 설정
        inspector.style.fontSize = `${size}px`;

        // 특정 요소들에 비례적 크기 설정
        const contentsList = document.getElementById('ins-contents-list');
        if (contentsList) {
            contentsList.style.fontSize = `${size}px`;
        }

        // 인스펙터 내 모든 div에 폰트 크기 적용
        const allDivs = inspector.querySelectorAll('div');
        allDivs.forEach(div => {
            // ins-contents-list 내의 div는 이미 상속받음
            if (!div.closest('#ins-contents-list')) {
                div.style.fontSize = `${size}px`;
            }
        });

        // 모든 단락(p) 요소에 폰트 크기 적용
        const paragraphs = inspector.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.fontSize = `${size}px`;
        });

        // 모든 span 요소에 폰트 크기 적용
        const spans = inspector.querySelectorAll('span');
        spans.forEach(span => {
            span.style.fontSize = `${size}px`;
        });

        // 라벨 폰트 크기 (약간 더 작게)
        const labels = inspector.querySelectorAll('.ins-label');
        labels.forEach(label => {
            label.style.fontSize = `${size - 1}px`;
        });

        // 입력 필드 폰트 크기
        const inputs = inspector.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.fontSize = `${size - 1}px`;
        });

        // 버튼 폰트 크기
        const buttons = inspector.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.fontSize = `${size}px`;
        });

        // 테이블 관련 요소
        const tables = inspector.querySelectorAll('table, tr, td, th');
        tables.forEach(table => {
            table.style.fontSize = `${size}px`;
        });
    }

    // 이미지 선택 모달 (Character/Tileset)
    showImageSelector(currentImage, onSelect) {
        // 모달 오버레이
        const overlay = document.createElement('div');
        overlay.id = 'image-selector-overlay';
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
        background-color: #2b2b2b;
        border: 2px solid #555;
        border-radius: 8px;
        width: 800px;
        height: 600px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

        // 제목
        const title = document.createElement('div');
        title.textContent = '이미지 선택';
        title.style.cssText = `
        padding: 15px 20px;
        border-bottom: 1px solid #555;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
    `;
        modalContainer.appendChild(title);

        // 탭 버튼 (Character / Tileset)
        const tabArea = document.createElement('div');
        tabArea.style.cssText = `
        display: flex;
        gap: 4px;
        padding: 8px 20px;
        border-bottom: 1px solid #555;
        background-color: #1a1a1a;
    `;

        const charTab = document.createElement('button');
        charTab.textContent = 'Character';
        charTab.style.cssText = `
        padding: 6px 15px;
        background-color: #3a3a3a;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        flex: 0 0 auto;
    `;
        tabArea.appendChild(charTab);

        const tileTab = document.createElement('button');
        tileTab.textContent = 'Tileset';
        tileTab.style.cssText = `
        padding: 6px 15px;
        background-color: #3a3a3a;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        flex: 0 0 auto;
    `;
        tabArea.appendChild(tileTab);

        modalContainer.appendChild(tabArea);

        // 컨텐츠 영역
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
        display: flex;
        flex: 1;
        overflow: hidden;
    `;

        let currentTab = currentImage.type || 'character';

        // Character 패널
        const characterPanel = document.createElement('div');
        characterPanel.style.cssText = `
        display: ${currentTab === 'character' ? 'flex' : 'none'};
        flex: 1;
        flex-direction: row;
    `;

        const charListContainer = document.createElement('div');
        charListContainer.style.cssText = `
        width: 200px;
        border-right: 1px solid #555;
        overflow-y: auto;
        background-color: #1a1a1a;
    `;

        const charactersList = main.charactersList || [];
        let selectedCharName = currentImage.type === 'character' ? (currentImage.characterName || '') : '';

        // 초기값 설정: 단일칩인 경우 selectedCharIndex는 항상 0
        const isInitialBig = selectedCharName.includes('$');
        let selectedCharIndex = isInitialBig ? 0 : (currentImage.type === 'character' ? (currentImage.characterIndex || 0) : 0);
        let selectedPattern = currentImage.type === 'character' ? (currentImage.pattern || 0) : 0;
        let selectedDirection = currentImage.type === 'character' ? (currentImage.direction || 2) : 2;
        let charGridInitialized = false;

        // (없음) 항목 추가
        const noneItem = document.createElement('div');
        noneItem.textContent = '(없음)';
        noneItem.style.cssText = `
        padding: 10px 15px;
        color: #999;
        cursor: pointer;
        border-left: 3px solid transparent;
        transition: background-color 0.2s;
        font-style: italic;
    `;

        if (selectedCharName === '') {
            noneItem.style.backgroundColor = '#3a3a3a';
            noneItem.style.borderLeftColor = '#4080ff';
        }

        noneItem.addEventListener('mouseenter', () => {
            if (selectedCharName !== '') {
                noneItem.style.backgroundColor = '#2a2a2a';
            }
        });

        noneItem.addEventListener('mouseleave', () => {
            if (selectedCharName !== '') {
                noneItem.style.backgroundColor = 'transparent';
            }
        });

        noneItem.addEventListener('click', () => {
            charListContainer.querySelectorAll('div').forEach(div => {
                div.style.backgroundColor = 'transparent';
                div.style.borderLeftColor = 'transparent';
            });

            noneItem.style.backgroundColor = '#3a3a3a';
            noneItem.style.borderLeftColor = '#4080ff';
            selectedCharName = '';
            selectedCharIndex = 0;
            selectedPattern = 0;
            selectedDirection = 2;

            updateCharGrid();
        });

        charListContainer.appendChild(noneItem);

        charactersList.forEach(charName => {
            const item = document.createElement('div');
            item.textContent = charName;
            item.style.cssText = `
            padding: 10px 15px;
            color: #fff;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: background-color 0.2s;
        `;

            if (charName === selectedCharName) {
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
            }

            item.addEventListener('mouseenter', () => {
                if (charName !== selectedCharName) {
                    item.style.backgroundColor = '#2a2a2a';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (charName !== selectedCharName) {
                    item.style.backgroundColor = 'transparent';
                }
            });

            item.addEventListener('click', () => {
                // 이전 선택 제거
                charListContainer.querySelectorAll('div').forEach(div => {
                    div.style.backgroundColor = 'transparent';
                    div.style.borderLeftColor = 'transparent';
                });

                // 새로 선택
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
                selectedCharName = charName;

                // 단일칩 여부에 따라 초기값 설정
                const isBigChar = charName.includes('$');
                selectedCharIndex = isBigChar ? 0 : 0; // 단일칩이든 아니든 0부터 시작
                selectedPattern = 0;
                selectedDirection = 2;

                // 그리드 업데이트
                updateCharGrid();
            });

            charListContainer.appendChild(item);
        });

        characterPanel.appendChild(charListContainer);

        // Character 그리드
        const charGridContainer = document.createElement('div');
        charGridContainer.style.cssText = `
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: auto;
    `;

        const updateCharGrid = () => {
            charGridContainer.innerHTML = '';

            if (!selectedCharName) return;

            const isBigName = selectedCharName.includes('$');
            const img = new Image();

            img.onload = () => {
                const isBigName = selectedCharName.includes('$');

                // 캔버스 크기를 이미지 크기에 따라 결정
                let canvasWidth, canvasHeight, cellWidth, cellHeight, gridCols, gridRows;

                if (isBigName) {
                    // $문자: 3x4 단일 칩
                    cellWidth = Math.max(img.width / 3, 40);
                    cellHeight = Math.max(img.height / 4, 40);
                    gridCols = 3;
                    gridRows = 4;
                    canvasWidth = img.width;
                    canvasHeight = img.height;
                } else {
                    // 일반 캐릭터: 12x8 (4x2 캐릭터 배치 × 3x4 프레임)
                    cellWidth = 40;
                    cellHeight = 40;
                    gridCols = 12;
                    gridRows = 8;
                    canvasWidth = 480;
                    canvasHeight = 320;
                }

                const charCanvas = document.createElement('canvas');
                charCanvas.width = canvasWidth;
                charCanvas.height = canvasHeight;

                const ctx = charCanvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;

                // 이미지를 캔버스에 그리기
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

                // 그리드 선 그리기
                ctx.strokeStyle = '#4080ff80';
                ctx.lineWidth = 1;

                for (let i = 1; i < gridCols; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * cellWidth, 0);
                    ctx.lineTo(i * cellWidth, canvasHeight);
                    ctx.stroke();
                }

                for (let i = 1; i < gridRows; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, i * cellHeight);
                    ctx.lineTo(canvasWidth, i * cellHeight);
                    ctx.stroke();
                }

                // 현재 선택된 프레임 강조
                const drawSelection = () => {
                    if (isBigName) {
                        // $문자는 3x4 단일 캐릭터
                        const directionIndex = [2, 4, 6, 8].indexOf(selectedDirection);
                        const x = selectedPattern * cellWidth;
                        const y = directionIndex * cellHeight;

                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, cellWidth, cellHeight);
                    } else {
                        // 일반 캐릭터: 4x2 배치 + 3x4 프레임
                        const charCol = selectedCharIndex % 4;
                        const charRow = Math.floor(selectedCharIndex / 4);

                        const directionIndex = [2, 4, 6, 8].indexOf(selectedDirection);

                        const x = (charCol * 3 + selectedPattern) * cellWidth;
                        const y = (charRow * 4 + directionIndex) * cellHeight;

                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.strokeRect(x, y, cellWidth, cellHeight);
                    }
                };

                drawSelection();

                charCanvas.style.cssText = `
                border: 1px solid #ccc;
                cursor: pointer;
                image-rendering: pixelated;
            `;

                // 클릭 핸들러
                charCanvas.addEventListener('click', (e) => {
                    const rect = charCanvas.getBoundingClientRect();
                    const clientX = e.clientX - rect.left;
                    const clientY = e.clientY - rect.top;

                    // 캔버스의 실제 크기와 표시 크기 비율
                    const scaleX = canvasWidth / rect.width;
                    const scaleY = canvasHeight / rect.height;

                    // 캔버스 좌표로 변환
                    const canvasX = clientX * scaleX;
                    const canvasY = clientY * scaleY;

                    // 그리드에서의 셀 위치
                    let clickCol = Math.floor(canvasX / cellWidth);
                    let clickRow = Math.floor(canvasY / cellHeight);

                    // 범위 체크
                    clickCol = Math.max(0, Math.min(clickCol, gridCols - 1));
                    clickRow = Math.max(0, Math.min(clickRow, gridRows - 1));

                    if (isBigName) {
                        // $문자: 3x4 단일 캐릭터
                        selectedCharIndex = 0;
                        selectedPattern = clickCol;
                        selectedDirection = [2, 4, 6, 8][clickRow];
                    } else {
                        // 일반 캐릭터: 4x2 캐릭터 배치 × 3x4 프레임
                        const charCol = Math.floor(clickCol / 3);
                        const charRow = Math.floor(clickRow / 4);

                        selectedCharIndex = charRow * 4 + charCol;
                        selectedPattern = clickCol % 3;
                        selectedDirection = [2, 4, 6, 8][clickRow % 4];
                    }

                    updateCharGrid();
                });

                charGridContainer.appendChild(charCanvas);
            };

            img.onerror = () => {
                charGridContainer.innerHTML = '<div style="color: #999;">이미지를 불러올 수 없습니다.</div>';
            };

            img.src = `project/img/characters/${selectedCharName}.png`;
        };

        updateCharGrid();
        characterPanel.appendChild(charGridContainer);
        contentArea.appendChild(characterPanel);

        // Tileset 패널
        const tilesetPanel = document.createElement('div');
        tilesetPanel.style.cssText = `
        display: ${currentTab === 'tileset' ? 'flex' : 'none'};
        flex: 1;
        flex-direction: row;
        overflow: hidden;
    `;

        // 왼쪽: B, C, D 리스트
        const tileListContainer = document.createElement('div');
        tileListContainer.style.cssText = `
        width: 200px;
        border-right: 1px solid #555;
        overflow-y: auto;
        background-color: #1a1a1a;
    `;

        let selectedTileLayer = 'B';
        let selectedTileId = currentImage.type === 'tileset' ? (currentImage.tileId || 256) : 256;

        // B, C, D 리스트 항목
        ['B', 'C', 'D'].forEach(layer => {
            const item = document.createElement('div');
            item.textContent = `Layer ${layer}`;
            item.style.cssText = `
            padding: 10px 15px;
            color: #fff;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: background-color 0.2s;
        `;

            if (layer === selectedTileLayer) {
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
            }

            item.addEventListener('mouseenter', () => {
                if (layer !== selectedTileLayer) {
                    item.style.backgroundColor = '#2a2a2a';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (layer !== selectedTileLayer) {
                    item.style.backgroundColor = 'transparent';
                }
            });

            item.addEventListener('click', () => {
                // 이전 선택 제거
                tileListContainer.querySelectorAll('div').forEach(div => {
                    div.style.backgroundColor = 'transparent';
                    div.style.borderLeftColor = 'transparent';
                });

                // 새로 선택
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
                selectedTileLayer = layer;

                // 그리드 업데이트
                updateTileGrid();
            });

            tileListContainer.appendChild(item);
        });

        tilesetPanel.appendChild(tileListContainer);

        // 오른쪽: 타일 그리드
        const tileGridContainer = document.createElement('div');
        tileGridContainer.style.cssText = `
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        overflow: auto;
        background-color: #1a1a1a;
    `;

        const updateTileGrid = () => {
            tileGridContainer.innerHTML = '';

            // 레이어별 타일 범위
            const layerRanges = {
                'B': { start: 256, end: 512 },
                'C': { start: 512, end: 768 },
                'D': { start: 768, end: 1024 }
            };

            const range = layerRanges[selectedTileLayer];
            if (!range) return;

            const tileCanvas = document.createElement('canvas');
            const tileSelectionRect = document.createElement('div');

            tileSelectionRect.style.cssText = `
            position: absolute;
            border: 3px solid #4080ff;
            box-sizing: border-box;
            pointer-events: none;
        `;

            // 타일 이미지 로드
            const sampleTile = main.mapManager.loader.getNormalTile(range.start);
            if (!sampleTile || !sampleTile.img) {
                tileGridContainer.innerHTML = '<div style="color: #999;">타일을 불러올 수 없습니다.</div>';
                return;
            }

            const tilesetImg = sampleTile.img;
            const tileWidth = 48;
            const tileHeight = 48;
            const tilesPerRow = 16;
            const tilesInRange = range.end - range.start;
            const rowsInRange = Math.ceil(tilesInRange / tilesPerRow);

            tileCanvas.width = tilesetImg.width;
            tileCanvas.height = tilesetImg.height;
            const ctx = tileCanvas.getContext('2d');
            ctx.drawImage(tilesetImg, 0, 0);

            tileCanvas.style.cssText = `
            border: 1px solid #555;
            max-width: 100%;
            max-height: 100%;
            image-rendering: pixelated;
        `;

            // 선택 박스 위치 업데이트
            const updateTileSelection = () => {
                const canvasRect = tileCanvas.getBoundingClientRect();
                const scaleX = canvasRect.width / tilesetImg.width;
                const scaleY = canvasRect.height / tilesetImg.height;

                const relativeId = selectedTileId - range.start;
                const col = relativeId % tilesPerRow;
                const row = Math.floor(relativeId / tilesPerRow);

                const pixelX = col * tileWidth;
                const pixelY = row * tileHeight;

                tileSelectionRect.style.left = (pixelX * scaleX) + 'px';
                tileSelectionRect.style.top = (pixelY * scaleY) + 'px';
                tileSelectionRect.style.width = (tileWidth * scaleX) + 'px';
                tileSelectionRect.style.height = (tileHeight * scaleY) + 'px';
            };

            // 클릭 이벤트
            tileCanvas.addEventListener('click', (e) => {
                const rect = tileCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const scaleX = rect.width / tilesetImg.width;
                const scaleY = rect.height / tilesetImg.height;

                const col = Math.floor(x / (tileWidth * scaleX));
                const row = Math.floor(y / (tileHeight * scaleY));

                const relativeId = row * tilesPerRow + col;
                if (relativeId < tilesInRange) {
                    selectedTileId = range.start + relativeId;
                    updateTileSelection();
                }
            });

            const tileWrapper = document.createElement('div');
            tileWrapper.style.cssText = `
            position: relative;
            display: inline-block;
        `;

            tileWrapper.appendChild(tileCanvas);
            tileWrapper.appendChild(tileSelectionRect);
            tileGridContainer.appendChild(tileWrapper);

            // 초기 선택 박스 위치 설정
            setTimeout(updateTileSelection, 0);
        };

        updateTileGrid();
        contentArea.appendChild(tilesetPanel);

        // 탭 버튼 이벤트
        charTab.addEventListener('click', () => {
            currentTab = 'character';
            characterPanel.style.display = 'flex';
            tilesetPanel.style.display = 'none';
            charTab.style.backgroundColor = '#4a4a4a';
            tileTab.style.backgroundColor = '#3a3a3a';
        });

        tileTab.addEventListener('click', () => {
            currentTab = 'tileset';
            characterPanel.style.display = 'none';
            tilesetPanel.style.display = 'flex';
            tileTab.style.backgroundColor = '#4a4a4a';
            charTab.style.backgroundColor = '#3a3a3a';
        });

        if (currentTab === 'character') {
            charTab.style.backgroundColor = '#4a4a4a';
        } else {
            tileTab.style.backgroundColor = '#4a4a4a';
        }

        modalContainer.appendChild(contentArea);

        // 하단 버튼
        const buttonArea = document.createElement('div');
        buttonArea.style.cssText = `
        padding: 15px 20px;
        border-top: 1px solid #555;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    `;

        // 확인 버튼
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '확인';
        confirmBtn.style.cssText = `
        padding: 8px 20px;
        background-color: #4080ff;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        font-weight: bold;
    `;
        confirmBtn.addEventListener('click', () => {
            if (currentTab === 'character') {
                onSelect({
                    type: 'character',
                    name: selectedCharName,
                    index: selectedCharIndex,
                    pattern: selectedPattern,
                    direction: selectedDirection,
                    tileId: 0
                });
            } else {
                onSelect({
                    type: 'tileset',
                    name: '',
                    index: 0,
                    pattern: 0,
                    direction: 2,
                    tileId: selectedTileId
                });
            }
            document.body.removeChild(overlay);
        });
        buttonArea.appendChild(confirmBtn);

        // 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `
        padding: 8px 20px;
        background-color: #555;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
    `;
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        buttonArea.appendChild(cancelBtn);

        modalContainer.appendChild(buttonArea);

        // ESC 키로 닫기
        const escListener = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        overlay.appendChild(modalContainer);
        document.body.appendChild(overlay);
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
        const systemData = main.systemData || {};
        const switches = systemData.switches || [];

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

    // 변수 선택 모달
    showVariableSelector(currentVariableId, onSelect) {
        // 모달 오버레이
        const overlay = document.createElement('div');
        overlay.id = 'variable-selector-overlay';
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
        title.textContent = '변수 선택';
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

        // System.json에서 변수 데이터 로드
        const systemData = main.systemData || {};
        const variables = systemData.variables || [];

        let selectedVariableId = currentVariableId || 1;
        let currentRangeStart = 1;

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

                if (selectedVariableId >= i && selectedVariableId < i + 20) {
                    btn.style.backgroundColor = '#0066cc';
                    btn.style.borderColor = '#0052a3';
                    btn.style.color = 'white';
                }

                btn.addEventListener('click', () => {
                    currentRangeStart = i;
                    renderVariableList();
                });

                btn.addEventListener('mouseenter', () => {
                    if (!(selectedVariableId >= i && selectedVariableId < i + 20)) {
                        btn.style.backgroundColor = '#2a2a2a';
                        btn.style.borderColor = '#555';
                    }
                });

                btn.addEventListener('mouseleave', () => {
                    if (!(selectedVariableId >= i && selectedVariableId < i + 20)) {
                        btn.style.backgroundColor = '#1a1a1a';
                        btn.style.borderColor = '#333';
                    }
                });

                rangeButtonContainer.appendChild(btn);
            }
        };

        // 중앙: 변수 목록
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

        const variableList = document.createElement('ul');
        variableList.style.cssText = `
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
        listContainer.appendChild(variableList);

        // 변수 이름 수정 텍스트 박스
        const renameContainer = document.createElement('div');
        renameContainer.style.cssText = `
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    `;

        const renameInput = document.createElement('input');
        renameInput.type = 'text';
        renameInput.placeholder = '선택한 변수의 이름을 입력하세요';
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
            variables[selectedVariableId] = renameInput.value;
        });
        renameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                variables[selectedVariableId] = renameInput.value;
                renderVariableList();
            }
        });
        renameContainer.appendChild(renameInput);
        listContainer.appendChild(renameContainer);

        const renderVariableList = () => {
            variableList.innerHTML = '';
            const rangeEnd = Math.min(currentRangeStart + 19, 500);
            rangeLabel.textContent = `[ ${String(currentRangeStart).padStart(4, '0')} - ${String(rangeEnd).padStart(4, '0')} ]`;

            for (let i = currentRangeStart; i <= rangeEnd; i++) {
                const li = document.createElement('li');
                li.dataset.variableId = i;
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

                const variableName = variables[i] || '';
                const displayId = String(i).padStart(4, '0');
                const displayText = variableName ? `${displayId} ${variableName}` : displayId;

                li.textContent = displayText;

                if (i === selectedVariableId) {
                    li.style.backgroundColor = '#0066cc';
                    li.style.borderColor = '#0052a3';
                    li.style.color = 'white';
                    li.style.fontWeight = 'bold';
                }

                li.addEventListener('mouseenter', () => {
                    if (i !== selectedVariableId) {
                        li.style.backgroundColor = '#2a2a2a';
                        li.style.borderColor = '#555';
                    }
                });

                li.addEventListener('mouseleave', () => {
                    if (i !== selectedVariableId) {
                        li.style.backgroundColor = '#1a1a1a';
                        li.style.borderColor = '#333';
                    }
                });

                li.addEventListener('click', () => {
                    // 이전 선택의 변경사항 저장
                    variables[selectedVariableId] = renameInput.value;

                    selectedVariableId = i;

                    // 텍스트 박스 업데이트
                    renameInput.value = variables[selectedVariableId] || '';

                    // UI 전체 갱신
                    renderVariableList();

                    // 범위 버튼 업데이트
                    rangeButtonContainer.querySelectorAll('button').forEach(btn => {
                        const rangeStart = parseInt(btn.dataset.rangeStart);
                        if (selectedVariableId >= rangeStart && selectedVariableId < rangeStart + 20) {
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

                variableList.appendChild(li);
            }
        };

        createRangeButtons();
        renderVariableList();

        // 초기 선택된 변수의 이름 표시
        renameInput.value = variables[selectedVariableId] || '';

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
            variables[selectedVariableId] = renameInput.value;
            onSelect(selectedVariableId);
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
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        overlay.appendChild(modalContainer);
        document.body.appendChild(overlay);
    }

    createMoveRouteEditor(cmd, index, page) {
        this.showMoveRouteEditor(cmd.parameters[0], cmd.parameters[1], (characterId, moveRoute) => {
            cmd.parameters[0] = characterId;
            cmd.parameters[1] = moveRoute;
            this.editor.displayCommandList(page.list);
        });
    }

    showMoveRouteEditor(currentCharacterId, currentMoveRoute, onConfirm) {
        // 기본값 설정
        let characterId = currentCharacterId ?? -1;
        const moveRoute = JSON.parse(JSON.stringify(currentMoveRoute || {
            list: [{ code: 0, parameters: [] }],
            repeat: false,
            skippable: false,
            wait: false
        }));
        let selectedIndex = -1; // 선택된 명령 인덱스

        // 모달 오버레이
        const overlay = document.createElement('div');
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
        background-color: #2a2a2a;
        border: 2px solid #0066cc;
        border-radius: 6px;
        width: 90%;
        max-width: 900px;
        height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
    `;

        // 제목
        const title = document.createElement('div');
        title.textContent = '이동 루트 설정';
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

        // 컨텐츠 영역
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
        display: flex;
        flex: 1;
        overflow: hidden;
        padding: 16px;
        gap: 16px;
    `;

        // 왼쪽: 이동 명령 리스트
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

        const listLabel = document.createElement('div');
        listLabel.textContent = '이동 명령';
        listLabel.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 14px;
    `;
        leftPanel.appendChild(listLabel);

        const commandList = document.createElement('div');
        commandList.style.cssText = `
        flex: 1;
        background-color: #1a1a1a;
        border: 1px solid #555;
        border-radius: 4px;
        overflow-y: auto;
        padding: 4px;
    `;

        // 이동 명령 렌더링 함수
        const renderCommandList = () => {
            commandList.innerHTML = '';
            moveRoute.list.forEach((moveCmd, idx) => {
                const cmdItem = document.createElement('div');
                const isSelected = idx === selectedIndex;
                cmdItem.style.cssText = `
                padding: 6px 8px;
                background-color: ${isSelected ? '#4a6fa5' : '#2a2a2a'};
                border: 1px solid ${isSelected ? '#6a8fc5' : '#444'};
                border-radius: 3px;
                margin-bottom: 4px;
                color: #fff;
                font-size: 13px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
                cmdItem.textContent = this.editor.getMoveRouteCommandText(moveCmd.code, moveCmd.parameters);
                cmdItem.onclick = () => {
                    selectedIndex = idx;
                    renderCommandList();
                };
                cmdItem.onmouseover = () => {
                    if (!isSelected) cmdItem.style.backgroundColor = '#3a3a3a';
                };
                cmdItem.onmouseout = () => {
                    if (!isSelected) cmdItem.style.backgroundColor = '#2a2a2a';
                };
                commandList.appendChild(cmdItem);
            });
        };

        renderCommandList();
        leftPanel.appendChild(commandList);

        // 캐릭터 선택
        const characterPanel = document.createElement('div');
        characterPanel.style.cssText = `
        margin-top: 10px;
        padding: 8px;
        background-color: #1a1a1a;
        border: 1px solid #555;
        border-radius: 4px;
    `;

        const characterLabel = document.createElement('div');
        characterLabel.textContent = '대상 캐릭터:';
        characterLabel.style.cssText = `
        color: #aaa;
        font-size: 12px;
        margin-bottom: 4px;
    `;
        characterPanel.appendChild(characterLabel);

        const characterSelect = document.createElement('select');
        characterSelect.style.cssText = `
        width: 100%;
        padding: 4px;
        background-color: #2a2a2a;
        color: #fff;
        border: 1px solid #444;
        border-radius: 3px;
        font-size: 13px;
    `;

        // 캐릭터 옵션 추가
        const playerOption = document.createElement('option');
        playerOption.value = -1;
        playerOption.textContent = '플레이어';
        characterSelect.appendChild(playerOption);

        const thisEventOption = document.createElement('option');
        thisEventOption.value = 0;
        thisEventOption.textContent = '현재 이벤트';
        characterSelect.appendChild(thisEventOption);

        // 맵의 이벤트들 추가
        if (main.map.events) {
            main.map.events.forEach((event, idx) => {
                if (event && idx > 0) {
                    const option = document.createElement('option');
                    option.value = idx;
                    option.textContent = `${String(idx).padStart(3, '0')}: ${event.name || '(이름 없음)'}`;
                    characterSelect.appendChild(option);
                }
            });
        }

        characterSelect.value = characterId;
        characterSelect.onchange = () => {
            characterId = parseInt(characterSelect.value);
        };

        characterPanel.appendChild(characterSelect);
        leftPanel.appendChild(characterPanel);

        // 가운데: 이동 명령 버튼들
        const middlePanel = document.createElement('div');
        middlePanel.style.cssText = `
        flex: 2;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

        const commandsLabel = document.createElement('div');
        commandsLabel.textContent = '이동 명령';
        commandsLabel.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 14px;
    `;
        middlePanel.appendChild(commandsLabel);

        const commandButtonsArea = document.createElement('div');
        commandButtonsArea.style.cssText = `
        flex: 1;
        background-color: #1a1a1a;
        border: 1px solid #555;
        border-radius: 4px;
        overflow-y: auto;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        align-content: start;
    `;

        // 이동 명령 목록 정의
        const moveCommands = [
            { code: 1, label: '아래로 이동' },
            { code: 2, label: '왼쪽으로 이동' },
            { code: 3, label: '오른쪽으로 이동' },
            { code: 4, label: '위로 이동' },
            { code: 5, label: '좌측으로 이동' },
            { code: 6, label: '우측으로 이동' },
            { code: 7, label: '좌측 상단으로 이동' },
            { code: 8, label: '우측 상단으로 이동' },
            { code: 9, label: '랜덤으로 이동' },
            { code: 10, label: '플레이어에게로 이동' },
            { code: 11, label: '플레이어에서 멀어지기' },
            { code: 12, label: '한걸음 앞으로' },
            { code: 13, label: '한걸음 뒤로' },
            { code: 14, label: '점프...' },
            { code: 15, label: '대기...' },
            { code: 16, label: '방향 변경 아래' },
            { code: 17, label: '방향 변경 왼쪽' },
            { code: 18, label: '방향 변경 오른쪽' },
            { code: 19, label: '방향 변경 위' },
            { code: 20, label: '90° 우측 돌리기' },
            { code: 21, label: '90° 좌측 돌리기' },
            { code: 22, label: '180° 돌리기' },
            { code: 23, label: '90° 우측 또는 좌측 돌리기' },
            { code: 24, label: '무작위로 돌리기' },
            { code: 25, label: '플레이어의 반대쪽 바라보기' },
            { code: 26, label: '플레이어와 반대 방향 변경' },
            { code: 27, label: '스위치 ON...' },
            { code: 28, label: '스위치 OFF...' },
            { code: 29, label: '속도 변경...' },
            { code: 30, label: '빈도 변경...' },
            { code: 33, label: '투명 상태 ON' },
            { code: 34, label: '투명 상태 OFF' },
            { code: 35, label: '애니메이션 ON' },
            { code: 36, label: '애니메이션 OFF' },
            { code: 37, label: '정지 애니메이션 ON' },
            { code: 38, label: '정지 애니메이션 OFF' },
            { code: 39, label: '방향 고정 ON' },
            { code: 40, label: '방향 고정 OFF' },
            { code: 41, label: '통과 ON' },
            { code: 42, label: '통과 OFF' },
            { code: 43, label: '이미지 변경...' },
            { code: 44, label: '불투명도 변경...' },
            { code: 45, label: '합성 방법 변경...' },
            { code: 0, label: '' }
        ];

        moveCommands.forEach(mc => {
            if (mc.label === '') return; // 빈 항목 제외

            const btn = document.createElement('button');
            btn.textContent = mc.label;
            btn.style.cssText = `
            padding: 8px;
            background-color: #3a3a3a;
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
            btn.onmouseover = () => btn.style.backgroundColor = '#4a4a4a';
            btn.onmouseout = () => btn.style.backgroundColor = '#3a3a3a';
            btn.onclick = () => {
                // 이동 명령 추가
                const newCmd = { code: mc.code, parameters: [] };

                // 0 코드(종료)가 없으면 추가
                if (moveRoute.list.length === 0 || moveRoute.list[moveRoute.list.length - 1].code !== 0) {
                    moveRoute.list.push({ code: 0, parameters: [] });
                }

                // 선택된 위치가 있으면 그 위에 삽입, 없으면 마지막 0 코드 앞에 삽입
                let insertIndex;
                if (selectedIndex >= 0 && selectedIndex < moveRoute.list.length) {
                    insertIndex = selectedIndex;
                } else {
                    insertIndex = moveRoute.list.length - 1;
                }

                moveRoute.list.splice(insertIndex, 0, newCmd);
                // 선택된 위치가 있었다면 +1 하여 원래 선택된 명령 유지
                if (selectedIndex >= 0) {
                    selectedIndex = insertIndex + 1;
                }
                renderCommandList();
            };
            commandButtonsArea.appendChild(btn);
        });

        middlePanel.appendChild(commandButtonsArea);

        // 오른쪽: 옵션
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
        width: 200px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

        const optionsLabel = document.createElement('div');
        optionsLabel.textContent = '옵션';
        optionsLabel.style.cssText = `
        color: #fff;
        font-weight: bold;
        font-size: 14px;
    `;
        rightPanel.appendChild(optionsLabel);

        const optionsArea = document.createElement('div');
        optionsArea.style.cssText = `
        background-color: #1a1a1a;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    `;

        // 동작 반복 체크박스
        const repeatContainer = document.createElement('label');
        repeatContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    `;
        const repeatCheckbox = document.createElement('input');
        repeatCheckbox.type = 'checkbox';
        repeatCheckbox.checked = moveRoute.repeat;
        repeatCheckbox.style.cssText = `
        width: 18px;
        height: 18px;
        cursor: pointer;
    `;
        repeatCheckbox.onchange = () => moveRoute.repeat = repeatCheckbox.checked;
        repeatContainer.appendChild(repeatCheckbox);
        const repeatLabel = document.createElement('span');
        repeatLabel.textContent = '동작 반복';
        repeatContainer.appendChild(repeatLabel);
        optionsArea.appendChild(repeatContainer);

        // 움직일수없을땐 스킵
        const skippableContainer = document.createElement('label');
        skippableContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    `;
        const skippableCheckbox = document.createElement('input');
        skippableCheckbox.type = 'checkbox';
        skippableCheckbox.checked = moveRoute.skippable;
        skippableCheckbox.style.cssText = `
        width: 18px;
        height: 18px;
        cursor: pointer;
    `;
        skippableCheckbox.onchange = () => moveRoute.skippable = skippableCheckbox.checked;
        skippableContainer.appendChild(skippableCheckbox);
        const skippableLabel = document.createElement('span');
        skippableLabel.textContent = '움직일수없을땐 스킵';
        skippableContainer.appendChild(skippableLabel);
        optionsArea.appendChild(skippableContainer);

        // 완료될때까지 대기
        const waitContainer = document.createElement('label');
        waitContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    `;
        const waitCheckbox = document.createElement('input');
        waitCheckbox.type = 'checkbox';
        waitCheckbox.checked = moveRoute.wait;
        waitCheckbox.style.cssText = `
        width: 18px;
        height: 18px;
        cursor: pointer;
    `;
        waitCheckbox.onchange = () => moveRoute.wait = waitCheckbox.checked;
        waitContainer.appendChild(waitCheckbox);
        const waitLabel = document.createElement('span');
        waitLabel.textContent = '완료될때까지 대기';
        waitContainer.appendChild(waitLabel);
        optionsArea.appendChild(waitContainer);

        rightPanel.appendChild(optionsArea);

        contentArea.appendChild(leftPanel);
        contentArea.appendChild(middlePanel);
        contentArea.appendChild(rightPanel);
        modalContainer.appendChild(contentArea);

        // 버튼 영역
        const buttonArea = document.createElement('div');
        buttonArea.style.cssText = `
        padding: 12px 16px;
        border-top: 1px solid #555;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        flex-shrink: 0;
    `;

        // OK 버튼
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
        padding: 8px 24px;
        background-color: #0066cc;
        border: 1px solid #0052a3;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
    `;
        okBtn.onmouseover = () => okBtn.style.backgroundColor = '#0052a3';
        okBtn.onmouseout = () => okBtn.style.backgroundColor = '#0066cc';
        okBtn.onclick = () => {
            onConfirm(characterId, moveRoute);
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escListener);
        };
        buttonArea.appendChild(okBtn);

        // 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `
        padding: 8px 24px;
        background-color: #3a3a3a;
        border: 1px solid #555;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
    `;
        cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#4a4a4a';
        cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#3a3a3a';
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            document.removeEventListener('keydown', escListener);
        };
        buttonArea.appendChild(cancelBtn);

        modalContainer.appendChild(buttonArea);

        // ESC 키로 닫기
        const escListener = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        overlay.appendChild(modalContainer);
        document.body.appendChild(overlay);
    }
}


/**
 * FieldEditor 기본 클래스
 * 각 필드 타입별로 상속받아 구현
 */
class FieldEditor {
    constructor(field, cmdObj) {
        this.field = field;
        this.cmdObj = cmdObj;
        this.value = null;
        this._htmlElement = this.createHtml(); // constructor에서 즉시 생성
    }

    /**
     * HTML 요소 생성 (반드시 구현)
     */
    createHtml() {
        throw new Error('createHtml must be implemented');
    }

    /**
     * HTML 요소 반환
     */
    get html() {
        return this._htmlElement;
    }

    /**
     * UI 업데이트
     */
    update() {
        throw new Error('update must be implemented');
    }
}

/**
 * 숫자 입력 필드
 */
class NumberFieldEditor extends FieldEditor {
    constructor(field, cmdObj) {
        super(field, cmdObj);
        this.value = 0;
    }
    createHtml() {
        const input = document.createElement('input');
        input.type = 'number';
        if (this.field.min !== undefined) input.min = this.field.min;
        if (this.field.max !== undefined) input.max = this.field.max;
        input.style.cssText = `width: 100%; padding: 8px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 13px;`;
        input.addEventListener('input', (e) => {
            this.value = parseInt(e.target.value) || 0;
        });
        return input;
    }

    update() {
        this.html.value = this.value ?? 0;
    }
}

/**
 * 텍스트 입력 필드
 */
class TextFieldEditor extends FieldEditor {
    createHtml() {
        const input = document.createElement('input');
        input.type = 'text';
        input.style.cssText = `width: 100%; padding: 8px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 13px;`;
        input.addEventListener('input', (e) => {
            this.value = e.target.value;
        });
        return input;
    }

    update() {
        this.html.value = this.value ?? '';
    }
}

/**
 * 선택 필드 (드롭다운)
 */
class SelectFieldEditor extends FieldEditor {

    getOptions() {
        return this.field.options || [];
    }

    createHtml() {
        const select = document.createElement('select');
        select.style.cssText = `width: 100%; padding: 8px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 13px;`;
        this.getOptions().forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            select.appendChild(option);
        });
        select.addEventListener('change', (e) => {
            this.value = parseInt(e.target.value);
        });
        return select;
    }

    update() {
        // this.value에 따라 선택된 값 설정
        Array.from(this.html.options).forEach(option => {
            if (option.value == this.value) {
                option.selected = true;
            }
        });
    }
}

class SelectAni extends SelectFieldEditor {
    getOptions() {
        return [
            ...(main.animationsData.map((e, i) => i > 0 ? {
                value: i,
                label: e.name
            } : null).filter(Boolean))
        ]
    }
}
class SelectSpeed extends SelectFieldEditor {
    getOptions() {
        return [
            { value: 1, label: '1: 가장 느림' },
            { value: 2, label: '2: 느림' },
            { value: 3, label: '3: 보통' },
            { value: 4, label: '4: 빠름' },
            { value: 5, label: '5: 더 빠름' },
            { value: 6, label: '6: 가장 빠름' }
        ]
    }
}
class SelectDirection extends SelectFieldEditor {
    getOptions() {
        return [
            { value: 2, label: '아래' },
            { value: 4, label: '왼쪽' },
            { value: 6, label: '오른쪽' },
            { value: 8, label: '위' }
        ]
    }
}
class SelectCharacter extends SelectFieldEditor {
    getOptions() {
        return [
            { value: -1, label: '플레이어' },
            { value: 0, label: '현재 이벤트' },
            ...((em.map.events || []).map((e, i) => i > 0 ? {
                value: i,
                label: `${String(i).padStart(3, '0')}: ${e?.name || '(이름 없음)'}`
            } : null).filter(Boolean))
        ]
    }
}
class SelectBalloon extends SelectFieldEditor {
    getOptions() {
        return [
            { value: 1, label: '느낌표' },
            { value: 2, label: '물음표' },
            { value: 3, label: '음표' },
            { value: 4, label: '하트' },
            { value: 5, label: '분노' },
            { value: 6, label: '땀' },
            { value: 7, label: '뒤죽박죽' },
            { value: 8, label: '침묵' },
            { value: 9, label: '전구' },
            { value: 10, label: 'Zzz' },
            { value: 11, label: '사용자 정의 1' },
            { value: 12, label: '사용자 정의 2' },
            { value: 13, label: '사용자 정의 3' },
            { value: 14, label: '사용자 정의 4' }
        ]
    }
}

/**
 * 체크박스 필드
 */
class CheckboxFieldEditor extends FieldEditor {
    createHtml() {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.style.cssText = `width: 18px; height: 18px; cursor: pointer;`;
        input.addEventListener('change', (e) => {
            this.value = e.target.checked;
        });
        return input;
    }

    update() {
        this.html.checked = !!this.value;
    }
}

/**
 * 토글 버튼 필드
 */
class ToggleFieldEditor extends FieldEditor {
    createHtml() {
        const btn = document.createElement('button');
        btn.style.cssText = `padding: 8px 16px; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 13px; transition: background-color 0.2s;`;
        btn.onclick = () => {
            this.value = this.value === 0 ? 1 : 0;
            this.update();
        };
        return btn;
    }

    update() {
        const isOn = this.value === 0;
        this.html.textContent = isOn ? 'ON' : 'OFF';
        this.html.style.backgroundColor = isOn ? '#4CAF50' : '#f44336';
    }
}

/**
 * 스위치 선택 필드
 */
class SwitchFieldEditor extends FieldEditor {
    createHtml() {
        const btn = document.createElement('button');
        btn.style.cssText = `width: 100%; padding: 10px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 13px; text-align: left; transition: background-color 0.2s;`;
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#4a4a4a');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#3a3a3a');
        btn.onclick = () => {
            em.showSwitchSelector(this.value || 1, (newId) => {
                this.value = newId;
                this.update();
            });
        };
        return btn;
    }

    update() {
        const id = this.value ?? 1;
        const name = em?.getSwitchName?.(id) || '';
        this.html.textContent = `#${String(id).padStart(4, '0')} ${name}`;
    }
}

/**
 * 변수 선택 필드
 */
class VariableFieldEditor extends FieldEditor {
    constructor(field, cmdObj) {
        super(field, cmdObj);
        this.value = 1
    }
    createHtml() {
        const btn = document.createElement('button');
        btn.style.cssText = `width: 100%; padding: 10px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 13px; text-align: left; transition: background-color 0.2s;`;
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#4a4a4a');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#3a3a3a');
        btn.onclick = () => {
            em.showVariableSelector(this.value || 1, (newId) => {
                this.value = newId;
                this.update();
            });
        };
        return btn;
    }

    update() {
        const id = this.value ?? 1;
        const name = em?.getVariableName?.(id) || '';
        this.html.textContent = `#${String(id).padStart(4, '0')} ${name}`;
    }
}

/**
 * 얼굴 이미지 선택 필드
 */
class FaceSelectorFieldEditor extends FieldEditor {
    constructor(field, cmdObj) {
        super(field, cmdObj);
        this.faceName = '';
        this.faceIndex = 0;
    }
    createHtml() {
        console.log("create")
        const btn = document.createElement('button');
        btn.style.cssText = `display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 13px; text-align: left; transition: background-color 0.2s;`;

        const preview = document.createElement('canvas');
        preview.width = 144;
        preview.height = 144;
        preview.style.cssText = `border: 1px solid #555; background-color: #1a1a1a; flex-shrink: 0;`;
        this.preview = preview;

        const label = document.createElement('span');
        this.label = label;

        btn.appendChild(preview);
        btn.appendChild(label);

        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#4a4a4a');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#3a3a3a');
        btn.onclick = () => {
            em.showFaceSelector(this.value || { name: '', index: 0 }, (newFace) => {
                this.value = newFace;
                this.faceName = newFace.name;
                this.faceIndex = newFace.index;
                this.update();
            });
        };

        return btn;
    }

    update() {
        this.label.textContent = this.faceName ? `${this.faceName} [${this.faceIndex}]` : '얼굴 선택...';

        const ctx = this.preview.getContext('2d');
        ctx.clearRect(0, 0, 144, 144);
        if (!this.faceName) return;

        const img = new Image();
        img.onload = () => {
            const w = img.width / 4, h = img.height / 2;
            ctx.drawImage(img, (this.faceIndex % 4) * w, Math.floor(this.faceIndex / 4) * h, w, h, 0, 0, 144, 144);
        };
        img.src = `project/img/faces/${this.faceName}.png`;
    }
}

/**
 * 메시지 텍스트 필드 (멀티라인)
 */
class MessageTextFieldEditor extends FieldEditor {
    createHtml() {
        const textarea = document.createElement('textarea');
        textarea.placeholder = '메시지를 입력하세요...';
        textarea.style.cssText = `width: 100%; height: 150px; padding: 8px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-family: monospace; font-size: 13px; resize: vertical;`;
        textarea.addEventListener('input', (e) => {
            this.value = e.target.value;
        });
        return textarea;
    }

    update() {
        this.html.value = this.value ?? '';
    }
}

/**
 * 선택지 목록 필드
 */
class ChoiceListFieldEditor extends FieldEditor {
    constructor(field, cmdObj) {
        super(field, cmdObj);
        this.inputs = [];
    }

    createHtml() {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

        for (let i = 0; i < (this.field.maxChoices || 6); i++) {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            const numLabel = document.createElement('label');
            numLabel.textContent = `#${i + 1}:`;
            numLabel.style.cssText = 'width: 30px; color: #999; font-size: 11px;';

            const input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = `flex: 1; padding: 6px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 12px;`;
            input.addEventListener('input', () => {
                this.value = this.inputs.map(inp => inp.value).filter(v => v !== '');
            });

            this.inputs.push(input);
            row.appendChild(numLabel);
            row.appendChild(input);
            container.appendChild(row);
        }

        return container;
    }

    update() {
        const choices = Array.isArray(this.value) ? this.value : [];
        this.inputs.forEach((input, i) => {
            input.value = choices[i] || '';
        });
    }
}
