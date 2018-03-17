class LiveExpression {
  constructor(monacoRange, className){
    this.className = className;
    this.decorator = {
      range: monacoRange,
      options: {
        isWholeLine: false,
        beforeContentClassName: 'myAnchorClass',
        className: `myContentClass ${className}`,
        glyphMarginClassName: 'myGlyphMarginClass'
      }
    }
  }
  getDecorator(){
    return {range: this.decorator.cloneRange(), options: {...this.decorator.options} };
  }
  
  getDomElement(){
    return document.querySelector(`.${this.className}`);
  }
}

export default LiveExpression;
