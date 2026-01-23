/**
 * EventEditor.js
 * 이벤트 코드 편집 기능을 담당하는 클래스
 */
class Command {
    constructor(cmd, index, list) {
        this.cmd = cmd;
        this.index = index;
        this.list = list;
    }

    get code() {
        return this.cmd.code;
    }

    get indent() {
        return this.cmd.indent;
    }

    get parameters() {
        return this.cmd.parameters;
    }

    set parameters(value) {
        this.cmd.parameters = value;
    }

    /**
     * 특정 인덱스부터 특정 코드를 찾아서 인덱스 반환
     * @param {number} targetCode - 찾을 코드
     * @param {boolean} inclusive - true면 찾은 인덱스+1 반환, false면 찾은 인덱스 반환
     * @returns {number} 찾은 인덱스 (못 찾으면 list.length)
     */
    findNextCode(targetCode, inclusive = true) {
        const startIndex = this.index + 1;

        for (let i = startIndex; i < this.list.length; i++) {
            if (this.list[i].code === targetCode) {
                return inclusive ? i + 1 : i;
            }
        }
        return this.list.length;
    }

    /**
     * 특정 인덱스부터 연속된 특정 코드들을 모두 수집
     * @param {number} targetCode - 수집할 코드
     * @returns {Array<Object>} 수집된 커맨드 객체들
     */
    collectCodes(targetCode) {
        const startIndex = this.index + 1;

        const collected = [];
        for (let i = startIndex; i < this.list.length; i++) {
            if (this.list[i].code === targetCode) {
                collected.push(this.list[i]);
            } else {
                break;
            }
        }
        return collected;
    }

    /**
     * 특정 인덱스부터 연속된 특정 코드의 개수를 세기
     * @param {number} targetCode - 셀 코드
     * @returns {number} 연속된 코드의 개수
     */
    countConsecutiveCodes(targetCode) {
        const startIndex = this.index + 1;

        let count = 0;
        for (let i = startIndex; i < this.list.length; i++) {
            if (this.list[i].code === targetCode) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    /**
     * 연속된 코드들을 제거
     * @param {number} targetCode - 제거할 코드
     * @returns {number} 제거된 개수
     */
    removeCodes(targetCode) {
        const startIndex = this.index + 1;

        const count = this.countConsecutiveCodes(targetCode);
        if (count > 0) {
            this.list.splice(startIndex, count);
        }
        return count;
    }

    /**
     * 현재 위치부터 위로 올라가면서 특정 코드를 찾아서 커맨드 반환
     * @param {number} targetCode - 찾을 코드
     * @returns {Object|null} 찾은 커맨드 객체 (못 찾으면 null)
     */
    findParentCode(targetCode) {
        const startIndex = this.index - 1;

        for (let i = startIndex; i >= 0; i--) {
            if (this.list[i].code === targetCode) {
                return this.list[i];
            }
        }
        return null;
    }
}

class EventEditor {
    /**
     * 커맨드 편집
     */
    editCommand(cmd, index, page) {
        // 빈 코드(0)인 경우 코드 리스트 표시
        if (cmd.code === 0) {
            this.showCommandList(index, page);
            return;
        }

        // 정의 시스템에서 편집기 찾기
        const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
        console.log(`편집 시작 ID: ${cmd.code}(${definition.name})`)

        // editorFields가 정의되어 있으면 범용 편집기 사용
        if (definition && definition.editorFields) {
            this.createGenericEditor(cmd, index, page, definition);
            return;
        }
        else if (cmd.code == 205) {
            this.createMoveRouteEditor(cmd, index, page)
        }
        else {
            console.log('편집 미구현:', cmd.code);
        }
    }

    /**
     * 범용 에디터 생성 (editorFields 기반)
     */
    createGenericEditor(cmd, index, page, definition) {
        const cmdObj = new Command(cmd, index, page.list);

        // 1단계: FieldEditor 인스턴스들 생성 (createHtml 자동 호출됨)
        const fieldEditors = {};
        const fieldsArray = Object.entries(definition.editorFields).map(([key, field]) => ({ ...field, _key: key }));

        console.log("생성된 편집UI 데이터", definition, fieldsArray)

        fieldsArray.forEach(field => {
            const Editor = this.getFieldEditorClass(field.type);
            if (!Editor) return;
            fieldEditors[field._key] = new Editor(field, cmdObj);
        });

        // 2단계: getValue 호출해서 값 할당
        if (definition.getValue) {
            definition.getValue(cmdObj, fieldEditors);
        }

        // 3단계: update() 호출해서 UI 업데이트
        Object.values(fieldEditors).forEach(editor => {
            editor.update();
        });

        // 모달 생성 및 렌더링
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;`;

        const container = document.createElement('div');
        container.style.cssText = `background-color: #2b2b2b; border: 2px solid #555; border-radius: 8px; padding: 20px; min-width: 400px; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);`;

        // 제목
        const title = document.createElement('h3');
        title.textContent = `${definition.name} 편집`;
        title.style.cssText = 'color: #fff; margin: 0 0 20px 0; font-size: 18px;';
        container.appendChild(title);

        // 필드 렌더링
        fieldsArray.forEach(field => {
            const fieldEditor = fieldEditors[field._key];
            if (!fieldEditor) return;

            const fieldContainer = document.createElement('div');
            fieldContainer.style.cssText = 'margin-bottom: 15px;';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.cssText = `display: block; color: #ccc; font-size: 13px; margin-bottom: 5px; font-weight: bold;`;
            fieldContainer.appendChild(label);

            fieldContainer.appendChild(fieldEditor.html);
            container.appendChild(fieldContainer);
        });

        // 버튼 영역
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;`;

        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `padding: 8px 20px; background-color: #0066cc; border: 1px solid #0052a3; border-radius: 4px; color: #fff; font-size: 13px; cursor: pointer;`;
        okBtn.onclick = () => {
            if (definition.setValue) {
                definition.setValue(cmdObj, fieldEditors);
            }
            console.log('편집 완료:', cmdObj.cmd.parameters);
            this.displayCommandList(page);
            document.body.removeChild(overlay);
        };
        buttonContainer.appendChild(okBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `padding: 8px 20px; background-color: #555; border: 1px solid #444; border-radius: 4px; color: #fff; font-size: 13px; cursor: pointer;`;
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
        };
        buttonContainer.appendChild(cancelBtn);

        container.appendChild(buttonContainer);

        // ESC 키로 닫기
        const escListener = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);

        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    /**
     * 필드 타입에 맞는 FieldEditor 클래스 반환
     */
    getFieldEditorClass(type) {
        const typeMap = {
            number: NumberFieldEditor,
            text: TextFieldEditor,
            select: SelectFieldEditor,
            'select-direction': SelectDirection,
            'select-speed': SelectSpeed,
            'select-character': SelectCharacter,
            'select-animation': SelectAni,
            'select-balloon': SelectBalloon,
            checkbox: CheckboxFieldEditor,
            toggle: ToggleFieldEditor,
            switch: SwitchFieldEditor,
            variable: VariableFieldEditor,
            'face-selector': FaceSelectorFieldEditor,
            'message-text': MessageTextFieldEditor,
            'choice-list': ChoiceListFieldEditor,
        };

        return typeMap[type];
    }

    /**
     * 입력 요소에서 값 추출하기
     */
    getInputValue(input, field) {
        if (!input) return undefined;

        const type = field.type;

        // 특수 타입 처리
        if (type === 'number') {
            return parseInt(input.value) || 0;
        } else if (type === 'select' || type === 'select-direction' || type === 'select-speed' || type === 'select-character') {
            return parseInt(input.value);
        } else if (type === 'checkbox') {
            return input.checked;
        } else if (type === 'toggle') {
            return parseInt(input.dataset.toggleValue);
        } else if (type === 'switch') {
            return parseInt(input.dataset.switchId);
        } else if (type === 'variable') {
            return parseInt(input.dataset.variableId);
        } else if (type === 'face-selector') {
            return {
                name: input.dataset.faceName,
                index: parseInt(input.dataset.faceIndex)
            };
        } else if (type === 'message-text') {
            return input.value;
        } else if (type === 'choice-list') {
            if (input._isChoiceList) {
                const choices = Array.from(input.querySelectorAll('input[type="text"]')).map(i => i.value).filter(v => v !== '');
                return choices.length > 0 ? choices : [''];
            }
            return undefined;
        } else if (type === 'audio-selector' || type === 'text') {
            return input.value;
        }

        // 기본: input.value
        return input.value;
    }

    /**
     * 코드 리스트 표시
     */
    showCommandList(index, page) {
        // 모달 오버레이 생성
        const overlay = document.createElement('div');
        overlay.id = 'command-list-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

        // 코드 리스트 컨테이너
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
        background-color: #2b2b2b;
        border: 2px solid #555;
        border-radius: 8px;
        padding: 20px;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

        // 제목
        const title = document.createElement('h3');
        title.textContent = '커맨드 추가';
        title.style.cssText = 'color: #fff; margin: 0 0 15px 0; font-size: 18px;';
        listContainer.appendChild(title);

        // 정의 시스템에서 커맨드 목록 생성
        const commandsByCategory = {};

        // 정의된 모든 커맨드를 카테고리별로 그룹화
        Object.entries(EVENT_COMMAND_DEFINITIONS).forEach(([code, def]) => {
            // 특수 코드 제외 (401, 402, 404 등)
            if (parseInt(code) >= 400) return;
            if (!def.name || !def.category) return;

            const category = def.category;
            if (!commandsByCategory[category]) {
                commandsByCategory[category] = [];
            }
            commandsByCategory[category].push({
                code: parseInt(code),
                name: def.name,
                category: def.category
            });
        });

        // 카테고리 순서 정의
        const categoryOrder = ['메시지', '제어', '게임 진행', '이동', '캐릭터', '화면', '타이밍'];

        // 카테고리별로 커맨드 표시
        categoryOrder.forEach(category => {
            const commands = commandsByCategory[category];
            if (!commands || commands.length === 0) return;

            // 카테고리 헤더
            const categoryHeader = document.createElement('div');
            categoryHeader.textContent = `▼ ${category}`;
            categoryHeader.style.cssText = `
            color: #4080ff;
            font-weight: bold;
            font-size: 13px;
            margin: 15px 0 8px 0;
            padding: 4px 8px;
            border-bottom: 1px solid #555;
        `;
            listContainer.appendChild(categoryHeader);

            // 커맨드 버튼들을 가로로 배치하는 컨테이너
            const commandsGrid = document.createElement('div');
            commandsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 8px;
            margin-bottom: 10px;
        `;

            // 해당 카테고리의 커맨드들
            commands.forEach(cmdInfo => {
                const cmdBtn = document.createElement('div');
                cmdBtn.style.cssText = `
                padding: 8px;
                background-color: #3a3a3a;
                border: 1px solid #555;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                transition: background-color 0.2s;
                text-align: center;
                font-size: 12px;
            `;
                cmdBtn.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 2px;">${cmdInfo.name}</div>
                <div style="font-size: 10px; color: #999;">코드: ${cmdInfo.code}</div>
            `;

                cmdBtn.addEventListener('mouseenter', () => {
                    cmdBtn.style.backgroundColor = '#4a4a4a';
                });

                cmdBtn.addEventListener('mouseleave', () => {
                    cmdBtn.style.backgroundColor = '#3a3a3a';
                });

                cmdBtn.addEventListener('click', () => {
                    em.editor.insertCommand(cmdInfo.code, index, page);
                    document.body.removeChild(overlay);
                });

                commandsGrid.appendChild(cmdBtn);
            });

            listContainer.appendChild(commandsGrid);
        });

        // 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `
        margin-top: 15px;
        padding: 8px 20px;
        background-color: #555;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        width: 100%;
    `;
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
        listContainer.appendChild(cancelBtn);

        // 오버레이 클릭으로 닫기
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        overlay.appendChild(listContainer);
        document.body.appendChild(overlay);
    }

    /**
     * 이동 루트 편집기
     */
    createMoveRouteEditor(cmd, index, page) {
        // EventManager.js의 createMoveRouteEditor 메서드 내용을 이동
        // 이 메서드는 매우 길기 때문에 나중에 처리
        console.log('이동 루트 편집기 - 아직 구현 안 됨');
    }

    /**
     * 얼굴 이미지 선택 모달
     */
    showFaceSelector(currentFace, onSelect) {
        // 모달 오버레이
        const overlay = document.createElement('div');
        overlay.id = 'face-selector-overlay';
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
        title.textContent = '얼굴 이미지 선택';
        title.style.cssText = `
        padding: 15px 20px;
        border-bottom: 1px solid #555;
        color: #fff;
        font-size: 16px;
        font-weight: bold;
    `;
        modalContainer.appendChild(title);

        // 컨텐츠 영역 (좌측: 목록, 우측: 선택)
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
        display: flex;
        flex: 1;
        overflow: hidden;
    `;

        // 좌측: 얼굴 이미지 파일 목록
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
        width: 200px;
        border-right: 1px solid #555;
        overflow-y: auto;
        background-color: #1a1a1a;
    `;

        const facesList = main.facesList || [];
        let selectedFileName = currentFace.name || '';

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

        if (selectedFileName === '') {
            noneItem.style.backgroundColor = '#3a3a3a';
            noneItem.style.borderLeftColor = '#4080ff';
        }

        noneItem.addEventListener('mouseenter', () => {
            if (selectedFileName !== '') {
                noneItem.style.backgroundColor = '#2a2a2a';
            }
        });

        noneItem.addEventListener('mouseleave', () => {
            if (selectedFileName !== '') {
                noneItem.style.backgroundColor = 'transparent';
            }
        });

        noneItem.addEventListener('click', () => {
            leftPanel.querySelectorAll('div').forEach(div => {
                div.style.backgroundColor = 'transparent';
                div.style.borderLeftColor = 'transparent';
            });

            noneItem.style.backgroundColor = '#3a3a3a';
            noneItem.style.borderLeftColor = '#4080ff';
            selectedFileName = '';

            updateRightPanel();
        });

        leftPanel.appendChild(noneItem);

        facesList.forEach(faceName => {
            const item = document.createElement('div');
            item.textContent = faceName;
            item.style.cssText = `
            padding: 10px 15px;
            color: #fff;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: background-color 0.2s;
        `;

            if (faceName === selectedFileName) {
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
            }

            item.addEventListener('mouseenter', () => {
                if (faceName !== selectedFileName) {
                    item.style.backgroundColor = '#2a2a2a';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (faceName !== selectedFileName) {
                    item.style.backgroundColor = 'transparent';
                }
            });

            item.addEventListener('click', () => {
                // 이전 선택 해제
                leftPanel.querySelectorAll('div').forEach(div => {
                    div.style.backgroundColor = 'transparent';
                    div.style.borderLeftColor = 'transparent';
                });

                // 새로운 선택
                item.style.backgroundColor = '#3a3a3a';
                item.style.borderLeftColor = '#4080ff';
                selectedFileName = faceName;

                // 우측 패널 업데이트
                updateRightPanel();
            });

            leftPanel.appendChild(item);
        });

        contentArea.appendChild(leftPanel);

        // 우측: 선택한 이미지 4x2 그리드
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: auto;
    `;

        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 144px);
        grid-template-rows: repeat(2, 144px);
        gap: 8px;
    `;

        rightPanel.appendChild(gridContainer);
        contentArea.appendChild(rightPanel);

        let selectedIndex = currentFace.index || 0;

        // 우측 패널 업데이트 함수
        const updateRightPanel = () => {
            gridContainer.innerHTML = '';

            if (!selectedFileName) return;

            const img = new Image();
            img.onload = () => {
                const faceWidth = img.width / 4;
                const faceHeight = img.height / 2;

                for (let i = 0; i < 8; i++) {
                    const cellCanvas = document.createElement('canvas');
                    cellCanvas.width = 144;
                    cellCanvas.height = 144;
                    const ctx = cellCanvas.getContext('2d');

                    const col = i % 4;
                    const row = Math.floor(i / 4);

                    ctx.drawImage(
                        img,
                        col * faceWidth, row * faceHeight,
                        faceWidth, faceHeight,
                        0, 0,
                        144, 144
                    );

                    const cell = document.createElement('div');
                    cell.style.cssText = `
                    width: 144px;
                    height: 144px;
                    border: 3px solid ${i === selectedIndex ? '#4080ff' : '#555'};
                    border-radius: 4px;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                `;

                    cell.appendChild(cellCanvas);

                    cell.addEventListener('mouseenter', () => {
                        if (i !== selectedIndex) {
                            cell.style.borderColor = '#777';
                        }
                    });

                    cell.addEventListener('mouseleave', () => {
                        if (i !== selectedIndex) {
                            cell.style.borderColor = '#555';
                        }
                    });

                    cell.addEventListener('click', () => {
                        selectedIndex = i;
                        // 모든 셀 테두리 초기화
                        gridContainer.querySelectorAll('div').forEach(div => {
                            div.style.borderColor = '#555';
                        });
                        // 선택된 셀 강조
                        cell.style.borderColor = '#4080ff';
                    });

                    gridContainer.appendChild(cell);
                }
            };

            img.onerror = () => {
                gridContainer.innerHTML = '<div style="color: #999; padding: 20px;">이미지를 불러올 수 없습니다.</div>';
            };

            img.src = `project/img/faces/${selectedFileName}.png`;
        };

        updateRightPanel();

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
            onSelect({
                name: selectedFileName,
                index: selectedIndex
            });
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

    /**
     * 스위치 선택 모달
     */
    showSwitchSelector(currentSwitchId, onSelect) {
        // EventManager에 있는 showSwitchSelector 로직을 이곳으로 이동
        em.showSwitchSelector(currentSwitchId, onSelect);
    }

    /**
     * 변수 선택 모달
     */
    showVariableSelector(currentVariableId, onSelect) {
        // EventManager에 있는 showVariableSelector 로직을 이곳으로 이동
        em.showVariableSelector(currentVariableId, onSelect);
    }

    /**
     * 이미지 선택 모달
     */
    showImageSelector(currentImage, onSelect) {
        // EventManager에 있는 showImageSelector 로직을 이곳으로 이동
        em.showImageSelector(currentImage, onSelect);
    }

    /**
     * 커맨드 복사 (선택된 모든 커맨드, indent:0인 0코드 제외)
     */
    copyCommand(cmd, index) {
        const page = em.selectedCommand.page;
        const commands = page.list;
        
        // 선택된 인덱스들이 있으면 모두 복사
        const indicesToCopy = em.selectedCommand.indices || [index];
        const commandsToCopy = indicesToCopy
            .map(idx => commands[idx])
            .filter(cmd => !(cmd.code === 0 && cmd.indent === 0)); // indent:0인 0코드 제외

        em.commandClipboard = JSON.parse(JSON.stringify(commandsToCopy));
        console.log('커맨드 복사:', commandsToCopy.length, '개');
    }

    /**
     * 커맨드 붙여넣기 (선택된 커맨드 위에 붙여넣기, 선택 유지)
     */
    pasteCommand(index, page) {
        if (!em.commandClipboard) return;

        const commandsToPaste = JSON.parse(JSON.stringify(em.commandClipboard));
        const pasteCount = commandsToPaste.length;
        
        // 선택된 위치 위에 삽입
        page.list.splice(index, 0, ...commandsToPaste);
        
        // 리스트 다시 렌더링
        this.displayCommandList(page);
        
        // 붙여넣은 첫 번째 커맨드로 선택 이동 (선택 유지)
        setTimeout(() => {
            const contentsList = document.getElementById('ins-contents-list');
            const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
            const newCmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === index);
            
            if (newCmdDiv) {
                const newCmd = page.list[index];
                this.selectCommand(newCmdDiv, newCmd, index, page);
                em.selectedCommandAnchor = index;
            }
        }, 0);
        
        console.log('커맨드 붙여넣기:', pasteCount, '개');
    }

    /**
     * 커맨드 삭제 (부모 코드 삭제 시 자식 코드도 삭제, 선택 유지 안함)
     */
    deleteCommand(index, page) {
        const commands = page.list;
        
        // 선택된 인덱스들이 있으면 모두 삭제
        let indicesToDelete = em.selectedCommand.indices || [index];
        
        // 부모 코드가 포함되어 있으면 자식 코드와 사이 코드도 삭제 대상에 추가
        const expandedIndices = new Set(indicesToDelete);
        
        indicesToDelete.forEach(idx => {
            const cmd = commands[idx];
            if (!cmd) return;
            
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            
            // 부모 코드면 childCodes와 그 사이의 모든 코드 추가
            if (definition && definition.childCodes && definition.childCodes.length > 0) {
                const childCodes = definition.childCodes;
                
                for (let i = idx + 1; i < commands.length; i++) {
                    const currentCode = commands[i].code;
                    
                    expandedIndices.add(i);
                    
                    // endCode를 만나면 종료
                    if (definition.endCode && currentCode === definition.endCode) {
                        break;
                    }
                }
            }
        });
        
        indicesToDelete = Array.from(expandedIndices);
        
        // 0 코드가 포함되어 있는지 확인
        const hasEndCode = indicesToDelete.some(idx => commands[idx].code === 0);
        if (hasEndCode) {
            alert('종료 커맨드는 삭제할 수 없습니다.');
            return;
        }

        // 역순으로 삭제
        indicesToDelete.sort((a, b) => b - a);
        indicesToDelete.forEach(i => {
            page.list.splice(i, 1);
        });

        em.selectedCommand = null;
        em.selectedCommandElement = null;
        em.selectedCommandElements = null;
        this.displayCommandList(page);
        console.log('커맨드 삭제:', indicesToDelete.length, '개');
    }

    /**
     * 커맨드 선택 (childCodes 기반)
     */
    selectCommand(element, cmd, index, page, event) {
        const commands = page.list;
        const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];

        // 자식 코드는 선택 불가 (연회색 표시만)
        if (definition && definition.parentCode !== undefined) {
            element.style.backgroundColor = 'rgba(200, 200, 200, 0.3)';
            setTimeout(() => {
                element.style.backgroundColor = 'transparent';
            }, 200);
            return;
        }

        // 이전 선택 해제
        if (em.selectedCommandElements) {
            em.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const indicesToSelect = [index];

        // childCodes가 있으면 endCode까지 모든 코드 선택
        if (definition && definition.childCodes && definition.childCodes.length > 0) {
            for (let i = index + 1; i < commands.length; i++) {
                const currentCode = commands[i].code;
                
                indicesToSelect.push(i);
                
                // endCode를 만나면 종료
                if (definition.endCode && currentCode === definition.endCode) {
                    break;
                }
            }
        }

        // 선택된 인덱스들의 DOM 요소 찾기 및 하이라이트
        const contentsList = document.getElementById('ins-contents-list');
        const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
        
        em.selectedCommandElements = [];
        indicesToSelect.forEach(idx => {
            const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
            if (cmdDiv) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                em.selectedCommandElements.push(cmdDiv);
            }
        });

        em.selectedCommandElement = element;
        em.selectedCommand = { cmd, index, page, indices: indicesToSelect };

        // 단축키 리스너 등록 (한번만)
        if (!em.commandKeyListener) {
            em.commandKeyListener = (e) => {
                // 입력 요소에 포커스되어 있으면 무시
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                    return;
                }

                if (!em.selectedCommand) return;

                const { cmd, index, page } = em.selectedCommand;

                // Enter: 커맨드 선택 창 열기
                if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this.showCommandList(index, page);
                }
                // Ctrl+C: 복사
                else if (e.key === 'c' && e.ctrlKey) {
                    e.preventDefault();
                    this.copyCommand(cmd, index);
                }
                // Ctrl+V: 붙여넣기
                else if (e.key === 'v' && e.ctrlKey) {
                    e.preventDefault();
                    this.pasteCommand(index, page);
                }
                // Delete 또는 Backspace: 삭제
                else if ((e.key === 'Delete' || e.key === 'Backspace') && cmd.code !== 0) {
                    e.preventDefault();
                    this.deleteCommand(index, page);
                }
            };
            document.addEventListener('keydown', em.commandKeyListener);
        }
    }

    /**
     * 커맨드 범위 선택 (Shift+클릭)
     */
    selectCommandRange(startIndex, endIndex, page) {
        // 이전 선택 해제
        if (em.selectedCommandElements) {
            em.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const commands = page.list;
        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        const indicesToSelect = [];

        // 범위 내 모든 인덱스 추가 (자식 코드 포함)
        for (let i = minIndex; i <= maxIndex; i++) {
            indicesToSelect.push(i);
        }

        // DOM 요소 찾기 및 하이라이트
        const contentsList = document.getElementById('ins-contents-list');
        const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
        
        em.selectedCommandElements = [];
        indicesToSelect.forEach(idx => {
            const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
            if (cmdDiv) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                em.selectedCommandElements.push(cmdDiv);
            }
        });

        // 마지막 커맨드 정보 저장
        const cmd = page.list[endIndex];
        em.selectedCommandElement = em.selectedCommandElements[em.selectedCommandElements.length - 1];
        em.selectedCommand = { cmd, index: endIndex, page, indices: indicesToSelect };
    }

    /**
     * 커맨드 삽입 (선택된 코드 위에 생성, 0코드 추가 불필요)
     */
    insertCommand(code, index, page) {
        // 현재 코드의 indent를 가져옴
        const currentIndent = page.list[index]?.indent || 0;

        // 새로운 정의 시스템을 사용하여 기본 커맨드 생성
        const definition = EVENT_COMMAND_DEFINITIONS[code];
        const newCmd = definition && definition.defaultParm
            ? {
                code: code,
                indent: currentIndent,
                parameters: JSON.parse(JSON.stringify(definition.defaultParm))
            }
            : {
                code: code,
                indent: currentIndent,
                parameters: []
            };

        // childCodes가 있으면 자식 코드들 생성
        const commandsToInsert = [newCmd];

        if (definition && definition.childCodes && definition.childCodes.length > 0) {
            // endCode가 있으면 endCode 추가
            if (definition.endCode) {
                const endDefinition = EVENT_COMMAND_DEFINITIONS[definition.endCode];
                const endCmd = endDefinition && endDefinition.defaultParm
                    ? {
                        code: definition.endCode,
                        indent: currentIndent,
                        parameters: JSON.parse(JSON.stringify(endDefinition.defaultParm))
                    }
                    : {
                        code: definition.endCode,
                        indent: currentIndent,
                        parameters: []
                    };
                commandsToInsert.push(endCmd);
            }
        }

        // 선택된 위치 위에 삽입
        page.list.splice(index, 0, ...commandsToInsert);

        // UI 새로고침
        this.displayCommandList(page);

        // 방금 추가한 커맨드 선택 및 편집
        setTimeout(() => {
            const contentsList = document.getElementById('ins-contents-list');
            const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
            const newCmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === index);
            
            if (newCmdDiv) {
                this.selectCommand(newCmdDiv, newCmd, index, page);
                em.selectedCommandAnchor = index;
                
                // 정의 시스템 활용하여 편집기 열기
                if (definition && definition.editorFields) {
                    this.editCommand(newCmd, index, page);
                }
            }
        }, 0);
    }

    /**
     * 커맨드 목록 표시 (선택 상태 유지)
     */
    displayCommandList(page) {
        const contentsList = document.getElementById('ins-contents-list');
        if (!contentsList) return;

        // 현재 선택 상태 저장
        const previousSelection = em.selectedCommand ? {
            indices: [...em.selectedCommand.indices],
            index: em.selectedCommand.index
        } : null;

        contentsList.innerHTML = '';

        const commands = page.list || [];

        if (commands.length === 0) {
            contentsList.innerHTML = '<div style="color: #666; padding: 2px 4px;">◆</div>';
            return;
        }

        commands.forEach((cmd, index) => {
            if (!cmd) return;

            // childCodes에 정의된 자식 코드는 표시하지 않음
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            if (definition && definition.parentCode !== undefined) {
                return; // 자식 코드는 스킵
            }

            const indent = (cmd.indent || 0) * 20;
            const color = this.getCommandColor(cmd.code);

            // 메인 커맨드 라인
            const cmdDiv = document.createElement('div');
            cmdDiv.style.cssText = `
            padding: 2px 4px;
            margin-left: ${indent}px;
            color: ${color};
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.4;
            cursor: pointer;
            border-radius: 2px;
            transition: background-color 0.15s;
        `;

            // 커맨드 데이터 저장
            cmdDiv.dataset.commandIndex = index;
            cmdDiv.dataset.commandCode = cmd.code;

            // 이전 선택 복원
            if (previousSelection && previousSelection.indices.includes(index)) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
            }

            // 마우스 호버 이벤트
            cmdDiv.addEventListener('mouseenter', (e) => {
                if (!previousSelection || !previousSelection.indices.includes(index)) {
                    cmdDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            });

            cmdDiv.addEventListener('mouseleave', (e) => {
                if (!previousSelection || !previousSelection.indices.includes(index)) {
                    cmdDiv.style.backgroundColor = 'transparent';
                } else {
                    cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                }
            });

            // 클릭 이벤트 (선택)
            cmdDiv.addEventListener('click', (e) => {
                if (e.shiftKey && em.selectedCommandAnchor !== undefined) {
                    // Shift 클릭: 범위 선택 (anchor 기준)
                    e.preventDefault();
                    this.selectCommandRange(em.selectedCommandAnchor, index, page);
                } else {
                    // 일반 클릭: 단일/연결 선택 및 anchor 설정
                    this.selectCommand(cmdDiv, cmd, index, page, e);
                    em.selectedCommandAnchor = index;
                }
            });

            // 텍스트 선택 방지
            cmdDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
            });
            cmdDiv.style.userSelect = 'none';

            // 더블클릭 이벤트 (편집)
            cmdDiv.addEventListener('dblclick', (e) => {
                this.editCommand(cmd, index, page);
            });

            // 우클릭 이벤트 (컨텍스트 메뉴)
            cmdDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectCommand(cmdDiv, cmd, index, page);
                em.showCommandContextMenu(e.pageX, e.pageY, cmd, index, page);
            });

            const commandText = this.getCommandText(cmd.code, cmd.parameters, new Command(cmd, index, commands));

            // selectable 속성 확인 (기본값 true)
            const selectable = definition?.selectable !== false;
            const prefixStr = selectable ? '<span style="color: #888;">◆</span>' : ""

            cmdDiv.innerHTML = `${prefixStr}${commandText}`;
            contentsList.appendChild(cmdDiv);

            // childCodes가 있으면 자식 코드들도 서브라인으로 표시
            if (definition && definition.childCodes && definition.childCodes.length > 0) {
                const childCodes = definition.childCodes;
                
                for (let i = index + 1; i < commands.length; i++) {
                    const childCmd = commands[i];
                    if (!childCmd) continue;
                    
                    const childDefinition = EVENT_COMMAND_DEFINITIONS[childCmd.code];
                    
                    // 자식 코드이면 서브라인으로 표시
                    if (childDefinition && childDefinition.parentCode === cmd.code) {
                        const subDiv = document.createElement('div');
                        subDiv.style.cssText = `
                        padding: 2px 4px;
                        margin-left: ${indent}px;
                        color: ${color};
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        line-height: 1.4;
                    `;
                        const childText = this.getCommandText(childCmd.code, childCmd.parameters, new Command(childCmd, i, commands));
                        subDiv.innerHTML = `${childText}`;
                        contentsList.appendChild(subDiv);
                    }
                    
                    // endCode를 만나면 종료
                    if (definition.endCode && childCmd.code === definition.endCode) {
                        break;
                    }
                }
            }

            // 이동 루트 설정 커맨드(205) 뒤에 이동 명령들 표시
            if (cmd.code === 205) {
                const moveRoute = cmd.parameters[1];
                if (moveRoute && moveRoute.list) {
                    moveRoute.list.forEach(routeCmd => {
                        // 종료 코드(0)는 표시하지 않음
                        if (routeCmd.code === 0) return;

                        const routeText = this.getMoveRouteCommandText(routeCmd.code, routeCmd.parameters);
                        const subDiv = document.createElement('div');
                        subDiv.style.cssText = `
                        padding: 2px 4px;
                        margin-left: ${indent}px;
                        color: ${color};
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        line-height: 1.4;
                    `;
                        subDiv.innerHTML = `<span style="color: #888;">：　　　　　　　：◇</span>${routeText}`;
                        contentsList.appendChild(subDiv);
                    });
                }
            }
        });

        // 선택 상태 복원
        if (previousSelection) {
            const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
            em.selectedCommandElements = [];
            
            previousSelection.indices.forEach(idx => {
                const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
                if (cmdDiv) {
                    em.selectedCommandElements.push(cmdDiv);
                }
            });
            
            if (em.selectedCommandElements.length > 0) {
                const lastIndex = previousSelection.index;
                const lastCmd = commands[lastIndex];
                em.selectedCommandElement = em.selectedCommandElements[em.selectedCommandElements.length - 1];
                em.selectedCommand = { cmd: lastCmd, index: lastIndex, page, indices: previousSelection.indices };
            }
        }
    }

    /**
     * 커맨드 추가 라인 표시 (더 이상 사용하지 않음 - childCodes로 대체)
     */
    appendCommandSublines(contentsList, cmd, indent) {
        // 현재는 childCodes 시스템으로 처리되므로 이 메소드는 사용되지 않음
    }

    /**
     * 이동 경로 커맨드 텍스트
     */
    getMoveRouteCommandText(code, parameters) {
        const p = parameters || [];
        const routeMap = {
            1: () => '아래로 이동',
            2: () => '좌측으로 이동',
            3: () => '우측으로 이동',
            4: () => '위로 이동',
            5: () => '좌상향으로 이동',
            6: () => '우상향으로 이동',
            7: () => '좌하향으로 이동',
            8: () => '우하향으로 이동',
            9: () => '임의로 이동',
            10: () => '플레이어 방향으로 이동',
            11: () => '플레이어 반대 방향으로 이동',
            12: () => '전진',
            13: () => '후진',
            14: () => `점프：${p[0] || 0}, ${p[1] || 0}`,
            15: () => `대기：${p[0] || 0}프레임들`,
            16: () => '아래로 꺾어지기',
            17: () => '좌측으로 꺾어지기',
            18: () => '우측으로 꺾어지기',
            19: () => '위로 꺾어지기',
            20: () => '시계방향으로 90도 회전',
            21: () => '반시계방향으로 90도 회전',
            22: () => '180도 회전',
            23: () => '시계/반시계 90도 임의 회전',
            24: () => '임의로 회전',
            25: () => '플레이어 방향으로 회전',
            26: () => '플레이어 반대 방향으로 회전',
            27: () => `스위치 ON：${p[0] || 0}`,
            28: () => `스위치 OFF：${p[0] || 0}`,
            29: () => `속도 변경：${p[0] || 3}`,
            30: () => `빈도 변경：${p[0] || 3}`,
            31: () => '보행 애니메이션 ON',
            32: () => '보행 애니메이션 OFF',
            33: () => '발걸음 애니메이션 ON',
            34: () => '발걸음 애니메이션 OFF',
            35: () => '방향 고정 ON',
            36: () => '방향 고정 OFF',
            37: () => '통과 ON',
            38: () => '통과 OFF',
            39: () => '투명 ON',
            40: () => '투명 OFF',
            41: () => '이미지 변경',
            42: () => '불투명도 변경',
            43: () => '합성 방식 변경',
            44: () => {
                const audioObj = p[0] || {};
                const audioName = audioObj.name || '(없음)';
                const volume = audioObj.volume !== undefined ? audioObj.volume : 90;
                const pitch = audioObj.pitch !== undefined ? audioObj.pitch : 100;
                const pan = audioObj.pan !== undefined ? audioObj.pan : 0;
                return `SE 재생：${audioName} (${volume}, ${pitch}, ${pan})`;
            },
            45: () => '스크립트 실행',
        };

        if (typeof routeMap[code] === 'function') {
            return routeMap[code]();
        }
        return `[${code}]`;
    }

    /**
     * 코드별 텍스트 색상 가이드
     */
    getCommandColor(code) {
        if (code === 101 || code === 401) return '#fff'; // 메시지: 흰색
        if (code === 111) return '#ffea00'; // 조건 분기: 노란색
        if (code === 122 || code === 121) return '#ffa500'; // 변수/스위치: 주황색
        return '#ccc'; // 기본
    }

    /**
     * RPG Maker MZ 커맨드 코드 변환
     */
    getCommandText(code, parameters, cmd) {
        const p = parameters || [];
        // 새로운 정의 시스템 사용
        const definition = EVENT_COMMAND_DEFINITIONS[code];
        if (definition && definition.getDisplayText) {
            return definition.getDisplayText(p, cmd);
        }
        return `[코드 ${code}]`;
    }
}
