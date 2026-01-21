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
