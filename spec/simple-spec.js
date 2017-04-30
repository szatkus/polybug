'use babel';

import polybug from '../lib/polybug';

describe('Simple case', () => {
  beforeEach(() => {
    atom.packages.activatePackage('polybug');
    //TODO: find a more portable workaround
    waitsForPromise(() => atom.workspace.open('/home/szatkus/polybug/spec/simple.py'));
    waitsFor(() => atom.workspace.getActiveTextEditor());
  });

  it('Open correct file and exit', () => {
    runs(() => {
      let workspaceElement = atom.views.getView(atom.workspace);
      atom.commands.dispatch(workspaceElement, 'polybug:debug-file');
      waitsFor(() => workspaceElement.querySelector('.polybug-panel .output').innerHTML);
      runs(() => {
        let output = workspaceElement.querySelector('.polybug-panel .output');
        let lines = output.innerHTML.split('\n');
        expect(lines[1]).toEqual('-&gt; print("test")');
        let input = workspaceElement.querySelector('.polybug-panel input');
        input.value = 'exit';
        let event = new KeyboardEvent('keypress', {key: 'Enter'});
        input.dispatchEvent(event);
        waitsFor(() => input.readOnly);
      });
    });
  });

  it('Open correct file and exit', () => {
    runs(() => {
      let workspaceElement = atom.views.getView(atom.workspace);
      atom.commands.dispatch(workspaceElement, 'polybug:debug-file');
      waitsFor(() => workspaceElement.querySelector('.polybug-panel .output').innerHTML);
      runs(() => {
        let output = workspaceElement.querySelector('.polybug-panel .output');
        let lines = output.innerHTML.split('\n');
        expect(lines[1]).toEqual('-&gt; print("test")');
        let input = workspaceElement.querySelector('.polybug-panel input');
        input.value = 'exit';
        let event = new KeyboardEvent('keypress', {key: 'Enter'});
        input.dispatchEvent(event);
        waitsFor(() => input.readOnly);
      });
    });
  });

  it('Open a file and step in', () => {

    runs(() => {
      let workspaceElement = atom.views.getView(atom.workspace);
      atom.commands.dispatch(workspaceElement, 'polybug:debug-file');
      waitsFor(() => workspaceElement.querySelector('.polybug-panel .output').innerHTML);
      runs(() => {
        let output = workspaceElement.querySelector('.polybug-panel .output');
        let lines = output.innerHTML.split('\n');
        expect(lines[1]).toEqual('-&gt; print("test")');
        let button = workspaceElement.querySelectorAll('.polybug-panel .btn')[3];
        let event = new MouseEvent('click');
        button.dispatchEvent(event);
        waitsFor(() => output.innerHTML.split('\n').length > 4);
        runs(() => {
          let lines = output.innerHTML.split('\n');
          expect(lines[3]).toEqual('test');
        });
      });
    });
  });
});
