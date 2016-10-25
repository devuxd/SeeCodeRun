/* global $*/
export class TraceSearch {
  traceSearchPanelBodySelector = "#traceSearchPanelBody";
  traceSearchPanelHeadingSelector = "#traceSearchPanelHeading";

  constructor(eventAggregator, traceModel, aceUtils) {
    this.eventAggregator = eventAggregator;
    this.traceModel = traceModel;
    this.aceUtils = aceUtils;
    this.options;
    this.searchFilterId = "functions";
    this.searchTermText = "";
    this.rows = [];
    this.filteredOptions = [];
    this.selectedExpressions = [];
    this.noResult = false;
    this.noSearchYet = true;
    this.suggestionMessage = '';
    this.test = '';
    this.searchBox = {
      aceMarkerManager: undefined,
      updateAceMarkers: this.aceUtils.updateAceMarkers,
      updateAceMarkersDelay: 500,
      searchFilters: this.traceModel.traceSearchfilters,
      traceHelper: undefined,
    };
    this.subscribe();
  }

  attached() {
    this.optionsBuilder();
  }

  publishTraceSearchChanged(searchTermText, searchFilterId) {
    this.eventAggregator.publish("searchBoxChanged", {
      searchTermText: searchTermText,
      searchFilterId: searchFilterId
    });
  }

  publishAceMarkersChanged(itemsWithRanges) {
    this.eventAggregator.publish("aceMarkersChanged", {
      items: itemsWithRanges
    });
  }

  adjustHeight($container) {
    let pendingHorizontalPixels = 15;
    $container.height($("#console-window").offset().top - $(this.traceSearchPanelHeadingSelector).offset().top - $(this.traceSearchPanelHeadingSelector).parent().height() - pendingHorizontalPixels);
  }

  subscribe() {
    let searchBox = this.searchBox;
    let self = this;
    this.eventAggregator.subscribe("panelHeadingsLoaded", panelHeadings => {
      $(this.traceSearchPanelBodySelector).on('show.bs.collapse', function (e) {
        if ($("#seePanelBody").is(":visible")) {
          $("#seePanelHeading").click();
        }
      });

      $(this.traceSearchPanelBodySelector).on('hidden.bs.collapse', function (e) {
        if (!$("#seePanelBody").is(":visible")) {
          $("#seePanelHeading").click();
        }
      });

      $(this.traceSearchPanelBodySelector).on('shown.bs.collapse', function (e) {
        self.adjustHeight($(this));
      });
    });
    this.eventAggregator.subscribe("rightSplitterResize", () => {
      this.adjustHeight($(this.traceSearchPanelBodySelector));
    });
    this.eventAggregator.subscribe("jsEditorReady", editor => {
      this.searchBox.aceMarkerManager = this.aceUtils.makeAceMarkerManager(editor);
    });


    this.eventAggregator.subscribe("traceChanged", payload => {
      searchBox.traceHelper = payload.data;
      if (searchBox.traceHelper.isValid()) {
        let variableValues = searchBox.traceHelper.getValues();
        let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.searchFilterId, this.searchTermText);
        this.updateTable(query);
      }
    });

    this.eventAggregator.subscribe("searchBoxChanged", payload => {
      this.searchTermText = payload.searchTermText;
      this.searchFilterId = payload.searchFilterId;
      if (searchBox.traceHelper) {
        let variableValues = searchBox.traceHelper.getValues();
        let query = searchBox.traceHelper.traceQueryManager.getQuery(variableValues, this.searchFilterId, this.searchTermText);
        this.updateTable(query);
      }
    });

    this.eventAggregator.subscribe("searchBoxStateRequest", () => {
      this.eventAggregator.publish("searchBoxStateResponse", {
        searchTermText: this.searchTermText,
        searchFilterId: this.searchFilterId
      });
    });

    let updateAceMarkersTimeout;
    let updateAceMarkersSetTimeout = window.setTimeout;
    let updateAceMarkersClearTimeout = window.clearTimeout;

    this.eventAggregator.subscribe("aceMarkersChanged", payload => {
      let items = payload.items;
      updateAceMarkersClearTimeout(updateAceMarkersTimeout);
      updateAceMarkersTimeout = updateAceMarkersSetTimeout(
        searchBox.updateAceMarkers(searchBox.aceMarkerManager, items),
        searchBox.updateAceMarkersDelay);
    });

  }

  optionsBuilder() {
    this.options = this.searchBox.searchFilters;
  }

  updateTable(query) {
    if (!$(this.traceSearchPanelBodySelector).is(":visible") && this.searchTermText) {
      $(this.traceSearchPanelHeadingSelector).click();
    }
    let searchFilterId = this.searchFilterId;
    let dataList = [];
    this.rows = query.where(function whereFilter(row) {
      if (row[searchFilterId]) {
        dataList.push(row[searchFilterId]);
      }
      return row.value !== undefined;
    }).items;

    this.filteredOptions = new Set(dataList);

    this.numberOfResult = this.rows.length;
    this.suggestionMessage = this.numberOfResult == 0 ?
      'There is no javascript code.Try to write some and then comeback here :)' :
      `Type any expression to see its value. Try ${this.rows[0].id} or ${this.rows[0].value}`;

    this.noSearchYet = this.searchTermText.replace(/^\s+|\s+$/g, '') == "";
    this.noResult = this.numberOfResult == 0 && !this.noSearchYet;
    this.errorMessage = `Oops, no results found for "${this.searchTermText}" with "${this.searchFilterId}" filter. Remember, the search term is case sensitive.`;
  }

  filterChanged() {
    this.publishTraceSearchChanged(this.searchTermText, this.searchFilterId);

  }

  doMouseOver(row) {
    if (this.selectedExpressions.indexOf(this.rows[row.$index]) == -1)
      this.selectedExpressions.push(this.rows[row.$index]);
    this.publishAceMarkersChanged(this.selectedExpressions);
  }

  doMouseOut(row) {
    if (!this.clickedRow) {
      this.publishAceMarkersChanged([]);
      return;
    }
    let indexFound2 = this.clickedRow.indexOf(this.rows[row.$index]);
    if (indexFound2 == -1) {
      let indexFound = this.selectedExpressions.indexOf(this.rows[row.$index]);
      this.selectedExpressions.splice(indexFound, 1);
    }
    this.publishAceMarkersChanged(this.selectedExpressions);
  }

  keyPressed() {
    this.publishTraceSearchChanged(this.searchTermText, this.searchFilterId);
  }

  // jumps to current line in the editor
  doOnClickJumpToCode(row) {
    let lineData = {lineNumber: this.rows[row.$index].range.start.row + 1};
    this.eventAggregator.publish("traceSearchGotoLine", lineData);
  }

  // highlights current line in the ditor
  doOnClickHighlight(row) {
    let indexFound = this.clickedRow.indexOf(this.rows[row.$index]);
    if (indexFound == -1) {
      this.clickedRow.push(this.rows[row.$index]);
    }
    else {
      this.clickedRow.splice(indexFound, 1);
    }
  }
}
