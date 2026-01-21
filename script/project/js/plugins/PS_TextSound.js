(() => {

const se_TextSound = {
    name: 'text',
    volume: 80,
    pitch: 100
}
    
Window_Message.prototype.updateMessage = function() {
    const textState = this._textState;
    if (textState) {
        while (!this.isEndOfText(textState)) {
            if (this.needsNewPage(textState)) {
                this.newPage(textState);
            }
            this.updateShowFast();
            if($gameMessage._background != 2){
                AudioManager.playSe(se_TextSound)
            }
            this.processCharacter(textState);
            this.startWait(1);
            if (this.shouldBreakHere(textState)) {
                break;
            }
        }
        this.flushTextState(textState);
        if (this.isEndOfText(textState) && !this.isWaiting()) {
            this.onEndOfText();
        }
        return true;
    } else {
        return false;
    }
};

})()