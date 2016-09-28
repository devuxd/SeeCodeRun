import esprima from 'esprima';
import estraverse from 'estraverse';

export class EsAnalyzer {

    constructor(traceModel) {
        this.traceModel = traceModel;
        this.Syntax = this.traceModel.esSyntax;
        this.traceTypes = this.traceModel.traceTypes;

        this.esprima = esprima;
        this.estraverse = estraverse;

    }

    traverse(object, visitor, master, objectKey) {
        var key, child, parent, path;

        parent = !master ? [] : master;

        if (visitor.call(null, object, parent, objectKey) === false) {
            return;
        }

        for (key in object) {
            if (object.hasOwnProperty(key)) {
                child = object[key];
                path = [ object ];
                path.push(parent);

                if (typeof child === 'object' && child !== null) {
                        this.traverse(child, visitor, path, key);
                }

            }
        }

    }

    collectPath( nodePath ){
        let path =[];

        while (nodePath != null){
            if(nodePath.length>1){
                path.unshift(nodePath[0]);
                nodePath = nodePath[1];

            }else if(nodePath.length>0){
                path.unshift(nodePath[0]);
                nodePath = null;
            }else{ // [] case
                nodePath = null;
            }
        }
        return path;
    }

    beautifyPathSyntaxTypesOnly (path){
        var beautifulString = "path: {";
        for( var i in path){
            var node = path[i];
            if(node.type){
                beautifulString  += node.type;
                beautifulString  += ", ";
            }

        }
        beautifulString  += " }";
        return beautifulString;
    }

    traceAllAutoLog(code, autoLogTracer) {
            let tree = esprima.parse(code, { range: true, loc: true });
            let traverseResults = {};

            this.traverse(tree, function traceVisitor(node, path, nodeKey) {
                traverseResults = {node: node, code: code, path: path, nodeKey: nodeKey};
                autoLogTracer(traverseResults);
            });

          return {tree: tree, traverseResults: traverseResults};
    }

}