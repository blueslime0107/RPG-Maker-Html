/**
 * @typedef {'text'|'number'|'select'|'switch'|'variable'|'face-selector'|'message-text'|'choice-list'|'audio-selector'|'checkbox'|'select-direction'|'select-speed'|'select-character'|'toggle'|'select-balloon'} FieldType
 */

/**
 * @typedef {Object} EditorField
 * @property {FieldType} type - 필드 타입
 * @property {string} label - 필드 레이블
 * @property {number} paramIndex - 파라미터 인덱스
 * @property {*} [default] - 기본값
 * @property {number} [min] - 최솟값 (number 타입)
 * @property {number} [max] - 최댓값 (number 타입)
 * @property {Array<{value: *, label: string}>} [options] - 선택지 배열 (select 타입)
 * @property {number} [linkedParamIndex] - 연결된 파라미터 인덱스 (face-selector, choice-list)
 * @property {number} [maxChoices] - 최대 선택지 개수 (choice-list)
 * @property {function(Object, number, Object): *} [getValue] - 값 가져오기 함수
 * @property {function(Object, number, Object, *): void} [setValue] - 값 설정 함수
 */

/**
 * @typedef {Object} CommandDefinition
 * @property {string} name - 커맨드 이름
 * @property {string} category - 커맨드 카테고리
 * @property {Array} [defaultParm] - 기본 파라미터 배열
 * @property {function(Array, Object): string} getDisplayText - 커맨드 표시 텍스트 생성 함수
 * @property {Object.<string, EditorField>} [editorFields] - 편집 필드 객체
 */

// ====================================================================================================
// 이벤트 커맨드 유틸리티 함수들
// ====================================================================================================

/**
 * 커맨드 객체를 관리하는 클래스
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

// 이벤트 커맨드 정의
/** @type {Object<number, CommandDefinition>} */
const EVENT_COMMAND_DEFINITIONS = {
    // 메시지
    101: {
        name: '텍스트 표시',
        category: '메시지',
        defaultParm: ['', 0, 0, 2, ''], // [faceName, faceIndex, background, position, speakerName]
        getDisplayText: (params) => {
            const faceName = params[0] || '없음';
            const faceIndex = params[1] || 0;
            const backgrounds = ['창', '어둡게', '투명'];
            const bgName = backgrounds[params[2]] || '창';
            const positions = ['맨 위', '가운데', '맨 아래'];
            const posName = positions[params[3]] || '맨 아래';
            const charName = params[4] || '없음';
            const faceStr = faceName !== '없음' ? `${faceName}(${faceIndex})` : '없음';
            return `텍스트：${charName}, ${faceStr}, ${bgName}, ${posName}`;
        },
        editorFields: {
            message: {
                type: 'message-text',
                label: '메시지'
            },
            face: {
                type: 'face-selector',
                label: '얼굴 이미지'
            },
            speaker: {
                label: '화자',
                type: 'text',
                default: ''
            },
            background: {
                label: '배경',
                type: 'select',
                options: [
                    { value: 0, label: '창' },
                    { value: 1, label: '어둡게' },
                    { value: 2, label: '투명' }
                ]
            },
            window: {
                label: '창 위치',
                type: 'select',
                options: [
                    { value: 0, label: '맨 위' },
                    { value: 1, label: '가운데' },
                    { value: 2, label: '맨 아래' }
                ]
            }
        },
        getValue: (cmd, editor) => {
            const codes = cmd.collectCodes(401);
            editor.message.value = codes.map(c => c.parameters[0] || '').join('\n');
            // face-selector는 dataset 사용
            editor.face.faceName = cmd.parameters[0] || '';
            editor.face.faceIndex = cmd.parameters[1] || 0;
            editor.speaker.value = cmd.parameters[4];
            editor.background.value = cmd.parameters[2];
            editor.window.value = cmd.parameters[3];
        },
        setValue: (cmd, editor) => {
            const lines = editor.message.value.split('\n');
            // 기존 401 코드들 제거
            cmd.removeCodes(401);
            // 새 401 코드들 삽입
            lines.forEach((line, i) => {
                cmd.list.splice(cmd.index + 1 + i, 0, {
                    code: 401,
                    indent: cmd.indent,
                    parameters: [line]
                });
            });
            cmd.parameters = [
                editor.face.faceName,
                parseInt(editor.face.faceIndex),
                parseInt(editor.background.value),
                parseInt(editor.window.value),
                editor.speaker.value
            ];
        },
    },
    // 특수 코드들
    401: {
        name: '텍스트 계속',
        selectable: false,
        getDisplayText: (params) => {
            return `：　　　：${params[0] || ''}`;
        }
    },

    102: {
        name: '선택지 표시',
        category: '메시지',
        defaultParm: [['예', '아니오'], 1, 0, 0, 0], // [choices[], cancelType, defaultIndex, positionIndex, backgroundIndex]
        getDisplayText: (params) => {
            const choices = params[0] || [];
            const choicesStr = Array.isArray(choices) ? choices.join(', ') : choices;
            const cancelType = params[1];
            const defaultIndex = params[2];
            const positionIndex = params[3];
            const backgroundIndex = params[4];

            const positions = ['왼쪽', '가운데', '오른쪽'];
            const backgrounds = ['창', '어둡게', '투명'];

            const positionStr = positions[positionIndex] || '왼쪽';
            const backgroundStr = backgrounds[backgroundIndex] || '창';
            const defaultStr = defaultIndex !== -1 ? defaultIndex + 1 : '없음';
            const cancelStr = cancelType === -2 ? '분기' : (cancelType === -1 ? '금지' : cancelType + 1);

            return `선택지 표시：${choicesStr} (${backgroundStr}, ${positionStr}, #${defaultStr}, #${cancelStr})`;
        },
        editorFields: {
            choice1: {
                type: 'text',
                label: '선택 #1'
            },
            choice2: {
                type: 'text',
                label: '선택 #2'
            },
            choice3: {
                type: 'text',
                label: '선택 #3'
            },
            choice4: {
                type: 'text',
                label: '선택 #4'
            },
            choice5: {
                type: 'text',
                label: '선택 #5'
            },
            choice6: {
                type: 'text',
                label: '선택 #6'
            },
            background: {
                label: '배경',
                type: 'select',
                options: [
                    { value: 0, label: '창' },
                    { value: 1, label: '어둡게' },
                    { value: 2, label: '투명' }
                ]
            },
            window: {
                label: '창의 위치',
                type: 'select',
                options: [
                    { value: 0, label: '왼쪽' },
                    { value: 1, label: '가운데' },
                    { value: 2, label: '오른쪽' }
                ]
            },
            defaultChoice: {
                label: '초기값',
                type: 'select',
                options: [
                    { value: 0, label: '선택 #1' },
                    { value: 1, label: '선택 #2' },
                    { value: 2, label: '선택 #3' },
                    { value: 3, label: '선택 #4' },
                    { value: 4, label: '선택 #5' },
                    { value: 5, label: '선택 #6' }
                ]
            },
            cancelType: {
                label: '취소했을때',
                type: 'select',
                options: [
                    { value: -2, label: '분기' },
                    { value: -1, label: '금지' },
                    { value: 0, label: '선택 #1' },
                    { value: 1, label: '선택 #2' },
                    { value: 2, label: '선택 #3' },
                    { value: 3, label: '선택 #4' },
                    { value: 4, label: '선택 #5' },
                    { value: 5, label: '선택 #6' }
                ]
            }
        },
        endCode: 404,
        getValue: (cmd, editor) => {
            editor.choice1.value = cmd.parameters[0][0] || '';
            editor.choice2.value = cmd.parameters[0][1] || '';
            editor.choice3.value = cmd.parameters[0][2] || '';
            editor.choice4.value = cmd.parameters[0][3] || '';
            editor.choice5.value = cmd.parameters[0][4] || '';
            editor.choice6.value = cmd.parameters[0][5] || '';
            editor.background.value = cmd.parameters[4] ?? 0;
            editor.window.value = cmd.parameters[3] ?? 0;
            editor.defaultChoice.value = cmd.parameters[2] ?? 0;
            editor.cancelType.value = cmd.parameters[1] ?? -2;
        },
        setValue: (cmd, editor) => {
            // 선택지 배열 업데이트
            cmd.parameters[0] = [
                editor.choice1.value,
                editor.choice2.value,
                editor.choice3.value,
                editor.choice4.value,
                editor.choice5.value,
                editor.choice6.value
            ];
            // 빈 셀 제거
            while (cmd.parameters[0].length > 0 && !cmd.parameters[0][cmd.parameters[0].length - 1]) {
                cmd.parameters[0].pop();
            }

            cmd.parameters[1] = parseInt(editor.cancelType.value);
            cmd.parameters[2] = parseInt(editor.defaultChoice.value);
            cmd.parameters[3] = parseInt(editor.window.value);
            cmd.parameters[4] = parseInt(editor.background.value);

            const choices = Array.from({ length: cmd.parameters[0].length }, (_, i) => i);
            let hasCancelBranch = cmd.parameters[1] === -2;
            let delIndex = 0;
            console.log(choices, hasCancelBranch);
            for (let i = cmd.index + 1; i < cmd.list.length; i++) {
                const currentCode = cmd.list[i].code;

                if (currentCode === 402) {
                    if (choices.length > 0) {
                        choices.shift(); // 선택지 하나 제거
                    } else {
                        // 제거할 부분 시작 인덱스
                        if (delIndex === 0) {
                            delIndex = i;
                        }
                    }
                }

                if (currentCode === 403) {
                    if (hasCancelBranch) {
                        hasCancelBranch = false
                        if (delIndex !== 0) {
                            cmd.list.splice(delIndex, i - delIndex);
                            i -= (i - delIndex);
                            delIndex = 0;
                        }
                    } else {
                        if (delIndex === 0) {
                            delIndex = i;
                        }
                    }
                }

                if (currentCode === 404) {
                    if (delIndex !== 0) {
                        cmd.list.splice(delIndex, i - delIndex);
                        i -= (i - delIndex);
                    }

                    // 남은 선택지들 추가
                    for (let choiceIdx = 0; choiceIdx < choices.length; choiceIdx++) {
                        cmd.list.splice(i, 0, {
                            code: 402,
                            indent: cmd.indent,
                            parameters: [choices[choiceIdx]]
                        });
                        i++;
                        cmd.list.splice(i, 0, {
                            code: 0,
                            indent: cmd.indent + 1,
                            parameters: []
                        });
                        i++;
                    }

                    // 취소 분기 추가
                    if (hasCancelBranch) {
                        cmd.list.splice(i, 0, {
                            code: 403,
                            indent: cmd.indent,
                            parameters: []
                        });
                        i++;
                        cmd.list.splice(i, 0, {
                            code: 0,
                            indent: cmd.indent + 1,
                            parameters: []
                        });
                        i++;
                    }
                    break; // 끝
                }
            }
        }
    },
    402: {
        selectable: false,
        getDisplayText: (params, cmd) => {
            const parentCmd = cmd.findParentCode(102);
            const choiceText = parentCmd.parameters[0][params[0]];
            return `：${choiceText}일 때`;
        }
    },
    403: {
        selectable: false,
        getDisplayText: (params, cmd) => {
            return `：취소일 때`;
        }
    },
    404: {
        selectable: false,
        defaultParm: [],
        getDisplayText: (params) => {
            return `：분기 종료`;
        }
    },
    111: {
        name: '조건 분기',
        category: '제어',
        defaultParm: [0, 0, 0, 0, 0], // 기본값
        getDisplayText: (params) => {
            if (em && em.getConditionalBranchText) {
                return `조건분기：${em.getConditionalBranchText(params)}`;
            }
            return '조건분기：';
        }
    },

    121: {
        name: '스위치 조작',
        category: '게임 진행',
        defaultParm: [1, 1, 0], // [switchId, switchId, state]
        getDisplayText: (params) => {
            const switchId = String(params[0]).padStart(4, '0');
            const switchName = em.getSwitchName ? em.getSwitchName(params[0]) : '';
            const state = params[2] === 0 ? 'ON' : 'OFF';
            return `스위치 조작：#${switchId} ${switchName} = ${state}`;
        },
        getValue: (cmd, editor) => {
            editor.switch.value = cmd.parameters[0];
            editor.toggle.value = cmd.parameters[2];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.switch.value;
            cmd.parameters[2] = editor.toggle.value;
        },
        editorFields: {
            switch: {
                label: '스위치',
                type: 'switch'
            },
            toggle: {
                label: '상태',
                type: 'toggle'
            }
        }
    },

    122: {
        name: '변수 조작',
        category: '게임 진행',
        defaultParm: [1, 0, 0], // [variableId, operation, operand]
        getDisplayText: (params) => {
            const varId = String(params[0]).padStart(4, '0');
            const varName = em.getVariableName ? em.getVariableName(params[0]) : '';
            const ops = ['=', '+=', '-=', '*=', '/=', '%'];
            const op = ops[params[1]] || '=';
            return `변수 조작：#${varId} ${varName} ${op} ${params[2]}`;
        },
        editorFields: [
            {
                paramIndex: 0,
                label: '변수',
                type: 'variable',
                default: 1
            },
            {
                paramIndex: 1,
                label: '연산',
                type: 'select',
                options: [
                    { value: 0, label: '대입 (=)' },
                    { value: 1, label: '더하기 (+=)' },
                    { value: 2, label: '빼기 (-=)' },
                    { value: 3, label: '곱하기 (*=)' },
                    { value: 4, label: '나누기 (/=)' },
                    { value: 5, label: '나머지 (%)' }
                ],
                default: 0
            },
            {
                paramIndex: 2,
                label: '값',
                type: 'number',
                default: 0
            }
        ]
    },

    201: {
        name: '장소 이동',
        category: '이동',
        defaultParm: [0, 1, 0, 0, 0, 0], // [direct, mapId, x, y, direction, fadeType]
        getDisplayText: (params) => {
            const isDirectDesignation = params[0] === 0;
            let locationStr = '';
            const directionMap = { 0: '유지', 2: '아래', 4: '왼쪽', 6: '오른쪽', 8: '위' };
            const directionName = directionMap[params[4]] || '유지';
            const fades = ['검게', '하얗게', '없음'];
            const fadeName = fades[params[5]] || '검게';

            if (isDirectDesignation) {
                const mapId = params[1] || 0;
                const mapName = em.getMapName ? em.getMapName(mapId) : `맵${mapId}`;
                const x = params[2] || 0;
                const y = params[3] || 0;
                locationStr = `${mapName} (${x},${y})`;
            } else {
                const mapVarId = params[1] || 0;
                const xVarId = params[2] || 0;
                const yVarId = params[3] || 0;
                const mapVarName = em.getVariableName ? em.getVariableName(mapVarId) : `#${mapVarId}`;
                const xVarName = em.getVariableName ? em.getVariableName(xVarId) : `#${xVarId}`;
                const yVarName = em.getVariableName ? em.getVariableName(yVarId) : `#${yVarId}`;
                locationStr = `변수:${mapVarName} (변수:${xVarName},변수:${yVarName})`;
            }

            let optionsStr = '';
            if (params[4] !== 0) {
                optionsStr += ` (방향: ${directionName})`;
            }
            if (params[5] !== 0) {
                optionsStr += ` (페이드: ${fadeName})`;
            }

            return `장소 이동：${locationStr}${optionsStr}`;
        },
        editorFields: {
            designation: {
                type: 'select',
                label: '지정 방식',
                options: [
                    { value: 0, label: '직접 지정' },
                    { value: 1, label: '변수 지정' }
                ]
            },
            mapId: {
                type: 'number',
                label: '맵 ID / 변수 ID',
                min: 1
            },
            x: {
                type: 'number',
                label: 'X 좌표 / 변수 ID',
                min: 0
            },
            y: {
                type: 'number',
                label: 'Y 좌표 / 변수 ID',
                min: 0,
            },
            mapIdVar: {
                type: 'variable',
                label: '맵 ID / 변수 ID',
                min: 1
            },
            xVar: {
                type: 'variable',
                label: 'X 좌표 / 변수 ID',
                min: 0
            },
            yVar: {
                type: 'variable',
                label: 'Y 좌표 / 변수 ID',
                min: 0,
            },
            direction: {
                type: 'select-direction',
                label: '방향',
            },
            fadeType: {
                type: 'select',
                label: '페이드 타입',
                options: [
                    { value: 0, label: '검은색' },
                    { value: 1, label: '흰색' },
                    { value: 2, label: '없음' }
                ]
            }
        },
        getValue: (cmd, editor) => {
            editor.designation.value = cmd.parameters[0];
            if (cmd.parameters[0] === 1) {
                // 변수 지정
                editor.mapIdVar.value = cmd.parameters[1];
                editor.xVar.value = cmd.parameters[2];
                editor.yVar.value = cmd.parameters[3];
            } else {
                // 직접 지정
                editor.mapId.value = cmd.parameters[1]  ;
                editor.x.value = cmd.parameters[2];
                editor.y.value = cmd.parameters[3];
            }
            editor.mapId.value = editor.mapId.value || 1;
            editor.direction.value = cmd.parameters[4];
            editor.fadeType.value = cmd.parameters[5];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.designation.value;
            if (cmd.parameters[0] === 1) {
                // 변수 지정
                cmd.parameters[1] = editor.mapIdVar.value;
                cmd.parameters[2] = editor.xVar.value;
                cmd.parameters[3] = editor.yVar.value;
            } else {
                // 직접 지정   

                cmd.parameters[1] = editor.mapId.value;
                cmd.parameters[2] = editor.x.value;
                cmd.parameters[3] = editor.y.value;
            }
            cmd.parameters[4] = editor.direction.value;
            cmd.parameters[5] = editor.fadeType.value;
        }
    },

    204: {
        name: '지도 스크롤',
        category: '화면',
        defaultParm: [2, 1, 3, true], // [direction, distance, speed, wait]
        getDisplayText: (params) => {
            const directionMap = { 2: '아래', 4: '왼쪽', 6: '오른쪽', 8: '위' };
            const direction = directionMap[params[0]] || '아래';
            const distance = params[1] || 1;
            const speed = params[2] || 3;
            const wait = params[3] ? '대기' : '';

            return `지도 스크롤：${direction}, ${distance}, ${speed}${wait ? ' (' + wait + ')' : ''}`;
        },
        editorFields: [
            {
                paramIndex: 0,
                label: '방향',
                type: 'select-direction',
                default: 2
            },
            {
                paramIndex: 1,
                label: '거리',
                type: 'number',
                min: 1,
                max: 100,
                default: 1
            },
            {
                paramIndex: 2,
                label: '속도',
                type: 'select-speed',
                default: 3
            },
            {
                paramIndex: 3,
                label: '대기',
                type: 'checkbox',
                default: true
            }
        ]
    },

    230: {
        name: '대기',
        category: '타이밍',
        defaultParm: [60], // [frames]
        getDisplayText: (params) => {
            const frames = params[0] || 0;
            return `대기：${frames}프레임`;
        },
        editorFields: {
            num: {
                label: '대기 시간 (프레임)',
                type: 'number'
            }
        },
        getValue: (cmd, editor) => {
            editor.num.value = cmd.parameters[0] || 0;
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.num.value;
        }
    },

    250: {
        name: 'SE 재생',
        category: '음향',
        defaultParm: ['', 100, 100, 0], // [filename, volume, pitch, pan]
        getDisplayText: (params) => {
            const filename = params[0] || '없음';
            const volume = params[1] ?? 100;
            const pitch = params[2] ?? 100;
            const pan = params[3] ?? 0;
            return `SE 재생：${filename} (음량:${volume}, 피치:${pitch}, 팬:${pan})`;
        },
        editorFields: [
            {
                type: 'audio-selector',
                label: 'SE 파일',
                paramIndex: 0,
                audioType: 'se',
                default: ''
            },
            {
                paramIndex: 1,
                label: '음량',
                type: 'number',
                default: 100,
                min: 0,
                max: 100
            },
            {
                paramIndex: 2,
                label: '피치',
                type: 'number',
                default: 100,
                min: 50,
                max: 150
            },
            {
                paramIndex: 3,
                label: '팬',
                type: 'number',
                default: 0,
                min: -100,
                max: 100
            }
        ]
    },

    241: {
        name: 'BGM 재생',
        category: '음향',
        defaultParm: ['', 90, 100, 0], // [filename, volume, pitch, pan]
        getDisplayText: (params) => {
            const filename = params[0] || '없음';
            const volume = params[1] ?? 100;
            const pitch = params[2] ?? 100;
            const pan = params[3] ?? 0;
            return `BGM 재생：${filename} (음량:${volume}, 피치:${pitch}, 팬:${pan})`;
        },
        editorFields: [
            {
                type: 'audio-selector',
                label: 'BGM 파일',
                paramIndex: 0,
                audioType: 'bgm',
                default: ''
            },
            {
                paramIndex: 1,
                label: '음량',
                type: 'number',
                default: 100,
                min: 0,
                max: 100
            },
            {
                paramIndex: 2,
                label: '피치',
                type: 'number',
                default: 100,
                min: 50,
                max: 150
            },
            {
                paramIndex: 3,
                label: '팬',
                type: 'number',
                default: 0,
                min: -100,
                max: 100
            }
        ]
    },

    245: {
        name: 'BGS 재생',
        category: '음향',
        defaultParm: ['', 100, 100, 0], // [filename, volume, pitch, pan]
        getDisplayText: (params) => {
            const filename = params[0] || '없음';
            const volume = params[1] ?? 100;
            const pitch = params[2] ?? 100;
            const pan = params[3] ?? 0;
            return `BGS 재생：${filename} (음량:${volume}, 피치:${pitch}, 팬:${pan})`;
        },
        editorFields: [
            {
                type: 'audio-selector',
                label: 'BGS 파일',
                paramIndex: 0,
                audioType: 'bgs',
                default: ''
            },
            {
                paramIndex: 1,
                label: '음량',
                type: 'number',
                default: 100,
                min: 0,
                max: 100
            },
            {
                paramIndex: 2,
                label: '피치',
                type: 'number',
                default: 100,
                min: 50,
                max: 150
            },
            {
                paramIndex: 3,
                label: '팬',
                type: 'number',
                default: 0,
                min: -100,
                max: 100
            }
        ]
    },



    // 제어 흐름
    112: {
        name: '분기：그 외',
        category: '제어',
        defaultParm: [],
        getDisplayText: (params) => {
            return `분기：그 외`;
        }
    },

    412: {
        name: '조건분기：끝',
        getDisplayText: (params) => {
            return `조건분기：끝`;
        }
    },

    115: {
        name: '반복',
        category: '제어',
        defaultParm: [],
        getDisplayText: (params) => {
            return `반복`;
        }
    },

    116: {
        name: '반복：끝',
        category: '제어',
        defaultParm: [],
        getDisplayText: (params) => {
            return `반복：끝`;
        }
    },

    117: {
        name: '공통 이벤트',
        category: '제어',
        defaultParm: [0], // [commonEventId]
        getDisplayText: (params) => {
            const commonEventName = em.getCommonEventName ? em.getCommonEventName(params[0] || 0) : `공통이벤트${params[0]}`;
            return `공통 이벤트：${commonEventName}`;
        }
    },

    123: {
        name: '셀프 스위치 조작',
        category: '게임 진행',
        defaultParm: [0, 0], // [selfSwitch, state]
        getDisplayText: (params) => {
            const selfSwitch = params[0];
            const state = params[1] === 0 ? 'ON' : 'OFF';
            return `셀프 스위치 조작：${selfSwitch} = ${state}`;
        },
        getValue: (cmd, editor) => {
            editor.switch.value = ['A', 'B', 'C', 'D'].indexOf(cmd.parameters[0]);
            editor.value.value = cmd.parameters[1];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = ['A', 'B', 'C', 'D'][editor.switch.value];
            cmd.parameters[1] = editor.value.value;
        },
        editorFields: {
            switch:{
                label: '셀프 스위치',
                type: 'select',
                options: [
                    { value: 0, label: 'A' },
                    { value: 1, label: 'B' },
                    { value: 2, label: 'C' },
                    { value: 3, label: 'D' }
                ]
            },
            value:{
                label: '상태',
                type: 'toggle'
            }
        }
    },

    125: {
        name: '금전 증감',
        category: '게임 진행',
        defaultParm: [0, 0, 0], // [operationType, amount, increase]
        getDisplayText: (params) => {
            const amount = params[1] || 0;
            const sign = params[2] === 0 ? '+' : '-';
            return `금전 증감：${sign}${amount}`;
        }
    },

    126: {
        name: '아이템 증감',
        category: '게임 진행',
        defaultParm: [1, 1, 0], // [itemId, amount, increase]
        getDisplayText: (params) => {
            const itemName = em.getItemName ? em.getItemName(params[0] || 0) : `아이템${params[0]}`;
            const amount = params[1] || 0;
            const sign = params[2] === 0 ? '+' : '-';
            return `아이템 증감：${itemName} ${sign}${amount}`;
        }
    },

    127: {
        name: '무기 증감',
        category: '게임 진행',
        defaultParm: [1, 1, 0], // [weaponId, amount, increase]
        getDisplayText: (params) => {
            const weaponName = em.getWeaponName ? em.getWeaponName(params[0] || 0) : `무기${params[0]}`;
            const amount = params[1] || 0;
            const sign = params[2] === 0 ? '+' : '-';
            return `무기 증감：${weaponName} ${sign}${amount}`;
        }
    },

    128: {
        name: '방어구 증감',
        category: '게임 진행',
        defaultParm: [1, 1, 0], // [armorId, amount, increase]
        getDisplayText: (params) => {
            const armorName = em.getArmorName ? em.getArmorName(params[0] || 0) : `방어구${params[0]}`;
            const amount = params[1] || 0;
            const sign = params[2] === 0 ? '+' : '-';
            return `방어구 증감：${armorName} ${sign}${amount}`;
        }
    },

    129: {
        name: '파티원 변경',
        category: '게임 진행',
        defaultParm: [1, 0, 0], // [actorId, add, initialize]
        getDisplayText: (params) => {
            const actorId = params[0] || 0;
            const actorName = em.getActorName ? em.getActorName(actorId) : `액터${actorId}`;
            const operations = ['추가', '해제'];
            const operation = operations[params[1]] || '추가';
            const isInitialize = params[2] ? ' (초기화)' : '';
            return `파티원 변경：${actorName} ${operation}${isInitialize}`;
        }
    },

    // 이동 관련
    205: {
        name: '이동 루트 설정',
        category: '이동',
        defaultParm: [-1, { list: [{ code: 0, parameters: [] }], repeat: false, skippable: false, wait: false }],
        getDisplayText: (params) => {
            const charId = params[0];
            let charName = '';
            if (charId === -1) {
                charName = '플레이어';
            } else if (charId === 0) {
                charName = '해당 이벤트';
            } else if (charId >= 1) {
                if (em.map && em.map.events && em.map.events[charId]) {
                    charName = em.map.events[charId].name || `이벤트 ${charId}`;
                } else {
                    charName = `이벤트 ${charId}`;
                }
            }
            const moveRoute = params[1] || {};
            const options = [];
            if (moveRoute.repeat) options.push('반복');
            if (moveRoute.skippable) options.push('스킵');
            if (moveRoute.wait) options.push('대기');
            const optStr = options.length > 0 ? ` (${options.join(', ')})` : '';
            return `이동 루트 설정：${charName}${optStr}`;
        }
    },

    // 캐릭터/화면 효과
    211: {
        name: '투명 상태 변경',
        category: '캐릭터',
        defaultParm: [0],
        getDisplayText: (params) => {
            return `투명 상태 변경：${params[0] === 0 ? 'ON' : 'OFF'}`;
        },
        getValue: (cmd, editor) => {
            editor.switch.value = cmd.parameters[0];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.switch.value;
        },
        editorFields: {
            switch: {
                type: 'toggle',
                label: 'on/off'
            }
        }

    },

    212: {
        name: '애니메이션 표시',
        category: '캐릭터',
        defaultParm: [-1, 1, 0], // [characterId, animationId, wait]
        getDisplayText: (params) => {
            const charId = params[0];
            const charName = (params[0] == -1) ? '플레이어' : (params[0] == 0) ? '현재 이벤트' : em.getCharacterName(charId);
            const animId = params[1] || 0;
            const animName = em.getAnimationName(animId)
            const wait = params[2] ? '(대기)' : '';
            return `애니메이션 표시：${charName}, ${animName} ${wait}`;
        },
        getValue: (cmd, editor) => {
            editor.character.value = cmd.parameters[0];
            editor.ani.value = cmd.parameters[1];
            editor.wait.value = cmd.parameters[2];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.character.value;
            cmd.parameters[1] = editor.ani.value;
            cmd.parameters[2] = editor.wait.value
        },
        editorFields: {
            character: {
                type: 'select-character',
                label: '대상'
            },
            ani: {
                type: 'select-animation',
                label: '애니메이션'
            },
            wait: {
                type: 'checkbox',
                label: '대기'
            }
        }
    },

    213: {
        name: '말풍선 아이콘 표시',
        category: '캐릭터',
        defaultParm: [-1, 0, 0], // [characterId, balloonId, wait]
        getDisplayText: (params) => {
            const charId = params[0] || -1;
            const charName = em.getCharacterName ? em.getCharacterName(charId) : '플레이어';
            const iconNames = ['없음', '느낌표', '물음표', '음표', '하트', '분노', '땀', '뒤죽박죽', '침묵', '전구', 'Zzz'];
            const iconName = iconNames[params[1]] || `아이콘${params[1]}`;
            const wait = params[2] ? ' (대기)' : '';
            return `말풍선 아이콘 표시：${charName}, ${iconName}${wait}`;
        },
        getValue: (cmd, editor) => {
            editor.character.value = cmd.parameters[0];
            editor.balloon.value = cmd.parameters[1];
            editor.wait.value = cmd.parameters[2];
        },
        setValue: (cmd, editor) => {
            cmd.parameters[0] = editor.character.value;
            cmd.parameters[1] = editor.balloon.value;
            cmd.parameters[2] = editor.wait.value
        },
        editorFields: {
            character: {
                type: 'select-character',
                label: '대상'
            },
            balloon: {
                type: 'select-balloon',
                label: '말풍선'
            },
            wait: {
                type: 'checkbox',
                label: '대기'
            }
        }
    },

    221: {
        name: '화면의 페이드아웃',
        category: '화면',
        defaultParm: [],
        getDisplayText: (params) => {
            return `화면의 페이드아웃`;
        },
        editorFields: null // 파라미터 없음
    },

    222: {
        name: '화면의 페이드인',
        category: '화면',
        defaultParm: [],
        getDisplayText: (params) => {
            return `화면의 페이드인`;
        },
        editorFields: null // 파라미터 없음
    },

    223: {
        name: '화면 색조 변경',
        category: '화면',
        defaultParm: [[0, 0, 0, 0], 60, 0], // [color, duration, wait]
        getDisplayText: (params) => {
            const color = params[0] || [0, 0, 0, 0];
            const colorStr = `(${color[0]},${color[1]},${color[2]},${color[3]})`;
            const duration = params[1] || 0;
            const wait = params[2] ? ' (대기)' : '';
            return `화면 색조 변경：${colorStr}, ${duration}프레임${wait}`;
        }
    }
};

class EventManager {
    constructor() {
        this.events = null
        this.selectedCommand = null; // 선택된 커맨드
        this.selectedCommandElement = null; // 선택된 커맨드 DOM 요소
        this.selectedCommandElements = null; // 선택된 커맨드들 (여러 개)
        this.selectedCommandAnchor = undefined; // Shift+클릭 범위 선택의 기준점
        this.commandDefinitions = EVENT_COMMAND_DEFINITIONS;
        this.clipboard = null; // 이벤트 복사/붙여넣기 클립보드
        this.commandClipboard = null; // 커맨드 복사/붙여넣기 클립보드
        this.draggedEvent = null; // 드래그 중인 이벤트
        this.dragStartPos = null; // 드래그 시작 위치
        this.selectedEvent = null; // 현재 선택된 이벤트
        this.initClickEvent()
        this.initDragEvent();
        this.initInspectorTabs();
        this.initFontSizeControl();
    }

    get map() {
        return main.map
    }
    get images() {
        return main.mapManager.images
    }

    loadEvent() {
        this.render()
    }

    // 맵에 있는 이벤트들을 불러와서 그리기
    render() {
        this.events = this.map.events.filter(x => x != null);

        // 플레이어 렌더링
        this.drawPlayer();

        // 이벤트 렌더링
        for (const event of this.map.events) {
            if (!event || !event.pages || event.pages.length === 0) continue;

            const x = event.x;
            const y = event.y;
            const imgInfo = event.pages[0].image;

            this.drawCharacter(event, x, y);
        }
    }

    drawPlayer() {
        const canvas = document.getElementById('map-canvas');
        const ctx = canvas.getContext('2d');
        // 플레이어가 현재 맵에 있는지 확인
        console.log('[drawPlayer] 시작 - mapId:', main. map,main.systemData.startMapId);

        if( main.mapInfo.id !== main.systemData.startMapId) {
            console.log('[drawPlayer] 플레이어가 현재 맵에 없음. 그리지 않음.');
            return; // 플레이어가 현재 맵에 없음
        }

        const x = main.systemData.startX;
        const y = main.systemData.startY;   
        console.log('[drawPlayer] 플레이어 위치:', x, y);
        
        const TILE_SIZE = 48;
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;

        // 파티 첫 번째 멤버의 캐릭터 정보 가져오기
        const actorId = main.systemData.partyMembers[0];
        console.log('[drawPlayer] Actor ID:', actorId);
        
        const actor = main.actorsData[actorId];
        if (!actor) {
            console.warn('[drawPlayer] Actor not found:', actorId);
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
        console.log('[drawPlayer] Character:', characterName, 'Index:', characterIndex);

        // 캐릭터 이미지 그리기
        if (characterName) {
            const img = main.images.get(characterName);
            console.log('[drawPlayer] Image loaded:', img, 'complete:', img?.complete, 'naturalWidth:', img?.naturalWidth);
            
            if (!img || !img.complete || !img.naturalWidth) {
                console.warn('[drawPlayer] Image not loaded:', characterName);
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

    drawCharacter(event, x, y) {
        const TILE_SIZE = 48;
        const dx = x * TILE_SIZE;
        const dy = y * TILE_SIZE;
        const info = event.pages[0].image
        const canvas = document.getElementById('map-canvas');
        const ctx = canvas.getContext('2d');

        let img = null
        if (info.tileId) {
            const tile = main.mapManager.loader.getNormalTile(info.tileId)
            ctx.drawImage(
                tile.img,
                tile.sx, tile.sy, TILE_SIZE, TILE_SIZE,
                dx, // 가로 중앙 정렬
                dy,       // 발끝을 타일 바닥에 맞춤
                TILE_SIZE, TILE_SIZE
            );
        }
        else if (info.characterName) {
            img = main.images.get(info.characterName);
            // $로 시작하면 단일 캐릭터(3x4), 아니면 8인용(12x8)
            const isBig = info.characterName.startsWith('$');

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

        // 2. 에디터 전용 시각화 (노란색 가이드)
        ctx.strokeStyle = 'rgba(0, 140, 255, 1)';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 이벤트 ID 표시
        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.fillText(event.id, dx + 4, dy + 14);
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

            const rect = canvas.getBoundingClientRect();
            const tileX = Math.floor((e.clientX - rect.left) / 48);
            const tileY = Math.floor((e.clientY - rect.top) / 48);

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
                    main.mapManager.renderMap();
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
                main.mapManager.renderMap();
            }

            isDragging = false;
            this.draggedEvent = null;
            this.dragStartPos = null;
        });
    }

    // 빈 공간 우클릭 메뉴
    showMapContextMenu(x, y, tileX, tileY) {
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
        const menu = document.getElementById('event-context-menu');
        if (menu) menu.remove();
        const cmdMenu = document.getElementById('command-context-menu');
        if (cmdMenu) cmdMenu.remove();
    }

    setupMenuClose(menu) {
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    // 커맨드 컨텍스트 메뉴
    showCommandContextMenu(x, y, cmd, index, page) {
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
                action: () => this.editCommand(cmd, index, page)
            },
            {
                label: '추가 (Enter)',
                action: () => this.openCommandSelector(index, page)
            },
            {
                label: '복사 (Ctrl+C)',
                action: () => this.copyCommand(cmd, index)
            },
            {
                label: '붙여넣기 (Ctrl+V)',
                action: () => this.pasteCommand(index, page),
                disabled: !this.commandClipboard
            },
            {
                label: '삭제 (Del)',
                action: () => this.deleteCommand(index, page),
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

    // 커맨드 선택 창 열기
    openCommandSelector(index, page) {
        console.log('[openCommandSelector] 호출 - index:', index);
        // 기존 showCommandList 메서드 호출
        if (typeof this.showCommandList === 'function') {
            this.showCommandList(index, page);
        } else if (typeof this.addCommand === 'function') {
            this.addCommand(index, page);
        } else {
            console.error('[openCommandSelector] showCommandList/addCommand method not found');
        }
    }

    // 커맨드 복사 (선택된 모든 커맨드, indent:0인 0코드 제외)
    copyCommand(cmd, index) {
        const page = this.selectedCommand.page;
        const commands = page.list;
        
        // 선택된 인덱스들이 있으면 모두 복사
        const indicesToCopy = this.selectedCommand.indices || [index];
        const commandsToCopy = indicesToCopy
            .map(idx => commands[idx])
            .filter(cmd => !(cmd.code === 0 && cmd.indent === 0)); // indent:0인 0코드 제외

        this.commandClipboard = JSON.parse(JSON.stringify(commandsToCopy));
        console.log('커맨드 복사:', commandsToCopy.length, '개');
    }

    // 커맨드 붙여넣기 (선택된 커맨드 위에, 붙여넣은 위치로 선택 이동)
    pasteCommand(index, page) {
        if (!this.commandClipboard) return;

        const commandsToPaste = JSON.parse(JSON.stringify(this.commandClipboard));
        const pasteCount = commandsToPaste.length;
        
        // 선택된 위치 위에 삽입
        page.list.splice(index, 0, ...commandsToPaste);
        
        // 리스트 다시 렌더링
        this.displayCommandList(page);
        
        // 붙여넣은 첫 번째 커맨드로 선택 이동
        setTimeout(() => {
            const contentsList = document.getElementById('ins-contents-list');
            const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
            const newCmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === index);
            
            if (newCmdDiv) {
                const newCmd = page.list[index];
                this.selectCommand(newCmdDiv, newCmd, index, page);
                this.selectedCommandAnchor = index;
            }
        }, 0);
        
        console.log('커맨드 붙여넣기:', pasteCount, '개');
    }

    // 커맨드 삭제 (선택된 모든 커맨드, 0 코드 제외)
    deleteCommand(index, page) {
        const commands = page.list;
        
        // 선택된 인덱스들이 있으면 모두 삭제
        const indicesToDelete = this.selectedCommand.indices || [index];
        
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

        this.selectedCommand = null;
        this.selectedCommandElement = null;
        this.selectedCommandElements = null;
        this.displayCommandList(page);
        console.log('커맨드 삭제:', indicesToDelete.length, '개');
    }

    // 플레이어 시작 위치 설정
    setPlayerStart(x, y) {
        main.systemData.startMapId = main.mapInfo.id;
        main.systemData.startX = x;
        main.systemData.startY = y;
        main.mapManager.renderMap();
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
        main.mapManager.renderMap();
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
        main.mapManager.renderMap();
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

        main.mapManager.renderMap();
        console.log('이벤트 삭제:', event.id);
    }

    // 이벤트 우클릭 메뉴 표시 (기존 코드 제거됨)

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
                    this.displayCommandList(page);
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
        this.displayCommandList(page);

        // 이미지 미리보기
        this.drawInspectorPreview(event, pageIndex);
    }

    // 커맨드 목록 표시
    displayCommandList(page) {
        const contentsList = document.getElementById('ins-contents-list');
        if (!contentsList) return;

        contentsList.innerHTML = '';
        this.selectedCommand = null;
        this.selectedCommandElement = null;

        const commands = page.list || [];

        if (commands.length === 0) {
            contentsList.innerHTML = '<div style="color: #666; padding: 2px 4px;">◆</div>';
            return;
        }

        commands.forEach((cmd, index) => {
            if (!cmd) return;

            // code 401 (메시지 계속)은 스킵 - 이전 텍스트 명령어의 부라인으로 처리
            if (cmd.code === 401) return;

            // code 505 (이동루트 상세)는 스킵 - code 205의 부라인으로 처리
            if (cmd.code === 505) return;

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

            // 마우스 호버 이벤트
            cmdDiv.addEventListener('mouseenter', (e) => {
                if (this.selectedCommandElement !== cmdDiv) {
                    cmdDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            });

            cmdDiv.addEventListener('mouseleave', (e) => {
                if (this.selectedCommandElement !== cmdDiv) {
                    cmdDiv.style.backgroundColor = 'transparent';
                }
            });

            // 클릭 이벤트 (선택)
            cmdDiv.addEventListener('click', (e) => {
                if (e.shiftKey && this.selectedCommandAnchor !== undefined) {
                    // Shift 클릭: 범위 선택 (anchor 기준)
                    e.preventDefault();
                    this.selectCommandRange(this.selectedCommandAnchor, index, page);
                } else {
                    // 일반 클릭: 단일/연결 선택 및 anchor 설정
                    this.selectCommand(cmdDiv, cmd, index, page, e);
                    this.selectedCommandAnchor = index;
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
                this.showCommandContextMenu(e.pageX, e.pageY, cmd, index, page);
            });

            const commandText = this.getCommandText(cmd.code, cmd.parameters, new Command(cmd, index, commands));

            // selectable 속성 확인 (기본값 true)
            const definition = this.commandDefinitions[cmd.code];
            const selectable = definition?.selectable !== false;
            const prefixStr = selectable ? '<span style="color: #888;">◆</span>' : ""

            cmdDiv.innerHTML = `${prefixStr}${commandText}`;
            contentsList.appendChild(cmdDiv);

            // 텍스트 표시 커맨드(101) 뒤에 오는 code 401들 출력
            if (cmd.code === 101) {
                for (let i = index + 1; i < commands.length; i++) {
                    const nextCmd = commands[i];
                    if (nextCmd && nextCmd.code === 401) {
                        const subDiv = document.createElement('div');
                        subDiv.style.cssText = `
                        padding: 2px 4px;
                        margin-left: ${indent}px;
                        color: ${color};
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        line-height: 1.4;
                    `;
                        subDiv.innerHTML = `<span style="color: #888;">：　　　：</span>${nextCmd.parameters[0] || ''}`;
                        contentsList.appendChild(subDiv);
                    } else if (nextCmd && nextCmd.code !== 401) {
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

            // 일부 커맨드는 추가 라인 표시 (이동 루트 등)
            this.appendCommandSublines(contentsList, cmd, indent);
        });
    }

    // 커맨드 추가 라인 표시 (메시지 계속, 이동 루트 등)
    appendCommandSublines(contentsList, cmd, indent) {
        const color = this.getCommandColor(cmd.code);

        // 메시지 계속 텍스트들 (code 401)
        if (cmd.code === 401 && cmd.parameters && cmd.parameters[0]) {
            const subDiv = document.createElement('div');
            subDiv.style.cssText = `
            padding: 2px 4px;
            margin-left: ${indent + 20}px;
            color: ${color};
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.4;
        `;
            subDiv.innerHTML = `<span style="color: #888;">：　　　：</span>${cmd.parameters[0]}`;
            contentsList.appendChild(subDiv);
        }
    }

    // 이동 경로 커맨드 텍스트
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

    // 코드별 텍스트 색상 가이드
    getCommandColor(code) {
        if (code === 101 || code === 401) return '#fff'; // 메시지: 흰색
        if (code === 111) return '#ffea00'; // 조건 분기: 노란색
        if (code === 122 || code === 121) return '#ffa500'; // 변수/스위치: 주황색
        return '#ccc'; // 기본
    }

    // RPG Maker MZ 커맨드 코드 변환
    getCommandText(code, parameters, cmd) {
        const p = parameters || [];

        // 새로운 정의 시스템 사용
        const definition = this.commandDefinitions[code];
        if (definition && definition.getDisplayText) {
            return definition.getDisplayText(p, cmd);
        }

        // 정의되지 않은 코드는 기존 방식으로 처리
        const commandMap = {
            // 기본
            0: () => '',

            103: () => `숫자 입력`,
            104: () => `아이템 선택`,
            105: () => `스크롤 텍스트`,

            // 주석 (108/408)
            108: () => `주석：${p[0] || ''}`,
            322: () => {
                const actorId = p[0] || 0;
                const actorName = this.getActorName(actorId);
                const walkImg = p[1] || '';
                const walkIndex = p[2] || 0;
                const faceImg = p[3] || '';
                const faceIndex = p[4] || 0;
                const svImg = p[5] || '';

                const faceStr = faceImg ? `${faceImg}(${faceIndex})` : '(없음)';
                const walkStr = walkImg ? `${walkImg}(${walkIndex})` : '(없음)';
                const svStr = svImg || '(없음)';

                return `액터 이미지 변경：${actorName}, ${faceStr}, ${walkStr}, ${svStr}`;
            },

            // 대기 (230)
            230: () => `대기：${p[0] || 30}프레임들`,

            // 사운드 (241, 245, 250은 EVENT_COMMAND_DEFINITIONS에서 정의)
            242: () => {
                const duration = p[0] || 0;
                return `BGM 페이드아웃：${duration}초`;
            },
            246: () => {
                const duration = p[0] || 0;
                return `BGS 페이드아웃：${duration}초`;
            },
            251: () => `BGS 페이드아웃`,

            // 스크립트 (119)
            119: () => `스크립트：${(p[0] || '').substring(0, 50)}`,
        };

        if (typeof commandMap[code] === 'function') {
            try {
                return commandMap[code]();
            } catch (e) {
                console.error(`[getCommandText] 코드 ${code} 처리 오류:`, e);
                return `[코드 ${code}]`;
            }
        }

        if (commandMap[code]) {
            return commandMap[code];
        }

        return `[코드 ${code}]`;
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

    // 커맨드별 색상 설정
    getCommandColor(code) {
        // 메시지 커맨드 (흰색)
        if (code === 101 || code === 102 || code === 103 || code === 104 || code === 105 || code === 401) {
            return '#ffffff';
        }
        // 조건분기 (노란색)
        if (code === 111 || code === 112 || code === 113) {
            return '#ffff00';
        }
        // 스위치/변수 (주황색)
        if (code === 121 || code === 122 || code === 123 || code === 125 || code === 126 || code === 127 || code === 128) {
            return '#ffaa00';
        }
        // 이동 (녹색)
        if (code === 201 || code === 205) {
            return '#00ff00';
        }
        // 화면 효과 (하늘색)
        if (code === 211 || code === 212 || code === 213 || code === 221 || code === 222 || code === 230) {
            return '#00ffff';
        }
        // 사운드 (분홍색)
        if (code === 241 || code === 242 || code === 245 || code === 250 || code === 251) {
            return '#ff00ff';
        }
        // 기본값 (회색)
        return '#aaaaaa';
    }

    // 방향 이름 변환
    getDirectionName(direction) {
        const directionMap = {
            2: '하',
            4: '좌',
            6: '우',
            8: '상'
        };
        return directionMap[direction] || '하';
    }

    // 트리거 이름 변환
    getTriggerName(trigger) {
        const triggerMap = {
            0: '접근',
            1: '플레이어 터치',
            2: '이벤트 터치',
            3: '자동 실행',
            4: '병렬 처리'
        };
        return triggerMap[trigger] || '접근';
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

    // 커맨드 선택 (연결된 코드 포함)
    selectCommand(element, cmd, index, page, event) {
        // 이전 선택 해제
        if (this.selectedCommandElements) {
            this.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const commands = page.list;
        const indicesToSelect = [index];

        // 연결된 코드 찾기
        if (cmd.code === 101) {
            // 텍스트 표시 - 401 수집
            for (let i = index + 1; i < commands.length; i++) {
                if (commands[i].code === 401) {
                    indicesToSelect.push(i);
                } else break;
            }
        } else if (cmd.code === 102) {
            // 선택지 표시 - 402, 403 수집
            for (let i = index + 1; i < commands.length; i++) {
                if (commands[i].code === 402 || commands[i].code === 403) {
                    indicesToSelect.push(i);
                } else break;
            }
        } else if (cmd.code === 205) {
            // 이동 루트 - 505 수집
            for (let i = index + 1; i < commands.length; i++) {
                if (commands[i].code === 505) {
                    indicesToSelect.push(i);
                } else break;
            }
        }

        // 선택된 인덱스들의 DOM 요소 찾기 및 하이라이트
        const contentsList = document.getElementById('ins-contents-list');
        const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
        
        this.selectedCommandElements = [];
        indicesToSelect.forEach(idx => {
            const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
            if (cmdDiv) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                this.selectedCommandElements.push(cmdDiv);
            }
        });

        this.selectedCommandElement = element;
        this.selectedCommand = { cmd, index, page, indices: indicesToSelect };

        // 단축키 리스너 등록 (한번만)
        if (!this.commandKeyListener) {
            this.commandKeyListener = (e) => {
                // 입력 요소에 포커스되어 있으면 무시
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT')) {
                    return;
                }

                if (!this.selectedCommand) return;

                const { cmd, index, page } = this.selectedCommand;

                // Enter: 커맨드 선택 창 열기
                if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    this.openCommandSelector(index, page);
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
            document.addEventListener('keydown', this.commandKeyListener);
        }
    }

    // 커맨드 범위 선택 (Shift+클릭)
    selectCommandRange(startIndex, endIndex, page) {
        // 이전 선택 해제
        if (this.selectedCommandElements) {
            this.selectedCommandElements.forEach(el => {
                el.style.backgroundColor = 'transparent';
            });
        }

        const minIndex = Math.min(startIndex, endIndex);
        const maxIndex = Math.max(startIndex, endIndex);
        const indicesToSelect = [];

        for (let i = minIndex; i <= maxIndex; i++) {
            indicesToSelect.push(i);
        }

        // DOM 요소 찾기 및 하이라이트
        const contentsList = document.getElementById('ins-contents-list');
        const allCmdDivs = Array.from(contentsList.children).filter(div => div.dataset.commandIndex);
        
        this.selectedCommandElements = [];
        indicesToSelect.forEach(idx => {
            const cmdDiv = allCmdDivs.find(div => parseInt(div.dataset.commandIndex) === idx);
            if (cmdDiv) {
                cmdDiv.style.backgroundColor = 'rgba(64, 128, 255, 0.4)';
                this.selectedCommandElements.push(cmdDiv);
            }
        });

        // 마지막 커맨드 정보 저장
        const cmd = page.list[endIndex];
        this.selectedCommandElement = this.selectedCommandElements[this.selectedCommandElements.length - 1];
        this.selectedCommand = { cmd, index: endIndex, page, indices: indicesToSelect };
    }

    // 커맨드 편집
    editCommand(cmd, index, page) {
        // 빈 코드(0)인 경우 코드 리스트 표시
        if (cmd.code === 0) {
            this.showCommandList(index, page);
            return;
        }

        // 정의 시스템에서 편집기 찾기
        const definition = this.commandDefinitions[cmd.code];
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

    // 범용 에디터 생성 (editorFields 기반)
    createGenericEditor(cmd, index, page, definition) {
        const savedPage = this.currentPage;
        this.currentPage = page;
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
            this.currentPage = savedPage;
            this.displayCommandList(page);
            document.body.removeChild(overlay);
        };
        buttonContainer.appendChild(okBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '취소';
        cancelBtn.style.cssText = `padding: 8px 20px; background-color: #555; border: 1px solid #444; border-radius: 4px; color: #fff; font-size: 13px; cursor: pointer;`;
        cancelBtn.onclick = () => {
            this.currentPage = savedPage;
            document.body.removeChild(overlay);
        };
        buttonContainer.appendChild(cancelBtn);

        container.appendChild(buttonContainer);

        // ESC 키로 닫기
        const escListener = (e) => {
            if (e.key === 'Escape') {
                this.currentPage = savedPage;
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

    // 입력 요소에서 값 추출하기
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

    // 코드 리스트 표시
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
        Object.entries(this.commandDefinitions).forEach(([code, def]) => {
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
                    this.insertCommand(cmdInfo.code, index, page);
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

    // 커맨드 삽입
    insertCommand(code, index, page) {
        // 빈 코드의 indent를 가져옴
        const emptyCodeIndent = page.list[index]?.indent || 0;

        // 새로운 정의 시스템을 사용하여 기본 커맨드 생성
        const definition = this.commandDefinitions[code];
        const newCmd = definition && definition.defaultParm
            ? {
                code: code,
                indent: emptyCodeIndent,
                parameters: definition.defaultParm
            }
            : {
                code: code,
                indent: emptyCodeIndent,
                parameters: []
            };

        // endCode가 있으면 종료 코드도 생성
        const commandsToInsert = [newCmd];

        if (definition && definition.endCode) {
            const endDefinition = this.commandDefinitions[definition.endCode];
            const endCmd = endDefinition && endDefinition.defaultParm
                ? {
                    code: definition.endCode,
                    indent: emptyCodeIndent,
                    parameters: endDefinition.defaultParm
                }
                : {
                    code: definition.endCode,
                    indent: emptyCodeIndent,
                    parameters: []
                };
            commandsToInsert.push(endCmd);
        }

        // 새로운 빈 코드 생성 (다음 커맨드를 위해)
        const emptyCmd = {
            code: 0,
            indent: emptyCodeIndent,
            parameters: []
        };

        commandsToInsert.push(emptyCmd);
        page.list.splice(index, 1, ...commandsToInsert);

        // UI 새로고침
        this.displayCommandList(page);

        // 방금 추가한 커맨드 바로 편집
        // 정의 시스템 활용
        if (definition.editorFields || (code === 205)) {
            this.editCommand(newCmd, index, page);
        }
    }

    // 얼굴 이미지 선택 모달
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
            this.displayCommandList(page);
        }, this.currentEvent, this.currentMap);
    }

    showMoveRouteEditor(currentCharacterId, currentMoveRoute, onConfirm, currentEvent, currentMap) {
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
                cmdItem.textContent = this.getMoveRouteCommandText(moveCmd.code, moveCmd.parameters);
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
