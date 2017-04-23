'use babel';

import { CompositeDisposable, DisplayMarkerLayer } from 'atom';
import { basename, dirname } from 'path';
import { exec, spawn } from 'child_process';

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
      'polybug:debug': () => this.debugFile(),
      'polybug:debug-project': () => this.debugProject()
    }));
  },

  deactivate() {
    this.panel.destroy();
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },

  write(data) {
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

  debug(directory, commandLine) {
    if (!this.panel) {
      let element = document.createElement('div');
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
          let data = this.input.value + '\n';
          this.child.stdin.write(data);
          this.write(data);
          this.input.value = '';
        }
      });
    }
    if (this.panel.isVisible()) {
      this.panel.hide();
      this.child.kill();
    } else {
      this.panel.show();
      this.input.readOnly = false;
      this.input.focus();
      this.output.innerHTML = '';
      let pythonPath = atom.config.get('polybug.pythonPath');
      this.child = exec(pythonPath + ' -u -m pdb ' + commandLine, {
        cwd: directory
      });

      this.child.stdout.on('data', (data) => this.write(data));
      this.child.stderr.on('data', (data) => this.write(data));
      this.child.on('exit', (data) => this.input.readOnly = true);
    }
  }

};
