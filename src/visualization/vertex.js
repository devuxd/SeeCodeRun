export class Vertex
{
    constructor( type , name , start , end , value)
    {
        if( !arguments.length )
        {
            this.type = 'NahType' ;
            this.name = 'NahName' ;
			this.value = 'NahValue' ;
            this.start = null ;
            this.end  = null ;
            this.children = [] ;
            this.parents = [] ;
        }
        else
        {
            this.type = type ;
            this.name = name ;
            this.start = start ;
            this.end = end ;
			this.value = value ;
            this.children = [] ;
            this.parents = [] ;
        }
    }
    //
    addParent(rent )
    {
        this.getParents().push( rent ) ;
    }
    //
    addChild( child )
    {
        this.getChildren().push( child ) ;
        //this.getChildren()[ this.getChildren().length - 1 ].addParent( this ) ;
    }
    //
	setName( name )
	{
		this.name = name ;
	}
	//
    setStart( start )
    {
        this.start = start ;
    }
    //
    setEnd( end )
    {
        this.end = end ;
    }
    //
	setValue( value )
	{
		this.value = value ;
	}
	//
	hasChild( child )
	{
		for( let i = 0 ; i < this.children.length ; i++ )
			if( this.children[ i ] === child )
				return true ;
		return false ;
	}
	//
	hasParent( par )
	{
		for( let i = 0 ; i < this.parents.length ; i++ )
			if( this.parents[ i ] === par )
				return true ;
		return false ;
	}
	//
    getChildren()
    {
        return this.children ;
    }
    //
    getParents()
    {
        return this.parents ;
    }
    //
    getStart()
    {
        return this.start ;
    }
    //
    getEnd()
    {
        return this.end ;
    }
    //
    getType()
    {
        return this.type ;
    }
	getValue()
	{
		return this.value ;
	}
	getName()
	{
		return this.name ;
	}
}
