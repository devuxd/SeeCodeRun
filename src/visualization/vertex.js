export class Vertex
{
    constructor( type , name , ranges , values , text )
    {
        this.type = type ;
        this.name = name ;
        this.ranges = ranges ;
        this.values = values ;
		this.parents = [] ;
		this.children = [] ;
		this.childCalls = [];
		this.isCallback = false ;
		this.text = text ;
    }
}
