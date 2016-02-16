

   // this a stub "fake" code is used to simulate the sinario in which other JS code calls the gutter API
   
  
  var change = false;
   function fake(){
       
       if(!change){
           var content  = ['void'];
           setContentGutter(1, content);
           
           var content1  = ['void'];
           setContentGutter(3, content);
           
           var content2 = ["Hello, world."];
           setContentGutter(4, content2);
           
           var content3 = ["Hello, world."];
           setContentGutter(5, content3);
            change =true;
       }
      
        
   }