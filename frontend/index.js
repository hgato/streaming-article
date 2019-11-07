function getName() {
    return +new Date()
}

const STREAM_NAME = getName()

function permittedGetUserMedia() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

function sendFile(file, chunkNumber) {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('name', STREAM_NAME);
    formData.append('chunk', chunkNumber);

    fetch('/api/upload', {
        method: 'PUT',
        body: formData
    });
}

function registerRecord(stream) {
    const mediaRecorder = new MediaRecorder(stream)
    let countUploadChunk = 0

    mediaRecorder.ondataavailable = (data) => {
        sendFile(data.data, countUploadChunk)
        countUploadChunk++
    }
    mediaRecorder.start()

    setInterval(() => {
        mediaRecorder.requestData()
    }, 2000)
}

function registerPlayer(mediaSource) {
    const videoBuffer = mediaSource.addSourceBuffer('video/webm;codecs=vp8');
    let countDownloadChunk = 0

    setInterval(() => {
        fetch(`/api/download?name=${STREAM_NAME}&chunk=${countDownloadChunk}`)
            .then((response) => {
                if (response.status !== 200) {
                    throw Error('no such file')
                }
                return response.arrayBuffer()
            }).then((buffer) => {
                countDownloadChunk++
                videoBuffer.appendBuffer(buffer)
            }).catch(() => {})
    }, 1000)
}

function processStream(stream, mediaSource) {
    registerRecord(stream)
    registerPlayer(mediaSource)
}


if (permittedGetUserMedia()) {
    const video = document.querySelector('video');
    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    navigator.mediaDevices.getUserMedia({
        video: true
    }).then((stream) => processStream(stream, mediaSource));
}