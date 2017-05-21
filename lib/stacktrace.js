'use babel';

let DEFAULT_CONTENT = '<h2>Stack Trace</h2>';

export default class StackTrace {
  constructor(parent) {
    this.element = document.createElement('div');
    this.element.className = 'stack';
    this.element.innerHTML = DEFAULT_CONTENT;
    parent.appendChild(this.element);

  }

  updateStack(stack) {
    this.element.innerHTML = DEFAULT_CONTENT;
    for (let i in stack) {
      let item = stack[i];
      let element = document.createElement('a');
      let functionName = item.functionName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      element.classList.add('item');
      if (item.active) {
        element.classList.add('active');
      }
      let filename;
      if (process.platform !== 'win32') {
        filename = item.path.substring(item.path.lastIndexOf('/') + 1);
      } else {
        filename = item.path.substring(item.path.lastIndexOf('\\') + 1);
      }
      element.innerHTML = filename + ':' + item.lineNumber + ' - ' + functionName;
      element.index = i;
      element.addEventListener('click', (event) => {
        this.debugger.moveFrame(event.target.index);
      });
      this.element.appendChild(element);
    }
  }

  attachDebugger(debuggerInstance) {
    this.debugger = debuggerInstance;
    debuggerInstance.on('stack', (stack) => this.updateStack(stack));
    debuggerInstance.on('run', (stack) => this.updateStack([]));
  }
}
