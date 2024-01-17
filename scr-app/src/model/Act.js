export const ActType = {
    SAFE: 'SAFE',
    UNSAFE: 'UNSAFE',
};

export const ActionType = {
    INTENDED: 'INTENDED',
    UNINTENDED: 'UNINTENDED',
};

export const ActionResultType = {
    SLIP: 'SLIP',
    LAPSE: 'LAPSE',
    MISTAKE: 'MISTAKE',
    VIOLATION: 'VIOLATION',
};

export const HumanCause = {
    ATTENTION: 'ATTENTION',
    MEMORY: 'MEMORY',
    RULE: 'RULE',
    KNOWLEDGE: 'KNOWLEDGE',
    ROUTINE: 'ROUTINE',
    EXCEPTION: 'EXCEPTION',
    SABOTAGE: 'SABOTAGE',
};


class PsychologicalType {
    actType;
    actionResultType;
    humanCause;
    name;
    description;
    examples;

    constructor(actType, actionResultType, humanCause, name, description, examples) {
        this.actType = actType;
        this.actionResultType = actionResultType;
        this.humanCause = humanCause;
        this.name = name;
        this.description = description
        this.examples = examples;
    }
}

export const intrusion = new PsychologicalType(
    ActType.UNSAFE,
    ActionResultType.SLIP,
    HumanCause.ATTENTION,
    "Intrusion",
    'user intended to do correct action, but did not actually execute action.',
    [`I poured some milk into my coffee and then put the coffee cup into the refrigerator.
    This is the correct action applied to the wrong object.`]
);
