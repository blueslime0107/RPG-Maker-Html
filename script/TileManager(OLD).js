
class MapManager {
    constructor() {
    }


    // loadMap 메서드 보완
    async loadMap(map) {
        this.tileset = main.tilesets[map.tilesetId];

        // 2. 타일셋 설정 및 렌더링
        const names = this.tileset.tilesetNames;
        this.loader.setup(
            main.map,
            this.tileset,
            {
                "A1": main.images.get(names[0]),
                "A2": main.images.get(names[1]),
                "A3": main.images.get(names[2]),
                "A4": main.images.get(names[3]),
                "A5": main.images.get(names[4]),
                "B": main.images.get(names[5]),
                "C": main.images.get(names[6]),
                "D": main.images.get(names[7]),
                "E": main.images.get(names[8])
            }
        );

        this.renderMap();
    }

    // 전체 맵 렌더링 (타일 + 이벤트)
    renderMap() {
        if (!main.map) return;
        this.loader.render(); // MapLoader를 통한 타일 렌더링
    }


    setTile(mapX, mapY, layerMode, selectedTile) {

        if (!main.map) return;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (this.isOutofMap(targetX, targetY)) continue;

                const tileId = this.calculateTileId(selectedTile, w, h);

                // R 탭(리전)은 항상 Layer 5에 배치
                let layerIdx;
                if (selectedTile.tab === 'R') {
                    layerIdx = 5;
                } else if (layerMode === 'auto') {
                    layerIdx = this.determineAutoLayer(targetX, targetY, tileId, selectedTile.tab);
                } else {
                    layerIdx = parseInt(layerMode);
                }

                // 오토타일인 경우 주변 타일 검사 후 패턴 결정
                let finalTileId = tileId;
                if (this.isAutotile(tileId)) {
                    finalTileId = this.calculateAutotilePattern(targetX, targetY, layerIdx, tileId);
                }

                this.setMapData(targetX, targetY, layerIdx, finalTileId);

                // 오토타일 전파: 주변 8칸 재계산 (항상 수행 - 인접 타일이 오토타일일 수 있음)
                // 레이어 0, 1에서만 오토타일 연결이 발생함
                this.propagateAutotile(targetX, targetY, layerIdx);
            }
        }
        this.renderMap();
    }

    // 특정 좌표의 레이어 타일값 조회 함수
    getTileIndex(x, y, layerIdx) {
        if (!main.map) return 0;
        const width = main.map.width;
        const height = main.map.height;
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        return (layerIdx * width * height) + (y * width) + x;
    }

    // 맵 범위 밖인지 검사
    isOutofMap(x, y) {
        if (!main.map) return true;
        return x < 0 || x >= main.map.width || y < 0 || y >= main.map.height;
    }

    // 오토타일 여부 확인
    isAutotile(tileId) {
        // A1~A4 범위
        return this.loader.isAutotile(tileId);
    }






    // 오토타일 전파: 주변 8칸 재계산
    propagateAutotile(x, y, layerIdx) {

        const directions = [
            [-1, -1], [0, -1], [1, -1],propagateAutotile
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const checkX = x + dx;
            const checkY = y + dy;

            if (this.isOutofMap(checkX, checkY)) continue;

            const checkTileId = this.mapData(checkX, checkY, layerIdx);

            // 주변 타일이 오토타일이면 재계산
            if (this.isAutotile(checkTileId)) {
                const baseId = this.getAutotileBaseId(checkTileId);
                const newPattern = this.calculateAutotilePattern(checkX, checkY, layerIdx, baseId);
                this.setMapData(checkX, checkY, layerIdx, newPattern);
            }
        }
    }

    // 타일 지우기
    eraseTile(mapX, mapY, layerMode, selectedTile) {
        if (!main.map) return;

        for (let h = 0; h < selectedTile.h; h++) {
            for (let w = 0; w < selectedTile.w; w++) {
                const targetX = mapX + w;
                const targetY = mapY + h;

                if (this.isOutofMap(targetX, targetY)) continue;

                // R 탭(리전)은 Layer 5 지우기
                if (selectedTile.tab === 'R') {
                    this.setMapData(targetX, targetY, 5, 0);
                    continue;
                }

                // 자동 모드: 타일 그룹에 따라 레이어 결정
                if (layerMode === 'auto') {
                    if (selectedTile.tab === 'A') {
                        // A 그룹: Layer 1 → Layer 0 순으로 지우기
                        if (this.mapData(targetX, targetY, 1) !== 0) {
                            const oldTileId = this.mapData(targetX, targetY, 1);
                            this.setMapData(targetX, targetY, 1, 0);
                            // 오토타일이었다면 주변 전파
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 1);
                            }
                        } else {
                            const oldTileId = this.mapData(targetX, targetY, 0);
                            this.setMapData(targetX, targetY, 0, 0);
                            if (this.isAutotile(oldTileId)) {
                                this.propagateAutotile(targetX, targetY, 0);
                            }
                        }
                    } else {
                        // B~E 그룹: Layer 3 → Layer 2 순으로 지우기
                        if (this.mapData(targetX, targetY, 3) !== 0) {
                            this.setMapData(targetX, targetY, 3, 0);
                        } else {
                            this.setMapData(targetX, targetY, 2, 0);
                        }
                    }
                } else {
                    // 수동 모드: 선택한 레이어만 지우기
                    const layerIdx = parseInt(layerMode);
                    const oldTileId = this.mapData(targetX, targetY, layerIdx);
                    this.setMapData(targetX, targetY, layerIdx, 0);

                    // 오토타일이었다면 주변 전파
                    if (this.isAutotile(oldTileId)) {
                        this.propagateAutotile(targetX, targetY, layerIdx);
                    }
                }
            }
        }
        this.renderMap();
    }


}
