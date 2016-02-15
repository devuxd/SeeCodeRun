
   
   
   
   function  setContentGutter (line, content){
        // setCss(); // bug
        var iframeBody = $('#gutter').contents().find("body");                 
         jumpToLine(line);
        for(var i =0; i< content.length; i++){
        iframeBody.find("#line"+line).append(content[i]+"_").addClass("outer-gutter");
        
        }

   }
   
   
   
   function jumpToLine(line){
      var iframeBody = $('#gutter').contents().find("body");
      var indexOfDiv = getLastDiv();
      for(indexOfDiv; indexOfDiv<=line; indexOfDiv++){
         iframeBody.append("<div id=line"+indexOfDiv+"></div>");
                        
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
      }
   