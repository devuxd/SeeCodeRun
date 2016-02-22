
   var jsEditor = ace.edit('aceJSEditorDiv');
   var selectedLine = 1;

   function  setContentGutter (line, content){
        
         var lastline =jsEditor.getLastVisibleRow()+1;
         var iframeBody = $('#gutter');

         if(iframeBody.find('#line'+lastline).length ==0){
          CreateLine(lastline);
         }
        for(var i =0; i< content.length; i++){
        iframeBody.find("#line"+line).append(" [ "+content[i]+" ]").addClass("outer-gutter");
        
        }
        highlightLine();
   }
   
   
   
   function CreateLine(line){
      var iframeBody = $('#gutter');  
      var indexOfDiv = getLastDiv();
      for(indexOfDiv; indexOfDiv<=line; indexOfDiv++){
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
         iframeBody.find("#line"+indexOfDiv).addClass("line_height");

      }
      
      function getLastDiv(){
      var iframeBody = $('#gutter');
       var indexOfDiv =1;   
          while (iframeBody.find('#line'+indexOfDiv).length !=0){
           indexOfDiv++;
         }
       return indexOfDiv;
      }
   }  
      
      
      function  highlightLine(){
      jsEditor.getSession().selection.on('changeCursor', function(e)
      {
          var iframeBody = $('#gutter');
          var line =  jsEditor.getCursorPosition().row+1;
          if(iframeBody.find('#line'+line).length ==0){
          CreateLine(line);
            }
          
           iframeBody.find("#line"+selectedLine).removeClass("highlight_gutter");
           iframeBody.find("#line"+line).addClass("highlight_gutter");
           selectedLine=line;
          
      }
      );
      }
   

(function () {
    var previousScroll = 0;

    $(window).scroll(function(){
       var currentScroll = $(this).scrollTop();
       if (currentScroll > previousScroll){
           alert('down');
       } else {
          alert('up');
       }
       previousScroll = currentScroll;
    });
}()); 
    

