let socket;
socket = io('')

import { calculateCountdown } from './countdown.utils.js'

const clockSpan = document.getElementById('clock')
const countdownSpan = document.getElementById('countdown')
const statusSpan = document.getElementById('status')

function clockTimer() {
    const date = new Date();
    clockSpan.textContent = date.toLocaleTimeString();
}

clockTimer();
statusSpan.textContent = ''
setInterval(clockTimer, 1000);

let roomId = (new URL(document.location)).searchParams.get("id");

let countdownInterval;

function setCountdown(countdown, pauseBuffer, startEpoch, currentEpoch) {
    const countdownLeft = calculateCountdown(countdown, pauseBuffer, startEpoch, currentEpoch)
    countdownSpan.textContent = countdownLeft
    if (countdownLeft <= 0) statusSpan.textContent = 'done'
    return countdownLeft
}

function processRoomUpdate(room) {
    if (countdownInterval) clearInterval(countdownInterval)
    else console.log('already cleared')
    /* no validation. assuming it is all correct */
    if (room.instruction === 'set') {
        countdownSpan.textContent = room.countdown
        statusSpan.textContent = 'idle'
    } else if (room.instruction === 'start') {
        statusSpan.textContent = 'running'
        setCountdown(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
        countdownInterval = setInterval(() => {
            const countdownLeft = setCountdown(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
            if (countdownLeft <= 0) clearInterval(countdownInterval)
        }, 100)
    } else if (room.instruction === 'pause') {
        statusSpan.textContent = 'paused'
        setCountdown(room.countdown, room.pauseBuffer, room.startEpoch, room.pauseEpoch)
    } else {
        /* restart */
        statusSpan.textContent = 'restarted'
        countdownSpan.textContent = room.countdown
        countdownInterval = setInterval(() => {
            const countdownLeft = setCountdown(room.countdown, room.pauseBuffer, room.startEpoch, Date.now())
            if (countdownLeft <= 0) clearInterval(countdownInterval)
        }, 100)
    }
}


async function init() {
    try {
        const res = await fetch('room-info?'  + new URLSearchParams({ id: roomId }), {
            method: 'GET',
        })
    
        if (res.status !== 200) {
            console.log('fail to init room....') // bad response from backend
            console.log(await res.text())
            return
        }
        const room = await res.json()
        processRoomUpdate(room)
        socket.emit('join-room', roomId)
    } catch (err) {
        console.log(`caught error: ${err}`) // cant reach backend
        return
    }
}

socket.on('toggle-countdown', (room) => processRoomUpdate(room))

init()