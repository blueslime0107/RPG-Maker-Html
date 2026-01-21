//=============================================================================
// PS - Advanced Timer
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Makes a picture clickable.
 * @author Yoji Ojima
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
 * @command AddFrame
 * @desc 타이머 시간 추가
 * 
 * @arg time
 * @desc 타이머 시간
 * @type number
 * @default 0
 * 
 * 
 */

(() => {
    _timerInitialize = Game_Timer.prototype.initialize  
    Game_Timer.prototype.initialize = function() {
        _timerInitialize.call(this)
        this.distFrame = 0;
    };

    Game_Timer.prototype.start = function(count) {
        this._frames = count;
        this._working = true;
    };

    Game_Timer.prototype.update = function(sceneActive) {
        if (sceneActive && this._working && this._frames > 0) {
            if(this.distFrame > this._frames) {
                this._frames+=2;
                if(this._frames >= this.distFrame) {
                    this._frames = this.distFrame;
                    this.distFrame = 0;
                }
            } else {
                this._frames--;
            }
        }
    };
    
    Game_Timer.prototype.addSec = function(value) {
        this.distFrame = this._frames + value;
    };

    _initialize = Sprite_Timer.prototype.initialize
    Sprite_Timer.prototype.initialize = function() {
        _initialize.call(this)
        this._frames = 0;
    };

    Sprite_Timer.prototype.updateBitmap = function() {
        this._frames = $gameTimer._frames;
        this.redraw();
    };

    Sprite_Timer.prototype.timerText = function() {
        const sec = Math.floor(this._frames / 60);
        const ms = Math.round((this._frames % 60)/60*100);
        return sec.padZero(2) + "." + ms.padZero(2);
    };

    _redraw = Sprite_Timer.prototype.redraw
    Sprite_Timer.prototype.redraw = function() {
        if($gameTimer.distFrame > $gameTimer._frames) {
            this.bitmap.textColor = "rgb(0, 207, 3)"
        } else {
            this.bitmap.textColor = "rgb(186, 226, 255)"
        }
        _redraw.call(this)
    };

    PluginManager.registerCommand("PS_AdvancedTimer", "AddFrame",function(args){
        $gameTimer.addSec(Number(args.time))
    });
})()