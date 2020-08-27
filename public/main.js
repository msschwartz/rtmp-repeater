let pollTimeout = null;

const poll = () => {
    clearTimeout(pollTimeout);
    $.get('/streams', data => {
        data.forEach(stream => {
            const $stream = $(`.stream[data-stream-id=${stream.id}]`);
            if (stream.active) {
                $stream.addClass('panel-success').removeClass('panel-warning');
                $stream.find('.status').html('active');
            } else {
                $stream.addClass('panel-warning').removeClass('panel-success');
                $stream.find('.status').html('stopped');
            }
        });
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
