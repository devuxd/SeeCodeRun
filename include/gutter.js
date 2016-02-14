
   
   
   
   function  setContentGutter (line, content){
       
        var iframeBody = $('#gutter').contents().find("body");                 
         jumpToLine(line);
        // console.log(content.length)
        for(var i =0; i< content.length; i++){
        iframeBody.find("#line"+line).append(content[i]+" ");
        }

   }
   
   
   
   function jumpToLine(line){
      var iframeBody = $('#gutter').contents().find("body");
      var indexOfDiv = getLastDiv();
      console.log(indexOfDiv);
      for(indexOfDiv; indexOfDiv<=line; indexOfDiv++){
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
                        
         console.log(indexOfDiv);
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