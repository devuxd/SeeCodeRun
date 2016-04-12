import jslinq from "jslinq";

export class TraceQueryManager{
	constructor(traceModel){
		this.filters = traceModel.traceSearchfilters;
	}
	
    contains(a,b){
        return (a!=null ? a.toString().indexOf(b) > -1 : false);
    }
    containsIgnoreCase(a,b){
        return (a!=null ? a.toString().toLowerCase().indexOf(b) > -1 : false);
    }

    getQuery(rawData, filterSelection, searchTerm){
        let contains = this.contains, filters = this.filters, dataSet = jslinq(rawData), query;
        
        if(searchTerm === ""){
            return dataSet;
        }
        
        switch(filters[filterSelection]){
        	case filters.any:
                query = dataSet.where(function(item){
                    return (contains(item.id,searchTerm)||contains(item.type,searchTerm)||contains(item.text,searchTerm)||contains(item.value,searchTerm));    

                    });
        		break;
        	default:
                query = dataSet.where(function(item){
                    return (contains(item[filterSelection],searchTerm));
                    });
        		break;  
        }
        return query;
    }
    
}