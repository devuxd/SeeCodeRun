import {createContext} from "react";
import {
    BundlingIcon, ConsultingIcon,
    EditingIcon, HaltingIcon,
    InstrumentationIcon,
    ParsingIcon,
    RunningIcon,
    SeeingIcon, UnknowingIcon
} from "../common/icons/Software";

const NotificationSeverity = {
    E: "Error",
    W: "Warning",
    I: "Info",
    S: "Success",
};

const ComputationalModel = {WA: "WebApp"}; //

class HyperReference { // references from one software representation to another
    #text;
}

class CodeNotification {
    #name;
    #description;
    #editorId;
    #ranges;
    #explanations;
    #hyperReferences;

    constructor(name, description) {
        this.#name = name;
        this.#description = description;
    }

    get name() {
        return this.#name;
    }

    get description() {
        return this.#description;
    }
}


class LiveEditRunLifecycleNotification {
    #name;
    #description;
}

const State = {
    I: "Idling",
    R: "Requesting",
    S: "Success",
    F: "Failure",
};

class PhaseState {
    #state = State.I;
    get state(){
        return this.#state;
    }

    request(){
        if(this.#state === State.I){
            this.#state = State.R;
            return;
        }
        throw new Error("A request can only be made if idling");
    }

    success(){
        if(this.#state === State.R){
            this.#state = State.S;
            return;
        }
        throw new Error("A success can only be made if requesting");
    }

    fail(){
        if(this.#state === State.R){
            this.#state = State.F;
            return;
        }
        throw new Error("A fail can only be made if requesting");
    }


}

class LiveEditRunLifecyclePhase {
    #name;
    #description;
    #phaseState;

    constructor(name, description) {
        this.#name = name;
        this.#description = description;
        this.#phaseState = new PhaseState();
    }

    get name() {
        return this.#name;
    }

    get description() {
        return this.#description;
    }

    get phaseState(){
        return this.#phaseState;
    }
}

class GraphicalLiveEditRunLifecyclePhase {
    #liveEditRunLifecyclePhase;
    #icon;
    constructor(liveEditRunLifecyclePhase, icon) {
        this.#liveEditRunLifecyclePhase = liveEditRunLifecyclePhase;
        this.#icon = icon;
    }

    get liveEditRunLifecyclePhase() {
        return this.#liveEditRunLifecyclePhase;
    }

    get icon() {
        return this.#icon;
    }
}


export const LiveEditRunLifecycle = {
    S: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Seeing", "The developer is seeing the code, yet the app scripts have not been executed yet"), SeeingIcon),
    E: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Editing", "The developer is editing an script"), EditingIcon),
    P: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Parsing", "The script is being parsed"), ParsingIcon),
    I: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Instrumenting", "The script is being instrumented to track expression states"), InstrumentationIcon),
    B: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Bundling", "All scripts are being bundled into an app"), BundlingIcon),
    R: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Running", "The app is running"), RunningIcon),
    H: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Halting", "The app is halting"), HaltingIcon),
    C: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Consulting", "The developer is consulting other resources"), ConsultingIcon),
    U: new GraphicalLiveEditRunLifecyclePhase(new LiveEditRunLifecyclePhase("Unknowing", "The developers is doing unknown to SCR"), UnknowingIcon),
};
export const LiveEditRunLifecycleContext = createContext({
    state: LiveEditRunLifecycle.S,
    notifications: [],
});
