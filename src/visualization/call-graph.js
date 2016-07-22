import * as d3 from 'd3';
import {event} from 'd3'
import {Vertex} from './vertex.js' ;

export function getD3Event() {
  return d3.event;
}

export class CallGraph {

    constructor() {
        this.config = {
            type: 'CallGraph',
            title: 'Call Graph',
            trace: null,
            formatTraceFx: this.formatTraceFx,
            renderFx: this.renderFx,
            errorMessage: null
        };
    }

    formatTraceFx(trace) //returns the root Vertex
    {
        if(!trace)
            return;
        //
        let root = new Vertex( trace.timeline[0].type , "Program()" , trace.timeline[0].range.start.row + 1 , trace.timeline[0].range.end.row + 1 ) ;
        //the text starts at line 0 by default, plus one to match natural line numbers
        let funcs = [] ;
        let wasBlock = false ;
        let lastBlock = "" ;
        //
        for( let index = 1 ; index < trace.timeline.length ; index++ ) //finds all functions
        {
            let tempVals = trace.timeline[ index ] ;
            if( tempVals.value != null )
                tempVals.value = tempVals.value.replace( /"/g , "" ) ; //scrubs for "
            //
            if( tempVals.type === "BlockStatement" )
            {
                wasBlock = true ;
                lastBlock = tempVals.value ;
            }
            else
            {
                if( tempVals.type === "FunctionDeclaration" && wasBlock ) //FunctionDeclarations always follow BlockStatements
                {
                    let isRepeat = false ;
                    for( let i = 0 ; i < funcs.length ; i++ )
                        if( tempVals.value  === funcs[ i ].getName() )
                            isRepeat = true ;
                    //
                    if( !isRepeat )
                    {
                        wasBlock = false ;
                        funcs.push( new Vertex( "FunctionDeclaration" , tempVals.value , tempVals.range.start.row , tempVals.range.end.row , lastBlock ) ) ;
                    }
                }
            }
        }
        for( let i = 0 ; i < funcs.length ; i++ )
        {
            console.log( funcs[ i ].getName() ) ;
            root.addChild( funcs[ i ] ) ;
        }
        //
        for( let index = 0 ; index < funcs.length ; index++ ) //won't work with recursion
        {
            let contents = funcs[ index ].getValue().replace( / /g , "" ) ;
            for( let k = 0 ; k < funcs.length ; k++ )
            {
                if( funcs[index] !== funcs[k] && !funcs[ k ].hasParent( funcs[ index ] ) && contents.indexOf( funcs[ k ].getName() + "(" ) > 0 )
                {
                    funcs[ k ].addParent( funcs[ index ] ) ;
                    funcs[ index ].addChild( funcs[ k ] ) ;
                }
            }
        }
		//
        console.log( root ) ;
        return root ;
    }

    renderFx(trace, divElement) {
        if (!trace){
            return;
        }
        // clear the div element
        d3.select(divElement).html("");

        let data = trace;

        let margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 400 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

        let rectWidth = 100,
            rectHeight = 40;

        let tree = d3.layout.tree()
            .nodeSize([160, 200]);

        let diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.x, d.y+rectHeight/2]; });

        let svg = d3.select(divElement).append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("position","relative")
            .attr("id","dfsfsd")
            .attr("onclick","console.log(d3.event)")
            .call(d3.behavior.zoom()
          .on("zoom", function () {
            console.log(getD3Event());
            svg.attr("transform", function() {
              let devent = d3.event;
              return "translate(" + devent.translate + ") scale(" + devent.scale +")";
            })
          }))
            .append("g")

        svg.attr("transform","translate(100,0)");
        // TODO: prevent jumping on pan/zoom

        let json = data;
        let nodes = tree.nodes(json),
            links = tree.links(nodes);

        let link = svg.selectAll("path.link")
            .data(links)
          .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal)
            .style("fill","none")
            .style("stroke","#ccc")
            .style("stroke-width","1.5px")

        let node = svg.selectAll("g.node")
            .data(nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .style("font","10px sans-serif");

        node.append("rect")
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("transform", "translate(" + (-1 * rectWidth/2) + ",0)")
            .style("fill","#fff")
            .style("stroke","steelblue")
            .style("stroke-width","1.5px")

        node.append("text")
            // .attr("dx", function(d) { return d.children ? -8 : 8; })
            .attr("dy", 22.5)
            .attr("text-anchor", "middle")
            .text(function(d) { return d.name; });

        d3.select(self.frameElement).style("height", height + "px");

    }

}
