System.register([], function (_export) {
  "use strict";

  "format global";
  return {
    setters: [],
    execute: function () {
      ace.define("ace/theme/chrome", ["require", "exports", "module", "ace/lib/dom"], function (require, exports, module) {

        exports.isDark = false;
        exports.cssClass = "ace-chrome";
        exports.cssText = ".ace-chrome .ace_gutter {\
background: #ebebeb;\
color: #333;\
overflow : hidden;\
}\
.ace-chrome .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-chrome {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-chrome .ace_cursor {\
color: black;\
}\
.ace-chrome .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-chrome .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-chrome .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-chrome .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-chrome .ace_invalid {\
background-color: rgb(153, 0, 0);\
color: white;\
}\
.ace-chrome .ace_fold {\
}\
.ace-chrome .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-chrome .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-chrome .ace_support.ace_type,\
.ace-chrome .ace_support.ace_class\
.ace-chrome .ace_support.ace_other {\
color: rgb(109, 121, 222);\
}\
.ace-chrome .ace_variable.ace_parameter {\
font-style:italic;\
color:#FD971F;\
}\
.ace-chrome .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-chrome .ace_comment {\
color: #236e24;\
}\
.ace-chrome .ace_comment.ace_doc {\
color: #236e24;\
}\
.ace-chrome .ace_comment.ace_doc.ace_tag {\
color: #236e24;\
}\
.ace-chrome .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-chrome .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-chrome .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-chrome .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-chrome .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-chrome .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-chrome .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-chrome .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-chrome .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-chrome .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-chrome .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-chrome .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-chrome .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-chrome .ace_storage,\
.ace-chrome .ace_keyword,\
.ace-chrome .ace_meta.ace_tag {\
color: rgb(147, 15, 128);\
}\
.ace-chrome .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-chrome .ace_string {\
color: #1A1AA6;\
}\
.ace-chrome .ace_entity.ace_other.ace_attribute-name {\
color: #994409;\
}\
.ace-chrome .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

        var dom = require("../lib/dom");
        dom.importCssString(exports.cssText, exports.cssClass);
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRoZW1lLWNocm9tZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxpQkFBZSxDQUFDOzs7O0FBQ2hCLFNBQUcsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUMsQ0FBQyxTQUFTLEVBQUMsU0FBUyxFQUFDLFFBQVEsRUFBQyxhQUFhLENBQUMsRUFBRSxVQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFOztBQUUvRyxlQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUN2QixlQUFPLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQztBQUNoQyxlQUFPLENBQUMsT0FBTyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXVIakIsQ0FBQzs7QUFFRixZQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDaEMsV0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUN0RCxDQUFDLENBQUMiLCJmaWxlIjoidGhlbWUtY2hyb21lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogKi8gXG5cImZvcm1hdCBnbG9iYWxcIjtcbmFjZS5kZWZpbmUoXCJhY2UvdGhlbWUvY2hyb21lXCIsW1wicmVxdWlyZVwiLFwiZXhwb3J0c1wiLFwibW9kdWxlXCIsXCJhY2UvbGliL2RvbVwiXSwgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbmV4cG9ydHMuaXNEYXJrID0gZmFsc2U7XG5leHBvcnRzLmNzc0NsYXNzID0gXCJhY2UtY2hyb21lXCI7XG5leHBvcnRzLmNzc1RleHQgPSBcIi5hY2UtY2hyb21lIC5hY2VfZ3V0dGVyIHtcXFxuYmFja2dyb3VuZDogI2ViZWJlYjtcXFxuY29sb3I6ICMzMzM7XFxcbm92ZXJmbG93IDogaGlkZGVuO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfcHJpbnQtbWFyZ2luIHtcXFxud2lkdGg6IDFweDtcXFxuYmFja2dyb3VuZDogI2U4ZThlODtcXFxufVxcXG4uYWNlLWNocm9tZSB7XFxcbmJhY2tncm91bmQtY29sb3I6ICNGRkZGRkY7XFxcbmNvbG9yOiBibGFjaztcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX2N1cnNvciB7XFxcbmNvbG9yOiBibGFjaztcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX2ludmlzaWJsZSB7XFxcbmNvbG9yOiByZ2IoMTkxLCAxOTEsIDE5MSk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9jb25zdGFudC5hY2VfYnVpbGRpbiB7XFxcbmNvbG9yOiByZ2IoODgsIDcyLCAyNDYpO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfY29uc3RhbnQuYWNlX2xhbmd1YWdlIHtcXFxuY29sb3I6IHJnYig4OCwgOTIsIDI0Nik7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9jb25zdGFudC5hY2VfbGlicmFyeSB7XFxcbmNvbG9yOiByZ2IoNiwgMTUwLCAxNCk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9pbnZhbGlkIHtcXFxuYmFja2dyb3VuZC1jb2xvcjogcmdiKDE1MywgMCwgMCk7XFxcbmNvbG9yOiB3aGl0ZTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX2ZvbGQge1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2Vfc3VwcG9ydC5hY2VfZnVuY3Rpb24ge1xcXG5jb2xvcjogcmdiKDYwLCA3NiwgMTE0KTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX3N1cHBvcnQuYWNlX2NvbnN0YW50IHtcXFxuY29sb3I6IHJnYig2LCAxNTAsIDE0KTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX3N1cHBvcnQuYWNlX3R5cGUsXFxcbi5hY2UtY2hyb21lIC5hY2Vfc3VwcG9ydC5hY2VfY2xhc3NcXFxuLmFjZS1jaHJvbWUgLmFjZV9zdXBwb3J0LmFjZV9vdGhlciB7XFxcbmNvbG9yOiByZ2IoMTA5LCAxMjEsIDIyMik7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV92YXJpYWJsZS5hY2VfcGFyYW1ldGVyIHtcXFxuZm9udC1zdHlsZTppdGFsaWM7XFxcbmNvbG9yOiNGRDk3MUY7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9rZXl3b3JkLmFjZV9vcGVyYXRvciB7XFxcbmNvbG9yOiByZ2IoMTA0LCAxMTgsIDEzNSk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9jb21tZW50IHtcXFxuY29sb3I6ICMyMzZlMjQ7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9jb21tZW50LmFjZV9kb2Mge1xcXG5jb2xvcjogIzIzNmUyNDtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX2NvbW1lbnQuYWNlX2RvYy5hY2VfdGFnIHtcXFxuY29sb3I6ICMyMzZlMjQ7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9jb25zdGFudC5hY2VfbnVtZXJpYyB7XFxcbmNvbG9yOiByZ2IoMCwgMCwgMjA1KTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX3ZhcmlhYmxlIHtcXFxuY29sb3I6IHJnYig0OSwgMTMyLCAxNDkpO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfeG1sLXBlIHtcXFxuY29sb3I6IHJnYigxMDQsIDEwNCwgOTEpO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfZW50aXR5LmFjZV9uYW1lLmFjZV9mdW5jdGlvbiB7XFxcbmNvbG9yOiAjMDAwMEEyO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfaGVhZGluZyB7XFxcbmNvbG9yOiByZ2IoMTIsIDcsIDI1NSk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9saXN0IHtcXFxuY29sb3I6cmdiKDE4NSwgNiwgMTQ0KTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX21hcmtlci1sYXllciAuYWNlX3NlbGVjdGlvbiB7XFxcbmJhY2tncm91bmQ6IHJnYigxODEsIDIxMywgMjU1KTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX21hcmtlci1sYXllciAuYWNlX3N0ZXAge1xcXG5iYWNrZ3JvdW5kOiByZ2IoMjUyLCAyNTUsIDApO1xcXG59XFxcbi5hY2UtY2hyb21lIC5hY2VfbWFya2VyLWxheWVyIC5hY2Vfc3RhY2sge1xcXG5iYWNrZ3JvdW5kOiByZ2IoMTY0LCAyMjksIDEwMSk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9tYXJrZXItbGF5ZXIgLmFjZV9icmFja2V0IHtcXFxubWFyZ2luOiAtMXB4IDAgMCAtMXB4O1xcXG5ib3JkZXI6IDFweCBzb2xpZCByZ2IoMTkyLCAxOTIsIDE5Mik7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9tYXJrZXItbGF5ZXIgLmFjZV9hY3RpdmUtbGluZSB7XFxcbmJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNyk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9ndXR0ZXItYWN0aXZlLWxpbmUge1xcXG5iYWNrZ3JvdW5kLWNvbG9yIDogI2RjZGNkYztcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX21hcmtlci1sYXllciAuYWNlX3NlbGVjdGVkLXdvcmQge1xcXG5iYWNrZ3JvdW5kOiByZ2IoMjUwLCAyNTAsIDI1NSk7XFxcbmJvcmRlcjogMXB4IHNvbGlkIHJnYigyMDAsIDIwMCwgMjUwKTtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX3N0b3JhZ2UsXFxcbi5hY2UtY2hyb21lIC5hY2Vfa2V5d29yZCxcXFxuLmFjZS1jaHJvbWUgLmFjZV9tZXRhLmFjZV90YWcge1xcXG5jb2xvcjogcmdiKDE0NywgMTUsIDEyOCk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9zdHJpbmcuYWNlX3JlZ2V4IHtcXFxuY29sb3I6IHJnYigyNTUsIDAsIDApXFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9zdHJpbmcge1xcXG5jb2xvcjogIzFBMUFBNjtcXFxufVxcXG4uYWNlLWNocm9tZSAuYWNlX2VudGl0eS5hY2Vfb3RoZXIuYWNlX2F0dHJpYnV0ZS1uYW1lIHtcXFxuY29sb3I6ICM5OTQ0MDk7XFxcbn1cXFxuLmFjZS1jaHJvbWUgLmFjZV9pbmRlbnQtZ3VpZGUge1xcXG5iYWNrZ3JvdW5kOiB1cmwoXFxcImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQ0NBWUFBQUNaZ2JZbkFBQUFFMGxFUVZRSW1XUDQvLy8vZjRiTGx5Ly9Cd0FtVmdkMS93MTEvZ0FBQUFCSlJVNUVya0pnZ2c9PVxcXCIpIHJpZ2h0IHJlcGVhdC15O1xcXG59XFxcblwiO1xuXG52YXIgZG9tID0gcmVxdWlyZShcIi4uL2xpYi9kb21cIik7XG5kb20uaW1wb3J0Q3NzU3RyaW5nKGV4cG9ydHMuY3NzVGV4dCwgZXhwb3J0cy5jc3NDbGFzcyk7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
