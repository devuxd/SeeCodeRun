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

        this.rootNode = {
            name: "Program",
            id: -1,
            parentId: null,
            ranges: [],
            children: [],
            isCallback: false,
            pinned: true
        }

        this.rootCopy = {
            name: "Program",
            id: -1,
            parentId: null,
            ranges: [],
            children: [],
            isCallback: false,
            pinned: true
        };
    }

    prepareFx() {
  		let self = this ;
  		this.formatTraceFx = function() { return null; }

      this.renderFx = function renderFx(formattedTrace, divElement, branches, query, queryType, aceUtils, aceMarkerManager) {
        if (!branches || branches.length === 0) {
          return;
        }

        self.rootNode = JSON.parse(JSON.stringify(self.rootCopy));

        self.removeUnpinned();
        self.addToGraph(self.createBranchHierarchy(branches));

        self.rootCopy = JSON.parse(JSON.stringify(self.root));

        if(query == undefined || query.trim() === "") {
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
          while(scrubLeaves(root));
        }

        function makeQuery() {
          scrubTree(root);
        }

        if(query !== null && queryType === "functions") {
          makeQuery();
        }

        d3.select(divElement).html("");

        let margin = {top: 20, right: 20, bottom: 30, left: 40};
        let width = $("#right-splitter").width() - margin.left - margin.right;
        let height = $(".tab-content").height() - 300 - margin.top - margin.bottom;

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
            let d3event = d3.event.transform;
            return "translate(" + d3event.x + ", " + d3event.y + ") scale(" + d3event.k +")";
          });
        }))
        .append("g");

        $(window).resize(function() {
          d3.select(divElement).select("svg").attr("width", $("#right-splitter").width() - margin.left - margin.right);
          d3.select(divElement).select("svg").attr("height", $(".tab-content").height() - 300 - margin.top - margin.bottom);
        });

        let root = d3.hierarchy(branches);
        let nodes = root.descendants();
        let links = root.descendants().slice(1);

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

        function showHoverText(d) {
          d3.select(this).append("text")
            .attr("class", "hover")
            .attr("transform", function(d) {
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
          aceUtils.updateAceMarkers(aceMarkerManager, d.data.ranges);
        }

        function unhighlight(d) {
          aceUtils.updateAceMarkers(aceMarkerManager, []);
        }

        let node = svg.selectAll(".node")
            .data(nodes)
          .enter().append("g");

        node.attr("class", "node")
            .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
            .attr("transform", nodeRenderer)
            .style("font","10px sans-serif");

        let matchedNodes = node.filter(function(d, i) {
          if(queryType === "functions") {
            return query === null || d.data.name.includes(query) || i === 0;
          }
          else {
            return true; // TODO support other query types
          }
        });

        matchedNodes.append("rect")
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("transform", "translate(" + (-1 * rectWidth/2) + ",0)")
            .style("fill","#fff")
            .style("stroke","steelblue")
            .style("stroke-width","1.5px");

        let regNodes = node.filter(function(d, i) {
          if(queryType === "functions") {
            return query !== null && i !== 0 && !d.data.name.includes(query);
          }
          else {
            return false; // TODO support other query types
          }
        });

        regNodes.on("mouseover", showHoverText)
          .on("mouseout", hideHoverText);

        matchedNodes.on("mouseover",highlight)
          .on("mouseout", unhighlight);

        regNodes.append("circle")
              .attr("r", 6)
              .attr("transform", "translate(0," + rectHeight/2 + ")");

        matchedNodes.append("text")
            .attr("dy", 22.5)
            .attr("text-anchor", "middle")
            .text(function(d) { return d.data.name; });

        function updatePins() {
          matchedNodes.selectAll("circle").remove();
          matchedNodes.filter(function(d) {
            return d.data.pinned === false;
          })
          .append("circle")
            .attr("r", 3)
            .on("click", function(d) {
              self.togglePinOnBranch(d.data);
              updatePins();
            })
            .style("stroke-width", 2)
            .style("color", "white");

          matchedNodes.filter(function(d) {
            return d.data.pinned === true;
          })
          .append("circle")
            .attr("r", 3)
            .on("click", function(d) {
              self.togglePinOnBranch(d.data);
              updatePins();
            })
            .style("stroke-width", 2)
            .style("color", "blue");
        }

        updatePins();

        svg.selectAll(".node").selectAll("*").attr("transform","translate(" + (width/2 - rectWidth/2) + ",5)");
        svg.selectAll(".node").selectAll("text").attr("transform","translate(" + width/2 + ",5)");
        svg.selectAll(".link").attr("transform","translate(" + width/2 + ",5)");
      }

    }

    createBranchHierarchy(branches) {
      branches[branches.length-1].parentId = branches[branches.length-2];
      for(let i = 0; i < branches.length-1; i++) {
        branches[i].children = [branches[i+1]];
        if(i !== 0) {
          branches[i].parentId = branches[i-1].id;
        }
      }
      return branches[0];
    }

    addToGraph(branches, currentIndex=0, currentBranch=this.rootNode) {
      for(let i = 0; i < currentBranch.children.length; i++) {
        if(!areBranchesEqual(branch, currentBranch)) {
          currentBranch.children.push(branch);
        }
        this.addToGraph(currentBranch.children[i]);
      }
    }

    removeUnpinned(currentBranch=this.rootNode) {
      for(let i = 0; i < currentBranch.children.length; i++) {
        if(!currentBranch.children[i].pinned) {
          currentBranch.children.splice(i, 1);
        }
        this.removeUnpinned(currentBranch.children[i]);
      }
    }

    togglePinOnBranch(branch) {
      let path = generatePath(branch);
      for(let i in path) {
        path[i].pinned = !path[i].pinned;
      }
    }

    generatePath(branch) {
      let currentBranch = this.rootNode;
      let path = [currentBranch];
      while(currentBranch.parentId !== null) {
        let branchHolder = {branch:null};
        getBranchById(currentBranch.parentId, branchHolder);
        currentBranch = branchHolder.branch;
        path.push(currentBranch);
      }
      return path;
    }

    getBranchById(id, branchHolder, currentBranch=this.root) {
      if(id === currentBranch.id) {
        branchHolder.branch = currentBranch;
        return;
      }
      for(let i = 0; i < currentBranch.children.length; i++) {
        getBranchById(currentBranch.children[i]);
      }
    }

    areBranchesEqual(branch1, branch2) {
      return branch1.id === branch2.id;
    }
}
