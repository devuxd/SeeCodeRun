/**
 * Created by DavidIgnacio on 7/17/2017.
 */
export class SearcherContainer{

  constructor(firebaseManager){
    this.firebaseManager = firebaseManager;
  }
  attached(){
    let firebaseURLs = this.firebaseManager.makePastebinMetagsURLsFirebase();
    firebaseURLs.on("child_added", function(snapshot){
        let data = snapshot.val();
      $("#urlList").append(`<li> ${JSON.stringify(data)}/li>`);
    });
  }

}
