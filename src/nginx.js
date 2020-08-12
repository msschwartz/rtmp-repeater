const {spawn} = require('child_process');

const nginxPath = process.env.NGINX_PATH || '/usr/sbin/nginx';

function run(conf) {
  const exec = spawn(nginxPath, ['-c', conf]);

  exec.on('close', code => console.log('close: ', code));
  exec.on('error', error => console.error('error: ', error));
  exec.stdout.on('data', data => console.log(String(data)));
  exec.stderr.on('data', data => console.log(String(data)));

  return exec;
}

module.exports = {
  run,
};
