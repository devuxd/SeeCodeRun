export function augmentError(errorObject, rawError, zoneData, entry) {

    console.log("RAW", {rawError, zoneData, entry});

    const name = zoneData?.[1];
    const aleZone = zoneData?.[2];

    if (errorObject?.name?.endsWith("TypeError")) {

        if (errorObject.message?.trim().endsWith(" is not a function")) {
            errorObject.message = `${name} is not a function`;
        }
        errorObject.message = errorObject.message.replace(/\(near.*/, "");

        if (name === "setAttribute") {
            if (aleZone) {
                const uid = aleZone.uid;
                if (aleZone.parentType === "MemberExpression") {
                    let parent = aleZone.parentSnapshot;
                    let isForIn = false;
                    let isForOf = false;
                    while (parent) {
                        if (parent.uid !== uid) {
                            break;
                        }
                        parent = parent.parentSnapshot;

                        // || parent.type === "ForOfStatement"
                    }

                    if (parent?.type === "ForInStatement") {
                        isForIn = true;
                    }

                    if (parent?.type === "ForOfStatement") {
                        isForOf = true;
                    }

                    if (isForIn) {
                        errorObject.message = errorObject.message.replace("undefined", `\`\`\`${name}\`\`\``);
                        errorObject.message = errorObject.message + ". \`\`\`HTMLCollection\`\`\` is not iterable via \`\`\`for in\`\`\`, try \`\`\`for of\`\`\`.";
                    } else {
                        if (isForOf) {
                            let str = `${aleZone?.parentSnapshot.sourceText}`;
                            let parts = str.split('.'); // Split the string into parts divided by dots
                            parts.pop(); // Remove the last segment after the last dot
                            let result = parts.join('.'); // Join the remaining segments back together

                            // console.log(result); // This will log "elements[i]"

                            // console.log("setAttribute", {uid, parent}, aleZone.parentType, aleZone.parentSnapshot);
                            errorObject.message = errorObject.message.replace("undefined", `\`\`\`${result}\`\`\``);
                            errorObject.message = errorObject.message.trim() + ", it is is \`\`\`undefined\`\`\`.";
                            let str2 = "elements[i]";
                            let match = str2.match(/\[(.*?)\](?=[^\[]*$)/);

                            if (match) {
                                let x = match[1]; // This captures the content between the brackets
                                errorObject.message = errorObject.message + ` Try using \`\`\`${x}\`\`\` directly instead.`;
                            }


                        }

                    }

                }

            }

        }
    }
}
