export class EsprimaNodeFactory{
    constructor(){
        
    }

    getDefaultAutoLogNode(){
        return {
            "type": "CallExpression",
            "callee": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                    "type": "MemberExpression",
                    "computed": false,
                    "object": {
                        "type": "Identifier",
                        "name": "window"
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "TRACE"
                    }
                },
                "property": {
                    "type": "Identifier",
                    "name": "autoLog"
                }
            },
            "arguments": [
                {
                    "type": "ObjectExpression",
                    "properties": [
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "type",
                                "raw": "'type'"
                            },
                            "computed": false,
                            "value": {
                                "type": "Literal",
                                "value": "",
                                "raw": "''"
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "id",
                                "raw": "'id'"
                            },
                            "computed": false,
                            "value": {
                                "type": "Literal",
                                "value": "",
                                "raw": "''"
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "text",
                                "raw": "'text'"
                            },
                            "computed": false,
                            "value": {
                                "type": "Literal",
                                "value": "",
                                "raw": "''"
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "value",
                                "raw": "'value'"
                            },
                            "computed": false,
                            "value": {
                                "type": "Literal",
                                "value": "",
                                "raw": "''"
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "range",
                                "raw": "'range'"
                            },
                            "computed": false,
                            "value": {
                                "type": "ObjectExpression",
                                "properties": [
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Literal",
                                            "value": "start",
                                            "raw": "'start'"
                                        },
                                        "computed": false,
                                        "value": {
                                            "type": "ObjectExpression",
                                            "properties": [
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "row",
                                                        "raw": "'row'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "Literal",
                                                        "value": 0,
                                                        "raw": "0"
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                },
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "column",
                                                        "raw": "'column'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "Literal",
                                                        "value": 0,
                                                        "raw": "0"
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                }
                                            ]
                                        },
                                        "kind": "init",
                                        "method": false,
                                        "shorthand": false
                                    },
                                    {
                                        "type": "Property",
                                        "key": {
                                            "type": "Literal",
                                            "value": "end",
                                            "raw": "'end'"
                                        },
                                        "computed": false,
                                        "value": {
                                            "type": "ObjectExpression",
                                            "properties": [
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "row",
                                                        "raw": "'row'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "Literal",
                                                        "value": 0,
                                                        "raw": "0"
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                },
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "column",
                                                        "raw": "'column'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "Literal",
                                                        "value": 0,
                                                        "raw": "0"
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                }
                                            ]
                                        },
                                        "kind": "init",
                                        "method": false,
                                        "shorthand": false
                                    }
                                ]
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Identifier",
                                "name": "indexRange"
                            },
                            "computed": false,
                            "value": {
                                "type": "ArrayExpression",
                                "elements": [
                                    {
                                        "type": "Literal",
                                        "value": 0,
                                        "raw": "0"
                                    },
                                    {
                                        "type": "Literal",
                                        "value": 0,
                                        "raw": "0"
                                    }
                                ]
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        },
                        {
                            "type": "Property",
                            "key": {
                                "type": "Literal",
                                "value": "extra",
                                "raw": "'extra'"
                            },
                            "computed": false,
                            "value": {
                                "type": "Literal",
                                "value": "",
                                "raw": "''"
                            },
                            "kind": "init",
                            "method": false,
                            "shorthand": false
                        }
                    ]
                }
            ]
        };
    }
    
/**
* @desc validates if location and range from esprima nodes have values
* post:  if location and range are undefined, returns undefined  otherwise
*        returns an AST nodes (Esprima format) in properties location and range, any undefined properties in inputs loc and range value are zeros 
**/
    getLocationDataNode(loc, range){
           let aceRange, indexRange;
    
           if(loc && range){
                aceRange = {
                    'start'     : {'row' : ((loc.start && loc.start.line>0)? loc.start.line-1: 0), 'column' : (loc.start? loc.start.column: 0) } ,
                    'end'       : {'row' : ((loc.end && loc.end.line>0)? loc.end.line-1: 0), 'column' : (loc.end? loc.end.column: 0) }
                };
                
                indexRange = [
                    (range.length>0? range[0]: 0),
                    (range.length>1? range[1]: 0) 
                ];
                
               let data = {
                  'location' : {
                                            "type": "ObjectExpression",
                                            "properties": [
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "start",
                                                        "raw": "'start'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "ObjectExpression",
                                                        "properties": [
                                                            {
                                                                "type": "Property",
                                                                "key": {
                                                                    "type": "Literal",
                                                                    "value": "row",
                                                                    "raw": "'row'"
                                                                },
                                                                "computed": false,
                                                                "value": {
                                                                    "type": "Literal",
                                                                    "value": aceRange.start.row,
                                                                    "raw": ""+aceRange.start.row
                                                                },
                                                                "kind": "init",
                                                                "method": false,
                                                                "shorthand": false
                                                            },
                                                            {
                                                                "type": "Property",
                                                                "key": {
                                                                    "type": "Literal",
                                                                    "value": "column",
                                                                    "raw": "'column'"
                                                                },
                                                                "computed": false,
                                                                "value": {
                                                                    "type": "Literal",
                                                                    "value": aceRange.start.column,
                                                                    "raw": ""+aceRange.start.column
                                                                },
                                                                "kind": "init",
                                                                "method": false,
                                                                "shorthand": false
                                                            }
                                                        ]
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                },
                                                {
                                                    "type": "Property",
                                                    "key": {
                                                        "type": "Literal",
                                                        "value": "end",
                                                        "raw": "'end'"
                                                    },
                                                    "computed": false,
                                                    "value": {
                                                        "type": "ObjectExpression",
                                                        "properties": [
                                                            {
                                                                "type": "Property",
                                                                "key": {
                                                                    "type": "Literal",
                                                                    "value": "row",
                                                                    "raw": "'row'"
                                                                },
                                                                "computed": false,
                                                                "value": {
                                                                    "type": "Literal",
                                                                    "value": aceRange.end.row,
                                                                    "raw": ""+aceRange.end.row
                                                                },
                                                                "kind": "init",
                                                                "method": false,
                                                                "shorthand": false
                                                            },
                                                            {
                                                                "type": "Property",
                                                                "key": {
                                                                    "type": "Literal",
                                                                    "value": "column",
                                                                    "raw": "'column'"
                                                                },
                                                                "computed": false,
                                                                "value": {
                                                                    "type": "Literal",
                                                                    "value": aceRange.end.column,
                                                                    "raw": ""+aceRange.end.column
                                                                },
                                                                "kind": "init",
                                                                "method": false,
                                                                "shorthand": false
                                                            }
                                                        ]
                                                    },
                                                    "kind": "init",
                                                    "method": false,
                                                    "shorthand": false
                                                }
                                            ]
                                        },
                              'range'  :           {
                                            "type": "ArrayExpression",
                                            "elements": [
                                                {
                                                    "type": "Literal",
                                                    "value": indexRange[0],
                                                    "raw": ""+ indexRange[0]
                                                },
                                                {
                                                    "type": "Literal",
                                                    "value": indexRange[1],
                                                    "raw": ""+ indexRange[1]
                                                }
                                            ]
                                        }
               };
               return data;
           } else {
               return undefined;
           }
           
    }
    
}