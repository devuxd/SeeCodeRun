$(document).ready(function(){
    $('#popup').hide();
    $('#hide').click(function(){
        $('#popup').toggle();
    });        
});

    //Chat box draggable       
    $(function() {
    $( "#popup" ).draggable();
  });

  //Chat box resizable    
      $(function() {
    $( "#popup" ).resizable({ handles: "n, e, s, w, ne, se, sw, nw"});
  });