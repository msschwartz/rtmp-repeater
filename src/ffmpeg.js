const {spawn} = require('child_process');
const tmp = require('tmp');
const fs = require('fs');

const ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

function run(source, destination) {
  const args = [
    '-hide_banner',
    '-loglevel', 'warning',
    '-re',
    '-i', source,
    '-f', 'flv',
    destination,
  ];
  const exec = spawn(ffmpegPath, args);

  exec.on('close', code => console.log('close: ', code));
  exec.on('error', error => console.error('error: ', error));
  exec.stdout.on('data', data => console.log(String(data)));
  exec.stderr.on('data', data => console.log(String(data)));

  return exec;
}

module.exports = {
  run,
};
