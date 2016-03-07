
   var jsEditor = ace.edit('aceJSEditorDiv');
   var selectedLine = 1;
   var index=  + "1";

   function  setContentGutter (line, content){
         var lastDiv = GetLastDiv();
         var lastline =jsEditor.getLastVisibleRow()+1;
         var iframeBody = $('#gutter');

         if(iframeBody.find('#line'+lastline).length ==0){
          CreateLine(lastline);
          
         }
         

        for(var i =0; i< content.length; i++){
        iframeBody.find("#line"+line).append(" [ "+content[i]+" ]");
        
        }
        highlightLine();
   }
   
   
   
   function CreateLine(line){
      var iframeBody = $('#gutter');  
      var indexOfDiv = GetLastDiv();
      for(indexOfDiv; indexOfDiv<=line; indexOfDiv++){
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
         iframeBody.find("#line"+indexOfDiv).addClass("line_height");

      }
   }
      function GetLastDiv(){
      var iframeBody = $('#gutter');
       var indexOfDiv =1;   
          while (iframeBody.find('#line'+indexOfDiv).length !=0){
           indexOfDiv++;
         }
       return indexOfDiv;
      }
   
      function RemoveLine(lastline, lastDiv){
          var iframeBody = $('#gutter');  
          while (lastline<lastDiv){
            iframeBody.find('#line'+lastDiv).remove();
              lastDiv--;
         }
      }
      
      function  highlightLine(){
      jsEditor.getSession().selection.on('changeCursor', function(e)
      {
          var lastDiv = GetLastDiv();
          var iframeBody = $('#gutter');
          var line =  jsEditor.getCursorPosition().row+1;
          var lastline =jsEditor.session.getLength();

          if(iframeBody.find('#line'+lastline).length ==0){
                 CreateLine(lastline);
            }
            if(lastline < lastDiv){
                console.info(lastDiv)
             RemoveLine(lastline, lastDiv);
         }
          //console.info(selectedLine);
          //console.info("--->"+ window.index);
           iframeBody.find("#line"+selectedLine).removeClass("highlight_gutter");
           iframeBody.find("#line"+line).addClass("highlight_gutter");
           selectedLine=line;
               

          
      }
      );
      }
   



