/* global Firepad */
/* global Firebase */
/* global ace */
<<<<<<< HEAD
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
<<<<<<< HEAD
=======
import '../mode-javascript';
import '../theme-chrome';
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
import '../mode-javascript';
import '../theme-chrome';
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz

export class JsGutter {
  
  constructor(eventAggregator) {
    this.eventAggregator = eventAggregator;
  }
  
  attached() {
    let gutter = ace.edit('gutterDiv');
    this.configureGutter(gutter);
    
    let session = gutter.getSession();
    
    this.gutter = gutter;
    this.session = session;
    this.subscribe();
  }
  
  configureGutter(gutter) {
    gutter.setTheme('ace/theme/chrome');
    gutter.setShowFoldWidgets(false);
    gutter.renderer.setShowGutter(false);
    gutter.renderer.$cursorLayer.element.style.display = 'none';
    gutter.setReadOnly(true);
  }
  
  subscribe() {
    let ea = this.eventAggregator;
    let session = this.session;
<<<<<<< HEAD
<<<<<<< HEAD

    ea.subscribe('onEditorChangedd', payload => {
         


         // This been used to populate the guuter (stub)
    //   let c = ['Hello'];
    // this.setContentGutter(1 , c); 
    // this.setContentGutter(100 , c); 
    //   console.info('payload');
	  
    });

    ea.subscribe('onCursorMoved', info => {

                  let lastDiv = this.GetLastDiv();
                  let iframeBody = $('#gutter');
                  let line =  info.cursor;
                  let lastline = info.lastVisibleRow;
                 
                  if(iframeBody.find('#line'+lastline).length ==0){
                         this.CreateLine(lastline);
                    }
                    if(lastline < lastDiv){
                     this.RemoveLine(lastline, lastDiv);
                 }
                  
                   iframeBody.find("#line"+this.selectedLine).removeClass("highlight_gutter");
                   iframeBody.find("#line"+line).addClass("highlight_gutter");
                   this.selectedLine=line;


                   this.LastVisibleRow = info.lastVisibleRow;
                  
                  this.highlightLine(line, lastline);
                
                 //TODO: Fix gutter scrolling expereince 
                 
                 // iframeBody.scrollTop((info.cursor*4)+1);
    });
  }
  setContentGutter (line, content){
         let lastDiv = this.GetLastDiv();
         if(line > lastDiv){
                 throw ("Line "+line+" does not exist"+ "last visible line is "+ lastDiv);
           }
         let iframeBody = $('#gutter');
        for(let index of content.length){
        iframeBody.find("#line"+line).append(" [ "+content[index]+" ]");
        
        }
   }
   CreateLine(line){
      let iframeBody = $('#gutter');  
      let indexOfDiv = this.GetLastDiv();
      for(indexOfDiv ; indexOfDiv <=line; indexOfDiv++){ // possible bug
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
         iframeBody.find("#line"+indexOfDiv).addClass("line_height");
      }
   }
   GetLastDiv(){
        let iframeBody = $('#gutter');
        let indexOfDiv =1;   
          while(iframeBody.find('#line'+indexOfDiv).length !=0){
           indexOfDiv++;
         }
       return indexOfDiv;
      }
	  RemoveLine(lastline, lastDiv){
          let iframeBody = $('#gutter');  
          while (lastline<lastDiv){
            iframeBody.find('#line'+lastDiv).remove();
              lastDiv--;
         }
      }
	  highlightLine(line, lastline){
=======
    
    ea.subscribe('onEditorChanged', payload => {
      let doc = session.doc;
>>>>>>> parent of 8e0a935... Merge pull request #57 from tlatoza/feature-30
=======
    
    ea.subscribe('onJsEditorChanged', payload => {
      let doc = session.doc;
>>>>>>> parent of 82bf960... Merge pull request #69 from tlatoza/Abdulaziz
      
      doc.removeLines(0, doc.getLength());
      
      // TODO: fix uncaught length error
      doc.insertLines(0, new Array(payload.length - 1));
      
      for(let result of payload.syntax) {
        doc.insertInLine({
          row: result.location.row,
          column: result.location.col
        }, result.content);
      }
    });
  }
}

