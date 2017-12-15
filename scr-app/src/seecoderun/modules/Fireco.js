

class Fireco{
  constructor(firecoWebWorker){
    this.worker = firecoWebWorker;

  }

  onError = error =>{

  };

  onMessage = () =>{

  };
  terminate = ()=> {
    this.worker.terminate();
  }

}
export default Fireco;
