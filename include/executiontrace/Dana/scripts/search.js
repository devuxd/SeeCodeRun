/**
 * ISSUE #18
 * Trace API should offer functionality for indexing the trace and letting clients search for matching expressions.
 * For example, the user might search for all calls to JQuery methods that manipulate the DOM on the DOM element 'button5'.
 * Support should be provided for querying based on both identifiers and runtime values.
 * 
 **/

// Add your calls after this line in the page (Issue18.hmtl)
// these arrays contains the data you want to analyze. Let me show you them more closely (they are shown in the right side of the page)
  
// var stackTrace = window.TRACE.getStackTrace();
// var valueTable = window.TRACE.getExecutionTrace(); // This array is the one you should care

// The idea of the API is to analyze the data structure given by this call
// EXECUTION TRACE:
//sample of an entry
var stackDataEntry ={
    "type":"CallExpression", // you care about this type of syntax
    "id":"document.getElementById", // this is key, you want to filter identifiers that look like this (pure DOM)
    "text":"document.getElementById(\"DOMEelement\")", // this is the full call expression text, even more flexible for search
    "values":[{"stackIndex":-1,"value":"null"},{"stackIndex":-1,"value":"null","hit":3}], // runtime values
    "range":{"start":{"row":1,"column":10}, "end":{"row":1,"column":48}},  // This is for #exec-vis (ignore)
    "hits":3, 
    "extra":""
    
};
/**
 * ANALYSIS 
 * you can use a library like grep and estools https://github.com/estools/esquery
 * and define the in their fucntions want you want to filter
 * you could define a syntax from your queries. It is better is you look for tools that have that already
 * e.g. getting all calls that starts with document. and have values
 * 
 * !!do not worry, it does not need to be a full language. lets use SQL for the sake of the example
 *  QueryManager.search("select * from calls where text = '^document.*' and values not null");
 * 
 * 
 * if the code has this:
 * $("#button5").append(" more blah");
 *  the query is like this
 *  QueryManager.search("select value from calls where library ='JQuery' and action = 'modify' and id= 'button5'");
 * 
 * and the output is
 * value = "more blah"
 * 
 * ahahah silly me, What about using Firebase(nope, queries are for something else) we store the structure in a table and we let them query like bosses.
 * http://jslinq.codeplex.com/ Look this library
 * We must add metadata from the entries though. Like if it is a read or a write to DOM action
 * TODO LIST
 * 0. Provide a list of test cases that we can agree on.
 * 1. Create a list of all JS (and Jquery) DOM API and classify them by read and write (getters and setters)
 * 2. Create a list of syntax types (look the full list in Syntax array defined at the beginning od esmorph.js)
 * 3. Analyze the stackdata entry stackDataEntry in line 18 of this file.
 * 4. Store statckdata in the JSLINQ format
 * 5. Provide queries that satisfy the API requirements
 */
 
//This is not working code yet - more like a pseudo code 
function search(type, value, range){
    var stackTrace = window.TRACE.getStackTrace();
    var valueTable = window.TRACE.getExecutionTrace();
    var stackDataEntry = { };
    var result;
    
    //Example: User is searching button 5 and the following jQuery code is used for this example
    //$("#button5").click(function(){  }); 
    stackDataEntry = valueTable;
    result = JSLINQ(stackDataEntry)
       .Where(item.type === "Literal" && item.range === "{'start':{'row':1,'column':10}, 'end':{'row':1,'column':48}")
       .Select(item.values == "#button5");
   
    }
        
    
    
    
    
    
    
    
    
}