/* global ace */

export class AceUtils{
    constructor(){
    }
    
    makeAceMarkerManager(aceEditor){
        return {    
                aceEditor: aceEditor,
                markers: [],
                markerRenderer: "expression-range",
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
    
    subscribeToGutterEvents(editor, tooltip, gutterDecorationClassName, dataModel, updateTooltip = this.updateTooltip){
     	editor.on("guttermousemove", function(e){ 
    	    updateTooltip(tooltip, editor.renderer.textToScreenCoordinates(e.getDocumentPosition()));
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

    		if (!editor.isFocused()){ 
    			return;
    		}

    		if (e.clientX > target.parentElement.getBoundingClientRect().right - 13){ 
    			return; 
    		}
    		let row = e.getDocumentPosition().row;
    		let text = "";
    		
    		if(dataModel.rows.hasOwnProperty(row)){
                    text = dataModel.rows[row].text; 
    				let pixelPosition = editor.renderer.textToScreenCoordinates(e.getDocumentPosition());
    				pixelPosition.pageY += editor.renderer.lineHeight;
    				updateTooltip(tooltip, pixelPosition, text);
    		}
    		e.stop(); 
    		 
    	});
        
    }
    
    subscribeToCodeHoverEvents(editor, tooltip, dataModel, updateTooltip = this.updateTooltip){

     	editor.on("mousemove", function (e){
		let position = e.getDocumentPosition(), match;
		if(position){
		    updateTooltip(tooltip, editor.renderer.textToScreenCoordinates(position));
			if(!dataModel){
			    return;
			}
			
			if(!dataModel.ranges){
			    return;
			}
			
			if(!dataModel.positionMatcher){
    		    return;
    		}
    		
    		if(!dataModel.positionMatcher.getMatchAtPosition){
    		    return;
    		}
			
			if (!editor.isFocused()){ 
    			return;
    		}
    		
			match = dataModel.positionMatcher.getMatchAtPosition(dataModel.ranges, position);
			
			if(match){
    				let pixelPosition = editor.renderer.textToScreenCoordinates(match.range.start);
    				pixelPosition.pageY += editor.renderer.lineHeight;
    				updateTooltip(tooltip, pixelPosition, match.text +",  values"+ JSON.stringify(match.values));
    		}
		}
		});
        
    }
    
    updateTooltip(div, position, text){
			
			div.style.left = position.pageX + 'px';
			div.style.top = position.pageY + 'px';
			if(text){
				div.style.display = "block";
				div.innerHTML = text;
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
                    format = "[] ";
                }
                
                return (format.length + traceGutterData.maxCount.toString().length + lastLineNumber.toString().length )* config.characterWidth;
            },
            getText: function(session, row) {
                if(traceGutterData.rows.hasOwnProperty(row)){
                    let count = traceGutterData.rows[row].count; 
                    return "["+ count +"] "+ (row + 1);
                }else{
                    return row + 1;
                }
            }
        };
        session.gutterRenderer = traceGutterRenderer;
    }
    
    customUpdateGutter(editor, traceGutterRenderer) {
        let dom = document;
        let gutter = editor.renderer.$gutterLayer;
        session.gutterRenderer = traceGutterRenderer;
        let config = editor.renderer.layerConfig;
        let session = editor.getSession();
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
  
    count(value, singular, plural) {
        return (value === 1) ? (`${value} ${singular}`) : (`${value} ${plural}`);
    }
    
}