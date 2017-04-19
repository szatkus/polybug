'use babel';

import PolybugView from './polybug-view';
import { CompositeDisposable, DisplayMarkerLayer } from 'atom';
import { basename, dirname } from 'path';

export default {

  polybugView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'polybug:debug': () => this.debug()
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

  debug() {
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
        if (event.keyCode === 13) { //ENTER
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
      let path = atom.workspace.getActivePaneItem().buffer.file.path;
      this.panel.show();
      this.input.readOnly = false;
      this.input.focus();
      this.output.innerHTML = '';
      let exec = require('child_process').exec;
      this.child = exec('python -u -m pdb ' + basename(path), {
        cwd: dirname(path)
      });

      this.child.stdout.on('data', (data) => this.write(data));
      this.child.stderr.on('data', (data) => this.write(data));
      this.child.on('exit', (data) => this.input.readOnly = true);
    }
  }

};

/*atom.workspace.observeTextEditors(function (textEditor) {
  console.log(textEditor);
  let gutter = textEditor.addGutter({name: 'polybug'});
  let element = document.createElement('div');
  element.onclick = function (event) {
    let lineHeight = textEditor.getLineHeightInPixels();
    let line = Math.floor(event.offsetY / lineHeight) + 1;
    let realLine = textEditor.screenPositionForBufferPosition([line, 0])[0];
    let breakpointElement = document.createElement('div');
    breakpointElement.className = 'breakpoint';
    breakpointElement.style.top = ((line - 1) * lineHeight + (lineHeight - 10) / 2) + 'px';
    breakpointElement.style.left = ((element.clientWidth - 10) / 2) + 'px';
    element.appendChild(breakpointElement);
  };
  // TODO: change it to something sane
  gutter.decorateMarker(textEditor.markBufferRange([[0, 0], [100000, 0]]), {
    type: 'gutter',
    class: 'polybug',
    item: element
  });
});*/
