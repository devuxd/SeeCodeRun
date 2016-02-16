
   var jsEditor = ace.edit('aceJSEditorDiv');
   var selectedLine = 1;
   
   function  setContentGutter (line, content){
         setCss(); // bug
         var lastline =jsEditor.getLastVisibleRow()+1;
         var iframeBody = $('#gutter').contents().find("body");  

         if(iframeBody.find('#line'+lastline).length ==0){
          CreateLine(lastline);
         }
        for(var i =0; i< content.length; i++){
        iframeBody.find("#line"+line).append(content[i]+" ").addClass("outer-gutter");
        
        }
          highlightLine();
   }
   
   
   
   function CreateLine(line){
         var iframeBody = $('#gutter').contents().find("body");  
      var indexOfDiv = getLastDiv();
      for(indexOfDiv; indexOfDiv<=line; indexOfDiv++){
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
         iframeBody.find("#line"+indexOfDiv).addClass("line_height");

      }
      
      function getLastDiv(){
      var iframeBody = $('#gutter').contents().find("body");
       var indexOfDiv =1;   
          while (iframeBody.find('#line'+indexOfDiv).length !=0){
           indexOfDiv++;
         }
       return indexOfDiv;
      }
   }  
      function setCss(){
          
           var iframeBody = $('#gutter').contents().find("head");
           iframeBody.append($("<link/>",
                { rel: "stylesheet", href: "styles.css", type: "text/css" }
              ));
              iframeBody.append($("<script/>",
                { src: "https://cdnjs.cloudflare.com/ajax/libs/ace/1.1.3/ace.js" }
              ));
              
      }
      
      

      
      function  highlightLine(){
      jsEditor.getSession().selection.on('changeCursor', function(e)
      {
            var line =  jsEditor.getCursorPosition().row+1; 
            var iframeBody = $('#gutter').contents().find("body");
            iframeBody.find("#line"+selectedLine).removeClass("highlight_gutter");
           iframeBody.find("#line"+line).addClass("highlight_gutter");
           selectedLine=line;
           
      }
      );
      }
   
   
  