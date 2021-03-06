'use babel';

import {TextEditor} from 'atom';

let BREAKPOINT_CLASS = 'breakpoint';

export default {
  breakpoints: [],
  init(debuggerInstance, state) {
    state = state || [];
    this.debugger = debuggerInstance;
    this.breakpoints = state;
    this.gutters = [];

    for (let breakpoint of state) {
      this.addBreakpoint(breakpoint);
    }

    atom.workspace.observeTextEditors((textEditor) => {
      let gutter = textEditor.addGutter({name: 'polybug'});
      let element = document.createElement('div');
      element.className = 'polybug-gutter';
      let path = textEditor.getPath();
      //TODO: do it in proper way
      let lineHeight = textEditor.getLineHeightInPixels() || Math.floor(atom.config.get('editor.fontSize') * atom.config.get('editor.lineHeight'));
      let showBreakpoint = (breakpoint) => {
        let screenLine = textEditor.bufferPositionForScreenPosition([breakpoint.line, 0]).row;
        let breakpointElement = document.createElement('div');
        breakpointElement.classList.add(BREAKPOINT_CLASS);
        if (breakpoint.condition) {
          breakpointElement.classList.add('conditional');
          breakpointElement.title = breakpoint.condition;
        }
        breakpointElement.style.top = ((screenLine - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
        breakpointElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
        breakpointElement.dataset.breakpoint = breakpoint.line;
        element.appendChild(breakpointElement);

        breakpointElement.polybugBreakpoint = breakpoint;
      };

      let toggleBreakpoint = (line) => {
        let breakpoint = this.findBreakpoint(path, line);

        if (breakpoint) {
          this.removeBreakpoint(breakpoint, element);
        } else {
          breakpoint = {
            path: path,
            line: line
          };
          showBreakpoint(breakpoint);
          this.addBreakpoint(breakpoint);
          this.breakpoints.push(breakpoint);
        }
      };

      element.onclick = (event) => {
        let line = Math.floor(event.offsetY / lineHeight);
        let realLine = textEditor.screenPositionForBufferPosition([line, 0]).row + 1;
        toggleBreakpoint(realLine);
      };

      element.oncontextmenu = (event) => {
        event.stopPropagation();
        let line = Math.floor(event.offsetY / lineHeight);
        let realLine = textEditor.screenPositionForBufferPosition([line, 0]).row + 1;
        let breakpoint = this.findBreakpoint(path, realLine);
        let dialog = document.createElement('div');
        dialog.className = 'polybug-condition';
        let input = new TextEditor({mini: true});
        let label = document.createElement('label');
        if (breakpoint && breakpoint.condition) {
          input.setText(breakpoint.condition);
        }
        label.textContent = 'Condition:';
        dialog.appendChild(label);
        dialog.appendChild(input.element);
        panel = atom.workspace.addModalPanel({item: dialog});
        input.element.focus();
        atom.commands.add(dialog, {
          'core:confirm': () => {

            if (breakpoint) {
              this.removeBreakpoint(breakpoint, element);
            }
            breakpoint = {
              path: path,
              line: realLine,
              condition: input.getText()
            };

            showBreakpoint(breakpoint);
            this.addBreakpoint(breakpoint);
            this.breakpoints.push(breakpoint);
            panel.destroy();
          },
          'core:cancel': () => panel.destroy()
        });
        input.element.onblur = () => panel.destroy();
      };

      let shadowElement = document.createElement('div');
      shadowElement.className = 'breakpoint-shadow';
      shadowElement.style.display = 'none';
      element.appendChild(shadowElement);
      element.onmousemove = (event) => {
        let line = Math.floor(event.offsetY / lineHeight);
        shadowElement.style.top = (line * lineHeight + (lineHeight - 10) / 2) + 'px';
        shadowElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
        shadowElement.style.display = 'block';
      };
      element.onmouseleave = (event) => {
        shadowElement.style.display = 'none';
      };

      // TODO: change it to something sane
      let decoration = gutter.decorateMarker(textEditor.markBufferRange([[0, 0], [100000, 0]]), {
        type: 'gutter',
        class: 'polybug',
        item: element
      });
      this.gutters.push(gutter);


      let mutationObserver = new MutationObserver(() => {
        mutationObserver.disconnect();
        for (let breakpoint of state) {
          if (breakpoint.path == path) {
            showBreakpoint(breakpoint);
          }
        }
      });

      mutationObserver.observe(element, {attributes: true, subtree: true});
      gutter.onDidDestroy(() => {
        this.gutters.splice(this.gutters.indexOf(gutter), 1);
        decoration.destroy();
      });

      debuggerInstance.on('stop', (path, line) => {
        let editorPath = textEditor.getPath();
        if (process.platform === 'win32') {
          editorPath = editorPath.toLowerCase();
          path = path.toLowerCase();
        }
        if (editorPath === path) {
          line--;
          let screenLine = textEditor.screenPositionForBufferPosition([line, 0]).row;
          for (let oldLine of document.querySelectorAll('.polybug-current')) {
            oldLine.classList.remove('polybug-current');
          }
          for (let pane of atom.workspace.getPanes()) {
            if (pane.getItems().indexOf(textEditor) !== -1) {
              pane.activateItem(textEditor);
            }
          }
          textEditor.scrollToBufferPosition([line, 0]);
          let lineElement = textEditor.element.querySelector('div.line[data-screen-row="' + screenLine + '"]');
          lineElement.classList.add('polybug-current');
        }
      });
      debuggerInstance.on('run', () => {
        for (let oldLine of document.querySelectorAll('.polybug-current')) {
          oldLine.classList.remove('polybug-current');
        }
      });
      atom.commands.add(textEditor.element, {
        'polybug:breakpoint': () => toggleBreakpoint(textEditor.getCursorBufferPosition().row + 1)
      });
    });
  },

  findBreakpoint(path, line) {
    for (let breakpoint of this.breakpoints) {
      if (breakpoint.path === path && breakpoint.line == line) {
        return breakpoint;
      }
    }
  },

  addBreakpoint(breakpoint) {
    this.debugger.addBreakpoint(breakpoint.path, breakpoint.line, breakpoint.condition);
  },

  destroy() {
    let gutters = this.gutters.slice(0);
    for (let gutter of gutters) {
      gutter.destroy();
    }
    for (let oldLine of document.querySelectorAll('.polybug-current')) {
      oldLine.classList.remove('polybug-current');
    }
  },

  getState() {
    return this.breakpoints;
  },

  removeBreakpoint(breakpoint, element) {
    this.breakpoints.splice(this.breakpoints.indexOf(breakpoint), 1);
    let breakpointElement = element.querySelector('.breakpoint[data-breakpoint="' + breakpoint.line + '"]');
    if (breakpointElement) {
      element.removeChild(breakpointElement);
    }
    this.debugger.removeBreakpoint(breakpoint.path, breakpoint.line);
  }
};
