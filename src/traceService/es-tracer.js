import {TraceHelper} from './trace-helper';
import {EsAnalyzer} from './es-analyzer';
import {EsInstrumenter} from './es-instrumenter';

export class EsTracer {

    constructor(traceModel, publisher) {
      this.esAnalyzer = new EsAnalyzer(traceModel);
      this.esInstrumenter = new EsInstrumenter(traceModel);
      this.traceModel = traceModel;
      this.publisher = publisher;
      this.subscribe();
    }

    onCodeRunning(){
        this.startTimestamp = +new Date();
    }

    onCodeFinished(payload){
        let event = this.traceModel.traceEvents.changed;
        this.traceChanged(event, payload.data);
    }

    traceChanged(event, results){
        let duration = (+new Date()) - this.startTimestamp ;
        results.description = `${event.description} Trace completed in ${1 + duration} ms.`;

        this.traceHelper = new TraceHelper(results, this.traceModel);

        let details = results.description;
        if(results.error){
            details += ` Error: ${results.error.toString()}`;
        }
        let payload = this.traceModel.makePayload(event.event, details, this.traceHelper);

        if(this.publisher){
            this.publisher.publish(payload.status, payload);
        }
    }

    getInstrumentation(sourceCode = "", timeLimit = 3000) {

        this.timeLimit = timeLimit;
        let  instrumentedCode;
        let payload = this.traceModel.makeEmptyPayload();

        try {
            instrumentedCode = this.esInstrumenter.instrumentTracer(sourceCode, this.esAnalyzer);

            payload.status = this.traceModel.traceEvents.instrumented.event;
            payload.description = this.traceModel.traceEvents.instrumented.description;
            payload.data = instrumentedCode;

        } catch (e) {
            payload.status = this.traceModel.traceEvents.failed.event;
            payload.description = `${this.traceModel.traceEvents.failed.description}. Error: ${e.toString()}`;

        }

        if(this.publisher){
            this.publisher.publish(payload.status, payload);
        }
        return payload;
    }

    subscribe(){
        if(this.publisher){
            return;
        }
        this.publisher.subscribe("traceNavigationPrepareChange", navigationData => {
                if(this.traceHelper){
                    this.traceHelper.setNavigationData(navigationData);
                    this.traceHelper.startNavigation();
                    this.traceHelper.navigateToBranch(this.branchRange, this.branchIndex, this.branchMax);
                    this.publisher.publish("traceNavigationChange", this.traceHelper);
                }
        });
    }
}