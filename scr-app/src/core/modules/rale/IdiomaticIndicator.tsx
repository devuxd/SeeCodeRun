import React, {useCallback, useEffect, useState, useMemo} from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import {useArtifactContext} from "./ArtifactContext";
import {
    fromShapesToShapes,
    InteractionType,
    useIdiomaticContext,
    IdiomaticIndicator as IdiomaticIndicatorShape,
    IdiomaticArtifact as IdiomaticArtifactShape
} from "./IdiomaticContext";


export default function IdiomaticIndicator({idiomaticIndicatorShape}) {
    const {interactionType} = idiomaticIndicatorShape;
    const {idiomaticArtifacts} = useIdiomaticContext();
    const activeArtifacts: IdiomaticArtifactShape[] = useMemo(() => {
        return fromShapesToShapes<IdiomaticIndicatorShape, IdiomaticArtifactShape>([idiomaticIndicatorShape], idiomaticArtifacts)[idiomaticIndicatorShape.id];
    }, [idiomaticIndicatorShape, idiomaticArtifacts]);
    const {searchState} = useArtifactContext();
    const {handleChangePartialSearchValue} = searchState;
    const [currentArtifactI, setCurrentArtifactId] = useState(0);
    const searchStateUpdate = useCallback(
        () => {
            if (interactionType !== InteractionType.Simulation) {
                return;
            }
            const stringObj = activeArtifacts[currentArtifactI].artifactCommand;
            const searchStateUpdate = JSON.parse(stringObj);
            handleChangePartialSearchValue(searchStateUpdate);
        },
        [currentArtifactI, activeArtifacts, handleChangePartialSearchValue]
    );

    useEffect(() => {
        if (currentArtifactI !== 0) {
            return;
        }
        searchStateUpdate();

    }, [currentArtifactI, searchStateUpdate]);

    return (
        <Timeline>
            {activeArtifacts.map(({
                                      id,
                                      titleMarkdownString,
                                      contentMarkdownString,
                                      artifactType,
                                      artifactCommand
                                  }, i) => (
                <TimelineItem key={id}>
                    <TimelineSeparator>
                        <TimelineDot/>
                        <TimelineConnector/>
                    </TimelineSeparator>
                    <TimelineContent>{titleMarkdownString}</TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    );
}
