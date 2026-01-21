(function() {

    _Game_Character_initMembers = Game_CharacterBase.prototype.initMembers
    Game_CharacterBase.prototype.initMembers = function() {
        _Game_Character_initMembers.call(this);
        this._softV = {x:0,y:0}//자동속력
        this._hardV = {x:0,y:0} //고정속력
        this._directionV = {x:0,y:0} // 캐릭터 바라보는 방향 벡터

    };

    // 가속도가 있면 움직임 업데이트 하기
    Game_CharacterBase.prototype.isMoving = function() {
        return this.xVelocity() > 0 || this.yVelocity() > 0
    };

    // 방향 정할때 방향벡터도 정함
    Game_CharacterBase.prototype.setDirection = function(d) {
        if (!this.isDirectionFixed() && d) {
            this._direction = d;
            this._directionV.x = 0;this._directionV.y = 0;
            if(d == 6){
                this._directionV.x = 1
            }
            if(d == 4){
                this._directionV.x = -1
            }
            if(d == 8){
                this._directionV.y = -1
            }
            if(d == 2){
                this._directionV.y = 1
            }
        }
        this.resetStopCount();
    };

    Game_CharacterBase.prototype.xVec = function(){
        return this._softV.x + this._hardV.x;
    }
    Game_CharacterBase.prototype.yVec = function(){
        return this._softV.y + this._hardV.y;
    }
    Game_CharacterBase.prototype.xVelocity = function(){
        return Math.abs(this.xVec());
    }
    Game_CharacterBase.prototype.yVelocity = function(){
        return Math.abs(this.yVec());
    }




    // Game Player 

    _Game_Player_initMembers = Game_Player.prototype.initMembers
    Game_Player.prototype.initMembers = function(){
        _Game_Player_initMembers.call(this)
        this._dashX = 0
        this._dashY = 0
        this._inputV = {x:0,y:0}
        this._moveRadi = 0
        this._moveSpd = 1
        this._dashV = {x:0,y:0}
        this._dashDir = 0
        this._dashRadi = 0
        this._dashSpd = 0
        this._dashMinSpd = 0.5
        this._rushing = false
        this._breaking = false
        this._wallDashing = false
        this._wallDashTouched = 0
        this._wallDashSpin = 1
        this._wallDashDir = 2
    }

    Game_Player.prototype.update = function(sceneActive) {
        var lastScrolledX = this.scrolledX();
        var lastScrolledY = this.scrolledY();
        var wasMoving = this.isMoving();
        this.updateDashing();
        if (sceneActive) {
            this.moveByInput();
        }
        Game_Character.prototype.update.call(this);
        this.updateScroll(lastScrolledX, lastScrolledY);
        this.updateVehicle();
        // if (!this.isMoving()) {
            this.updateNonmoving(wasMoving);
        // }
        this._followers.update();
    };

    // 플레이어 키입력 관련 이벤트
    Game_Player.prototype.moveByInput = function() {
        this._hardV.x = 0; this._hardV.y = 0; // 하드 속력은 상시 초기화
        this.executeMove();
    };

    Game_Player.prototype.executeMove = function() { // 키 입력관련
        let movingHorizontally = this.rightPressed() || this.leftPressed();
        let movingVertically = this.upPressed() || this.downPressed();
        //초기화
        this._inputV.x = 0
        this._inputV.y = 0

        if (this.rightPressed()) {
            this._inputV.x = 1;
            if (!movingVertically) this.setDirection(6);
        }
        if (this.leftPressed()) {
            this._inputV.x = -1;
            if (!movingVertically) this.setDirection(4);
        }
        if (this.upPressed()) {
            this._inputV.y = -1;
            if (!movingHorizontally) this.setDirection(8);
        }
        if (this.downPressed()) {
            this._inputV.y = 1;
            if (!movingHorizontally) this.setDirection(2);
        }

        if(this._softV.x != 0 || this._softV.y != 0){
            this._inputV.x = 0
            this._inputV.y = 0
        }

        if(this.canDashProcessing()){ // 대쉬 가능?
            if(this._rushing){
                this._dashSpd = 2
            }
            if(this._dashSpd < 2){ // 최대 속력 2
                this._dashSpd += 0.05
            }else{
                this.setRush(true)
            }
            this._dashV.x = this._inputV.x
            this._dashV.y = this._inputV.y
        }else{
            this._dashSpd = Math.max(0,this._dashSpd *= this.fraction()) // 속도 감속
            if(this._rushing){ // 대쉬중 이였으면
                this._breaking = true // 브레이크, 브레이크 중엔 대쉬,이동 불가
                if(this._dashSpd >= this._dashMinSpd){
                    this._inputV.x = 0
                    this._inputV.y = 0
                }
            }
            if(this._dashSpd < this._dashMinSpd){ // 브레이크 종료시
                this._dashV.x = 0
                this._dashV.y = 0
                this._breaking = false
                if(this._rushing && this.canDashProcessing()){

                }else{
                    this.setRush(false)
                }
            }
        }
        this._dashDir = this._direction // 방향 저장, 틀릴시 브레이크를 위한 계산

        // 잔상 그리기
        if(this._rushing){
            this.residual().setColorTone((Math.random() < 0.5) ? [255,0,0,1] : [0,255,0,1]);
            this.residual().setValid(true);
        }else{
            this.residual().setValid(false);
        }

        if(this._dashSpd > 0){ // 대쉬 속력 추가
            this._dashRadi = dirToPoint(0,0,this._dashV.x,this._dashV.y)
            xy = getXyRadi(0,0,this._dashSpd,this._dashRadi)
            this._hardV.x += xy.x
            this._hardV.y += xy.y
        }

        if(this._inputV.x != 0 || this._inputV.y != 0){ // 기본 입력 속력 추가
            this._moveRadi = dirToPoint(0,0,this._inputV.x,this._inputV.y)
            xy = getXyRadi(0,0,this._moveSpd,this._moveRadi)
            this._hardV.x += Math.round(xy.x)
            this._hardV.y += Math.round(xy.y)
        }

        if(this._wallDashing){
            switch(this._wallDashDir){
                case 2:
                    this._hardV.y += 1
                    break
                case 4:
                    this._hardV.x -= 1
                    break
                case 6:
                    this._hardV.x += 1
                    break
                case 8:
                    this._hardV.y -= 1
            }
        }
    };

    Game_Player.prototype.setRush = function(rush){
        this._rushing = rush
        $gameMap.refresh()
    }

    
    // 캐릭터 이동 처리 업데이트함수
    Game_Player.prototype.updateMove = function() {
        // if($gameMap.isEventRunning()){return}

        let sizeOff = 0.1

        let x = this._realX + sizeOff
        let y = this._realY + sizeOff
        let newX = x + this.xVec() * 0.1
        let newY = y + this.yVec() * 0.1
        let adjustX = newX
        let adjustY = newY

        let fx = Math.floor(x)
        let cx = Math.ceil(x-sizeOff*2)
        let fy = Math.floor(y)
        let cy = Math.ceil(y-sizeOff*2)
        
        let Nfx = Math.floor(newX)
        let Ncx = Math.ceil(newX-sizeOff*2)
        let Nfy = Math.floor(newY)
        let Ncy = Math.ceil(newY-sizeOff*2)

        let NupL = {x:Nfx,y:Nfy}
        let NupR = {x:Ncx,y:Nfy}
        let NdownL = {x:Nfx,y:Ncy}
        let NdownR = {x:Ncx,y:Ncy}
        

        // console.log(upL,upR,downL,downR,NupL,NupR,NdownL,NdownR);

        ColUpL = (!this.canPass2(NupL.x,NupL.y,2) && this.canPass3(NdownL.x,NdownL.y,8))
        ColUpR = (!this.canPass2(NupR.x,NupR.y,2) && this.canPass3(NdownR.x,NdownR.y,8))

        ColDownL = (!this.canPass2(NdownL.x,NdownL.y,8) && this.canPass3(NupL.x,NupL.y,2))
        ColDownR = (!this.canPass2(NdownR.x,NdownR.y,8) && this.canPass3(NupR.x,NupR.y,2))

        ColLeftU = (!this.canPass2(NupL.x,NupL.y,6) && this.canPass3(NupR.x,NupR.y,4))
        ColLeftD = (!this.canPass2(NdownL.x,NdownL.y,6) && this.canPass3(NdownR.x,NdownR.y,4))
        
        ColRightU = (!this.canPass2(NupR.x,NupR.y,4) && this.canPass3(NupL.x,NupL.y,6))
        ColRightD = (!this.canPass2(NdownR.x,NdownR.y,4) && this.canPass3(NdownL.x,NdownL.y,6))

        if(fy > Nfy && ( ColUpL || ColUpR )){ // 위
            adjustY = Ncy
            if(this._rushing && this._direction == 8){
                this.knockBackDash()
            }else{
                if(!this._rushing){
                    this.resetDash()
                }
            }
        }else{
        }
        if(cy < Ncy && (ColDownL || ColDownR)){ // 아래
            adjustY = Nfy + sizeOff*2
            if(this._rushing && this._direction == 2){
                this.knockBackDash()
            }else{
                if(!this._rushing){
                    this.resetDash()
                }
            }
        }else{
        }
        if(fx > Nfx && (ColLeftU || ColLeftD)){ // 왼쪽
            adjustX = Ncx
            if(this._rushing && this._direction == 4){
                this.knockBackDash()
            }else{
                if(!this._rushing){
                    this.resetDash()
                }
            }
        }else{
            
        }
        if(cx < Ncx && (ColRightU || ColRightD)){ // 오른쪽
            adjustX = Nfx + sizeOff*2
            if(this._rushing && this._direction == 6){
                this.knockBackDash()
            }else{
                if(!this._rushing){
                    this.resetDash()
                }
            }
        }else{
        }

        this._realX = adjustX - sizeOff
        this._realY = adjustY - sizeOff
        this._x = Math.round(this._realX)
        this._y = Math.round(this._realY)

        this.updateEventDashCrash(fx,fy,cx,cy)
        this.updateAccelation()
        
    };

    Game_Player.prototype.updateEventDashCrash = function(fx,fy,cx,cy){
        if(this._rushing){ // 달리는중에 이벤트 처리
            for(let event of $gameMap.events()){
                if(event.x == fx || event.x == cx){
                    if(event.y == fy || event.y == cy){
                        event.triggerDashCrushed()
                    }
                }
            }
        }
    }

    Game_Player.prototype.updateAccelation = function(){
        if(this._softV.x != 0){ // 가속도
            this._softV.x *= this.fraction()
            if(Math.abs(this._softV.x) <= 0.01){
                this._softV.x = 0
            }
        }
        if(this._softV.y != 0){ // 가속도
            this._softV.y *= this.fraction()
            if(Math.abs(this._softV.y) <= 0.01){
                this._softV.y = 0
            }
        }
    }

    Game_Player.prototype.resetDash = function(){
        this._rushing = false
        this._dashSpd = 0
    }

    Game_Player.prototype.knockBackDash = function(){
        radi = dirToPoint(0,0,-this._dashV.x,-this._dashV.y)
        xy = getXyRadi(0,0,this._dashSpd,radi)
        this._softV.x += xy.x
        this._softV.y += xy.y
        this.resetDash()
    }

    Game_Player.prototype.fraction = function(){
        return 0.95
    }

    Game_Player.prototype.checkEventTriggerDir = function(triggers,dir) {
        if (this.canStartLocalEvents()) {
            var direction = dir
            var x1 = this.x;
            var y1 = this.y;
            var x2 = $gameMap.roundXWithDirection(x1, direction);
            var y2 = $gameMap.roundYWithDirection(y1, direction);
            this.startMapEvent(x2, y2, triggers, true);
            if (!$gameMap.isAnyEventStarting() && $gameMap.isCounter(x2, y2)) {
                var x3 = $gameMap.roundXWithDirection(x2, direction);
                var y3 = $gameMap.roundYWithDirection(y2, direction);
                this.startMapEvent(x3, y3, triggers, true);
            }
        }
    };

    Game_Player.prototype.movePressed = function(){return this._inputV.x != 0 || this._inputV.y != 0}
    Game_Player.prototype.rightPressed = function(){return Input._signX() > 0}
    Game_Player.prototype.leftPressed = function(){return Input._signX() < 0}
    Game_Player.prototype.upPressed = function(){return Input._signY() < 0}
    Game_Player.prototype.downPressed = function(){return Input._signY() > 0}
    Game_Player.prototype.dashPressed = function(){return Input.isPressed('shift')}
    Game_Player.prototype.canDashProcessing = function(){
        return this.dashPressed() && this._dashDir == this._direction && this.movePressed() && !this._breaking
    }


    _Game_Event_initMembers = Game_Event.prototype.initMembers
    Game_Event.prototype.initMembers = function() {
        _Game_Event_initMembers.call(this);
        this.dashCrushed = false

    };

    Game_Event.prototype.triggerDashCrushed = function(){
        this.dashCrushed = true
        this.refresh()
    }

})();