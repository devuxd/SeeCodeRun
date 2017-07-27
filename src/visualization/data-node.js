export class DataNode
{
  constructor(type, name, range, values, text)
    {
      this.type = type;
      this.name = name;
      this.range = range;
      this.callRanges = [];
      this.values = values;
		this.parents = [] ;
		this.children = [] ;
		this.childCalls = [];
		this.isCallback = false ;
		this.text = text ;
		this.x = 0 ;
		this.y = 0;
    }
}
