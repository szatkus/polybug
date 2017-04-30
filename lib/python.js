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

  sendCommand(command) {
    let data = command + '\n';
    this.child.stdin.write(data);
    this.emit('data', data);
  }

  destroy() {
    this.child.kill();
  }
}
