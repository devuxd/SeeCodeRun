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

    prepareFx(){
      let self = this;
      this.formatTraceFx =  function formatTraceFxAsD3RootNode(trace = this.trace){
        if(!trace)
          return ;
        // console.log( trace ) ;
        //the text starts at line 0 by default, plus one to match natural line numbers
        let callsMatrix = {} ;
        let funcs = [] ;
        //
        funcs = self.findFuncs( trace ) ;
        //

        for( let i = 0 ; i < funcs.length ; i++ )
        callsMatrix[ funcs[i].name ] = funcs[ i ] ; //try with adjacency list
        //callsMatrix[ funcs[i].name ] = {} ;
        callsMatrix = self.makeMatrix( funcs , callsMatrix ) ;
        //
        // console.log( callsMatrix ) ;
        //turns matrix into tree
        //let roots = self.matrixToTree( callsMatrix , funcs ) ;
        //console.log( roots ) ;
        // console.log(funcs)
        return callsMatrix[funcs[0].name] ;
      };

        this.renderFx  =  function renderFx(formattedTrace, divElement, query) {
          if (!formattedTrace){
              return;
          }

          if(query !== null && (query.trim() === "" || query == undefined)) {
            query = null;
          }

          function scrubLeaves(root, hasLeaves=0) {
            if(root === undefined || root.children === undefined) {
              return hasLeaves;
            }

            let children = root.children;

            for(let i = 0; i < children.length; i++) {
              if(children[i].children.length === 0 && !children[i].name.includes(query)) {
                hasLeaves++;
                root.children.splice(i, 1);
              }
              hasLeaves += scrubLeaves(children[i], hasLeaves);
            }
            return hasLeaves;
          }

          function scrubTree(root) {
            while(scrubLeaves(root)) {

            };
          }

          function makeQuery() {
            scrubTree(formattedTrace);
          }

          if(query !== null) {
            makeQuery();
          }

          console.log(query)

          console.log(formattedTrace)
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

          d3.select(divElement).select("svg").remove();

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
              let link = svg.selectAll(".link")
                  .data(links)
                .enter()
                  .append("g")
                  .attr("class", "link");

              link.append("line")
                  .attr("x1", function(d) { return d.parent.x; })
                  .attr("y1", function(d) { return !d.parent.data.name.includes(query) ? d.parent.y + rectHeight/2 : d.parent.y + rectHeight; })
                  .attr("x2", function(d) { return d.x; })
                  .attr("y2", function(d) { return !d.data.name.includes(query) ? d.y + rectHeight/2 : d.y; })
                  .style("fill","none")
                  .style("stroke","#ccc")
                  .style("stroke-width","1.5px");

              link.append("text")
                .attr("class","num_text")
                .attr("x", function(d) {
                  return (d.x + d.parent.x)/2;
                })
                .attr("y", function(d) {
                  return (d.y + d.parent.y + rectHeight)/2;
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                  return 1;//Math.floor((Math.random() * 10) + 1);
                })
                .style("font","10px sans-serif");

              function mouseover(d) {
                d3.select(this).append("text")
                  .attr("class", "hover")
                  .attr("transform", function(d) {
                    return "translate(5, -5)";
                  })
                  .text(d.data.name);
              }

              function mouseout(d) {
                d3.select(this).select("text.hover").remove();
              }

              console.log('nodes')
              console.log(node)
              let node = svg.selectAll(".node")
                  .data(nodes)
                .enter().append("g");

              let multiParents = node.filter(function (d, i) {
                return d.data.parents.length > 1;
              });

              let parentPairs = [];

              multiParents.each(function(d) {
                for(let i = 1; i < d.data.parents.length; i++) {
                  let p;
                  node.filter(function (d2, i2) { console.log(d2); return d2.data.id === d.data.parents[i].id; }).each(function(pNode) {
                    p = pNode;
                  })
                  parentPairs.push({
                    parent: p,
                    child: d
                  });
                }
              });

              parentPairs.forEach(function(multiPair) {
                link.append("line")
                .attr("class", "additionalParentLink")
                .attr("x1", multiPair.parent.x)
                .attr("y1", !multiPair.parent.data.name.includes(query) ? multiPair.parent.y + rectHeight/2 : multiPair.parent.y + rectHeight )
                .attr("x2", multiPair.child.x)
                .attr("y2", !multiPair.child.data.name.includes(query) ? multiPair.child.y + rectHeight/2 : multiPair.child.y)
                .style("fill","none")
                .style("stroke","#ccc")
                .style("shape-rendering", "geometricPrecision")
                .style("stroke-width","1.5px")
              })

              node.attr("class", "node")
                  .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
                  .attr("transform", nodeRenderer)
                  .style("font","10px sans-serif");

              let filteredNodes = node.filter(function(d, i) {
                return query === null || d.data.name.includes(query) || i === 0;
              });

              filteredNodes.append("rect")
                  .attr("width", rectWidth)
                  .attr("height", rectHeight)
                  .attr("transform", "translate(" + (-1 * rectWidth/2) + ",0)")
                  .style("fill","#fff")
                  .style("stroke","steelblue")
                  .style("stroke-width","1.5px");

              let regNodes = node.filter(function(d, i) {
                return query !== null && i !== 0 && !d.data.name.includes(query);
              });

              regNodes.on("mouseover", mouseover).on("mouseout", mouseout)

              regNodes.append("circle")
                    .attr("r", 4.5)
                    .attr("transform", "translate(0," + rectHeight/2 + ")");

              filteredNodes.append("text")
                  .attr("dy", 22.5)
                  .attr("text-anchor", "middle")
                  .text(function(d) { return d.data.name; });
              }

              // update();
              d3.select(self.frameElement).style("height", 200 + "px");
    }

    findFuncs( trace )
{
  let self = this ;
  let funcs = []
    let doesFuncExist = {} ;
  let lastBlockRange = null ;
  //
  for( let index = 1 ; index < trace.timeline.length - 1 ; index++ ) //precomputes all the funcs
  {
    let step = self.scrubStep( trace.timeline[ index ] ) ;
    //
    switch( step.type )
    {
      case "BlockStatement" :
        lastBlockRange = step.range ;
        break ;
        //
      case "FunctionData" :
        if( !doesFuncExist[ step.id ] )
        {
          if( !lastBlockRange )
            funcs.push( new Vertex( step.type , step.id , step.range , step.value ) ) ;
          else
          {
            funcs.push( new Vertex( step.type , step.id , lastBlockRange , step.value ) ) ;
            lastBlockRange = null ;
          }
          doesFuncExist[ step.id ] = true ;
        }
        break ;
        //
      case "CallExpression" :
        funcs.push( new Vertex( step.type , step.id , step.range , null ) ) ;
        break ;

      default: {}

    }
  }
  return funcs ;
}

makeMatrix( funcs , callsMatrix )
{
  let self = this ;
  for( let index1 = 0 ; index1 < funcs.length ; index1++ )
  {
    for( let index2 = 0 ; index2 < funcs.length ; index2++ )
    {

      if( funcs[ index2 ].type === "FunctionData" )
      {

        if( index1 !== index2 && self.isRangeInRange( funcs[ index1 ].range , funcs[ index2 ].range ) )
        {
          // console.log( "sparta" ) ;
          let x = funcs[ index2 ].name ;
          let y = funcs[ index1 ].name ;

          if( !callsMatrix[ x ].hasOwnProperty( callsMatrix[ y ] ) )
          {
            callsMatrix[ x ].children.push( callsMatrix[ y ] ) ;
            callsMatrix[ y ].parents.push( callsMatrix[ x ] ) ;
          }



          /*
          if( callsMatrix[ x ][ y ] ) //hold number of calls
            callsMatrix[ x ][ y ] += 1 ;
          else
            callsMatrix[ x ][ y ] = 1 ; //TODO: there is a bug, if echo calls console 2x and echo
          */								//itself is called 2x , it shows 4 calls of console
        }
      }
    }
  }
  return callsMatrix ;
}

  matrixToTree( callsMatrix , funcs , roots )
  {
    let self = this ;
    //
    for( let i = 0 ; i < funcs.length ; funcs++ )


    for( let index1 = 0 ; index1 < funcs.length ; index1++ )
    {
      for( let index2 = 0 ; index2 < funcs.length ; index2++ )
      {
        if( callsMatrix[ funcs[ index1 ].name ][ funcs[ index2].name ] )
        {
          funcs[ index1 ].children.push( funcs[ index2 ] ) ;
          funcs[ index2 ].parents.push( funcs[ index2 ] ) ;
        }
      }
    }
    return funcs ; //temp check
  }

  //
  //helpers
  //

  scrubStep( step )
  {
    if( step !== null )
    {
      if( step.text !== null )
      {
        step.text = step.text.replace( /"/g , "" ) ; //scrubs for "
      }
      if( step.id !== null )
      {
        step.id = step.id.replace( /[()""]/g , "" ) + "()" ;

      }
      if( step.type !== null )
      {
        step.type = step.type.replace( /"/g , "" ) ;
      }
    }
    return step ;
  }

  isRangeInRange(isRange, inRange) //be careful here!
  {
    if( isRange.start.row > inRange.start.row && isRange.end.row < inRange.end.row )
      return true ;

    if( isRange.start.row === inRange.start.row || isRange.end.row === inRange.end.row )
    {
      if( isRange.start.row === inRange.start.row )
        if( isRange.start.column < inRange.start.column )
          return false ;
      if( isRange.end.row === inRange.end.row )
        if( isRange.end.column > inRange.end.column )
          return false ;
      return true ;
    }

    return false ;
  }
}
