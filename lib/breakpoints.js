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
      element.className = 'polybug-gutter';
      let path = textEditor.getPath();
      //TODO: do it in proper way
      let lineHeight = textEditor.getLineHeightInPixels() || Math.floor(atom.config.get('editor.fontSize') * atom.config.get('editor.lineHeight'));
      let applyBreakpoint = (breakpoint) => {
        let screenLine = textEditor.bufferPositionForScreenPosition([breakpoint.line, 0]).row;
        let breakpointElement = document.createElement('div');
        breakpointElement.className = BREAKPOINT_CLASS;
        breakpointElement.style.top = ((screenLine - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
        breakpointElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
        breakpointElement.dataset.breakpoint = breakpoint.line;
        element.appendChild(breakpointElement);

        breakpointElement.polybugBreakpoint = breakpoint;
        this.addBreakpoint(breakpoint);
      };

      element.onclick = (event) => {
        let line = Math.floor(event.offsetY / lineHeight) + 1;
        let realLine = textEditor.screenPositionForBufferPosition([line, 0]).row;
        let breakpoint = {
          path: path,
          line: realLine
        };
        for (let b of this.breakpoints) {
          if (b.path === path && b.line == realLine) {
            this.breakpoints.splice(this.breakpoints.indexOf(b), 1);
            let bElement = element.querySelector('.breakpoint[data-breakpoint="' + realLine + '"]');
            if (bElement) {
              element.removeChild(bElement);
            }
            this.removeBreakpoint(b);
            return;
          }
        }
        applyBreakpoint(breakpoint);
        this.breakpoints.push(breakpoint);
      };

      let shadowElement = document.createElement('div');
      shadowElement.className = 'breakpoint-shadow';
      shadowElement.style.display = 'none';
      element.appendChild(shadowElement);
      element.onmousemove = (event) => {
        let line = Math.floor(event.offsetY / lineHeight) + 1;
        let realLine = textEditor.screenPositionForBufferPosition([line, 0]).row;
        shadowElement.style.top = ((line - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
        shadowElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
        shadowElement.style.display = 'block';
      };
      element.onmouseleave = (event) => {
        shadowElement.style.display = 'none';
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
