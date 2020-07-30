const config = require('./config');
const {getStreams, startStream} = require('./streams');

const CHECK_INTERVAL = 10000;

// monitor streams:
// check if primary is available
// start primary if available
// check if backup is available
// start backup if available
// if primary starts, kill backup and start primary
// if primary ends, kill primary and start backup
// if backup fails, restry in 10 seconds

const checkStreams = () => {
    const streams = getStreams();

    Object.values(config).forEach(c => {
        if (!streams.some(s => s.destination === c.destination)) {
            console.log('no stream found, starting backup');
            startStream(c.backup, c.destination);
        }
    });

    setTimeout(checkStreams, CHECK_INTERVAL);
};

const init = () => {
    checkStreams();
};

module.exports = {
    init,
};