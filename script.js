const surahSelect = document.getElementById('surahSelect')
const verseContainer = document.getElementById('verseContainer')
const playButton = document.getElementById('playButton')
const stopButton = document.getElementById('stopButton')
const resumeButton = document.getElementById('resumeButton')
const showMealButton = document.getElementById('showMealButton')
const mealContainer = document.getElementById('mealContainer')
const mealText = document.getElementById('mealText')

let currentAudio = null
let isPlaying = false
let currentIndex = 0
let currentVerses = []
let currentSurahNum = null

// Sayfa açıldığında sure adlarını yükle
window.addEventListener('DOMContentLoaded', async () => {
  for (let i = 1; i <= 114; i++) {
    try {
      const res = await fetch(`data/surah/surah_${i}.json`)
      const surah = await res.json()
      const option = document.createElement('option')
      option.value = i
      option.textContent = `سورة ${surah.name}`
      surahSelect.appendChild(option)
    } catch (err) {
      console.warn(`Sure ${i} yüklenemedi`, err)
    }
  }

  surahSelect.value = 1
  loadSurah(1)
})

// Sure değişince ses durur, meal gizlenir, yeni sure yüklenir
surahSelect.addEventListener('input', () => {
  stopAudio()
  mealContainer.classList.add('hidden')
  loadSurah(surahSelect.value)
})

// Oynat
playButton.addEventListener('click', () => {
  stopAudio()
  currentIndex = 0
  startAudio()
})

// Devam Ettir
resumeButton.addEventListener('click', () => {
  if (!isPlaying && currentVerses.length > 0) {
    startAudio()
  }
})

// Durdur
stopButton.addEventListener('click', () => {
  stopAudio()
})

// Meali Göster
showMealButton.addEventListener('click', () => {
  loadMeal(surahSelect.value)
})

// Sureyi yükle ve göster
function loadSurah(num) {
  const surahNum = parseInt(num)

  fetch(`data/surah/surah_${surahNum}.json`)
    .then(res => res.json())
    .then(surah => {
      verseContainer.innerHTML = `
        <div class="surah-frame">
          <h2>سورة ${surah.name}</h2>
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

        currentLine.appendChild(ayahEnd)
        currentWidth += 44
      })
    })
    .catch(err => {
      verseContainer.innerHTML = `<p style="color:red;">Sure ${num} yüklenemedi.</p>`
      console.error(`Hata: Sure ${num} yüklenemedi`, err)
    })
}
const toggleTheme = document.getElementById('toggleTheme')

toggleTheme.addEventListener('click', () => {
  document.body.classList.toggle('dark')
  document.body.classList.toggle('light')
})

// Meali yükle ve göster
function loadMeal(num) {
  fetch('meal/meal.json')
    .then(res => res.json())
    .then(data => {
      const mealList = data[num.toString()]
      if (!mealList) return

      mealText.innerHTML = ''
      mealList.forEach(item => {
        const p = document.createElement('p')
        p.textContent = `${item.verse}. ${item.text}`
        mealText.appendChild(p)
      })

      mealContainer.classList.remove('hidden')
    })
    .catch(err => {
      console.error(`Meal ${num} yüklenemedi`, err)
    })
}

// Sesli okuma başlat
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

// Yardımcılar
function stopAudio() {
  if (isPlaying && currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
    isPlaying = false
  }
}

function createLine() {
  const div = document.createElement('div')
  div.className = 'line'
  return div
}

function createAyahEnd() {
  const dot = document.createElement('span')
  dot.className = 'ayah-end'
  return dot
}
