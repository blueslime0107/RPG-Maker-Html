
class MapListEditor {
    constructor() {
        this.draggedMapId = 0
    }

    init(){
        this.renderMapList()
    }
    // 맵 리스트
    renderMapList() {
        const mapListElement = document.getElementById('map-list');

        // 1. main.mapInfos 원본을 정렬 (정렬은 표시 순서를 위해 필요)
        const validInfos = main.data.mapInfos.filter(info => info !== null)
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
    // 컨텍스트 메뉴 닫기
    closeContextMenu() {
        const menu = document.getElementById('map-context-menu');
        if (menu) {
            menu.remove();
        }
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
        main.data.tilesets.forEach((ts, idx) => {
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




}