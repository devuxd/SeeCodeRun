/* global ace */
/* global $ */
import '../ace/theme/theme-chrome';
import '../ace/mode/mode-javascript';
import '../ace/mode/mode-html';
import '../ace/mode/mode-css';

export class AceUtils{

    parseRangeString(range){
        try{
            return `${range.start.row}-${range.start.column}-${range.end.row}-${range.end.column}`;
        }catch(e){
            return "parse-range-string-error";
        }
    }

    removeAllGutterDecorations(editor, className){
        let editorSession = editor.getSession();
        let lastRow = this.getLayout(editor).lastRow;
        for(let row = 0; row < lastRow; row++){
            editorSession.removeGutterDecoration(row, className);
            editorSession.addGutterDecoration(row, "");
        }
    }

    configureEditor(editor, theme = 'ace/theme/chrome'){
        editor.setTheme(theme);
        editor.setShowFoldWidgets(false);
        editor.setShowPrintMargin(false);
        editor.setAutoScrollEditorIntoView(true);
        editor.$blockScrolling = Infinity;

        editor.setDisplayIndentGuides(true);

        ace.require("ace/ext/language_tools");
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true
        });

        ace.require("ace/ext/spellcheck");
        editor.setOption("spellcheck", true);
    }

    configureSession(session, mode = 'ace/mode/javascript') {
        session.setUseWrapMode(true);
        session.setFoldStyle("manual");
        session.setOption("useWorker", true);
        session.setMode(mode);
        let whitespace = ace.require("ace/ext/whitespace");
        whitespace.detectIndentation(session);
    }

    getAvailableMarkers(){
        return {
            defaultMarker: "default-marker",
            expressionMarker: "expression-marker",
            yellowMarker: "yellow-marker",
            redMarker: "red-marker",
            seecoderunBlueMarker: "seecoderun-blue-marker",
            errorMarker: "error-marker",
            logMarker: "log-marker",
            functionMarker: "function-marker",
            blockMarker: "block-marker"
        };
    }
    makeAceMarkerManager(aceEditor){
        return {
            aceEditor: aceEditor,
            markers: [],
            markerRenderer: this.getAvailableMarkers().defaultMarker,
            markerType: "text",
            inFront: false
        };
    }

    updateAceMarkers(aceMarkerManager, elementsWithRangeProperty){
        var Range = ace.require("ace/range").Range;
        let ranges = [];
        for(let key in elementsWithRangeProperty){

            if(elementsWithRangeProperty.hasOwnProperty(key)){

                let element = elementsWithRangeProperty[key];

                if (element.hasOwnProperty("range")){
                            let elementRange = element.range;
                            let range = new Range(  elementRange.start.row,
                                                    elementRange.start.column,
                                                    elementRange.end.row,
                                                    elementRange.end.column
                                        );
                            ranges.push(range);
                }
            }
        }

        let editSession = aceMarkerManager.aceEditor.getSession();

        if(aceMarkerManager.markers){
            let oldmarkers = aceMarkerManager.markers;
            for(let i in oldmarkers){
                let marker = oldmarkers[i];
                editSession.removeMarker(marker);
            }
        }

        let newMarkers = [];
        let markerRenderer = aceMarkerManager.markerRenderer, markerType = aceMarkerManager.markerType, inFront = aceMarkerManager.inFront;
        for(let i in ranges){
            let range = ranges[i];
            let marker = editSession.addMarker(range, markerRenderer, markerType, inFront);
            newMarkers.push(marker);
        }
        aceMarkerManager.markers = newMarkers;
    }

    subscribeToGutterEvents(
        editor, tooltip, gutterDecorationClassName, dataModel,
        updateTooltip = this.updateTooltip, tooltipSlideDelay = 100, tooltipShowDelay = 100, tooltipHideDelay =2000,
        aceGutterCellSelector = ".ace_gutter-cell"
    ){
     	let self = this;
     	self.gutterTooltipHideTimeout = null;
     	self.previousRow = null;
     	self.firstLoad = true;
     	self.gutterCellLeftPadding = parseFloat($(aceGutterCellSelector).css("padding-left"), 10);
     	self.gutterCellRightPadding = parseFloat($(aceGutterCellSelector).css("padding-right"), 10);

        let setTooltipMouseMove =	function setTooltipMouseMove(target, row, pixelPosition, content){
            $(target).mouseenter( function onMouseEnterGutterCell(){
		            clearTimeout(self.gutterTooltipHideTimeout);
		               self.previousRow = row;
            	  	   updateTooltip(tooltip, pixelPosition, content, row, editor.renderer.lineHeight, tooltipSlideDelay, tooltipShowDelay, tooltipHideDelay);
		        } ).mouseleave( function onMouseLeaveGutterCell(){
                    clearTimeout(self.gutterTooltipHideTimeout);
    			    self.gutterTooltipHideTimeout =
    			    setTimeout( function gutterTooltipHideTimeout(){
    			        self.previousRow = null;
    			        updateTooltip(tooltip, pixelPosition, "", row, editor.renderer.lineHeight, tooltipSlideDelay, tooltipShowDelay, tooltipHideDelay);
    			    }, tooltipHideDelay);
    			    $(target).off("mouseenter mouseleave");
            } );
            $(target).mouseenter();
        };
     	editor.on("guttermousemove", function(e){
    	  	let target = e.domEvent.target;

    		if(!dataModel){
			    return;
			}

			if(!dataModel.rows){
			    return;
			}

    		if (target.className.indexOf(gutterDecorationClassName) == -1){
    			return;
    		}

    		if (e.clientX > target.parentElement.getBoundingClientRect().right - self.gutterCellRightPadding){
    			return;
    		}

    		if (e.clientX < target.parentElement.getBoundingClientRect().left + self.gutterCellLeftPadding){
    			return;
    		}

    		let row = e.getDocumentPosition().row;
    		let content = "";
    		if(dataModel.rows.hasOwnProperty(row)){
    		        content = dataModel.rows[row];
                    let pixelPosition = {};
                    let boundingRect = target.getBoundingClientRect();
    			    pixelPosition.pageY = boundingRect.top - editor.renderer.lineHeight;
    				pixelPosition.pageX = boundingRect.left;

                    if(row !== self.previousRow){
                        setTooltipMouseMove(target, row,  pixelPosition, content);
                    }
    		}
    		e.stop();
    	});
    }

    publishExpressionHoverEvents(editor, eventAggregator, mousePositionHandler){

        if(!editor){
			    throw "An Ace editor is required";
		}

		if(!eventAggregator){
			    throw "An event aggregator (or an object with a publish('Event_Name', data_structure ) method) is required";
		}

		if(!mousePositionHandler){
			    throw "A mouse position handler object  with a getExpressionAtPosition(position) method (e.g. a Trace Helper) is required";
		}

     	editor.on("mousemove", function (e){
    		let position = e.getDocumentPosition();
    		let isTextMatch = undefined;

    		if(position){
    		    isTextMatch = editor.getSession().getWordRange(position);
    		}

            //editor.isFocused()
    		if(isTextMatch){
    			let match = mousePositionHandler.getExpressionAtPosition(position);
                eventAggregator.publish("expressionHovered", match);
    		}else{
    		     eventAggregator.publish("expressionHovered", undefined);
    		}

		});

    }

    subscribeToExpressionHoverEvents(editor, eventAggregator, renderer){
        if(!editor){
			    throw "An Ace editor is required";
		}

		if(!eventAggregator){
			    throw "An event aggregator (or an object with a subscribe('Event_Name', callback_function ) method) is required";
		}

		if(!renderer){
			    throw "A renderer (or an object with an onExpressionHovered(match, pixelPosition ) method) is required";
		}

        eventAggregator.subscribe("expressionHovered", match =>{
    		if(match){
                let pixelPosition = this.calculateRangeCoordinates(editor, match.range);
    			renderer.onExpressionHovered(match, pixelPosition);
    		}else{
    		    renderer.onExpressionHovered();
    		}
        });

    }

    calculateRangeCoordinates(editor, range){
        let midColumn = range.start.column;
        if(range.start.row === range.end.row){
                midColumn = Math.ceil(( midColumn + range.end.column)/2);
        }
        let midColumnPixelPosition = editor.renderer.textToScreenCoordinates({row: range.end.row, column: midColumn});

        let bottomRightPosition  = {row: range.end.row, column: range.end.column};
        let pixelPosition = editor.renderer.textToScreenCoordinates(bottomRightPosition);
        pixelPosition.pageX = midColumnPixelPosition.pageX < pixelPosition.pageX? midColumnPixelPosition.pageX : pixelPosition.pageX;
		pixelPosition.pageY += editor.renderer.lineHeight ;
		return pixelPosition;
    }

    updateTooltip(div, position, content){
            if(!div){
                return;
            }

			if(position){
		        div.style.left = position.pageX + 'px';
			    div.style.top = position.pageY + 'px';
			}

			if(content){
				div.style.display = "block";
				div.innerHTML = content;
			}else{
				div.style.display = "none";
				div.innerHTML = "";
			}
	}

    updateGutterDecorations(editor, previousRows, rows, gutterDecorationClassName){
        this.removeGutterDecorations(editor, previousRows, gutterDecorationClassName);
        this.addGutterDecorations(editor, rows, gutterDecorationClassName);
	}

	addGutterDecorations(editor, rows, gutterDecorationClassName){
        for (let row in rows) {
            if(rows.hasOwnProperty(row)){
                 editor.getSession().addGutterDecoration(row, gutterDecorationClassName);
            }
        }
	}

	removeGutterDecorations(editor, rows, gutterDecorationClassName){
        for(let row in rows){
            if(rows.hasOwnProperty(row)){
             editor.getSession().removeGutterDecoration(row, gutterDecorationClassName);
            }
        }
	}


    getDefaultGutterRenderer(){
        return {
            getWidth: function(session, lastLineNumber, config) {
                return lastLineNumber.toString().length * config.characterWidth;
            },
            getText: function(session, row) {
                return row + 1;
            }
        };
    }

    setTraceGutterRenderer(editor, traceGutterData){

        let session = editor.getSession();
        let traceGutterRenderer =  {
            getWidth: function(session, lastLineNumber, config) {
                let format = "";
                if(traceGutterData.maxCount > 0){
                    format = "[/]  ";
                }

                return (format.length + traceGutterData.maxCount.toString().length*2 + lastLineNumber.toString().length )* config.characterWidth;
            },
            getText: function(session, row) {
                if(traceGutterData.rows.hasOwnProperty(row)){
                    let count = traceGutterData.rows[row].count;
                    if(count == null){
                        count = "n.a.";
                    }
                    let branch = traceGutterData.rows[row].branch;
                    if(branch == null){
                        branch = count;
                    }
                    return "["+branch+"/"+ count +"] "+ (row + 1);
                }else{
                    return row + 1;
                }
            }
        };
        session.gutterRenderer = traceGutterRenderer;
    }



    getLayout(editor){
        let session = editor.getSession();
        let config = editor.renderer.layerConfig;
        let lineHeight = editor.renderer.lineHeight + "px";
        let firstLineNumber = session.$firstLineNumber;
        let firstRow = config.firstRow;
        let lastRow = Math.min(config.lastRow + config.gutterOffset,  // needed to compensate for hor scollbar
            session.getLength() - 1);

        let gutterLayout = {
            lineHeight: lineHeight,
            firstLineNumber: firstLineNumber,
            firstRow: firstRow,
            lastRow: lastRow,
            getRowHeight: function(row){
                return session.getRowLength(row) * config.lineHeight + "px";
            },
            layerConfig: config,
            scrollMargin: editor.renderer.scrollMargin,
            $size: editor.renderer.$size

        };
        return gutterLayout;
    }

    customUpdateGutter(editor, traceGutterRenderer) {
        let dom = document;
        let gutter = editor.renderer.$gutterLayer;
        let config = editor.renderer.layerConfig;
        let session = editor.getSession();

        if(traceGutterRenderer){
         session.gutterRenderer = traceGutterRenderer;
        }

        let firstRow = config.firstRow;
        var lastRow = Math.min(config.lastRow + config.gutterOffset,  // needed to compensate for hor scollbar
            session.getLength() - 1);
        var fold = session.getNextFoldLine(firstRow);
        var foldStart = fold ? fold.start.row : Infinity;
        var foldWidgets = gutter.$showFoldWidgets && session.foldWidgets;
        var breakpoints = session.$breakpoints;
        var decorations = session.$decorations;
        var firstLineNumber = session.$firstLineNumber;
        var lastLineNumber = 0;

        var gutterRenderer = session.gutterRenderer || gutter.$renderer;

        var cell = null;
        var index = -1;
        var row = firstRow;
        while (true) {
            if (row > foldStart) {
                row = fold.end.row + 1;
                fold = session.getNextFoldLine(row, fold);
                foldStart = fold ? fold.start.row : Infinity;
            }
            if (row > lastRow) {
                while (gutter.$cells.length > index + 1) {
                    cell = gutter.$cells.pop();
                    gutter.element.removeChild(cell.element);
                }
                break;
            }

            cell = gutter.$cells[++index];
            if (!cell) {
                cell = {element: null, textNode: null, foldWidget: null};
                cell.element = dom.createElement("div");
                cell.textNode = document.createTextNode('');
                cell.element.appendChild(cell.textNode);
                gutter.element.appendChild(cell.element);
                gutter.$cells[index] = cell;
            }

            var className = "ace_gutter-cell ";
            if (breakpoints[row])
                className += breakpoints[row];
            if (decorations[row])
                className += decorations[row];
            if (gutter.$annotations[row])
                className += gutter.$annotations[row].className;
            if (cell.element.className != className)
                cell.element.className = className;

            var height = session.getRowLength(row) * config.lineHeight + "px";
            if (height != cell.element.style.height)
                cell.element.style.height = height;

            if (foldWidgets) {
                var c = foldWidgets[row];
                // check if cached value is invalidated and we need to recompute
                if (c == null)
                    c = foldWidgets[row] = session.getFoldWidget(row);
            }

            if (c) {
                if (!cell.foldWidget) {
                    cell.foldWidget = dom.createElement("span");
                    cell.element.appendChild(cell.foldWidget);
                }
                className = "ace_fold-widget ace_" + c;
                if (c == "start" && row == foldStart && row < fold.end.row)
                    className += " ace_closed";
                else
                    className += " ace_open";
                if (cell.foldWidget.className != className)
                    cell.foldWidget.className = className;

                height = config.lineHeight + "px";
                if (cell.foldWidget.style.height != height)
                    cell.foldWidget.style.height = height;
            } else {
                if (cell.foldWidget) {
                    cell.element.removeChild(cell.foldWidget);
                    cell.foldWidget = null;
                }
            }

            var text = lastLineNumber = gutterRenderer
                ? gutterRenderer.getText(session, row)
                : row + firstLineNumber;
            if (text != cell.textNode.data)
                cell.textNode.data = text;

            row++;
        }
         gutter.element.style.height = config.minHeight + "px";

        if (gutter.$fixedWidth || session.$useWrapMode)
            lastLineNumber = session.getLength() + firstLineNumber;

        var gutterWidth = gutterRenderer
            ? gutterRenderer.getWidth(session, lastLineNumber, config)
            : lastLineNumber.toString().length * config.characterWidth;

        var padding = gutter.$padding || gutter.$computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== gutter.gutterWidth && !isNaN(gutterWidth)) {
            gutter.gutterWidth = gutterWidth;
            gutter.element.style.width = Math.ceil(gutter.gutterWidth) + "px";
            gutter._emit("changeGutterWidth", gutterWidth);
        }
    }

    getTraceAnnotations(trace){
        var i, stackTrace, entry, text, row;
		var annotations = [];
        for (i = 0; i < trace.length; i += 1) {
            entry = stackTrace[i];
            text = entry.text;
			row = entry.range.start.row;

			annotations.push({ type : "info", row: row, column: 0, raw: "y is called x times", text: `${text}  is called  ${this.count(entry.count, 'time', 'times')}`});

        }
        return annotations;
    }

    getCompactJsCode(jsCode){
        let codeWithoutComments = jsCode.replace(/\/\*.*\*\/|\/\/.*[\n\r]/g, "");
        let codeTrimmed = codeWithoutComments.replace(/^[\s\xA0]+|[\s\xA0]+$/, "");
        let editorCompactedText = codeTrimmed.replace(/(["'`]([^"'`]*)["'`])?[\s\xA0]+/g, "$1 ");
        return editorCompactedText;
    }

    count(value, singular, plural) {
        return (value === 1) ? (`${value} ${singular}`) : (`${value} ${plural}`);
    }

    bindAceEvents(editorDivId, editor, ea){
        let aceEvents = this.aceEvents;
        for(let component in aceEvents.components){
            let componentEvents = aceEvents[component];
            for(let i in componentEvents){
                let event = componentEvents[i];
                editor[component].on(event, data =>{
                    ea.publish(event, data);
                });

            }
        }
    }
    // Events as Ace 2.3.1
    aceEvents = {
        editor: [

        ],
        components: {
            session: [],
            renderer: [
                "beforeRender",
                "changeCharacterSize",
                "beforeRender",
                "afterRender",
                "autosize",
                "scrollbarVisibilityChanged"
            ]
        }
    };
}