/**
 * @typedef {'text'|'number'|'select'|'switch'|'variable'|
 * 'face-selector'|'message-text'|'choice-list'|
 * 'audio-selector'|'checkbox'|'select-direction'|
 * 'select-speed'|'select-character'|'toggle'|
 * 'select-balloon'} FieldType
 */

/**
 * @typedef {Object} EditorField
 * @property {FieldType} type - 필드 타입
 * @property {string} label - 필드 레이블
 * @property {number} paramIndex - 파라미터 인덱스
 * @property {*} [default] - 기본값
 * @property {number} [min] - 최솟값 (number 타입)
 * @property {number} [max] - 최댓값 (number 타입)이
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

// 이벤트 커맨드 정의
/** @type {Object<number, CommandDefinition>} */
const EVENT_COMMAND_DEFINITIONS = {
    0:{
        name: '빈 커맨드',
        getDisplayText: (params) => {
            return ``;
        }
    },
    // 메시지
    101: {
        name: '텍스트 표시',
        category: '메시지',
        defaultParm: ['', 0, 0, 2, ''], // [faceName, faceIndex, background, position, speakerName]
        listCode: 401, // 연속된 401 코드들이 이어짐
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
                type: 'text',
                label: '화자'
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
            console.log(codes)
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
        parentCode: 101,
        getDisplayText: (params) => {
            return `：　　　：${params[0] || ''}`;
        }
    },

    102: {
        name: '선택지 표시',
        category: '메시지',
        defaultParm: [['예', '아니오'], 1, 0, 0, 0], // [choices[], cancelType, defaultIndex, positionIndex, backgroundIndex]
        childCodes: [402, 403, 404], // 마지막 요소 404가 endCode
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
        parentCode: 102,
        getDisplayText: (params, cmd) => {
            const parentCmd = cmd.findParentCode(102);
            const choiceText = parentCmd.parameters[0][params[0]];
            return `：${choiceText}일 때`;
        }
    },
    403: {
        parentCode: 102,
        getDisplayText: (params, cmd) => {
            return `：취소일 때`;
        }
    },
    404: {
        parentCode: 102,
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