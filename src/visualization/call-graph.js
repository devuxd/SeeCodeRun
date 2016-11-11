/*global d3*/
import {Vertex} from "./vertex.js";
import {AceUtils} from "../utils/ace-utils";

export class CallGraph {
  focusedNode = null;
  currentDirection = "down"; // or "right"
  directionManager = {
    right: {
      nodeRenderer: function translateRight(d) {
        return "translate(" + d.y + "," + d.x + ")";
      },
      linkRenderer: function linkRenderer(d) {
        return "M" + d.y + "," + d.x +
          "C" + (d.parent.y + 100) + "," + d.x +
          " " + (d.parent.y + 100) + "," + d.parent.x +
          " " + d.parent.y + "," + d.parent.x;
      }
    },
    down: {
      nodeRenderer: function translateRight(d) {
        return "translate(" + d.x + "," + d.y + ")";
      },
      linkRenderer: function linkRenderer(d) {
        return "M" + d.x + "," + d.y +
          "C" + (d.parent.x + 100) + "," + d.y +
          " " + (d.parent.x + 100) + "," + d.parent.y +
          " " + d.parent.x + "," + d.parent.y;
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
    this.aceUtils = new AceUtils();
    this.focusMarker = this.aceUtils.makeAceMarkerManager(null, this.aceUtils.getAvailableMarkers().callGraphFocusMarker, "line");
    this.hoverMarker = this.aceUtils.makeAceMarkerManager(null, this.aceUtils.getAvailableMarkers().callGraphHoverMarker);

  }

  prepareFx() {
    let self = this;
    this.formatTraceFx = function makeTree(trace = this.trace, traceHelper) {
      if (!trace)
        return;
      if (traceHelper) {
        self.traceHelper = traceHelper;
        self.isRangeInRange = traceHelper.isRangeInRange;
      }
      //the text starts at line 0 by default, plus one to match natural line numbers
      let map = {};
      let funcs = [];
      //
      funcs = self.findFuncs(trace);

      for (let i = 0; i < funcs.length; i++)
        map[funcs[i].name] = funcs[i]; //try with adjacency list

      map = self.makeMatrixList(funcs, map);
      //
      let rootsList = []; //list of functions that arent called
      for (let key in map) {
        //console.log( key ) ;
        if (map[key].parents.length === 0)
          rootsList.push(map[key]);
      }
      //
      // console.log( "funcs" ) ;
      // console.log( funcs ) ;
      // console.log( "map" ) ;
      // console.log( map ) ;

      // console.log( map[ "alpha()" ].children[ 1 ] === map[ "alpha()" ].children[ 2 ] ) ;
      //turns matrix into tree

      let masterHead = new Vertex("Program", "Program");

      // rootsList.map(function(e) {
      //   masterHead.children.push(e);
      // })

      // return rootsList[ 0 ] ;
      return rootsList[0];
    };

    this.renderFx = function renderFx(formattedTrace, divElement, query, queryType, aceUtils, aceMarkerManager, dimensions, eventAggregator) {
      if (!formattedTrace) {
        return;
      }

      if (query !== null && (query == undefined || query.trim() === "")) {
        query = null;
      }

      function scrubLeaves(root, hasLeaves = 0) {
        if (root === undefined || root.children === undefined) {
          return hasLeaves;
        }

        let children = root.children;

        for (let i = 0; i < children.length; i++) {
          if (children[i].children.length === 0 && !children[i].name.includes(query)) {
            hasLeaves++;
            root.children.splice(i, 1);
          }
          hasLeaves += scrubLeaves(children[i], hasLeaves);
        }
        return hasLeaves;
      }

      function scrubTree(root) {
        while (scrubLeaves(root)) {

        }
        ;
      }

      function makeQuery() {
        scrubTree(formattedTrace);
      }

      if (query !== null && queryType === "functions") {
        makeQuery();
      }

      d3.select(divElement).html("");

      // let margin = {
      //     top: 20,
      //     right: 20,
      //     bottom: 30,
      //     left: 40
      //   },
      //   width = dimensions.width - 4,
      //   height = dimensions.height - 4;

      let rectWidth = 100,
        rectHeight = 40;

      let tree = d3.tree()
        .nodeSize([160, 200]);

      let diagonal = self.directionManager[self.currentDirection].linkRenderer;

      let nodeRenderer = self.directionManager[self.currentDirection].nodeRenderer;

      d3.select(divElement).select("svg").remove();
      //todo: look for #seePanelBody and match the height of the svg. Be aware of resizing events
      let svg = d3.select(divElement).append("svg")
        .classed("svg-container", true)
        .style("width", "100%")
        .style("height", "99%")
        .attr("position", "relative")
        .call(d3.zoom()
          .on("zoom", function () {
            svg.attr("transform", function () {
              let devent = d3.event.transform;
              return "translate(" + devent.x + ", " + devent.y + ") scale(" + devent.k + ")";
            });
          }))
        .append("g");

      svg.attr("transform", "translate(100,0)");

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
        .attr("x1", function (d) {
          return d.parent.x;
        })
        .attr("y1", function (d) {
          return !d.parent.data.name.includes(query) ? d.parent.y + rectHeight / 2 : d.parent.y + rectHeight;
        })
        .attr("x2", function (d) {
          return d.x;
        })
        .attr("y2", function (d) {
          return !d.data.name.includes(query) ? d.y + rectHeight / 2 : d.y;
        })
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-width", "1.5px");

      // link.append("text")
      //   .attr("class","num_text")
      //   .attr("x", function(d) {
      //     return (d.x + d.parent.x)/2;
      //   })
      //   .attr("y", function(d) {
      //     return (d.y + d.parent.y + rectHeight)/2;
      //   })
      //   .attr("text-anchor", "middle")
      //   .text(function (d) {
      //     return d.data.childCalls;//Math.floor((Math.random() * 10) + 1);
      //   })
      //   .style("font","10px sans-serif");

      function showHoverText(d) {
        d3.select(this).append("text")
          .attr("class", "hover")
          .attr("transform", function (d) {
            return "translate(5, -5)";
          })
          .text(d.data.name);
        highlight(d);
      }

      function hideHoverText(d) {
        d3.select(this).select("text.hover").remove();
        unhighlight(d);
      }

      function highlight(d) {
        unhighlight();
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.hoverMarker, elements: d.data.ranges});
      }

      function unhighlight() {
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.hoverMarker, elements: []});
      }

      function focus(d) {
        if (d.data.isFocused === true) {
          unfocus();
          d.data.isFocused = false;
          return;
        }
        if (self.focusedNode) {
          unfocus();
          self.focusedNode.data.isFocused = false;
        }
        self.focusedNode = d;
        d.data.isFocused = true;
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.focusMarker, elements: d.data.ranges});
      }

      function unfocus() {
        eventAggregator.publish("jsEditorHighlight", {aceMarkerManager: self.focusMarker, elements: []});
      }

      // console.log('nodes')
      // console.log(node)
      let node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g");

      let multiParents = node.filter(function (d, i) {
        return d.data.parents.length > 1;
      });

      let parentPairs = [];

      multiParents.each(function (d) {
        for (let i = 1; i < d.data.parents.length; i++) {
          let p;
          node.filter(function (d2, i2) {
            return d2.data.id === d.data.parents[i].id;
          }).each(function (pNode) {
            p = pNode;
          })
          parentPairs.push({
            parent: p,
            child: d
          });
        }
      });

      parentPairs.forEach(function (multiPair) {
        link.append("line")
          .attr("class", "additionalParentLink")
          .attr("x1", multiPair.parent.x)
          .attr("y1", !multiPair.parent.data.name.includes(query) ? multiPair.parent.y + rectHeight / 2 : multiPair.parent.y + rectHeight)
          .attr("x2", multiPair.child.x)
          .attr("y2", !multiPair.child.data.name.includes(query) ? multiPair.child.y + rectHeight / 2 : multiPair.child.y)
          .style("fill", "none")
          .style("stroke", "#ccc")
          .style("shape-rendering", "geometricPrecision")
          .style("stroke-width", "1.5px")
      })

      node.attr("class", "node")
        .attr("class", function (d) {
          return "node" + (d.children ? " node--internal" : " node--leaf");
        })
        .attr("transform", nodeRenderer)
        .style("font", "10px sans-serif");

      let filteredNodes = node.filter(function (d, i) {
        if (queryType === "functions") {
          return query === null || d.data.name.includes(query) || i === 0;
        }
        else {
          return true; // TODO support other query types
        }
      });

      filteredNodes.append("rect")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("transform", "translate(" + (-1 * rectWidth / 2) + ",0)")
        .style("fill", "#fff")
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px");

      let regNodes = node.filter(function (d, i) {
        if (queryType === "functions") {
          return query !== null && i !== 0 && !d.data.name.includes(query);
        }
        else {
          return false; // TODO support other query types
        }
      });

      regNodes.on("mouseover", showHoverText)
        .on("mouseout", hideHoverText);

      filteredNodes.on("mouseover", highlight)
        .on("mouseout", unhighlight);

      //  regNodes.on("mousedown", showHoverText)
      //   .on("mouseup", hideHoverText);
      //
      // regNodes.on("mousedown", addClass)


      filteredNodes.on("mousedown", focus)
        .on("mouseup", unfocus);

      regNodes.append("circle")
        .attr("r", 6)
        .attr("transform", "translate(0," + rectHeight / 2 + ")");

      filteredNodes.append("text")
        .attr("dy", 22.5)
        .attr("text-anchor", "middle")
        .text(function (d) {
          return d.data.name;
        });
    }
  }


  findFuncs(trace) {

    let funcs = []
    if (!trace) {
      return funcs;
    }
    if (!trace.timeline) {
      return funcs;
    }
    let self = this;
    let doesFuncExist = {};
    let doesCallExist = {};
    let lastBlockRange = null;
    let callfuncs = [];
    //
    for (let index = 1; index < trace.timeline.length - 1; index++) //precomputes all the funcs
    {   // dangerous direct modification ot the trace
      let entry = trace.timeline[index];
      // shallow copy of values of interest, careful with value and range(they are the only properties that are "objects"), do not modify their properties, create a copy if needed
      let step = {id: entry.id, value: entry.value, range: entry.range, type: entry.type, text: entry.text};
      step = self.scrubStep(step);
      //
      switch (step.type) {
        case "BlockStatement":
          lastBlockRange = step.range;
          break;
        //
        case "FunctionData":
          if (!doesFuncExist[step.id]) {
            if (!lastBlockRange)
              funcs.push(new Vertex(step.type, step.id, [{
                range: step.range
              }], step.value, step.text));
            else {
              funcs.push(new Vertex(step.type, step.id, [{
                range: lastBlockRange
              }], step.value, step.text));
              lastBlockRange = null;
            }
            doesFuncExist[step.id] = true;
          }
          else {

          }
          break;
        //
        case "CallExpression":
          let found = false;
          for (let i = 0; i < callfuncs.length; i++) {
            if (callfuncs[i] === step.id) {
              found = true;
            }
          }
          if (!found || step.id.includes(".")) {
            let currentVertex = new Vertex(step.type, step.id, [{
              range: step.range
            }], null, step.text);
            funcs.push(currentVertex);
            callfuncs.push(step.id)
          }
          else {
            for (let i = 0; i < funcs.length; i++) {
              if (funcs[i].name === step.id) {
                funcs[i].ranges.push({
                  range: step.range
                })
              }
            }
          }
          break;

        default: {
        }

      }
    }
    return funcs;
  }

  makeMatrixList(funcs, map) {
    // console.log(map)
    let self = this;
    for (let index1 = 0; index1 < funcs.length; index1++) {
      for (let index2 = 0; index2 < funcs.length; index2++) {

        if (funcs[index2].type === "FunctionData") {

          if (index1 !== index2 && self.isRangeInRange(funcs[index1].ranges[0].range, funcs[index2].ranges[0].range)) {
            let mom = funcs[index2].name;
            let child = funcs[index1].name;

            if (!map[mom].childCalls[child]) {
              map[mom].children.push(map[child]);
              if (funcs[index1].type !== "CallExpression")
                map[child].parents.push(map[mom]);
              //
              map[mom].childCalls[child] = ["testing"];
            }
            else {
              map[mom].childCalls[child].push("testing");
            }

          }
          //
          //	if( index1 !== index2 && funcs[index1].type === "CallExpression"
          //		&& funcs[index1].text.indexOf( funcs[index2].name.replace( /[()""]/g , "" ) ) )
          //	{
          //		let mom = funcs[ index2 ].name ;
          //		let child = funcs[ index1 ].name ;
          //
          //		console.log( "callback found" ) ;
          //		map[ mom ].children.push( map[ child ] ) ;
          //		map[ child ].parents.push( map[ mom ] ) ;
          //		map[ child ].isCallback = true ;
          //	}
        }
      }
    }
    return map;
  }

  //
  //helpers
  //

  scrubStep(step) {
    if (step !== null) {
      if (step.text !== null) {
        step.text = step.text.replace(/"/g, ""); //scrubs for "
      }
      if (step.id !== null) {
        step.id = step.id.replace(/[()""]/g, "") + "()";

      }
      if (step.type !== null) {
        step.type = step.type.replace(/"/g, "");
      }
    }
    return step;
  }
}
