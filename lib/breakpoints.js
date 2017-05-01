'use babel';

import {TextEditor} from 'atom';

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
        this.addBreakpoint(breakpoint);
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
          applyBreakpoint(breakpoint);
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

            applyBreakpoint(breakpoint);
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
      gutter.onDidDestroy(() => this.gutters.splice(this.gutters.indexOf(gutter), 1));

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
