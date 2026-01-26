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

class EventCodeEditor {
    constructor(contentsList) {
        // 순수하게 코드 편집 기능만 제공
        this.currentContentsList = contentsList; // 현재 렌더링중인 contentsList 요소
    }

    /**
     * 커맨드 편집
     * @param {Object} cmd - 커맨드 객체
     * @param {number} index - 커맨드 인덱스
     * @param {Array} list - 커맨드 리스트 (page.list 또는 commonEvent.list)
     */
    editCommand(cmd, index, list) {
        // 빈 코드(0)인 경우 코드 리스트 표시
        if (cmd.code === 0) {
            this.showCommandList(index, list);
            return;
        }

        // 정의 시스템에서 편집기 찾기
        const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
        if(definition.parentCode){ //  자식 코드인 경우 편집 안 함
            return;
        }
        console.log(`편집 시작 ID: ${cmd.code}(${definition.name})`)

        // editorFields가 정의되어 있으면 범용 편집기 사용
        if (definition && definition.editorFields) {
            this.createGenericEditor(cmd, index, list, definition);
            return;
        }
        else if (cmd.code == 205) {
            this.createMoveRouteEditor(cmd, index, list)
        }
        else {
            console.log('편집 미구현:', cmd.code);
        }
    }

    /**
     * 범용 에디터 생성 (editorFields 기반)
     * @param {Object} cmd - 커맨드 객체
     * @param {number} index - 커맨드 인덱스
     * @param {Array} list - 커맨드 리스트
     * @param {Object} definition - 커맨드 정의
     */
    createGenericEditor(cmd, index, list, definition) {
        const cmdObj = new Command(cmd, index, list);

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

        // 조건부 표시 처리를 위한 컨테이너/의존 맵 준비
        const fieldContainers = {};
        const dependentsMap = {}; // controlKey -> [dependentKey,...]

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

        // 필드 렌더링 (조건부 표시 지원)
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

            fieldContainers[field._key] = fieldContainer;

            // collect dependency info if condition exists
            if (field.condition && typeof field.condition === 'object') {
                Object.keys(field.condition).forEach(controlKey => {
                    dependentsMap[controlKey] = dependentsMap[controlKey] || [];
                    dependentsMap[controlKey].push(field._key);
                });
            }
        });

        // 조건 평가 함수
        const evaluateConditionFor = (key) => {
            const field = fieldsArray.find(f => f._key === key);
            if (!field || !field.condition) return true;
            const cond = field.condition;
            return Object.keys(cond).every(controlKey => {
                const expected = cond[controlKey];
                const ctlEditor = fieldEditors[controlKey];
                if (!ctlEditor) return false;
                const actual = ctlEditor.value;
                // loose equality to allow string/number matches
                return actual == expected;
            });
        };

        // 초기 표시 상태 설정
        Object.keys(fieldContainers).forEach(key => {
            try {
                const ok = evaluateConditionFor(key);
                fieldContainers[key].style.display = ok ? '' : 'none';
            } catch (e) {
                fieldContainers[key].style.display = '';
            }
        });

        // 변화 감지 바인딩: 컨트롤 필드 변경 시 의존 필드 재평가
        Object.keys(dependentsMap).forEach(controlKey => {
            const ctlEditor = fieldEditors[controlKey];
            if (!ctlEditor) return;
            const element = ctlEditor.html;
            const trigger = () => {
                // small delay to let the field's own handler update .value
                setTimeout(() => {
                    const dependents = dependentsMap[controlKey] || [];
                    dependents.forEach(depKey => {
                        const ok = evaluateConditionFor(depKey);
                        const containerDep = fieldContainers[depKey];
                        if (containerDep) containerDep.style.display = ok ? '' : 'none';
                    });
                }, 0);
            };
            element.addEventListener('change', trigger);
            element.addEventListener('input', trigger);
            element.addEventListener('click', trigger);
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
            this.displayCommandList(list);
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
     * @param {number} index - 삽입할 위치 인덱스
     * @param {Array} list - 커맨드 리스트
     */
    showCommandList(index, list) {
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
                    this.insertCommand(cmdInfo.code, index, list);
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
    /**
     * 이동 루트 에디터 생성
     * @param {Object} cmd - 커맨드 객체
     * @param {number} index - 커맨드 인덱스
     * @param {Array} list - 커맨드 리스트
     */
    createMoveRouteEditor(cmd, index, list) {
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
        // 현재 선택된 이벤트의 페이지 리스트 가져오기
        if (!em.selectedEvent || em.currentPageIndex === undefined) return;
        const commands = em.selectedEvent.pages[em.currentPageIndex].list;
        
        // 선택된 인덱스들이 있으면 모두 복사
        const indicesToCopy = em.selectedCommand.indices || [index];
        const commandsToCopy = indicesToCopy
            .map(idx => commands[idx])
            .filter(cmd => !(cmd.code === 0 && cmd.indent === 0)); // indent:0인 0코드 제외

        em.commandClipboard = JSON.parse(JSON.stringify(commandsToCopy));
        console.log('커맨드 복사:', commandsToCopy.length, '개');
    }

    /**
     * 커맨드 붙여넣기 (선택된 커맨드 위에 붙여넣기, 원래 선택 항목 유지)
     * @param {number} index - 붙여넣을 위치
     * @param {Array} list - 커맨드 리스트
     */
    pasteCommand(index, list) {
        if (!em.commandClipboard) return;

        const commandsToPaste = JSON.parse(JSON.stringify(em.commandClipboard));
        const pasteCount = commandsToPaste.length;
        
        // 현재 선택된 인덱스들 저장 (붙여넣기 후 아래로 밀려날 것)
        const originalIndices = em.selectedCommand?.indices || [index];
        const originalCurrentIndex = em.selectedCommand?.index || index;
        
        // 선택된 위치 위에 삽입
        list.splice(index, 0, ...commandsToPaste);
        
        // 원래 선택된 인덱스들을 pasteCount만큼 증가시킴
        const newIndices = originalIndices.map(idx => {
            // 붙여넣기 위치보다 같거나 뒤에 있던 항목들은 아래로 밀림
            if (idx >= index) {
                return idx + pasteCount;
            }
            return idx;
        });
        
        const newCurrentIndex = originalCurrentIndex >= index 
            ? originalCurrentIndex + pasteCount 
            : originalCurrentIndex;
        
        // 선택 상태를 먼저 업데이트
        const newCurrentCmd = list[newCurrentIndex];
        em.selectedCommand = { cmd: newCurrentCmd, index: newCurrentIndex, indices: newIndices };
        em.selectedCommandAnchor = newCurrentIndex;
        
        // 리스트 다시 렌더링 (이제 previousSelection이 올바른 인덱스로 설정됨)
        this.displayCommandList(list);
        
        console.log('커맨드 붙여넣기:', pasteCount, '개');
    }

    /**
     * 커맨드 삭제 (부모 코드 삭제 시 자식 코드도 삭제)
     * @param {number} index - 삭제할 커맨드 인덱스
     * @param {Array} list - 커맨드 리스트
     */
    deleteCommand(index, list) {
        const commands = list;
        
        // 선택된 인덱스들이 있으면 모두 삭제
        let indicesToDelete = em.selectedCommand.indices || [index];
        
        // 부모 코드가 포함되어 있으면 자식 코드와 사이 코드도 삭제 대상에 추가
        const expandedIndices = new Set(indicesToDelete);
        
        indicesToDelete.forEach(idx => {
            const cmd = commands[idx];
            if (!cmd) return;
            
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            
            // 부모 코드면 자식 코드들도 삭제 대상에 추가
            if (definition) {
                // listCode: 연속된 동일 코드만
                if (definition.listCode) {
                    for (let i = idx + 1; i < commands.length; i++) {
                        if (commands[i].code === definition.listCode) {
                            expandedIndices.add(i);
                        } else {
                            break;
                        }
                    }
                }
                // childCodes: 마지막 childCode까지
                else if (definition.childCodes && definition.childCodes.length > 0) {
                    const endCode = definition.childCodes[definition.childCodes.length - 1];
                    for (let i = idx + 1; i < commands.length; i++) {
                        expandedIndices.add(i);
                        if (commands[i].code === endCode) {
                            break;
                        }
                    }
                }
            }
        });
        
        indicesToDelete = Array.from(expandedIndices);
        
        // 역순으로 삭제
        indicesToDelete.sort((a, b) => b - a);
        indicesToDelete.forEach(i => {
            list.splice(i, 1);
        });

        // 삭제 후 마지막 코드가 0코드가 아니면 0코드 추가
        if (list.length > 0) {
            const lastCmd = list[list.length - 1];
            if (lastCmd && lastCmd.code !== 0) {
                // 마지막 코드의 indent를 기반으로 0코드 생성
                const lastIndent = lastCmd.indent || 0;
                list.push({
                    code: 0,
                    indent: lastIndent,
                    parameters: []
                });
            }
        }

        // 리스트 다시 렌더링
        this.displayCommandList(list);
        
        // 삭제 후 다음 코드 선택
        setTimeout(() => {
            // 다음 선택 가능한 인덱스 찾기 (자식 코드가 아닌 첫 번째)
            const minDeleteIndex = Math.min(...Array.from(expandedIndices));
            let nextIndex = minDeleteIndex;
            while (nextIndex < list.length) {
                const cmd = list[nextIndex];
                if (!cmd) break;
                
                const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
                // 자식 코드가 아니면 선택
                if (!definition || definition.parentCode === undefined) {
                    const contentsList = this.currentContentsList;
                    if (!contentsList) break;
                    const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
                    const nextCmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === nextIndex);
                    
                    if (nextCmdDiv) {
                        this.selectCommand(nextCmdDiv, cmd, nextIndex, list);
                        em.selectedCommandAnchor = nextIndex;
                    }
                    break;
                }
                nextIndex++;
            }
        }, 0);
        
        console.log('커맨드 삭제:', indicesToDelete.length, '개');
    }

    /**
     * 커맨드 선택 (childCodes 기반)
     * @param {HTMLElement} element - 클릭된 DOM 요소
     * @param {Object} cmd - 커맨드 객체
     * @param {number} index - 커맨드 인덱스
     * @param {Array} list - 커맨드 리스트
     * @param {Event} event - 마우스 이벤트
     */
    selectCommand(element, cmd, index, list, event) {
        const commands = list;
        const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];

        // 자식 코드는 선택 불가 (연회색 표시만)
        if (definition && definition.parentCode !== undefined) {
            element.style.backgroundColor = 'rgba(200, 200, 200, 0.3)';
            setTimeout(() => {
                element.style.backgroundColor = 'transparent';
            }, 200);
            return;
        }

        // Shift+클릭: 범위 선택
        if (event && event.shiftKey && em.selectedCommandAnchor !== undefined) {
            this.selectCommandRange(em.selectedCommandAnchor, index, list);
            return;
        }

        // Ctrl+클릭: 다중 선택 토글
        if (event && (event.ctrlKey || event.metaKey)) {
            const currentIndices = new Set(em.selectedCommand?.indices || []);
            
            // 자식 코드 범위 계산
            const toggleIndices = [index];
            if (definition) {
                // listCode: 바로 다음에 연속된 동일 코드만 선택
                if (definition.listCode) {
                    for (let i = index + 1; i < commands.length; i++) {
                        if (commands[i].code === definition.listCode) {
                            toggleIndices.push(i);
                        } else {
                            break; // 다른 코드 나오면 중단
                        }
                    }
                }
                // childCodes: 마지막 childCode까지 모든 코드 선택
                else if (definition.childCodes && definition.childCodes.length > 0) {
                    const endCode = definition.childCodes[definition.childCodes.length - 1];
                    for (let i = index + 1; i < commands.length; i++) {
                        toggleIndices.push(i);
                        if (commands[i].code === endCode) {
                            break; // endCode(마지막 childCode) 만나면 중단
                        }
                    }
                }
            }

            // 토글: 이미 선택되어 있으면 제거, 없으면 추가
            const isSelected = currentIndices.has(index);
            if (isSelected) {
                toggleIndices.forEach(idx => currentIndices.delete(idx));
            } else {
                toggleIndices.forEach(idx => currentIndices.add(idx));
            }

            // 선택이 비어있으면 초기화
            if (currentIndices.size === 0) {
                em.selectedCommand = null;
                em.selectedCommandElement = null;
                em.selectedCommandElements = null;
                em.selectedCommandAnchor = undefined;
                return;
            }

            // 다중 선택 적용
            const indicesToSelect = Array.from(currentIndices).sort((a, b) => a - b);
            
            // 이전 선택 해제
            if (em.selectedCommandElements) {
                em.selectedCommandElements.forEach(el => {
                    el.style.backgroundColor = 'transparent';
                });
            }

            // DOM 요소 찾기 및 하이라이트
            const contentsList = this.currentContentsList
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
            em.selectedCommand = { cmd, index, indices: indicesToSelect };
            // Ctrl+클릭 시에는 앵커 변경하지 않음
            return;
        }

        // 일반 클릭: 단일 선택 (또는 부모 코드면 자식까지)
        // 이전 선택 해제
        if (em.selectedCommandElements) {
            em.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const indicesToSelect = [index];

        // 자식 코드 선택
        if (definition) {
            // listCode: 바로 다음에 연속된 동일 코드만 선택
            if (definition.listCode) {
                for (let i = index + 1; i < commands.length; i++) {
                    if (commands[i].code === definition.listCode) {
                        indicesToSelect.push(i);
                    } else {
                        break; // 다른 코드 나오면 중단
                    }
                }
            }
            // childCodes: 마지막 childCode까지 모든 코드 선택
            else if (definition.childCodes && definition.childCodes.length > 0) {
                const endCode = definition.childCodes[definition.childCodes.length - 1];
                for (let i = index + 1; i < commands.length; i++) {
                    indicesToSelect.push(i);
                    if (commands[i].code === endCode) {
                        break; // endCode(마지막 childCode) 만나면 중단
                    }
                }
            }
        }

        // 선택된 인덱스들의 DOM 요소 찾기 및 하이라이트
        const contentsList = this.currentContentsList
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
        em.selectedCommand = { cmd, index, indices: indicesToSelect };
        em.selectedCommandAnchor = index; // 앵커 설정

        // 단축키 리스너 등록 (한번만)
        if (!em.commandKeyListener) {
            em.commandKeyListener = (e) => {
                // 입력 요소에 포커스되어 있으면 무시
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                    return;
                }

                if (!em.selectedCommand) return;

                const { cmd, index } = em.selectedCommand;
                if (!em.selectedEvent || em.currentPageIndex === undefined) return;
                const list = em.selectedEvent.pages[em.currentPageIndex].list;

                // Enter 또는 Spacebar: 커맨드 선택 창 열기 / 편집
                if ((e.key === 'Enter' || e.key === ' ') && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    if (e.key === ' ') {
                        // Spacebar: 편집
                        this.editCommand(cmd, index, list);
                    } else {
                        // Enter: 커맨드 선택 창
                        this.showCommandList(index, list);
                    }
                }
                // 화살표 위: 이전 커맨드 선택
                else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectPreviousCommand(index, list);
                }
                // 화살표 아래: 다음 커맨드 선택
                else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectNextCommand(index, list);
                }
                // Ctrl+C: 복사
                else if (e.key === 'c' && e.ctrlKey) {
                    e.preventDefault();
                    this.copyCommand(cmd, index);
                }
                // Ctrl+V: 붙여넣기
                else if (e.key === 'v' && e.ctrlKey) {
                    e.preventDefault();
                    this.pasteCommand(index, list);
                }
                // Delete 또는 Backspace: 삭제
                else if ((e.key === 'Delete' || e.key === 'Backspace') && cmd.code !== 0) {
                    e.preventDefault();
                    this.deleteCommand(index, list);
                }
            };
            document.addEventListener('keydown', em.commandKeyListener);
        }
    }

    /**
     * 이전 커맨드 선택 (화살표 위)
     */
    selectPreviousCommand(currentIndex, list) {
        const commands = list;
        
        // 현재 인덱스 이전의 선택 가능한 커맨드 찾기 (자식 코드가 아닌 것)
        for (let i = currentIndex - 1; i >= 0; i--) {
            const cmd = commands[i];
            if (!cmd) continue;
            
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            // 자식 코드가 아니면 선택
            if (!definition || definition.parentCode === undefined) {
                const contentsList = this.currentContentsList;
                const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
                const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === i);
                
                if (cmdDiv) {
                    this.selectCommand(cmdDiv, cmd, i, list);
                    em.selectedCommandAnchor = i;
                    
                    // 스크롤하여 보이게 만들기
                    cmdDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                break;
            }
        }
    }

    /**
     * 다음 커맨드 선택 (화살표 아래)
     */
    selectNextCommand(currentIndex, list) {
        const commands = list;
        
        // 현재 인덱스 다음의 선택 가능한 커맨드 찾기 (자식 코드가 아닌 것)
        for (let i = currentIndex + 1; i < commands.length; i++) {
            const cmd = commands[i];
            if (!cmd) continue;
            
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            // 자식 코드가 아니면 선택
            if (!definition || definition.parentCode === undefined) {
                const contentsList = this.currentContentsList
                const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
                const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === i);
                
                if (cmdDiv) {
                    this.selectCommand(cmdDiv, cmd, i, list);
                    em.selectedCommandAnchor = i;
                    
                    // 스크롤하여 보이게 만들기
                    cmdDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                break;
            }
        }
    }

    /**
     * 커맨드 범위 선택 (Shift+클릭)
     * @param {number} anchorIndex - 시작 인덱스
     * @param {number} currentIndex - 끝 인덱스
     * @param {Array} list - 커맨드 리스트
     */
    selectCommandRange(anchorIndex, currentIndex, list) {
        // 이전 선택 해제
        if (em.selectedCommandElements) {
            em.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const commands = list;
        const minIndex = Math.min(anchorIndex, currentIndex);
        const maxIndex = Math.max(anchorIndex, currentIndex);
        const indicesToSelect = [];
        const processed = new Set();

        // 범위 내 모든 인덱스 추가 (부모 코드면 자식들도 포함)
        for (let i = minIndex; i <= maxIndex; i++) {
            const cmd = commands[i];
            if (!cmd || processed.has(i)) continue;
            
            // 화면에 표시되는 항목만 선택 (자식 코드 제외)
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];
            if (definition && definition.parentCode !== undefined) {
                continue; // 자식 코드는 스킵
            }
            
            indicesToSelect.push(i);
            processed.add(i);
            
            // 부모 코드면 자식들도 선택에 추가
            if (definition) {
                // listCode: 연속된 동일 코드
                if (definition.listCode) {
                    for (let j = i + 1; j < commands.length; j++) {
                        if (commands[j].code === definition.listCode) {
                            indicesToSelect.push(j);
                            processed.add(j);
                        } else {
                            break;
                        }
                    }
                }
                // childCodes: 마지막 childCode까지
                else if (definition.childCodes && definition.childCodes.length > 0) {
                    const endCode = definition.childCodes[definition.childCodes.length - 1];
                    for (let j = i + 1; j < commands.length; j++) {
                        indicesToSelect.push(j);
                        processed.add(j);
                        if (commands[j].code === endCode) {
                            break;
                        }
                    }
                }
            }
        }

        // DOM 요소 찾기 및 하이라이트
        const contentsList = this.currentContentsList
        const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
        
        em.selectedCommandElements = [];
        indicesToSelect.forEach(idx => {
            const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
            if (cmdDiv) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                em.selectedCommandElements.push(cmdDiv);
            }
        });

        // 현재 위치의 커맨드 정보 저장
        const cmd = list[currentIndex];
        em.selectedCommandElement = em.selectedCommandElements[em.selectedCommandElements.length - 1];
        em.selectedCommand = { cmd, index: currentIndex, indices: indicesToSelect };
        // 앵커는 유지 (변경하지 않음)
    }

    /**
     * 커맨드 삽입 (선택된 코드 위에 생성, 0코드 추가 불필요)
     */
    insertCommand(code, index, list) {
        // 현재 코드의 indent를 가져옴
        const currentIndent = list[index]?.indent || 0;

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

        // 자식 코드들 생성
        const commandsToInsert = [newCmd];

        if (definition) {
            // childCodes가 있으면 마지막 childCode(endCode) 추가
            if (definition.childCodes && definition.childCodes.length > 0) {
                const endCode = definition.childCodes[definition.childCodes.length - 1];
                const endDefinition = EVENT_COMMAND_DEFINITIONS[endCode];
                const endCmd = endDefinition && endDefinition.defaultParm
                    ? {
                        code: endCode,
                        indent: currentIndent,
                        parameters: JSON.parse(JSON.stringify(endDefinition.defaultParm))
                    }
                    : {
                        code: endCode,
                        indent: currentIndent,
                        parameters: []
                    };
                commandsToInsert.push(endCmd);
            }
        }

        // 선택된 위치 위에 삽입
        list.splice(index, 0, ...commandsToInsert);

        // UI 새로고침 - currentContentsList 사용
        this.displayCommandList(list);

        // 방금 추가한 커맨드 선택 및 편집
        setTimeout(() => {
            const contentsList = this.currentContentsList;
            const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
            const newCmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === index);
            
            if (newCmdDiv) {
                this.selectCommand(newCmdDiv, newCmd, index, list);
                em.selectedCommandAnchor = index;
                
                // 정의 시스템 활용하여 편집기 열기
                if (definition && definition.editorFields) {
                    this.editCommand(newCmd, index, list);
                }
            }
        }, 0);
    }

    /**
     * 커맨드 목록 표시 (선택 상태 유지)
     * @param {Array} list - 커맨드 리스트 (page.list 또는 commonEvent.list)
     * @param {HTMLElement} targetElement - 렌더링할 대상 요소 (선택사항, 기본값: ins-contents-list)
     */
    displayCommandList(list) {
        const contentsList = this.currentContentsList;

        // 현재 선택 상태 저장
        const previousSelection = em.selectedCommand ? {
            indices: [...em.selectedCommand.indices],
            index: em.selectedCommand.index
        } : null;

        contentsList.innerHTML = '';

        const commands = list || [];

        if (commands.length === 0) {
            contentsList.innerHTML = '<div style="color: #666; padding: 2px 4px;">◆</div>';
            return;
        }

        commands.forEach((cmd, index) => {
            if (!cmd) return;

            // childCodes에 정의된 자식 코드는 표시하지 않음
            const definition = EVENT_COMMAND_DEFINITIONS[cmd.code];

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
                // 현재 선택된 항목이 아닐 때만 호버 효과
                if (!em.selectedCommand || !em.selectedCommand.indices.includes(index)) {
                    cmdDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            });

            cmdDiv.addEventListener('mouseleave', (e) => {
                // 현재 선택된 항목이면 선택 색상 유지, 아니면 투명
                if (em.selectedCommand && em.selectedCommand.indices.includes(index)) {
                    cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                } else {
                    cmdDiv.style.backgroundColor = 'transparent';
                }
            });

            // 클릭 이벤트 (선택)
            cmdDiv.addEventListener('click', (e) => {
                if (e.shiftKey && em.selectedCommandAnchor !== undefined) {
                    // Shift 클릭: 범위 선택 (anchor 기준)
                    e.preventDefault();
                    this.selectCommandRange(em.selectedCommandAnchor, index, list);
                } else {
                    // 일반 클릭: 단일/연결 선택 및 anchor 설정
                    this.selectCommand(cmdDiv, cmd, index, list, e);
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
                this.editCommand(cmd, index, list);
            });

            // 우클릭 이벤트 (컨텍스트 메뉴)
            cmdDiv.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectCommand(cmdDiv, cmd, index, list);
                em.showCommandContextMenu(e.pageX, e.pageY, cmd, index, { list });
            });
            

            const commandText = this.getCommandText(cmd.code, cmd.parameters, new Command(cmd, index, commands));

            // selectable 속성 확인: parentCode가 있으면 선택 불가
            const selectable = !(definition && definition.parentCode !== undefined);
            const prefixStr = selectable ? '<span style="color: #888;">◆</span>' : ''


            cmdDiv.innerHTML = `${prefixStr}${commandText}`;
            console.log(contentsList);
            contentsList.appendChild(cmdDiv);
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
                em.selectedCommand = { cmd: lastCmd, index: lastIndex, indices: previousSelection.indices };
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
