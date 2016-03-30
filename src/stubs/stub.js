import {JsGutter} from '../jsGutter/js-gutter';
import {inject} from 'aurelia-framework';
@inject(JsGutter)
export class Stub {  
  constructor(jsGutter) {
      this.jsGutter=jsGutter;
  }

  mySpecialMethod() {
    let content  = ['void'];
           this.jsGutter.setContentGutter(1, content);
           
  }
}