'use babel';

import EventEmitter from 'events';
import { exec, spawn } from 'child_process';

export default class PythonDebugger extends EventEmitter {

  constructor(pythonPath, commandLine, directoryPath) {
    super();
    this.child = exec(pythonPath + ' -u -m pdb ' + commandLine, {
      cwd: directoryPath
    });

    this.child.stdout.on('data', (data) => {
      let lines = data.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('> ') === 0 && lines[i+1] && lines[i+1].indexOf('-> ') === 0) {
          let line = lines[i].substring(2);
          let path = line.substring(0, line.indexOf('('));
          line = line.substring(line.indexOf('(') + 1, line.indexOf(')'));
          let lineNumber = parseInt(line);
          this.emit('stop', path, lineNumber);
        }
      }
      this.emit('data', data);
    });
    this.child.stderr.on('data', (data) => this.emit('data', data));
    this.child.on('exit', (data) => this.emit('exit', data));
  }

  addBreakpoint(path, line, condition) {
    let command = 'break ' + path + ':' + line;
    if (condition) {
      command += ', ' + condition;
    }
    this.sendCommand(command);
  }

  continue() {
    this.sendCommand('continue');
    this.emit('run', 'continue')
  }

  destroy() {
    this.child.kill();
  }

  next() {
    this.sendCommand('next');
    this.emit('run', 'next')
  }

  removeBreakpoint(path, line) {
    let command = 'clear ' + path + ':' + line;
    this.sendCommand(command);
  }

  restart() {
    this.sendCommand('restart');
    this.emit('run', 'restart')
  }

  return() {
    this.sendCommand('return');
    this.emit('run', 'return')
  }

  sendCommand(command) {
    let data = command + '\n';
    if (this.child.stdin.writable) {
      this.child.stdin.write(data);
      this.emit('data', data);
    }
  }

  step() {
    this.sendCommand('step');
    this.emit('run', 'step')
  }

}
