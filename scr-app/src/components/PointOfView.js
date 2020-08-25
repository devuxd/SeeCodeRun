import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Slider from '@material-ui/core/Slider';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import IconButton from '@material-ui/core/IconButton';
import MinimizeIcon from '@material-ui/icons/Minimize';
import MaximizeIcon from '@material-ui/icons/Maximize';
import {defaultSimpleMonacoOptions} from "../utils/monacoUtils";


const createSimpleEditor = (reactRef, monaco, text, editorModelLanguage, editorOptions) => {
    const editor = monaco.editor.create(
        reactRef,
        {
            ...editorOptions,
            model: monaco.editor.createModel(text, editorModelLanguage)
        }
    );

    const updateText = (text) => {
        editor.setValue(text);
    };
    return {editor, updateText};
};

const createDiffEditor = (reactRef, monaco, originalText, modifiedText, editorModelLanguage, editorOptions, showMonacoIds) => {
    if(!showMonacoIds){
        originalText = originalText.replace(/'b;[0-9]+'/g, "'*id*'");
        modifiedText = modifiedText.replace(/'b;[0-9]+'/g, "'*id*'");
    }
    const originalModel = monaco.editor.createModel(originalText, editorModelLanguage);
    const modifiedModel = monaco.editor.createModel(modifiedText, editorModelLanguage);

    const diffEditor = monaco.editor.createDiffEditor(reactRef, editorOptions);
    diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel
    });

    const diffNavigator = monaco.editor.createDiffNavigator(diffEditor, {
        followsCaret: true, // resets the navigator state when the user selects something in the editor
        ignoreCharChanges: true // jump from line to line
    });

    const updateOriginalText = (originalText) => {
        originalModel.setValue(originalText);
    };
    const updateModifiedText = (modifiedText) => {
        originalModel.setValue(modifiedText);
    };
    return {diffEditor, diffNavigator, updateOriginalText, updateModifiedText};
};

class ViewEditor extends React.Component {
    constructor(props) {
        super(props);
        this.editorDiv = React.createRef();
    }

    render() {
        return <div ref={this.editorDiv} style={{height: '100%', width: '100%'}}/>;
    }

    componentDidMount() {
        const {diff, monaco, originalText, modifiedText, editorModelLanguage, editorOptions, readOnly} = this.props;
        const options = {...editorOptions, readOnly};
        if (diff) {
            const {diffEditor, diffNavigator, updateOriginalText, updateModifiedText} = createDiffEditor(
                this.editorDiv.current, monaco, originalText, modifiedText, editorModelLanguage, options
            );
            this.editor = diffEditor;
            this.diffNavigator = diffNavigator;
            this.updateOriginalText = updateOriginalText;
            this.updateModifiedText = updateModifiedText;
        } else {
            const {editor, updateText} = createSimpleEditor(
                this.editorDiv.current, monaco, originalText, editorModelLanguage, options
            );
            this.editor = editor;
            this.updateOriginalText = updateText;
        }

    }

    componentWillUnmount() {
        this.editor && this.editor.dispose();
    }
}

ViewEditor.propTypes = {
    diff: PropTypes.bool,
    readOnly: PropTypes.bool,
    monaco: PropTypes.object.isRequired,
    originalText: PropTypes.string,
    modifiedText: PropTypes.string,
    editorOptions: PropTypes.object,
    editorModelLanguage: PropTypes.string,
}
ViewEditor.defaultProps = {
    diff: false,
    readOnly: true,
    editorModelLanguage: 'text/plain',
    editorOptions: {
        ...defaultSimpleMonacoOptions,
        enableSplitViewResizing: true,
        renderSideBySide: true,
    }
};

const useStylesTransitionList = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper,
    },
    gridList: {
        width: '100%',
        flexWrap: 'nowrap',
        // Promote the list into his own layer on Chrome. This cost memory but helps keeping high FPS.
        transform: 'translateZ(0)',
    },
    title: {
        height: 40,
    },
    icon: {
        color: theme.palette.primary.light,
    },
    titleBar: {
        zIndex: theme.zIndex.drawer,
    },
}));

const TransitionList = (props) => {
    const classes = useStylesTransitionList();
    const {windowSize, monaco, tileRefs, selectTile, tilesVisibility, handleTilesVisibilityChange} = props;
    return (
        <div className={classes.root}>
            <GridList className={classes.gridList} cols={windowSize} spacing={16}>
                {props.tiles.map((tile, i) =>
                    (tilesVisibility[i] && tilesVisibility[i].hidden ?
                            <GridListTile ref={tileRefs.current[i]} key={tile.id}
                                          style={{position: 'relative', width: 48}}>
                                <IconButton size={'small'}
                                            aria-label={`show '${tile.expression.text}' transition`}
                                            onClick={() => handleTilesVisibilityChange(i, {hidden: false})}
                                            style={{position: 'absolute', bottom: 0}}
                                >
                                    <MaximizeIcon className={classes.icon}/>
                                </IconButton>
                            </GridListTile>
                            :
                            <GridListTile ref={tileRefs.current[i]} key={tile.id}
                                          onMouseOver={(ev) => selectTile(ev, i + 1)}>
                                <ViewEditor monaco={monaco}
                                            originalText={tile.dataTransition.from}
                                            modifiedText={tile.dataTransition.to}
                                            editorModelLanguage={tile.dataTransition.language}
                                            diff
                                />
                                <GridListTileBar
                                    title={<ViewEditor
                                        monaco={monaco}
                                        originalText={tile.expression.text}
                                        editorModelLanguage={tile.expression.language}
                                        editorOptions={defaultSimpleMonacoOptions}

                                    />}
                                    classes={{
                                        root: classes.titleBar,
                                        title: classes.title,
                                    }}
                                    actionIcon={
                                        <IconButton aria-label={`hide '${tile.expression.text}' transition`}
                                                    onClick={() => handleTilesVisibilityChange(i, {hidden: true})}>
                                            <MinimizeIcon className={classes.icon}/>
                                        </IconButton>
                                    }
                                />
                            </GridListTile>
                    )
                )}
            </GridList>
        </div>
    );
}
TransitionList.propTypes = {
    tileData: PropTypes.object,
}


const useStyles = makeStyles({
    root: {
        width: '95%',
    },
});

const valueTextTransitionSlider = (value) => {
    return `${value}`;
}

const TransitionSlider = (props) => {
    const classes = useStyles();
    const {min, max, value, onChangeCommitted} = props;

    return (
        <div className={classes.root}>
            <Slider
                value={value}
                getAriaValueText={valueTextTransitionSlider}
                aria-labelledby="point-of-view-slider"
                step={1}
                marks
                min={min}
                max={max}
                valueLabelDisplay="auto"
                onChangeCommitted={onChangeCommitted}
            />
        </div>
    );
};

TransitionSlider.propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    value: PropTypes.number,
};
TransitionSlider.defaultProps = {
    min: 1,
    max: 10,
    value: 10,
};


const PointOfView = (props) => {
    const {monaco, tiles} = props;
    const tilesLength = tiles.length;
    const tileRefs = React.useRef([]);
    const [selectedTile, setSelectedTile] = useState(tilesLength);
    const [tilesVisibility, handleTilesVisibilityChange] = useState({});
    if (tileRefs.current.length !== tilesLength) {
        tileRefs.current = Array(tilesLength).fill().map((_, i) => tileRefs.current[i] || React.createRef());
    }

    const selectTile = (ev, i) => {
        setSelectedTile(i);
        selectedTile !== i && tileRefs.current && tileRefs.current[i - 1] &&
        tileRefs.current[i - 1].current.scrollIntoView({behavior: "smooth", block: "start", inline: "center"});
    };
    return <Container width={"md"}>
        <TransitionList tiles={tiles} monaco={monaco}
                        tileRefs={tileRefs}
                        selectTile={selectTile}
                        tilesVisibility={tilesVisibility}
                        handleTilesVisibilityChange={(i, change) => {
                            const newState = {...tilesVisibility};
                            newState[i] = {...change};
                            handleTilesVisibilityChange(newState);
                        }}
        />
        <TransitionSlider value={selectedTile} max={tiles.length} onChangeCommitted={selectTile}/>
    </Container>;

}

export default PointOfView;

PointOfView.propTypes = {
    monaco: PropTypes.object.isRequired,
    windowSize: PropTypes.number,
    tiles: PropTypes.array.isRequired,
};
PointOfView.defaultProps = {
    monaco: global.monaco,
    windowSize: 3,
    tiles: [
        {
            id: 1,
            expression: {
                text: 'let x; x++;',
                language: 'typescript',
            },
            dataTransition: {
                from: '1',
                to: '2',
                language: 'typescript',
            }
        },
        {
            id: 2,
            expression: {
                text: 'x.a.b= val',
                language: 'typescript',
            },
            dataTransition: {
                from: "{a:{b:'off'}}",
                to: "{a:{b:'on'}}",
                language: 'json',
            }
        },
        {
            id: 3,
            expression: {
                text: 'x = y;\nkmeokvmorkemvrokmvormvokrvmokrmvkrovkmorkvmrekovkoemvokevkekovmevmkevekvoemvoevm',
                language: 'typescript',
            },
            dataTransition: {
                from: "{z:1, a:{b1:'off', b2:'off'}}",
                to: "{z:2, a:{b1:'off', b2:null}}",
                language: 'json',
            }
        },
    ],

};

export const createPointOfViewTile =
    (id, expressionText, expressionLanguage = 'typescript', fromData, toData, dataLanguage = 'json') => ({
        id,
        expression: {
            text: expressionText,
            language: expressionLanguage,
        },
        dataTransition: {
            from: fromData,
            to: toData,
            language: dataLanguage,
        }
    });