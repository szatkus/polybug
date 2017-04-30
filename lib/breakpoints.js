'use babel';

let BREAKPOINT_CLASS = 'breakpoint';

export default {
  breakpoints: [],
  init(debuggerInstance) {
    this.debugger = debuggerInstance;
    atom.workspace.observeTextEditors((textEditor) => {
      this.gutter = textEditor.addGutter({name: 'polybug'});
      let element = document.createElement('div');
      element.onclick = (event) => {
        if (event.target.classList.contains(BREAKPOINT_CLASS)) {
          let breakpoint = event.target.polybugBreakpoint;
          event.target.parentElement.removeChild(event.target);
          this.removeBreakpoint(breakpoint);
        } else {
          let lineHeight = textEditor.getLineHeightInPixels();
          let line = Math.floor(event.offsetY / lineHeight) + 1;
          let realLine = textEditor.screenPositionForBufferPosition([line, 0])[0];
          let breakpointElement = document.createElement('div');
          breakpointElement.className = BREAKPOINT_CLASS;
          breakpointElement.style.top = ((line - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
          breakpointElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
          element.appendChild(breakpointElement);
          let breakpoint = {
            path: textEditor.getPath(),
            line: line
          };
          breakpointElement.polybugBreakpoint = breakpoint;
          this.breakpoints.push(breakpoint);
          this.addBreakpoint(breakpoint);
        }
      };
      // TODO: change it to something sane
      this.gutter.decorateMarker(textEditor.markBufferRange([[0, 0], [100000, 0]]), {
        type: 'gutter',
        class: 'polybug',
        item: element
      });
    });
  },

  addBreakpoint(breakpoint) {
    this.debugger.addBreakpoint(breakpoint.path, breakpoint.line);
  },

  removeBreakpoint(breakpoint) {
    this.debugger.removeBreakpoint(breakpoint.path, breakpoint.line);
  },

  destroy() {
    this.gutter.destroy();
  }
};
