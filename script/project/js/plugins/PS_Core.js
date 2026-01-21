
//=============================================================================
// RPG Maker MZ - Custom Wait
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 임의로 이벤트 처리를 잠시 기다리게 합니다
 * @author ParSL
 *
 * @help ButtonPicture.js
 *
 * This plugin provides a command to call a common event when a picture is
 * clicked.
 *
 * Use it in the following procedure.
 *   1. Execute "Show Picture" to display your button image.
 *   2. Call the plugin command "Set Button Picture".
 *
 * @command moveToChar
 * @desc 이 이벤트를 다른 이벤트 위치로 옮깁니다
 * 
 * @arg event
 * @desc 이벤트 Id (0=player)
 * @type int
 * @default 0
 * 
 * @command moveToCharName
 * @desc 이벤트를 해당 이름을 가진 이벤트로 이동한다
 * 
 * @arg target
 * @desc 이벤트 (0=플레이어)
 * @type int
 * @default 0
 * 
 * @arg name
 * @desc 이벤트 이름
 * @type string
 * @default 
 * 
 * @command dragCharToMe
 * @desc 해당 이벤트를 자신에게 이동시킨다
 * 
 * @arg event
 * @desc 이벤트 Id (0=player)
 * @type int
 * @default 0
 * 
 * @command moveToStart
 * @desc 이 이벤트가 처음 생성된 위치로 이동합니다
 * 
 * @command playerInputAble
 * @desc 주인공의 캐릭터 키입력을 허용할지 설정합니다
 * 
 * @arg toggle
 * @desc 허용 여부
 * @type boolean
 * @default true
 * @on yes
 * @off no
 * 
 */

//#region UseFulCode

const Screen_ = {
    width : 1104,
    height : 624,
    center: {
        x: 552,
        y: 312
    }
}

function isInRange(num=0,range=0,crit=0){
    if(num+range < num){
        return num+range <= crit && crit <= num
    }
    else{
        return num <= crit && crit <= num+range
    }
}

function playerX(){
    return $gamePlayer.screenX()-24-96-24
}
function playerY(){
    return $gamePlayer.screenY()-48+24
}

function convertMapToScreen(object) {
    var tw = $gameMap.tileWidth();
    var th = $gameMap.tileHeight();
    return {x:Math.round($gameMap.adjustX(object.x) * tw + tw / 2), y:Math.round($gameMap.adjustY(object.y) * th + th / 2)}
};

function divideAndRemaind(a=0, b=0) {
    if (b === 0) {
        throw new Error("Division by zero is not allowed.");
    }

    const quotient = Math.floor(a / b);
    const remainder = a % b;

    return {
        quo: quotient,
        re: remainder
    };
}

function getImage(image,x,y,width,height,flipX=false){
    var bitmap = new Bitmap(width,height);  
    bitmap.bltImage(image,x,y,width,height,0,0,width,height);
    return bitmap;
}

var makeNewSprite = function(x,y,width,height,anchor=[0,0],size=[1,1]){
    let sprite = new Sprite()
    sprite.move(x,y)
    sprite.bitmap = new Bitmap(width,height)
    sprite.anchor.set(anchor[0],anchor[1])
    sprite.scale.set(size[0],size[1])
    return sprite
}

var centerPoint = function(x1,y1,x2,y2){
    return {x: (x1+x2)*0.5 , y: (y1+y2)*0.5}
}

var dirToPoint = function(curX,curY,targetX, targetY) {
    var dx = targetX - curX;
    var dy = targetY - curY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
}

var getDist = function(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;

    var distance = Math.sqrt(dx*dx + dy*dy);
    return distance;
}

var getDistObj = function(obj1,obj2) {
    var dx = obj2.x - obj1.x;
    var dy = obj2.y - obj1.y;

    var distance = Math.sqrt(dx*dx + dy*dy);
    return distance;
}

var getXyRadi = function(x,y,length,angle){
    return {x: x + length * Math.cos(angle * Math.PI / 180), 
    y: y + length * Math.sin(angle * Math.PI / 180)};
}

var getChoose = function(list) {
    if (list.length === 0) {
      return null; // 배열이 비어있을 경우 예외 처리
    }
  
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

function getImage(image,x,y,width,height){
    var bitmap = new Bitmap(width,height);  
    bitmap.blt(image,x,y,width,height,0,0);
    return bitmap;
}

function getRadi(value){
    return value * Math.PI / 180
}

function extractFunctionNames(inputFunction) {
    // 정규 표현식을 사용하여 함수 이름 추출
    console.log(inputFunction);
    const functionNames = inputFunction.toString()
  
    return functionNames;
}

function waiting(ms) {
    return new Promise(resolve => setTimeout(resolve, ms*17));
  }

function makeBitmapSprite(bitmap,scale=1){
    let sprite = new Sprite()
    sprite.bitmap = bitmap
    sprite.anchor.set(0.5,0.5)
    sprite.scale.set(scale,scale)
    return sprite
}

function downTime(value,frame){
    return 1 - 1 / value * frame
}

function upTime(value,frame){
    return 1 / value * frame
}

function getRandom(min,max){
    return (Math.random()*(max-min)+min)
}

function getRandNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandList(min, max) {
    const size = max - min + 1;
    const arr = Array.from({ length: size }, (_, i) => i + min);

    for (let i = size - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}


function cubicBezier(p1x, p1y, p2x, p2y) {
    return function (t) {
        const cx = 3 * p1x;
        const bx = 3 * (p2x - p1x) - cx;
        const ax = 1 - cx - bx;

        const cy = 3 * p1y;
        const by = 3 * (p2y - p1y) - cy;
        const ay = 1 - cy - by;

        function bezier(t, a, b, c) {
            return ((a * t + b) * t + c) * t;
        }

        function bezierX(t) {
            return bezier(t, ax, bx, cx);
        }

        function bezierY(t) {
            return bezier(t, ay, by, cy);
        }

        function derivativeX(t) {
            return (3 * ax * t + 2 * bx) * t + cx;
        }

        function solveCurveX(x, epsilon = 1e-6) {
            let t0 = 0;
            let t1 = 1;
            let t2 = x;
            let x2, d2;

            for (let i = 0; i < 8; i++) {
                x2 = bezierX(t2) - x;
                if (Math.abs(x2) < epsilon) return t2;
                d2 = derivativeX(t2);
                if (Math.abs(d2) < epsilon) break;
                t2 = t2 - x2 / d2;
            }

            while (t0 < t1) {
                x2 = bezierX(t2);
                if (Math.abs(x2 - x) < epsilon) return t2;
                if (x > x2) t0 = t2;
                else t1 = t2;
                t2 = (t1 - t0) * 0.5 + t0;
            }

            return t2;
        }

        return bezierY(solveCurveX(t));
    };
}


function moveToPosition(xCurrent, yCurrent, xTarget, yTarget, p1x, p1y, p2x, p2y, duration, frame) {
    const easingFunction = cubicBezier(p1x, p1y, p2x, p2y);

    const deltaX = xTarget - xCurrent;
    const deltaY = yTarget - yCurrent;

    const t = frame / duration;

    if (t >= 1) {
        console.log(`Final position: (${xTarget}, ${yTarget})`);
        return;
    }

    const easedT = easingFunction(t);
    const x = xCurrent + deltaX * easedT;
    const y = yCurrent + deltaY * easedT;

    return x,y

}

function modiValue(value1, value2) {
    return value1 > 0 ? value1 + value2 : value1 - value2;
}

//#endregion


AudioManager.playSe = function(se) {
    if (se.name) {
        
        this._seBuffers = this._seBuffers.filter(function(audio) {
            if(audio._url == `audio/se/${se.name}.ogg`){
                audio.stop()
                return false
            }
            return true
        });
        // [Note] Do not play the same sound in the same frame.
        const latestBuffers = this._seBuffers.filter(
            buffer => buffer.frameCount === Graphics.frameCount
        );
        if (latestBuffers.find(buffer => buffer.name === se.name)) {
            return;
        }
        const buffer = this.createBuffer("se/", se.name);
        this.updateSeParameters(buffer, se);
        buffer.play(false);
        this._seBuffers.push(buffer);
        this.cleanupSe();
    }
};
SceneManager.isGameActive = function() {
    // [Note] We use "window.top" to support an iframe.
    try {
        return true;
    } catch (e) {
        // SecurityError
        return true;
    }
};

$dataSprite = {character:{}};

(() => {
    const pluginName = "PS_CharAddition"
    const js_eventReset = "js:eventReset"
    const js_playerRushing = "js:playerRushing"
    const js_onChars = "js:onChars"

    //#region SpriteBitmap Addition
    Sprite.prototype.isMouseOver = function(){
        return this.worldTransform.tx - this.width*(1-this.anchor.x)*this.scale.x< TouchInput.x && 
        TouchInput.x < this.worldTransform.tx + this.width*(this.anchor.x)*this.scale.x  &&
        this.worldTransform.ty - this.height *(1-this.anchor.y)*this.scale.y < TouchInput.y && 
        TouchInput.y < this.worldTransform.ty + this.height *(this.anchor.y)*this.scale.y;
    }

    Sprite.prototype.isClicked = function(){
        return TouchInput.isTriggered() && this.isMouseOver()
    }

    Sprite.prototype.isActiveClicked = function(){
        return TouchInput.isTriggered() && this.isMouseOver()
    }

    Sprite.prototype.addSprite = function(bitmap,x,y,anchor = [0.5,0.5],scale = [1,1]){
        let sprite = new Sprite(bitmap)
        sprite.move(x,y)
        sprite.anchor.set(anchor[0],anchor[1])
        sprite.scale.set(scale[0],scale[1])
        this.addChild(sprite)
        return sprite
    }

    Sprite.prototype.updateMoveReal = function(){
        // this.x = this.realX
        if(this.realX != this.x){
          this.x += (this.realX - this.x)/this.moveSpd;
          if(Math.abs(this.x-this.realX) < 2){
            this.x = this.realX;
          }
        }
        if(this.realY != this.y){
            this.y += (this.realY - this.y)/this.moveSpd;
            if(Math.abs(this.y-this.realY) < 2){
                this.y = this.realY;
            }
        }
    }
    Sprite.prototype.smoothMove = function(x,y,add=false){
        // this.x = this.realX
        // this.y = this.realY
        this.realX = (add) ? this.realX+x : x
        this.realY = (add) ? this.realY+y : y
    }
    Sprite.prototype.hardMove = function(x,y,add=false){
        // this.x = this.realX
        // this.y = this.realY
        this.realX = (add) ? this.realX+x : x
        this.realY = (add) ? this.realY+y : y
        this.x = this.realX
        this.y = this.realY
    }

    Sprite.prototype.isMoving = function(){
    return this.realX == this.x && this.realY == this.y
    }
    Sprite.prototype.moveSpd = 10
    Sprite.prototype.realX = 0
    Sprite.prototype.realY = 0

    Bitmap.prototype.presetFont = function(fontSize,color,outcolor,outSize){
        this.outlineColor = outcolor
        this.textColor = color
        this.fontSize = fontSize
        this.outlineWidth = outSize
    }

    Bitmap.prototype.drawLineRect = function(ot,dt,color,x=0,y=0,width=this.width,height=this.height){
        this.fillRect(ot+x,ot+y,width-ot*2,dt,color)
        this.fillRect(ot+x,ot+y,dt,height-ot*2,color)
        this.fillRect(width-ot+x,height-ot+y,-(width-ot*2),-dt,color)
        this.fillRect(width-ot+x,height-ot+y,-dt,-(height-ot*2),color)
    }
    Bitmap.prototype.fillBitmap = function(bitmap,x=0,y=0){
        this.blt(bitmap,0,0,bitmap.width,bitmap.height,x,y)
    }
    // Bitmap.prototype.blt = function(source, sx, sy, sw, sh, dx, dy, dw, dh) {
    //     dw = dw || sw;
    //     dh = dh || sh;
    //     if (true) {
    //         this._context.globalCompositeOperation = 'source-over';
    //         this._context.drawImage(source._canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    //         this._setDirty();
    //     }
    // }
    Bitmap.prototype.easyDrawText = function(text,x,y,size,color,other=null){
        this.fontSize = size
        this.textColor = color
        this.outlineColor = other && other.outlineColor ? other.outlineColor : 'rgba(0,0,0,0.5)'
        this.outlineWidth = other && other.outlineWidth ? other.outlineWidth : 5
        this.drawText(text,x,y,other && other.width ? other.width : this.width,0,other && other.aligin ? other.aligin : "center")
    }

    Bitmap.prototype.fillAlpha = function(){
        var context = this._context
        context.save();
        context.globalAlpha = 0.5
        context.fill();
    context.restore();
        // context.fillStyle
        this._setDirty()
    }

    TouchInput._onMouseMove = function(event) {
        var x = Graphics.pageToCanvasX(event.pageX);
        var y = Graphics.pageToCanvasY(event.pageY);
        this._onMove(x, y);
    };

    Window_Message.prototype.isTriggered = function() {
        return (Input.isRepeated('ok') || Input.isRepeated('cancel'));
    };

    Bitmap.prototype.strokeRect = function(x, y, width, height, lineWidth, color) {
        if (lineWidth < 0) {
            return;
        }
        
        var context = this._context;
        context.save();
        
        // Set the line width and stroke color
        context.lineWidth = lineWidth;
        context.strokeStyle = color;
    
        // Draw the rectangle outline
        context.strokeRect(x, y, width, height);
        context.restore();
        this._baseTexture.update();
    };
    

    Bitmap.prototype.strokeCircle = function(x, y, width, radius, color, angle=360,stAngle=0) {
        if(radius < 0){return}
        var context = this._context;
        context.save();
        context.strokeStyle = color;
        context.lineWidth = width;
        context.beginPath();
        context.arc(x, y, radius, (stAngle-90)*Math.PI/180, (angle-90)*Math.PI/180, true);
        context.stroke();
        context.restore();
        this._setDirty();
    };

    Bitmap.prototype.drawLine = function(x, y, dx, dy, width, color) {
        if (width < 0) { return; }
        var context = this._context;
        context.save();
        context.lineWidth = width;
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(dx, dy);
        context.stroke();
        context.restore();
        this._setDirty();
    };
    
    //#endregion

    //#region CharAddition

    
    Object.defineProperties(Game_CharacterBase.prototype,{
        sprite: {
            get: function(){
                return $dataSprite.character[this.spriteId]
            }
        }
    })

    Game_Map.prototype.event = function(eventId){
        if(eventId == 0){
            return $gamePlayer
        }
        return this._events[eventId];
    }

    Game_Map.prototype.resetChars = function(){
        for(let event of this.events()){
            event.resetTriggered = true
            event.refresh()
        }
    }

    Game_Map.prototype.eventsXyVisible = function(x, y) {
        return this.events().filter(event => event.pos(x, y) && (event._characterName != "" || event._tileId != 0));
    };

    Game_Map.prototype.eventsNotDied = function(x, y) {
        return this.eventsXy(x,y).filter(event => !event.died);
    };

    characterbase_initMembers = Game_CharacterBase.prototype.initMembers
    Game_CharacterBase.prototype.initMembers = function(){
        characterbase_initMembers.call(this)
        this.spriteId = 0
    }

    Game_CharacterBase.prototype.canPass2 = function(x, y, d) {
        const x2 = $gameMap.roundXWithDirection(x, d);
        const y2 = $gameMap.roundYWithDirection(y, d);
        if (!$gameMap.isValid(x2, y2)) {
            return false;
        }
        if (this.isThrough() || this.isDebugThrough()) {
            return true;
        }
        if (!this.isMapPassable(x, y, d)) {
            return false;
        }
        if (this.isCollidedWithCharacters(x, y)) {
            return false;
        }
        return true;
    };
    
    Game_CharacterBase.prototype.canPass3 = function(x, y, d) {
        if ($gameMap.isPassable(x, y, d) && !this.isCollidedWithCharacters(x, y)) {
            return true;
        }
        return false;
    };

    Game_Character.prototype.resetTriggered = false
    
    Game_Character.prototype.teleport = function(x,y){
        this._x = x*1
        this._y = y*1
        this._realX = x*1
        this._realY = y*1
        if(this == $gamePlayer){
            $gameMap.setDisplayPos(x - $gamePlayer.centerX(), y - $gamePlayer.centerY())
        }
    }
    
    Game_Character.prototype.onChars = function(){
        return $gameMap.eventsXy(this.x, this.y).length > 1 || this.onChar($gamePlayer)
    }

    Game_Character.prototype.onCharsOnlyEvent = function(){
        return $gameMap.eventsXy(this.x, this.y).length > 1
    }
    
    Game_Character.prototype.onChar = function(character){
        return character.x == this.x && character.y == this.y
    }
    
    Game_Character.prototype.moveToChar = function(event){
        this.teleport(event.x,event.y)
    }

    Game_Character.prototype.moveToCharName = function(name){
        for(let event of $gameMap.events()){
            if(event.event().name == name){
                this.moveToChar(event)
            }
        }
    }

    _initmembers = Game_Player.prototype.initMembers
    Game_Player.prototype.initMembers = function(){
        _initmembers.call(this)
        this._canInput = true
    }
    
    Game_Player.prototype.isDashing = function() {
        return true;
    };

    Game_Player.prototype.setKeyInputable = function(value){
        this._canInput = value
    }

    _moveByInput = Game_Player.prototype.moveByInput
    Game_Player.prototype.moveByInput = function(){
        if(!this._canInput){return}
        _moveByInput.call(this)
    }

    _meetsConditions = Game_Event.prototype.meetsConditions
    Game_Event.prototype.meetsConditions = function(page) { // 출현 조건
        var c = page.conditions;
        if(c.switch1Valid) { // 스위치 1
            if($dataSystem.switches[c.switch1Id].startsWith("js")){
                let code = $dataSystem.switches[c.switch1Id]
                switch(code){
                    case js_eventReset:
                        return this.resetTriggered
                    case js_playerRushing:
                        return $gamePlayer._rushing
                    case js_onChars:
                        return this.onChars()
                }
            }
        }
        if (c.variableValid) { // 변수
            if($dataSystem.variables[c.variableId].startsWith("js")){
                let code = $dataSystem.variables[c.variableId]
                switch(code){
                    case "js:playerRegion":
                        return $gamePlayer.regionId() == c.variableValue
                }
            }
            // 변수가 같을때 출현, >= X
            if ($gameVariables.value(c.variableId) != c.variableValue) { 
                return false;
            }
        }
        return _meetsConditions.call(this,page)
    };

    _checkEventTriggerAuto = Game_Event.prototype.checkEventTriggerAuto
    Game_Event.prototype.checkEventTriggerAuto = function() { // 자동 병령처리
        if(this._pageIndex >= 0){
            let switch1Id = $dataSystem.switches[this.event().pages[this._pageIndex].conditions.switch1Id]
            if(switch1Id == js_eventReset){
                this.start();
            }
        }
        _checkEventTriggerAuto.call(this)
    };

    Game_Event.prototype.moveToStart = function(){
        this.teleport(this.event().x,this.event().y)
    }

    Game_Event.prototype.isCollidedWithEvents = function(x, y) {
        return Game_CharacterBase.prototype.isCollidedWithEvents.call(this,x,y)
    };
    
    Game_Interpreter.prototype.event = function(){
        return $gameMap.event(this._eventId)
    }

    _terminate = Game_Interpreter.prototype.terminate
    Game_Interpreter.prototype.terminate = function() { // 출현조건이  
        if(!!this._eventId){ // 이벤트 실행의 끝일때
            let event = $gameMap.event(this._eventId)
            if(event && event._pageIndex >= 0){
                // 스위치(19)면 리셋
                let switch1 = $dataSystem.switches[event.event().pages[event._pageIndex].conditions.switch1Id]
                if(switch1 == js_eventReset){
                    event.resetTriggered = false // 리셋 끄기
                    event.refresh()
                }
            }
        }
        _terminate.call(this)
    };
    _createCharacters = Spriteset_Map.prototype.createCharacters
    Spriteset_Map.prototype.createCharacters = function() {
        $dataSprite.character = {}
        this.spriteWaitNums = 0
        _createCharacters.call(this)
        for (const sprite of this._characterSprites) {
            $dataSprite.character[this.spriteWaitNums] = sprite
            sprite._character.spriteId = this.spriteWaitNums
            this.spriteWaitNums++
        }
    };

    Spriteset_Map.prototype.createSpawnEvent = function(id) {
        var event = $gameMap._events[id];
        var sId = this._characterSprites.length;
        this._characterSprites[sId] = new Sprite_Character(event);
        this._characterSprites[sId].update(); // To remove occsaional full-spriteset visible issue
        this._tilemap.addChild(this._characterSprites[sId]);
        
        $dataSprite.character[this.spriteWaitNums] = this._characterSprites[sId]
        this._characterSprites[sId]._character.spriteId = this.spriteWaitNums
        this.spriteWaitNums++
    };

    PluginManager.registerCommand(pluginName, "moveToChar",function(args){
        this.event().moveToChar($gameMap.event(Number(args.event)))
    });

    PluginManager.registerCommand(pluginName, "dragCharToMe",function(args){
        $gameMap.event(Number(args.event)).moveToChar(this.event())
    });

    PluginManager.registerCommand(pluginName, "moveToStart",function(args){
        this.event().moveToStart()
    });
    
    PluginManager.registerCommand(pluginName, "moveToCharName",function(args){
        for(let event of $gameMap.events()){
            if(event.event().name == args.name){
                this.event().moveToChar(event)
            }
        }
    });

    PluginManager.registerCommand(pluginName, "eventReset",function(args){
        $gameMap.resetChars()
    });

    PluginManager.registerCommand(pluginName, "playerInputAble",function(args){
        $gamePlayer.setKeyInputable(args.toggle == "true")
    });

    //#endregion

    //#region DebugScreen

    function DebugClass(){
        this.initialize.apply(this,arguments);
    }
    
    DebugClass.prototype.initialize = function(){
        this.picture = new Sprite(0,0)
        
        this.dl = {
        }
        this.debugLogList = []
    }
    
    DebugClass.prototype.start = function(){
        this.picture.bitmap = new Bitmap($dataSystem.advanced.screenWidth,$dataSystem.advanced.screenHeight)
        this.debugBit = this.picture.bitmap
    }
    
    DebugClass.prototype.mapLoad = function(){
        this.picture = new Sprite(0,0)
        this.start()
        SceneManager._scene._spriteset.addChild(this.picture)
        this.picture.visible = false
    }
    
    DebugClass.prototype.update = function(){
        this.debugBit.clear()
        this.updateLog("playerX",$gamePlayer.x)
        this.updateLog("playerY",$gamePlayer.y)

        let i = 0
        for(let logs in this.dl ){
            this.debugBit.easyDrawText(logs + ": "+this.dl [logs],0,20+i*25,20,'rgb(255, 255, 255)',{aligin:"left"})
            i++
        }

        index = 0
        for(let text of this.debugLogList){
            this.debugBit.easyDrawText(text,0,16+index,20,'rgba(255,255,255,1)',{aligin:"right"})
            index+=20;
        }
    }

    DebugClass.prototype.updateLog = function(key,value){
        this.dl[key] = value
    }

    DebugClass.prototype.log = function(text){
        if (this.debugLogList.length === 0) {
            this.debugLogList.push(text);
            return;
        }
        let lastItem = String(this.debugLogList[this.debugLogList.length - 1]);
        if(!lastItem){return}
        let match = lastItem.match(/^(.*?)(?::(\d+))?$/); // 기존 텍스트와 숫자 분리
        let baseText = match[1];
        let count = match[2] ? parseInt(match[2], 10) + 1 : 1;
    
        if (baseText === text) {
            this.debugLogList[this.debugLogList.length - 1] = `${baseText}:${count}`;
        } else {
            this.debugLogList.push(text);
            if(this.debugLogList.length > 30){
                this.debugLogList.splice(0,1)
            }
        }
    }
    
    DEBUG = new DebugClass()

    var _Scene_Boot_create = Scene_Boot.prototype.onDatabaseLoaded;
    Scene_Boot.prototype.onDatabaseLoaded= function() {
        _Scene_Boot_create.call(this);
        DEBUG.start()
    };
    
    var _Scene_Map_create = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_create.call(this);
        DEBUG.mapLoad()
    };
    
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function(){
        _Scene_Map_update.call(this);
        DEBUG.update()
    }

    //#endregion
})()

