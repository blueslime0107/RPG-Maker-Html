
class EventEditor {
    constructor() {
        this.event = null; // 현재 선택된 이벤트 보관
        this.page = null;
        this.condition = null
        this.cmdList = null;
        this.pageIndex = 0; // 현재 페이지 인덱스 초기화
        this.editor = new EventCodeEditor(document.getElementById('ins-contents-list')); // EventEditor 인스턴스 (독립적으로 생성)
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
        this.event = null; // 현재 선택된 이벤트
        this.pageIndex = 0; // 현재 페이지 인덱스
        this.initClickEvent()
        this.initDragEvent();
        this.initInspectorTabs();
        this.initInspectorButtons();
        this.initFontSizeControl();
    }

    init(){
        // 탭 버튼 클릭 리스너 등록
        this.initInspector()
        const settingBtn = document.querySelector('[data-tab="setting"]');
        const commandsBtn = document.querySelector('[data-tab="commands"]');
        settingBtn.onclick = () => this.switchContentTab('setting');
        commandsBtn.onclick = () => this.switchContentTab('commands');
    }

    initInspector(){

//         conditions: {actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: undefined, …}
// directionFix: false
// image: characterName: 'Actor1', characterIndex: 2, pattern: 1, direction: 2, tileId: 0}
// list: (3) [{…}, {…}, {…}]
// moveFrequency: 3
// moveRoute: {list: Array(1), repeat: true, skippable: false, wait: false}
// moveSpeed: 3
// moveType: 0
// priorityType: 1
// stepAnime: false
// through: false
// trigger: 0
// walkAnime: true
        // 스위치 컨테이너 초기화
        const switchContainer = document.getElementById('ins-switch');
        switchContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 8px;
        `;

        switchContainer.appendChild((() => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
                color: #fff;
                font-size: 13px;
            `;
            this.switch1Toggle = new CheckboxFieldEditor({
                label: '스위치1',
                change: (value) => {
                    this.condition.switch1Valid = value;
                    this.switch1Field.toggleValiable(value);
                }
            });
            this.switch1Field = new SwitchFieldEditor({
                change: (value) => { this.condition.switch1Id = value; },
                valiable: false
            });
            container.appendChild(this.switch1Toggle.html);
            container.appendChild(this.switch1Field.html);
            return container;
        })());
        switchContainer.appendChild((() => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
                color: #fff;
                font-size: 13px;
            `;
            this.switch2Toggle = new CheckboxFieldEditor({
                label: '스위치2',
                change: (value) => {
                    this.condition.switch2Valid = value;
                    this.switch2Field.toggleValiable(value);
                }
            });
            this.switch2Field = new SwitchFieldEditor({
                change: (value) => { this.condition.switch2Id = value; },
                valiable: false
            });
            container.appendChild(this.switch2Toggle.html);
            container.appendChild(this.switch2Field.html);
            return container;
        })());
        switchContainer.appendChild((() => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
                color: #fff;
                font-size: 13px;
            `;
            this.selfSwitchToggle = new CheckboxFieldEditor({
                label: '셀프 스위치',
                change: (value) => {
                    this.condition.selfSwitchValid = value;
                    this.selfSwitchField.toggleValiable(value);
                }
            });
            this.selfSwitchField = new SelectFieldEditor({
                options: ['A', 'B', 'C', 'D'],
                valiable: false,
                change: (value) => { 
                    this.condition.selfSwitchCh = this.selfSwitchField.options[value]; 
                },
            });
            container.appendChild(this.selfSwitchToggle.html);
            container.appendChild(this.selfSwitchField.html);
            return container;
        })());
        switchContainer.appendChild((() => {
            const container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 8px;
                color: #fff;
                font-size: 13px;
            `;
            this.variableToggle = new CheckboxFieldEditor({
                label: '변수',
                change: (value) => {
                    this.condition.variableValid = value;
                    this.variableField.toggleValiable(value);
                    this.varNumField.toggleValiable(value);
                }
            });
            container.appendChild(this.variableToggle.html);

            // 두 번째 행: variableField, ">=", varNumField
            const row2 = document.createElement('div');
            row2.style.cssText = `
                display: flex;
                gap: 8px;
                align-items: center;
            `;

            this.variableField = new VariableFieldEditor({
                valiable: false,
                change: (value) => { this.condition.variableId = value; }
            });
            this.variableField.html.style.flex = '1';
            row2.appendChild(this.variableField.html);

            const geLabel = document.createElement('span');
            geLabel.textContent = '>=';
            geLabel.style.cssText = `
                color: #fff;
                font-size: 13px;
                flex-shrink: 0;
            `;
            row2.appendChild(geLabel);

            this.varNumField = new NumberFieldEditor({
                valiable: false,
                change: (value) => { this.condition.variableValue = value; }
            });
            this.varNumField.html.style.flex = '1';
            row2.appendChild(this.varNumField.html);

            container.appendChild(row2);
            return container;
        })());
        
        const characterContainer = document.getElementById('ins-preview');
        characterContainer.appendChild((() => {
            this.charSelecter = new CharacterEditor({
                change: (value) => {
                    this.page.image = value
                    if(this.pageIndex == 0){
                        mapViewer.renderEvent()
                    }
                }
            })
            return this.charSelecter.html;
        })());

        const optionContainer = document.getElementById('ins-option');
        optionContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 8px;
        `;
        optionContainer.appendChild((() => {
            this.stepAnimeToggle = new CheckboxFieldEditor({
                label: '보행 움직임',
                change: (value) => {
                    this.page.stepAnime = value;
                }
            })
            return this.stepAnimeToggle.html;
        })());
        optionContainer.appendChild((() => {
            this.walkAnimeToggle = new CheckboxFieldEditor({
                label: '제자리 움직임',
                change: (value) => {
                    this.page.walkAnime = value;
                }
            })
            return this.walkAnimeToggle.html;
        })());
        optionContainer.appendChild((() => {
            this.directionFixToggle = new CheckboxFieldEditor({
                label: '방향 고정',
                change: (value) => {
                    this.page.directionFix = value;
                }
            })
            return this.directionFixToggle.html;
        })());
        optionContainer.appendChild((() => {
            this.throughToggle = new CheckboxFieldEditor({
                label: '통과',
                change: (value) => {
                    this.page.through = value;
                }
            })
            return this.throughToggle.html;
        })());
        
        const toggleContainer = document.getElementById('ins-toggle');
        toggleContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 8px;
        `;
        toggleContainer.append(...(() => {
            this.priorityTypeSelect = new SelectFieldEditor({
                label: '우선권',
                options: ['아래', '동일', '위'],
                change: (value) => {
                    this.page.priorityType = value;
                }
            })
            this.priorityTypeSelect.html.style.cssText += `grid-column: span 2;`
            
            this.triggerSelect = new SelectFieldEditor({
                label: '발동',
                options: ['결정키', '플레이어 접근', '이벤트 접근', '자동 실행', '병렬 처리'],
                change: (value) => {
                    this.page.trigger = value;
                }
            })
            this.triggerSelect.html.style.cssText += `grid-column: span 2;`

            this.moveTypeSelect = new SelectFieldEditor({
                label: '이동방식',
                options: ['고정', '랜덤', '접근', '커스텀'],
                change: (value) => {
                    this.page.moveType = value;
                }
            })
            this.moveCustomButton = new SelectFieldEditor({
                label: '발동',
                options: ['결정키', '플레이어 접근', '이벤트 접근', '자동 실행', '병렬 처리'],
                change: (value) => {
                    this.page.moveType = value;
                }
            })
            this.moveSpeedSelect = new SelectSpeed({
                label: '속도',
                change: (value) => {
                    this.page.moveSpeed = value;
                }
            })
            this.moveFrequencySelect = new SelectFrequency({
                label: '빈도',
                change: (value) => {
                    this.page.moveFrequency = value;
                }
            })


            return [this.priorityTypeSelect.html, this.triggerSelect.html, this.moveTypeSelect.html, this.moveCustomButton.html, this.moveSpeedSelect.html, this.moveFrequencySelect.html];
        })());
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
            this.editor.displayCommandList(this.page.list);
        }
    }

    // 인스펙터에 데이터 로드
    showInspector(event) {
        console.log("shoiw")
        this.event = event; // 현재 선택된 이벤트 보관
        this.pageIndex = 0; // 현재 페이지 인덱스 초기화

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
    }
    // 페이지 데이터 로드
    loadPageToInspector(event, pageIndex) {
        this.page = event.pages[pageIndex];
        this.pageIndex = pageIndex;
        this.condition = this.page.conditions

        this.switch1Field.onChange(this.condition.switch1Id)
        this.switch1Toggle.onChange(this.condition.switch1Valid)
        this.switch2Field.onChange(this.condition.switch2Id)
        this.switch2Toggle.onChange(this.condition.switch2Valid)
        let index = ['A','B','C','D'].indexOf(this.condition.selfSwitchCh)
        console.log(index)
        this.selfSwitchField.onChange(index)
        this.selfSwitchToggle.onChange(this.condition.selfSwitchValid)
        this.variableField.onChange(this.condition.variableId)
        this.variableToggle.onChange(this.condition.variableValid)
        this.varNumField.onChange(this.condition.variableValue)
        this.charSelecter.onChange(this.page.image)
        this.stepAnimeToggle.onChange(this.page.stepAnime)
        this.walkAnimeToggle.onChange(this.page.walkAnime)
        this.directionFixToggle.onChange(this.page.directionFix)
        this.throughToggle.onChange(this.page.through)
        this.priorityTypeSelect.onChange(this.page.priorityType)
        this.triggerSelect.onChange(this.page.trigger)
        this.moveTypeSelect.onChange(this.page.moveType)
        this.moveSpeedSelect.onChange(this.page.moveSpeed)
        this.moveFrequencySelect.onChange(this.page.moveFrequency)
    }
    hideInspector(){
        this.event = null;
        document.getElementById('inspector-main').style.display = 'none';
        document.getElementById('inspector-empty').style.display = 'block';
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



    // 인스펙터 버튼 이벤트 초기화
    initInspectorButtons() {
        // 새로 만들기 버튼
        const newBtn = document.getElementById('ins-btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                if (!this.event || this.pageIndex === undefined) return;
                const page = this.event.pages[this.pageIndex];
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
                if (!this.selectedCommand || !this.event || this.pageIndex === undefined) return;
                const page = this.event.pages[this.pageIndex];
                if (!page) return;
                this.editor.pasteCommand(this.selectedCommand.index, page.list);
            });
        }

        // 삭제 버튼
        const deleteBtn = document.getElementById('ins-btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (!this.selectedCommand || !this.event || this.pageIndex === undefined) return;
                if (this.selectedCommand.cmd.code === 0) return; // 빈 코드는 삭제 불가
                const page = this.event.pages[this.pageIndex];
                if (!page) return;
                this.editor.deleteCommand(this.selectedCommand.index, page.list);
            });
        }

        // 비우기 버튼
        const clearBtn = document.getElementById('ins-btn-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (!this.event || this.pageIndex === undefined) return;
                const page = this.event.pages[this.pageIndex];
                if (!page) return;
                if (!confirm('모든 실행 내용을 삭제하시겠습니까?')) return;
                page.list = [{ code: 0, indent: 0, parameters: [] }];
                this.editor.displayCommandList(page.list);
            });
        }
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


    // 캐릭터 미리보기 그리기
    // drawCharacterPreview(ctx, img, info) {
    //     let characterName = info.characterName;

    //     const isBig = characterName.includes('$');

    //     // direction과 pattern 반영
    //     const direction = info.direction || 2; // 기본값: 아래(2)
    //     const pattern = info.pattern !== undefined ? info.pattern : (isBig ? 0 : 1); // 단일칩은 0, 일반은 1

    //     if (isBig) {
    //         // 단일칩 처리: 3x4 (pattern x direction)
    //         const charW = img.width / 3;
    //         const charH = img.height / 4;

    //         const directionIndex = [2, 4, 6, 8].indexOf(direction);
    //         const sx = pattern * charW;
    //         const sy = directionIndex * charH;

    //         ctx.drawImage(img, sx, sy, charW, charH, -24, -24, charW, charH);
    //     } else {
    //         // 일반 캐릭터 처리: 12x8 (4x2 캐릭터 배치 × 3x4 패턴)
    //         const charW = img.width / 12;
    //         const charH = img.height / 8;
    //         const col = info.characterIndex % 4;
    //         const row = Math.floor(info.characterIndex / 4);

    //         const directionIndex = [2, 4, 6, 8].indexOf(direction);
    //         const sx = (col * 3 + pattern) * charW;
    //         const sy = (row * 4 + directionIndex) * charH;

    //         ctx.drawImage(img, sx, sy, charW, charH, 24, 24, 48, 48);
    //     }
    // }

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
