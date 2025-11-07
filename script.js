const surahSelect = document.getElementById('surahSelect')
const verseContainer = document.getElementById('verseContainer')
const playButton = document.getElementById('playButton')
const stopButton = document.getElementById('stopButton')
const resumeButton = document.getElementById('resumeButton')

let currentAudio = null
let isPlaying = false
let currentIndex = 0
let currentVerses = []
let currentSurahNum = null

// Hızlı dropdown için tek JSON'dan yükle
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/surah-list.json')
    const list = await res.json()

    list.forEach(surah => {
      const option = document.createElement('option')
      option.value = surah.id
      option.textContent = ` ${surah.name}`
      surahSelect.appendChild(option)
    })

    surahSelect.value = 1
    loadSurah(1)
  } catch (err) {
    console.error('Sure listesi yüklenemedi', err)
  }
})

// Sure değişince anında yükle
surahSelect.addEventListener('input', () => {
  stopAudio()
  loadSurah(surahSelect.value)
})

// Oku
playButton.addEventListener('click', () => {
  stopAudio()
  currentIndex = 0
  startAudio()
})

// Devam
resumeButton.addEventListener('click', () => {
  if (!isPlaying && currentVerses.length > 0) {
    startAudio()
  }
})

// Durdur
stopButton.addEventListener('click', () => {
  stopAudio()
})

// Başlat
function startAudio() {
  const surahNum = parseInt(surahSelect.value)
  const audioSurah = surahNum.toString().padStart(3, '0')
  currentSurahNum = audioSurah

  fetch(`data/surah/surah_${surahNum}.json`)
    .then(res => res.json())
    .then(surah => {
      currentVerses = Object.entries(surah.verse)
      isPlaying = true
      playNext()
    })
}

function playNext() {
  if (currentIndex >= currentVerses.length) {
    isPlaying = false
    return
  }

  const ayahKey = currentVerses[currentIndex][0]
  const ayahNum = ayahKey.split('_')[1].padStart(3, '0')
  currentAudio = new Audio(`audio/${currentSurahNum}/${ayahNum}.mp3`)
  currentAudio.play()
  currentAudio.onended = () => {
    currentIndex++
    playNext()
  }
}

// Sureyi yükle
function loadSurah(num) {
  const surahNum = parseInt(num)

  fetch(`data/surah/surah_${surahNum}.json`)
    .then(res => res.json())
    .then(surah => {
      verseContainer.innerHTML = `
        <div class="surah-frame">
          <h2> ${surah.name}</h2>
          <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        </div>
      `

      const frame = verseContainer.querySelector('.surah-frame')
      const verses = Object.entries(surah.verse)
      const lineWidth = 720
      let currentLine = createLine()
      frame.appendChild(currentLine)
      let currentWidth = 0

      verses.forEach(([_, text]) => {
        const words = text.trim().split(/\s+/)
        const ayahEnd = createAyahEnd()

        words.forEach(word => {
          const span = document.createElement('span')
          span.className = 'word'
          span.textContent = word
          frame.appendChild(span)
          const wordWidth = span.offsetWidth
          frame.removeChild(span)

          if (currentWidth + wordWidth > lineWidth) {
            currentLine = createLine()
            frame.appendChild(currentLine)
            currentWidth = 0
          }

          currentLine.appendChild(span)
          currentWidth += wordWidth + 8
        })

