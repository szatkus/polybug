'use babel';

import polybug from '../lib/polybug';

describe('Simple case', () => {
  beforeEach(() => {
    atom.packages.activatePackage('polybug');
  });
  it('Open correct file and debug', () => {
    //TODO: find a more portable workaround
    waitsForPromise(() => atom.workspace.open('/home/szatkus/polybug/spec/simple.py'));

    waitsFor(() => atom.workspace.getActiveTextEditor());
    runs(() => {
      let workspaceElement = atom.views.getView(atom.workspace);
      atom.commands.dispatch(workspaceElement, 'polybug:debug');
      waitsFor(() => workspaceElement.querySelector('.polybug-panel .output').innerHTML);
      runs(() => {
        let output = workspaceElement.querySelector('.polybug-panel .output');
        let lines = output.innerHTML.split('\n');
        console.log(lines);
        expect(lines[1]).toEqual('-&gt; print("test")');
        let input = workspaceElement.querySelector('.polybug-panel input');
        input.value = 'exit';
        let event = new KeyboardEvent('keypress', {key: 'Enter'});
        input.dispatchEvent(event);
        waitsFor(() => input.readOnly);
      });
    });
  });
});
