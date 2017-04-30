'use babel';

import EventEmitter from 'events';
import { exec, spawn } from 'child_process';

export default class PythonDebugger extends EventEmitter {

  constructor(pythonPath, commandLine, directoryPath) {
    super();
    this.child = exec(pythonPath + ' -u -m pdb ' + commandLine, {
      cwd: directoryPath
    });

    this.child.stdout.on('data', (data) => this.emit('data', data));
    this.child.stderr.on('data', (data) => this.emit('data', data));
    this.child.on('exit', (data) => this.emit('exit', data));
  }

  destroy() {
    this.child.kill();
  }

  addBreakpoint(path, line) {
    let command = 'break ' + path + ':' + line;
    this.sendCommand(command);
  }

  sendCommand(command) {
    let data = command + '\n';
    this.child.stdin.write(data);
    this.emit('data', data);
  }

  removeBreakpoint(path, line) {
    let command = 'clear ' + path + ':' + line;
    this.sendCommand(command);
  }

}
