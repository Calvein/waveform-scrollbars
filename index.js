import getSongData from 'soundcloud-badge'

// Change this if you want, but it has to be downloadable for CORS
const url = 'http://soundcloud.com/edbangerrecords/breakbot-back-for-more'
const clientId = '5247b2c9dddfe7afb755c75a6198999d'
const body = document.body
// When the user don't have scrollbars
const defaultWidth = 980

// Audio variables
let audio = new Audio()
let audioCtx = new AudioContext()
let analyser = audioCtx.createAnalyser()
let source = audioCtx.createMediaElementSource(audio)
audio.crossOrigin = 'anonymous'
source.connect(audioCtx.destination)
source.connect(analyser)
const bufferLength = analyser.frequencyBinCount

getSongData({
    client_id: clientId
  , song: url
  , dark: true
}, (err, streamUrl) => {
    if (err) throw err
    audio.src = streamUrl
    setScrollbars()
})

let data = new Uint8Array(bufferLength)
let raf
const tick = () => {
    // Mutate data with the current playing data
    analyser.getByteTimeDomainData(data)
    const bucketSize = bufferLength / nbScrollbars

    for (let i = 0; i * bucketSize <= bufferLength; i++) {
        // The end might not be precise, I'm fine with that
        if (!scrollbars[i]) break

        let datum = data.slice(
            i * bucketSize
          , (i + 1) * bucketSize
        )
        let value = datum.reduce((a, b) => a + b, 0) / datum.length
        setScrollbarHeight(scrollbars[i], value)
    }

    raf = requestAnimationFrame(tick)
}

let nbScrollbars
let scrollbars
const setScrollbars = () => {
    body.style.overflowY = 'scroll'
    let scrollbarWidth = window.innerWidth - body.clientWidth
    let hasScrollbars = true
    body.style.overflow = 'auto'

    if (scrollbarWidth <= 1) {
        scrollbarWidth = defaultWidth
        hasScrollbars = false
    }

    // +1 because we're removing the body scrollbar afterwards
    nbScrollbars = Math.floor(body.clientWidth / scrollbarWidth) + 1
    scrollbars = []

    // Remove old ones
    ;[].forEach.call(document.querySelectorAll('u'), (el) => {
        el.remove()
    })

    let i = nbScrollbars
    while(i--) {
        let el = document.createElement('u')
        body.appendChild(el)
        setScrollbarHeight(el)
        if (!hasScrollbars) {
            el.style.width = defaultWidth + 'px'
        }
        scrollbars.push(el)
    }

}

const setScrollbarHeight = (el, value = 128) => {
    let height = window.innerHeight * .9 * value / 255
    el.style.height = height + 'px'
}

window.addEventListener('resize', (e) => {
    setScrollbars()
})

// Play/pause on space or click
const togglePlay = () => {
    if (audio.paused) {
        let intro = document.querySelector('span')
        intro && intro.remove()
        audio.play()
        tick()
    } else {
        cancelAnimationFrame(raf)
        audio.pause()
    }
}

document.addEventListener('keydown', (e) => {
    if (e.keyCode !== 32) return
    togglePlay()
})
document.addEventListener('click', togglePlay)