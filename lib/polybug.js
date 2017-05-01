'use babel';

import { CompositeDisposable, DisplayMarkerLayer } from 'atom';
import { basename, dirname } from 'path';
import PythonDebugger from './python';
import breakpoints from './breakpoints';

export default {

  config: {
    pythonPath: {
      'title': 'A path to python executable',
      'type': 'string',
      'default': 'python'
    },
    commandLine: {
      'title': 'A command line for project entry point',
      'type': 'string',
      'default': 'main.py'
    }
  },

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'polybug:debug-file': () => this.debugFile(),
      'polybug:debug-project': () => this.debugProject(),
      'polybug:continue': () => this.debugger && this.debugger.sendCommand('continue'),
      'polybug:step': () => this.debugger && this.debugger.sendCommand('step'),
      'polybug:next': () => this.debugger && this.debugger.sendCommand('next'),
      'polybug:return': () => this.debugger && this.debugger.sendCommand('return'),
      'polybug:restart': () => this.debugger && this.debugger.sendCommand('restart'),
    }));
    this.state = state;
  },

  deactivate() {
    this.panel.destroy();
    this.debugger.destroy();
    this.subscriptions.dispose();
    breakpoints.destroy();
    this.panel = null;
    this.debugger = null;
  },

  serialize() {
    return {
      breakpoints: breakpoints.getState()
    };
  },

  write(data) {
    data = data.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    this.output.innerHTML += data;
    this.output.scrollTop = 100000;
  },

  debugFile() {
    let path = atom.workspace.getActivePaneItem().buffer.file.path;
    this.debug(dirname(path), basename(path));
  },

  debugProject() {
    let directory = atom.project.getPaths()[0];
    let commandLine = atom.config.get('polybug.commandLine');
    this.debug(directory, commandLine);
  },

  addButton(name, hint, action) {
    let element = document.createElement('button');
    element.className = 'btn';
    element.innerHTML = name;
    element.title = hint;
    element.addEventListener('click', action);
    this.toolbar.appendChild(element);
  },

  debug(directory, commandLine) {
    if (!this.panel) {
      let element = document.createElement('div');
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'toolbar';
      element.appendChild(this.toolbar);
      this.addButton('<svg width="16" height="16"><polygon points="4,1 11,9 4,16"/></svg>', 'Continue', () => this.debugger.sendCommand('continue'));
      this.addButton('<svg width="16" height="16"><rect x="0" y="1" width="2" height="15"/><rect x="3" y="1" width="2" height="15"/><polygon points="7,1 14,9 7,16"/></svg>', 'Next', () => this.debugger.sendCommand('next'));
      this.addButton('<svg width="16" height="16"><rect x="2" y="1" width="2" height="15"/><polygon points="6,1 13,9 6,16"/></svg>', 'Step', () => this.debugger.sendCommand('step'));
      this.addButton('<svg width="16" height="16"><polygon points="0,1 7,9 0,16"/><polygon points="8,1 15,9 8,16"/></svg>', 'Return', () => this.debugger.sendCommand('return'));
      this.addButton('<svg width="16" height="16"><path d="M3 7 A 6 6, 0, 1, 0, 7 3" stroke="black" fill="transparent"/><polygon points="4,3 9,0 9,6"/></svg>', 'Restart', () => this.debugger.sendCommand('restart'));
      this.output = document.createElement('pre');
      this.output.className = 'output';
      element.appendChild(this.output);
      this.input = document.createElement('input');
      this.input.placeholder = '>>';
      this.input.className = 'native-key-bindings';
      element.appendChild(this.input);
      element.className = 'polybug-panel';
      this.panel = atom.workspace.addBottomPanel({item: element, visible: false});

      this.input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          this.debugger.sendCommand(this.input.value);
          this.input.value = '';
        }
      });
    }
    if (this.panel.isVisible()) {
      this.panel.hide();
      this.debugger.destroy();
      breakpoints.destroy();
    } else {
      this.panel.show();
      this.input.readOnly = false;
      this.input.focus();
      this.output.innerHTML = '';
      let pythonPath = atom.config.get('polybug.pythonPath');
      this.debugger = new PythonDebugger(pythonPath, commandLine, directory);
      this.debugger.on('data', (data) => this.write(data));
      this.debugger.on('exit', (data) => this.input.readOnly = true);
      breakpoints.init(this.debugger, this.state.breakpoints);
    }
  }

};
