import $ from 'jquery';

export class ShareBox {
  selectedEffect = "fold";
  hideTimeout = 5000;
  slideAnimationDuration = 500;

  constructor(firebaseManager, eventAggregator) {
    this.firebaseManager = firebaseManager;
    this.eventAggregator = eventAggregator;
  }

  attached() {
    this.shareURL = 'https://seecode.run/#:' + this.firebaseManager.pastebinId;
    let copyTarget = document.getElementById("copyTarget");
    copyTarget.value = this.shareURL;

    let self = this;
    let toggleShareBoxTimeoutCallback = function toggleShareBoxTimeoutCallback() {
      $("#shareBox").toggle("slide", {direction: "right"}, self.slideAnimationDuration);
      $("#shareButton span").removeClass("navigation-bar-active-item");
      $("#shareButton label").removeClass("navigation-bar-active-item");
    };

    $('#shareBox').hide();
    $('#shareButton').click(function toggleShareBox() {
      if ($("#shareBox").is(":visible")) {
        $("#shareButton span").removeClass("navigation-bar-active-item");
        $("#shareButton label").removeClass("navigation-bar-active-item");
      } else {
        self.eventAggregator.publish("shareBoxShown");
        $("#shareButton span").addClass("navigation-bar-active-item");
        $("#shareButton label").addClass("navigation-bar-active-item");
      }
      if (!$("#shareBox").is(":animated")) {
        $("#shareBox").toggle("slide", {direction: "right"}, self.slideAnimationDuration);
      }
    });

    self.eventAggregator.subscribe("historyBoxShown", ()=> {
      if ($("#shareBox").is(":visible")) {
        $("#shareButton span").removeClass("navigation-bar-active-item");
        $("#shareButton label").removeClass("navigation-bar-active-item");
        $("#shareBox").toggle();
      }
    });

    $('#shareListItem').mouseenter(function shareListItemMouseEnter() {
      clearTimeout(self.toggleShareBoxTimeout);
    }).mouseleave(function shareListItemMouseLeave() {
      if ($("#shareBox").is(":visible")) {
        self.toggleShareBoxTimeout = setTimeout(toggleShareBoxTimeoutCallback, self.hideTimeout);
      }
    });

    let $copyButton = $("#copyButton");

    $copyButton.click(function copyButtonClick() {
      let copyTarget = document.getElementById("copyTarget");
      self.copyToClipboard(copyTarget);
    });

    let $goToShareButton = $("#goToShareButton");
    $goToShareButton.click(function goToSharedPastebin() {
      window.open(self.shareURL, '_blank');
    });
  }

  copyToClipboard(elem) {
    let target = undefined;
    let targetId = "_hiddenCopyText_";
    let isInput = elem.tagName === "INPUT" || elem.tagName === "TEXTAREA";
    let origSelectionStart, origSelectionEnd;
    if (isInput) {
      target = elem;
      origSelectionStart = elem.selectionStart;
      origSelectionEnd = elem.selectionEnd;
    }
    else {
      target = document.getElementById(targetId);
      if (!target) {
        target = document.createElement("textarea");
        target.style.position = "absolute";
        target.style.left = "-9999px";
        target.style.top = "0";
        target.id = targetId;
        document.body.appendChild(target);
      }
      target.textContent = elem.textContent;
    }
    let currentFocus = document.activeElement;
    target.focus();
    target.setSelectionRange(0, target.value.length);

    let succeed;
    try {
      succeed = document.execCommand("copy");
    }
    catch (e) {
      succeed = false;
    }

    if (currentFocus && typeof currentFocus.focus === "function") {
      currentFocus.focus();
    }

    if (isInput) {

      elem.setSelectionRange(origSelectionStart, origSelectionEnd);
    }
    else {

      target.textContent = "";
    }
    return succeed;
  }
}
