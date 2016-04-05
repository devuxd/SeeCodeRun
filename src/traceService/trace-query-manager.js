import JsLinQ from "jslinq";

export class TraceQueryManager{
	constructor(traceModel){
		this.filters = traceModel.traceSearchfilters;
	}
	
    contains(a,b){
        return (a.toString().toLowerCase().indexOf(b)>=0);
    }

    query(rawData, searchTerm, filterSelection){
        let contains = this.contains, filters = this.filters, dataSet = JsLinQ(rawData), query;
        
        if(searchTerm === ""){
            return dataSet;
        }
        
        switch(filterSelection){
        	case filters.Any:
                query = dataSet.Where(function(item){return contains(item.id,searchTerm)||contains(item.type,searchTerm)||
                    contains(item.text,searchTerm)||contains(item.values,searchTerm)    
                    }).ToArray();
        		break;
        	case filters.ID:
                query = dataSet.Where(function(item){
                    return contains(item.id,searchTerm)}).ToArray();
        		break;
        	case filters.Type:
                query = dataSet.Where(function(item){
                    return contains(item.type,searchTerm)}).ToArray();
                break;
        	case filters.Text:
                query = dataSet.Where(function(item){
                    return contains(item.text,searchTerm)}).ToArray();
        		break;
        	case filters.Values:
                query = dataSet.Where(function(item){
                    return contains(item.values,searchTerm)}).ToArray();
        		break;        	
        	default:
        		return dataSet;
        }
        return query;
    }
    
}