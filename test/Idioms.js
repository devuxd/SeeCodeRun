/**
 * Created by DavidIgnacio on 6/22/2017.
 */

class JSClass {

  manipulateData(){
    console.log(this);
    let functionExpression = function(){
      console.log(this);
    };
    let objectFunction = {attribute: "value",
      method: function(){
        console.log(this);
      }
    };
    () =>{
        console.log(this);
        setTimeout(function (){
          console.log(this);
        }, 1000);
    }

  }
}
