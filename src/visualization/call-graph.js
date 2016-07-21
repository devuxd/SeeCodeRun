/*global d3*/
import {Vertex} from "./vertex.js"
export class CallGraph {
    currentDirection = "down";// or "right"
    directionManager = {
        right: {
            nodeRenderer: function translateRight(d) {
                return "translate(" + d.y + "," + d.x + ")";
            },
            linkRenderer: function linkRenderer(d) {
              return "M" + d.y + "," + d.x
                  + "C" + (d.parent.y + 100) + "," + d.x
                  + " " + (d.parent.y + 100) + "," + d.parent.x
                  + " " + d.parent.y + "," + d.parent.x;
            }
        },
        down: {
            nodeRenderer: function translateRight(d) {
                return "translate(" + d.x + "," + d.y + ")";
            },
            linkRenderer: function linkRenderer(d) {
              return "M" + d.x + "," + d.y
                  + "C" + (d.parent.x + 100) + "," + d.y
                  + " " + (d.parent.x + 100) + "," + d.parent.y
                  + " " + d.parent.x + "," + d.parent.y;
            }
        }
    };
    controlFlowBlocks = [
        "IfStatement",
        "WhileStatement",
        "DoWhileStatement",
        "ForStatement",
        "ForInStatement",
        "SwitchStatement",
        "SwitchCase",
        "TryStatement",
        "CatchClause"
    ];
    programCalls = [
        "Program",
        "FunctionDeclaration",
        "FunctionExpression",
        "CallExpression"
    ];
    constructor() {
        this.prepareFx();
        this.config = {
            type: 'CallGraph',
            styleClass: 'call-graph',
            title: 'Call Graph',
            trace: null,
            formatTraceFx: this.formatTraceFx,
            renderFx: this.renderFx,
            errorMessage: null
        };
    }

    getValidEntryData(entry){
        if(!(entry && entry.type)){
            return null;
        }

        if(this.programCalls.indexOf(entry.type) > -1){
            return {type: entry.type, name: entry.id, range: entry.range};
        }

        if(this.controlFlowBlocks.indexOf(entry.type) > -1){
            return {type: entry.type, name: entry.type.replace("Statement", "").replace("Clause", ""), range: entry.range};
        }

        if(entry.type === "SwitchCase"){
            return {type: entry.type, name: "Switch", range: entry.range};
        }

        return null;
    }

    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }

    addEntryToTree(root, entry, validEntryData) {
        let currentNode = root;

        if(!entry){
            return;
        }

        if(!(entry.type === "BlockStatement" && entry.range)){
            return;
        }

        let newChild = { type: entry.type, name: "entryName" , range: entry.range, children : null} ;

        let nextNode = currentNode; // root is default

        do{
            currentNode = nextNode;
            nextNode = null;
            for(let childIndex in currentNode.children){
                let child = currentNode.children[childIndex];
                if(this.isRangeInRange(newChild.range, child.range)){
                    nextNode = child;
                    break;
                }
            }
        }while(nextNode);

        if(validEntryData){
            newChild.type = validEntryData.type;
            newChild.name = validEntryData.name;
            newChild.range = validEntryData.range;
        }

        if(currentNode.children){
            currentNode.children.push(newChild);
        }else{
            currentNode.children = [newChild];
        }
    }

    prepareFx(){
        let self = this;
        this.formatTraceFx =  function formatTraceFxAsD3RootNode(trace = this.trace){
          if(!trace)
            return;
          console.log( "Test" ) ;
          console.log( trace ) ;
          //
          let root = new Vertex( trace.timeline[0].type , "Program()" , trace.timeline[0].range.start.row + 1 , trace.timeline[0].range.end.row + 1 , trace.timeline[0].text.replace( /"/g , "" ) , null ) ;
          //the text starts at line 0 by default, plus one to match natural line numbers
          let funcs = [] ;
          let wasBlock = false ;
          let lastBlock = "" ;
          let lastFunc = null ;
          let lastFuncAddress = null ;
          //
          for( let index = 1 ; index < trace.timeline.length ; index++ ) //finds all functions
          {
            let tempVals = trace.timeline[index] ;
            if( tempVals.text!= null )
            tempVals.text = tempVals.text.replace( /"/g , "" ) ; //scrubs for "
            //
            if( tempVals.type === "BlockStatement" )
            {
              wasBlock = true ;
              lastBlock = tempVals.text ;
            }
            else if( tempVals.type === "CallExpression" )
            {
              if( lastFuncAddress === null ) //sanity check
              console.log( "lastFunc was null\n" ) ;
              //
              let vertex = new Vertex( "CallExpression" , tempVals.id , tempVals.range.start.row , tempVals.range.end.row , tempVals.text, null ) ; //holds raw text rn, change to vals
              console.log("adding children: ") ;
              console.log(vertex.getAddress() );
              console.log(lastFuncAddress ) ;
              console.log( "children added" ) ;
              vertex.addParent( lastFuncAddress ) ;
              console.log( lastFunc + "\n" ) ;
              lastFunc.addChild( vertex.getAddress() ) ;
              //wasBlock = false ;
            }
            else
            {
              if( tempVals.type === "FunctionData" && wasBlock ) //FunctionData always follow BlockStatements
              {
                let isRepeat = false ;
                for( let i = 0 ; i < funcs.length ; i++ )
                if( tempVals.text.replace(/ /g , "")  === funcs[i].getName().replace(/ /g , "") )
                isRepeat = true ;
                console.log( "text: " + tempVals.text ) ;
                //
                if( !isRepeat )
                {
                  wasBlock = false ;
                  //
                  console.log( "tempVals.text: " + tempVals.text ) ;
                  let vertex = new Vertex( "FunctionData" , tempVals.text , tempVals.range.start.row , tempVals.range.end.row , lastBlock , tempVals.value ) ;
                  lastFuncAddress = vertex.getAddress() ;
                  funcs.push( vertex ) ;
                  lastFunc = vertex ;
                }
              }
            }
          }
          for( let i = 0 ; i < funcs.length ; i++ )
          {
            console.log( "funcs"  ) ;
            console.log( funcs[i].getChildren()) ;
          }
          for( let i = 0 ; i < funcs.length ; i++ ) //adds all the functions to root
          {
            console.log( funcs[i].getName() ) ;
            if( funcs[i].getName() === "alpha")
              root.addChild( funcs[i] ) ;
          }
          //adds calls between functions
          for( let index = 0 ; index < funcs.length ; index++ ) //won't work with recursion
          {
            let contents = funcs[index].getText().replace( / /g , "" ) ;
            /*
            if( funcs[index].getName().indexOf( "echo") )
            {
              console.log( "echo: " + funcs[index]) ;
              console.log( contents ) ;
            }
            */
            for( let k = 0 ; k < funcs.length ; k++ )
            {
              if( index !== k && !funcs[k].hasParent( funcs[index] ) && contents.indexOf( funcs[k].getName() + "(" ) > 0 )
              {

                funcs[k].addParent( funcs[index].getAddress() ) ;
                //need to have only one reference per vertex
                funcs[index].addChild( funcs[k].getAddress() ) ;
              }
            }
          }
          for( let index = 0 ; index < funcs.length ; index++ ) //reformats functions
          funcs[index].setName( funcs[index].getName() + "()" ) ;
          //
          console.log( root ) ;
          console.log( funcs ) ;
          return root ;
        };

        this.renderFx  =  function renderFx(formattedTrace, divElement) {
            if (!formattedTrace){
                return;
            }
            d3.select(divElement).html("");

            let margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 400 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

            let rectWidth = 60,
                rectHeight = 20;

            let tree = d3.tree()
                .nodeSize([80, 40]);

            let diagonal = self.directionManager[self.currentDirection].linkRenderer;

            let nodeRenderer = self.directionManager[self.currentDirection].nodeRenderer;

            let svg = d3.select(divElement).append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("position","relative")
                .call(d3.zoom()
              .on("zoom", function () {
                svg.attr("transform", function() {
                    let devent = d3.event.transform;
                  return "translate(" + devent.x + ", " + devent.y + ") scale(" + devent.k +")";
                });
              }))
                .append("g");

            svg.attr("transform","translate(100,0)");

            let root = d3.hierarchy(formattedTrace),
                nodes = root.descendants(),
                links = root.descendants().slice(1);

            tree(root);
            svg.selectAll(".link")
                .data(links)
              .enter().append("line")
                .attr("class", "link")
                .attr("x1", function(d) { return d.parent.x; })
                .attr("y1", function(d) { return d.parent.y + rectHeight; })
                .attr("x2", function(d) { return d.x; })
                .attr("y2", function(d) { return d.y; })
                .style("fill","none")
                .style("stroke","#ccc")
                .style("stroke-width","1.5px");

            let node = svg.selectAll(".node")
                .data(nodes)
              .enter().append("g")
                .attr("class", "node")
                .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                .attr("transform", nodeRenderer)
                .style("font","10px sans-serif");

            node.append("rect")
                .attr("width", rectWidth)
                .attr("height", rectHeight)
                .attr("transform", "translate(" + (-1 * rectWidth/2) + ",0)")
                .style("fill","#fff")
                .style("stroke","steelblue")
                .style("stroke-width","1.5px");

            node.append("text")
                .attr("dy", 12.5)
                .attr("text-anchor", "middle")
                .text(function(d) { return d.data.name; });

            d3.select(self.frameElement).style("height", height + "px");
        };
    }

}
