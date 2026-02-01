/**
 * FieldEditor 기본 클래스
 * 각 필드 타입별로 상속받아 구현
 */
class FieldEditor {
    constructor(obj = { label, change, valiable}) {
        this.value = null;
        this.label = obj.label;
        this.change = obj.change;
        this.valiable = true; // 활성화 여부
        this.html = this.createHtml(obj); // constructor에서 즉시 생성
        if(obj.valiable !== undefined){
            this.toggleValiable(obj.valiable);
        }
    }

    /**
     * HTML 요소 생성 (반드시 구현)
     */
    createHtml() {
        throw new Error('createHtml must be implemented');
    }

    toggleValiable(value){
        this.valiable = value;
        this.html.disabled = !this.valiable
        this.html.style.opacity = this.valiable ? '1' : '0.4';
    }
}


/**
 * 체크박스 필드
 */
class CheckboxFieldEditor extends FieldEditor {
    constructor(obj) {
        super(obj);
        this.value = false;
        this.labelText.textContent = obj.label;
    }

    createHtml() {
        const container = document.createElement('label');
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
            user-select: none; /* 클릭할 때 텍스트가 드래그되는 것 방지 */
        `;

        
        const labelText = document.createElement('span');
        labelText.textContent = ''; // 여기에 내용 입력
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.style.cssText = `width: 18px; height: 18px; cursor: pointer; margin: 0;`;
        input.addEventListener('change', (e) => {
            this.value = e.target.checked;
            if (typeof this.onChange === 'function') {
                this.onChange(this.value);
            }
        });

        // [체크박스] [텍스트] 순서로 배치
        container.appendChild(input);
        container.appendChild(labelText);

        this.checkbox = input;
        this.labelText = labelText;
        return container;
    }

    onChange(value){
        this.value = value;
        this.checkbox.checked = !!this.value;
        this.change(this.value);
    }
}


/**
 * 스위치 선택 필드
 */
class SwitchFieldEditor extends FieldEditor {
    constructor(obj) {
        super(obj);
        this.value = 1;
    }

    createHtml() {
        const btn = document.createElement('button');
        btn.className = 'ins-selector-btn';
        btn.style.cssText = 'width: 100%; padding: 6px; font-size: 11px; text-align: left;';
        btn.textContent = `[${this.value}] ${editor.getSwitchName(this.value)}`;
        btn.onclick = () => {editor.showSwitchSelector(this.value, (newId) => this.onChange(newId));};
        return btn;
    }

    onChange(id){
        this.value = id || this.value;
        const name = editor.getSwitchName(this.value);
        this.html.textContent = `[${this.value}] ${name}`;
        this.change(this.value);
    }
}

/**
 * 변수 선택 필드
 */
class VariableFieldEditor extends FieldEditor {
    constructor(obj) {
        super(obj);
        this.value = 1;
    }
    createHtml() {
        this.value = 1;
        const btn = document.createElement('button');
        btn.style.cssText = `width: 100%; padding: 6px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; cursor: pointer; font-size: 11px; text-align: left; transition: background-color 0.2s;`;
        btn.textContent = `[${this.value}] ${editor.getVariableName(this.value)}`;
        btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#4a4a4a');
        btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#3a3a3a');
        btn.onclick = () => {
            editor.showVariableSelector(this.value || 1, (newId) => {
                this.value = newId;
                this.onChange();
            });
        };
        return btn;
    }

    onChange(value){
        if(value) this.value = value
        const name = editor.getVariableName(this.value);
        this.html.textContent = `[${this.value}] ${name}`;
        this.change(this.value);
    }
}


/**
 * 선택 필드 (드롭다운)
 */
class SelectFieldEditor extends FieldEditor {

    getOptions(options) {
        this.options = options;
        return 
    }

    createHtml(obj) {
        this.options = []
        this.getOptions(obj.options)
        
        const container = document.createElement('label');
        container.style.cssText = `
            display: grid;
            grid-template-columns: 1fr;
            gap: 6px;
            margin-bottom: 4px;
        `;
        
        const labelText = document.createElement('span');
        labelText.textContent = obj.label; // 여기에 내용 입력

        const select = document.createElement('select');
        select.style.cssText = `width: 100%; padding: 6px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 11px;`;
        this.options.forEach((opt, index) => {
            const option = document.createElement('option');
            if(opt.value !== undefined){
                option.value = opt.value;
                option.textContent = opt.label;
            }else{
                option.value = index;
                option.textContent = opt;
            }
            select.appendChild(option);
        });
        select.addEventListener('change', (e) => {
            this.value = parseInt(e.target.value);
            this.onChange(this.value || 0);
        });
        container.appendChild(labelText);
        container.appendChild(select);
        this.select = select;
        return container;
    }
    onChange(id){
        this.select.value = id;
        this.change(this.value);
    }
    toggleValiable(value){
        super.toggleValiable(value);
        this.select.disabled = !this.valiable
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
        this.options = [
            { value: 1, label: '1: 가장 느림' },
            { value: 2, label: '2: 느림' },
            { value: 3, label: '3: 보통' },
            { value: 4, label: '4: 빠름' },
            { value: 5, label: '5: 더 빠름' },
            { value: 6, label: '6: 가장 빠름' }
        ]
    }
}
class SelectFrequency extends SelectFieldEditor {
    getOptions() {
        this.options = [
            { value: 1, label: '1: 가장 느림' },
            { value: 2, label: '2: 느림' },
            { value: 3, label: '3: 보통' },
            { value: 4, label: '4: 빠름' },
            { value: 5, label: '5: 더 빠름' }
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
 * 숫자 입력 필드
 */
class NumberFieldEditor extends FieldEditor {
    constructor(obj) {
        super(obj);
        this.value = 0;
    }
    createHtml(obj) {
        const input = document.createElement('input');
        input.type = 'number';
        if (obj.min !== undefined) input.min = obj.min;
        if (obj.max !== undefined) input.max = obj.max;
        input.style.cssText = `width: 100%; padding: 6px; background-color: #3a3a3a; border: 1px solid #555; border-radius: 4px; color: #fff; font-size: 11px;`;
        input.value = 0

        input.addEventListener('input', (e) => {
            this.value = parseInt(e.target.value) || 0;
        });
        return input;
    }

    onChange(id){
        this.value = id;
        this.change(this.value);
    }
}

class CharacterEditor extends FieldEditor {

    createHtml() {

        // 새로운 프리뷰 영역 생성
        const previewArea = document.createElement('div');
        previewArea.style.cssText = `
            width: 100%;
            min-width: 105px;
            min-height: 105px;
            background-color: #2a2a2a;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        `;
        
        // 호버 효과
        previewArea.addEventListener('mouseenter', () => {
            previewArea.style.backgroundColor = '#3a3a3a';
        });
        previewArea.addEventListener('mouseleave', () => {
            previewArea.style.backgroundColor = '#2a2a2a';
        });
        
        // 새 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        canvas.style.border = '1px solid #555';
        canvas.style.backgroundColor = '#1a1a1a';
        previewArea.appendChild(canvas);

        // 클릭 시 선택 모달 열기
        previewArea.addEventListener('click', () => {
            editor.showCharacterSelector(this.value, (image) => {
                this.value = image;
                this.onChange(image)
            });
        });

        this.previewArea = previewArea;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        return previewArea;
    }


    // 3. 인스펙터용 이미지 미리보기 (작은 캔버스에 그리기)
    drawPreview() {
        if (!this.value.characterName && !this.value.tileId) {
            this.previewArea.innerHTML = '<div style="color: #888;">이미지 없음</div>';
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.value.characterName) {
            editor.drawCharacter(this.ctx,this.value,24,24)
        } else if (this.value.tileId) {
            // 타일 미리보기
            try {
                const tile = main.mapManager.loader.getNormalTile(this.value.tileId);
                this.ctx.drawImage(tile.img, tile.sx, tile.sy, 48, 48, 24, 24, 48, 48);
            } catch (e) {
                console.error('[drawInspectorPreview] 타일 로드 오류:', e);
                this.previewArea.innerHTML = '<div style="color: #888;">타일 로드 실패</div>';
            }
        }
    }

    onChange(image){
        this.value = image;
        this.change(image);
        this.drawPreview()
    }

}
