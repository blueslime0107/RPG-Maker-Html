(() => {

_initMembers = Game_Character.prototype.initMembers
Game_Character.prototype.initMembers = function(){
    _initMembers.call(this)
    this.spining = false
}

_isMapPassable = Game_Player.prototype.isMapPassable 
Game_Player.prototype.isMapPassable = function(x, y, d) {
    const x2 = $gameMap.roundXWithDirection(x, d);
    const y2 = $gameMap.roundYWithDirection(y, d);
    if($gameMap.regionId(x2,y2) == 10 || $gameMap.terrainTag(x2,y2) == 1){
        return true
    }
    return _isMapPassable.call(this,x,y,d)
};

_playerUpdate = Game_Character.prototype.update
Game_Character.prototype.update = function(){
    _playerUpdate.call(this)
    this.spinUpdate()
}

Game_Character.prototype.spinUpdate = function(){
    if(!this.spining){
        this.sprite.rotation = 0
        this.sprite.scale.set(1,1)
        return
    }
    if(this.sprite.scale.x > 0){
        this.sprite.y -= 24
        this.sprite.anchor.set(0.5,0.5)
        this.sprite.rotation += 0.2
        this.sprite.scale.x -= 1/60
        this.sprite.scale.y -= 1/60
    }
}

    
Window_ActorCommand.prototype.makeCommandList = function() {
    if (this._actor) {
        // this.addAttackCommand();
        // this.addGuardCommand();
        this.addSkillCommands();
        this.addItemCommand();
    }
};

Window_ActorCommand.prototype.addSkillCommands = function() {
    const skillTypes = this._actor.skillTypes();
    for (const stypeId of skillTypes) {
        const name = $dataSystem.skillTypes[stypeId];
        this.addCommand("행동", "skill", true, stypeId);
    }
};

Window_ActorCommand.prototype.addItemCommand = function() {
    
    if($gameSwitches.value(10)){
        return
    }
    this.addCommand("단서", "item");
};

Window_BattleStatus.prototype.maxCols = function() {
    if($gameSwitches.value(10)){
        return 3
    }
    return 2;
};

Sprite_Gauge.prototype.bitmapWidth = function() {
    
    if($gameSwitches.value(10)){
        return 150
    }
    return 248;
};


Sprite_Gauge.prototype.label = function() {
    if($gameSwitches.value(10)){
        switch (this._statusType) {
            case "hp":
                return "체력";
            case "mp":
                return "정신";
            case "tp":
                return TextManager.tpA;
            default:
                return "";
        }
    }else{
        switch (this._statusType) {
            case "hp":
                return "체력";
            case "mp":
                return "진행도";
            case "tp":
                return TextManager.tpA;
            default:
                return "";
        }
    }
};

Scene_Gameover.prototype.playGameoverMusic = function() {
    AudioManager.stopBgm();
    AudioManager.stopBgs();
    // AudioManager.playMe($dataSystem.gameoverMe);
};


Scene_Battle.prototype.terminate = function() {
    Scene_Message.prototype.terminate.call(this);
    $gameParty.onBattleEnd();
    $gameTroop.onBattleEnd();
    // AudioManager.stopMe();
    if (this.shouldAutosave()) {
        this.requestAutosave();
    }
};

})()