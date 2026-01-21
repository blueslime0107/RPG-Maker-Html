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
 * @command Wait
 * @desc 조건식으로 이벤트 처리를 중단합니다
 * 
 * @arg script
 * @desc 조건식
 * @type text
 * @default Default
 * 
 */


(() => {
    _clear = Game_Interpreter.prototype.clear
    Game_Interpreter.prototype.clear = function() {
        _clear.call(this)
        this._waitFunc = null
    };

    _updateWaitMode = Game_Interpreter.prototype.updateWaitMode
    Game_Interpreter.prototype.updateWaitMode = function() {
        let waiting = false;
        if(this._waitMode == "custom"){
            waiting = this._waitFunc.call(this)
        }else{
            waiting = _updateWaitMode.call(this)
        }
        if (!waiting) {
            this._waitMode = "";
            this._waitFunc = null
        }
        return waiting
    }

    PluginManager.registerCommand("PS_CustomWait", "Wait",function(args){
        this.setWaitMode("custom")
        this._waitFunc = eval("(function() { return "+args.script+"})");
    });

})();