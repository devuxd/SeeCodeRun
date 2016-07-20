/*global d3*/

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
        "CallProgram",
        "CallExpression"
    ];

    programExecutors = [
        "Program",
        "FunctionDeclaration",
        "FunctionExpression",
        "FunctionData"
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

    collectTraceDecorationData(traceDecorationData, entry){
        if(!traceDecorationData){
           traceDecorationData = [];
        }

        if(!(entry && entry.type)){
            return traceDecorationData;
        }

        if(this.programCalls.indexOf(entry.type) > -1){
            traceDecorationData.push({type: entry.type, name: entry.id, range: entry.range, isReady: false});
            return traceDecorationData;
        }

        if(this.controlFlowBlocks.indexOf(entry.type) > -1){
            traceDecorationData.push( {type: entry.type, name: entry.type.replace("Statement", "").replace("Clause", ""), range: entry.range});
             return traceDecorationData;
        }

        if(entry.type === "SwitchCase"){
            traceDecorationData.push( {type: entry.type, name: "Switch", range: entry.range});
            return traceDecorationData;
        }

        return traceDecorationData;
    }

    decorateTree(root, validEntryData){

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
            let root = {type: "Program", name: "Script", range: {start:{row: 0, column:0}, end:{row: 0, column:0}}, children : null} ;
            if(!trace){
                return root;
            }
            if(!trace.timeline){
                return root;
            }
            root.range = trace.timeline[0];
            let traceDecorationData = null;
            for( let index = 1 ; index < trace.timeline.length ; index++ ) {
                let entry = trace.timeline[ index ] ;
                traceDecorationData = self.collectTraceDecorationData(traceDecorationData, entry);
                self.addEntryToTree(root, entry);
            }
            self.decorateTree(root, traceDecorationData);
            console.log(trace.timeline);
            return root;
        };

        this.renderFx  =  function renderFx(formattedTrace, divElement) {
            if (!formattedTrace){
                return;
            }
            d3.select(divElement).html("");

            let margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 400 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

            let rectWidth = 100,
                rectHeight = 40;

            let tree = d3.tree()
                .nodeSize([160, 200]);

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
              .enter().append("path")
                .attr("class", "link")
                .attr("d", diagonal)
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
                .attr("dx", function(d) { return d.children ? -8 : 8; })
                .attr("dy", 22.5)
                .attr("text-anchor", "middle")
                .text(function(d) { return d.data.name; });

            d3.select(self.frameElement).style("height", height + "px");
        };
    }

}
