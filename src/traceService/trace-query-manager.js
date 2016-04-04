import JsLinQ from "jslinq";
export class TraceQueryManager{
	constructor(){
		this.jsLinQ = JsLinQ;
	}
	
	querySomething(aList){
		let dataSet = this.jsLinQ(aList);
		console.log(JSON.stringify(dataSet));
	}

}