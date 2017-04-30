'use babel';

let BREAKPOINT_CLASS = 'breakpoint';

export default {
  breakpoints: [],
  init(debuggerInstance, state) {
    this.debugger = debuggerInstance;
    this.breakpoints = state;
    this.gutters = [];

    atom.workspace.observeTextEditors((textEditor) => {
      let gutter = textEditor.addGutter({name: 'polybug'});
      let element = document.createElement('div');
      let path = textEditor.getPath();
      //TODO: do it in proper way
      let lineHeight = textEditor.getLineHeightInPixels() || Math.floor(atom.config.get('editor.fontSize') * atom.config.get('editor.lineHeight'));
      let applyBreakpoint = (breakpoint, isNew) => {
        let screenLine = textEditor.bufferPositionForScreenPosition([breakpoint.line, 0]).row;
        let breakpointElement = document.createElement('div');
        breakpointElement.className = BREAKPOINT_CLASS;
        breakpointElement.style.top = ((screenLine - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
        breakpointElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
        element.appendChild(breakpointElement);

        breakpointElement.polybugBreakpoint = breakpoint;
        this.addBreakpoint(breakpoint);
      };

      element.onclick = (event) => {
        if (event.target.classList.contains(BREAKPOINT_CLASS)) {
          let breakpoint = event.target.polybugBreakpoint;
          event.target.parentElement.removeChild(event.target);
          this.removeBreakpoint(breakpoint);
          this.breakpoints.splice(this.breakpoints.indexOf(breakpoint), 1);
        } else {
          let line = Math.floor(event.offsetY / lineHeight) + 1;
          let realLine = textEditor.screenPositionForBufferPosition([line, 0]).row;
          let breakpoint = {
            path: path,
            line: realLine
          };
          applyBreakpoint(breakpoint);
          this.breakpoints.push(breakpoint);
        }
      };
      // TODO: change it to something sane
      gutter.decorateMarker(textEditor.markBufferRange([[0, 0], [100000, 0]]), {
        type: 'gutter',
        class: 'polybug',
        item: element
      });
      this.gutters.push(gutter);


      let mutationObserver = new MutationObserver(() => {
        mutationObserver.disconnect();
        for (let breakpoint of state) {
          if (breakpoint.path == path) {
            applyBreakpoint(breakpoint);
          }
        }
      });

      mutationObserver.observe(element, {attributes: true, subtree: true});
      gutter.onDidDestroy(() => this.gutters.splice(this.gutters.indexOf(gutter, 1)));
    });
  },

  addBreakpoint(breakpoint) {
    this.debugger.addBreakpoint(breakpoint.path, breakpoint.line);
  },

  destroy() {
    let gutters = this.gutters.slice(0);
    for (let gutter of gutters) {
      gutter.destroy();
    }
  },

  getState() {
    return this.breakpoints;
  },

  removeBreakpoint(breakpoint) {
    this.debugger.removeBreakpoint(breakpoint.path, breakpoint.line);
  }
};
