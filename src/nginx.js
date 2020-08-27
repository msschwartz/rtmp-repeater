const {spawn} = require('child_process');
const tmp = require('tmp');
const fs = require('fs');

const nginxPath = process.env.NGINX_PATH || '/usr/sbin/nginx';

const template = `
worker_processes 1;

daemon off;

error_log stderr;

events {
  worker_connections 128;
}

rtmp {
  server {
    listen {{port}};
    application relay {
      live on;
      pull {{source}} name=live static;
    }
  }
}
`;

function run(port, source) {
  const conf = template.replace('{{port}}', port).replace('{{source}}', source);
  const tmpobj = tmp.fileSync();
  fs.writeFileSync(tmpobj.name, conf);
  const exec = spawn(nginxPath, ['-c', tmpobj.name]);

  exec.on('close', code => console.log('close: ', code));
  exec.on('error', error => console.error('error: ', error));
  exec.stdout.on('data', data => console.log(String(data)));
  exec.stderr.on('data', data => console.log(String(data)));

  return exec;
}

module.exports = {
  run,
};
