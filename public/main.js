// const renderStreams = streams => {
//     if (!streams || streams.length === 0) {
//         $('#active_streams').html('empty');
//     } else {
//         var html = '';
//         for (var i = 0; i < streams.length; i++) {
//             const stream = streams[i];
//             const start = new Date(stream.start);
//             const end = new Date(stream.end);
//             var template = $('#stream-template').html();
//             template = template.replace(/{{key}}/g, stream.key);
//             template = template.replace(/{{source}}/g, stream.source);
//             template = template.replace(/{{destination}}/g, stream.destination);
//             template = template.replace(/{{bitrate}}/g, stream.currentKbps);
//             template = template.replace(/{{start}}/g, start.toLocaleString('en-US', {timeStyle: 'short'}));
//             template = template.replace(/{{end}}/g, end.toLocaleString('en-US', {timeStyle: 'short'}));
//             html = html + template;
//         }
//         $('#active_streams').html(html);
//     }
// };

let pollTimeout = null;

const poll = () => {
    clearTimeout(pollTimeout);
    $.get('/streams', data => {
        // console.log(data);
        pollTimeout = setTimeout(poll, 3000);
    });
};

const startStream = function () {
    const streamId = $(this).parents('.stream').attr('data-stream-id');
    $.post(`/streams/${streamId}/start`);
};

const stopStream = function () {
    const streamId = $(this).parents('.stream').attr('data-stream-id');
    $.post(`/streams/${streamId}/stop`);
};

$(() => {
    $('.stream .btn-success').click(startStream);
    $('.stream .btn-danger').click(stopStream);
    poll();
});
