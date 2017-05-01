/**
 * Created by DavidIgnacio on 4/18/2017.
 */
import {customElement} from 'aurelia-framework';
import {draggable} from 'jquery-ui';

@customElement('pastebin')
export class Searcher {
  searcherSelector = "#searcher";
  query = "";
  $currentMetagURL = null;
  currentURL = null;
  currentPastedText = null;
  currentCopiedText = null;
  sentPastedText = null;
  DEBUG_MODE = false;

  constructor(eventAggregator, firebaseManager) {
    this.eventAggregator = eventAggregator;
    this.firebaseManager = firebaseManager;
  }

  attached() {
    this.metagsURLsFirebase = this.firebaseManager.makeMetagsURLsFirebase();
    let self = this;
    let gcseCallback = function () {
      if (document.readyState == 'complete') {
        self.onGoogleLoad();
      } else {
        google.setOnLoadCallback(function () {
          self.onGoogleLoad();
        }, true);
      }
    };
    window.__gcse = {
      callback: gcseCallback
    };

    let cx = '001516196410189427601:kz8ylumip-q';
    let gcse = document.createElement('script');
    gcse.type = 'text/javascript';
    gcse.async = true;
    gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
    let s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(gcse, s);
  }

  onGoogleLoad() {
    let self = this;
    let $searcher = $(this.searcherSelector);
    $(this.searcherSelector + " input.gsc-search-button.gsc-search-button-v2").click(function click() {

      self.query = $(self.searcherSelector + " input.gsc-input");
      self.onGoogleSearch(self.query);
    });
    $(this.searcherSelector + " input.gsc-input").on('keyup', function (e) {
      self.query = $(self.searcherSelector + " input.gsc-input").val();
      if (e.keyCode == 13) {
        self.onGoogleSearch(self.query);
      }
    });

    $(".searcher span.gscb_a").click(function hideResultsContainer() {
        $searcher.height(38);
        $(".searcher .results").hide();
      }
    );

    if (self.DEBUG_MODE) {
      $searcher.css({top: 100, left: 300});
      $searcher.show();
      return;
    }
    $searcher.hide();
    $(".searcher .results").hide();
    self.eventAggregator.subscribe("autoCompleteHidden", payload => {
      clearTimeout(self.hideTimeout);
      if ($searcher.find(":hover").length > 0 || $searcher.find(":focus").length > 0) {
        self.hideTimeout = setTimeout(function () {
            self.eventAggregator.publish('autoCompleteHidden', null);
          }, 2500
        );
        return;
      }
      $searcher.hide();
    });

    // self.eventAggregator.subscribe("autoCompleteShown", payload =>{
    //   $searcher.css({top: payload.top, left: payload.left});
    //   $searcher.show();
    //   if(payload.takeFocus){
    //     $(self.searcherSelector+" input.gsc-input").focus();
    //   }
    // });
    //
    self.eventAggregator.subscribe("toggleSearcher", payload => {
      $searcher.css({top: payload.top, left: payload.left});

      if ($searcher.is(":visible")) {
        $searcher.hide();
      } else {
        $searcher.show();
        if (payload.takeFocus) {
          $(self.searcherSelector + " input.gsc-input").focus();
        }
      }

    });

    self.eventAggregator.subscribe("editorPaste", payload => {
      self.currentCopiedText = payload;
    });

    self.eventAggregator.subscribe("editorPaste", payload => {
      self.currentPastedText = payload.text;

      // Copy action happened outside of the pastebin editors' reach
      if (self.currentCopiedText !== self.currentPastedText) {
        // User went to a web page via clicking Searcher's search results and has not
        if (self.currentURL && self.currentPastedText !== sentPastedText) {
          console.log("Storing", self.currentURL, self.currentPastedText);
          self.sentPastedText = currentPastedText;
        }
      }
    });

    $searcher.draggable();
    $searcher.hover(
      function mouseenter() {
        clearTimeout(self.hideTimeout);
      },
      function mouseexit() {
        clearTimeout(self.hideTimeout);
        self.hideTimeout = setTimeout(function () {
            self.eventAggregator.publish('autoCompleteHidden', null);
          }, 2500
        );
      }
    );
  }

  onGoogleSearch() {
    let self = this;
    let $searcher = $(this.searcherSelector);
    $searcher.height(500);

    $(".searcher .results").show();

    setTimeout(function () {
      self.onGoogleResults(self.query);
    }, 1500);
  }

  onGoogleResults() {
    this.appendMetags();
    let $searcher = $(this.searcherSelector);
  }

  appendMetags() {
    let self = this;
    let metagURLKey = null;
    $("a.gs-title").each(function () {
        let context = this;
        let $element = $(this);
        let resultURL = $(this).attr('href');
        let urlQuery = self.metagsURLsFirebase.orderByChild('url');
        urlQuery.once("value", function (snapshot) {
            let urls = snapshot;
            if (urls.hasChildren()) {
              // console.log(urls.val());
              let found = false;
              urls.forEach(function (child) {
                if (child.val().url === resultURL) {
                  let metagURLKey = child.key();
                  self.appendMetagRank(context, $element, metagURLKey);
                  found = true;
                }

              });
              // .then(function(){
              //       if(found){
              //         return;
              //       }
              //       let userChoices = {favorited: false, pinned: false};
              //       let metagRanking = { votes: 0,  userChoices: userChoices};
              //       let pageURL = {url: resultURL, metagRanking: metagRanking};
              //       let metagURLKey = self.metagsURLsFirebase.push().set(pageURL).key;
              //
              //       self.appendMetagRank($element, metagURLKey);
              // });


            } else {
              let userChoices = {favorited: false, pinned: false};
              let metagRanking = {votes: 0, userChoices: userChoices};
              let pageURL = {url: resultURL, metagRanking: metagRanking};
              let metagURLKey = self.metagsURLsFirebase.push().set(pageURL).key;

              self.appendMetagRank($element, metagURLKey);
            }

          },
          function () {
            // let userChoices = {favorited: false, pinned: false};
            // let metagRanking = { votes: 0,  userChoices: userChoices};
            // let pageURL = {url: resultURL, metagRanking: metagRanking};
            // let metagURLKey = self.metagsURLsFirebase.push(pageURL).key;
            // self.appendMetagRank($element, metagURLKey);
            console.log("FB error");
          }
        );


      }
    );

    $("a.gs-title").hover(function hoverIn() {
      let $element = $(this);
      let elementURL = $(this).attr('href');
      $element.addClass("searcher-search-result-highlight");
      clearTimeout(this.timeOut);
      if (!self.$currentMetagURL) {
        self.$currentMetagURL = elementURL;
        $element.popover('show');
      } else {
        if (self.$currentMetagURL !== elementURL) {
          self.$currentMetagURL = elementURL;
          $(".metag-popover").hide();
          $element.popover('show');
        }
      }


    }, function hoverOut() {
      let $element = $(this);
      $element.removeClass("searcher-search-result-highlight");
      clearTimeout(this.timeOut);
      this.timeOut = setTimeout(function () {
        self.$currentMetagURL = null;
        $element.popover('hide');
      }, 2500);
    });

    // var popOverOptions = {trigger: "hover"};
    // $('[data-toggle="popover"]').popover(popOverOptions);

    $("a.gs-title").click(function googleResultTitleClick() {
      self.currentURL = $(this).attr('href');
      // User is now looking another link

      //todo user copied text should be reset too
      self.sentPastedText = null;
    });
  }


  appendMetagRank(context, $element, metagURLKey) {
    if (true) {
      return;
    }

    let self = this;
    let metagRankTemplate = `
    <div class="metag metagRank" id = "${metagURLKey}">
  <div class="rankingContainer">
         <label class="rankingLabel"></label>
  </div>
  
  <div class="voteContainer">
    <div>
      <div>
       <span class="voteUpContainer">
         <button class="voteButton vote-button btn btn-info fa fa-arrow-up faup">
         </button>
       </span>
     </div>
    <div class="voteCountContainer" >
      <label class="voteCountLabel"> </label>
    </div>  
    <div>
      <span class="voteDownContainer">
        <button class="voteButton vote-button btn btn-info fa fa-arrow-down">
        </button>
      </span>
    </div>
  </div>
 </div>
 
 <div class="userChoicesContainer">    
   <div class="favoriteToggleIcon iconChosenFalse">
     <i class="fa fa-star" ></i>
   </div>
   <div class="pinnedToggleIcon iconChosenFalse">
     <i class="fa fa-thumb-tack"></i>
   </div> 
 </div>
</div>
    `;
    let popoverTemplate = '<div class="popover metag-popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>'
    $element.attr({
      "data-toggle": "popover",
      "data-placement": "auto left",
      "data-content": metagRankTemplate
    });
    $element.popover({
      trigger: "manual",
      placement: "right",
      title: "1",
      // content: metagRankTemplate,
      container: "body",
      html: true,
      offset: "0 10px",
      template: popoverTemplate
    });
    $element.popover();
    $element.on('inserted.bs.popover', function () {
      $(`#${metagURLKey}`).hover(
        function hoverIn() {
          clearTimeout(context.timeOut);
        },
        function hoverOut() {
          clearTimeout(context.timeOut);
          context.timeOut = setTimeout(function () {
            $element.popover('hide');
          }, 2500);
        }
      );
      self.bindViewListenersToFirebaseMetagPublishers(metagURLKey);
      self.subscribeToFirebaseMetagChangesAndBindToView(metagURLKey);
    });

  }


  subscribeToFirebaseMetagChangesAndBindToView(metagURLKey) {
    let metagsURLFirebaseVote = this.firebaseManager.makeMetagsURLFirebaseVote(metagURLKey);

    metagsURLFirebaseVote.on("value", function (snapshot) {

      let urlData = snapshot.val();
      if (!urlData) return;
      let voteCount = urlData.metagRanking.votes;
      $(`#${metagURLKey} .voteCountLabel`).html(voteCount);

      if (urlData.metagRanking.userChoices.favorited) {
        $(`#${metagURLKey} .favoriteToggleIcon`).addClass('iconChosenTrue');
      } else {
        $(`#${metagURLKey} .favoriteToggleIcon`).removeClass('iconChosenTrue');
      }
      if (urlData.metagRanking.userChoices.pinned) {
        $(`#${metagURLKey} .pinnedToggleIcon`).addClass('iconChosenTrue');
      } else {
        $(`#${metagURLKey} .pinnedToggleIcon`).removeClass('iconChosenTrue');
      }
    });
  }

  bindViewListenersToFirebaseMetagPublishers(metagURLKey) {
    let self = this;
    //console.log("why", $(`#${metagURLKey} > .voteContainer > div > div > .voteUpContainer`));
    $(`#${metagURLKey} > .voteContainer > div > div > .voteUpContainer`).click(function () {
      $(".voteButton").prop("disabled", true);
      self.publishFirebaseURLChanges({metagURLKey: metagURLKey, isVoteAction: true, isVoteUp: true});
    });

    $(`#${metagURLKey} .voteDownContainer`).click(function () {
      $(".voteButton").prop("disabled", true);
      self.publishFirebaseURLChanges({metagURLKey: metagURLKey, isVoteAction: true, isVoteUp: false});
    });

    $(`#${metagURLKey} .favoriteToggleIcon`).click(function () {
      self.publishFirebaseURLChanges({metagURLKey: metagURLKey, isFavoritedAction: true});
    });

    $(`#${metagURLKey} .pinnedToggleIcon`).click(function () {
      self.publishFirebaseURLChanges({metagURLKey: metagURLKey, isPinnedAction: true});
    });

    $(`#${metagURLKey} .commentAction`).click(function () {
      if (!metagTemplate) {
        metagTemplate = $(`#${metagURLKey}`).html();
        metagTemplate =
          `<div class="metag metagRank" id="fardina1" >${metagTemplate}</div>`;

        // console.log(metagTemplate);
      }

      let $newMetagComment = $(`#${metagURLKey} > .commentsSection`).append(metagTemplate);
    });
  }

  publishFirebaseURLChanges(action) {
    let metagURLKey = action.metagURLKey;
    let metagsURLFirebaseVote = this.firebaseManager.makeMetagsURLFirebaseVote(metagURLKey);
    metagsURLFirebaseVote.once("value", function (snapshot) {
      let urlData = snapshot.val();
      if (!urlData) {
        return;
        // let userChoices = {favorited: false, pinned: false};
        // let metagRanking = { votes: 0,  userChoices: userChoices};
        // urlData = {url: resultURL, metagRanking: metagRanking};
      }
      if (action.isVoteAction) {
        let increment = action.isVoteUp ? 1 : -1;
        urlData.metagRanking.votes += increment;
      }

      if (action.isFavoritedAction) {
        urlData.metagRanking.userChoices.favorited = !urlData.metagRanking.userChoices.favorited;
      }

      if (action.isPinnedAction) {
        urlData.metagRanking.userChoices.pinned = !urlData.metagRanking.userChoices.pinned;
      }

      metagsURLFirebaseVote.update(urlData);
    });
  }

}
