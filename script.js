// 🌙 Element Referansları
const surahSelect = document.getElementById('surahSelect')
const verseContainer = document.getElementById('verseContainer')
const playButton = document.getElementById('playButton')
const stopButton = document.getElementById('stopButton')
const resumeButton = document.getElementById('resumeButton')
const showMealButton = document.getElementById('showMealButton')
const mealContainer = document.getElementById('mealContainer')
const mealText = document.getElementById('mealText')
const toggleTheme = document.getElementById('toggleTheme')

// 🔊 Ses Oynatma Değişkenleri
let currentAudio = null
let isPlaying = false
let currentIndex = 0
let currentVerses = []
let currentSurahNum = null

// 🚀 Sayfa Açılışında
window.addEventListener('DOMContentLoaded', async () => {
  // Tema tercihini yükle
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    document.body.classList.add('light')
    toggleTheme.textContent = '🌙 Koyu Tema'
  }

  // Sure adlarını yükle
  for (let i = 1; i <= 114; i++) {
    try {
      const cached = localStorage.getItem(`surah_meta_${i}`)
      const surah = cached ? JSON.parse(cached) : await fetchSurah(i)
      if (!cached) localStorage.setItem(`surah_meta_${i}`, JSON.stringify(surah))

      const option = document.createElement('option')
      option.value = i
      option.textContent = `${surah.name} Suresi` 
      surahSelect.appendChild(option)
    } catch (err) {
      console.warn(`Sure ${i} yüklenemedi`, err)
    }
  }

  surahSelect.value = 1
  loadSurah(1)
})

// 🎨 Tema Geçişi
toggleTheme.addEventListener('click', () => {
  document.body.classList.toggle('light')
  const isLight = document.body.classList.contains('light')
  localStorage.setItem('theme', isLight ? 'light' : 'dark')
  toggleTheme.textContent = isLight ? '🌙 Koyu Tema' : '☀️ Açık Tema'
})

// 🔁 Sure Değişince
surahSelect.addEventListener('input', () => {
  stopAudio()
  mealContainer.classList.add('hidden')
  loadSurah(surahSelect.value)
})

// ▶️ Oynat
playButton.addEventListener('click', () => {
  stopAudio()
  currentIndex = 0
  startAudio()
})

// ⏯️ Devam Ettir
resumeButton.addEventListener('click', () => {
  if (!isPlaying && currentVerses.length > 0) startAudio()
})

// ⏹️ Durdur
stopButton.addEventListener('click', stopAudio)

// 📖 Meal Göster
showMealButton.addEventListener('click', () => {
  loadMeal(surahSelect.value)
})

// 📦 Sure JSON'u getir
async function fetchSurah(num) {
  const res = await fetch(`data/surah/surah_${num}.json`)
  return await res.json()
}

// 📖 Sureyi Yükle ve Göster
async function loadSurah(num) {
  const surahNum = parseInt(num)
  const cached = localStorage.getItem(`surah_${surahNum}`)
  const surah = cached ? JSON.parse(cached) : await fetchSurah(surahNum)
  if (!cached) localStorage.setItem(`surah_${surahNum}`, JSON.stringify(surah))

  verseContainer.innerHTML = `
    <div class="surah-frame">
      <h2>${surah.name} Suresi</h2>
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
      currentLine.appendChild(span)

      const wordWidth = span.getBoundingClientRect().width
      if (currentWidth + wordWidth > lineWidth) {
        currentLine = createLine()
        frame.appendChild(currentLine)
        currentWidth = 0
        currentLine.appendChild(span)
      }

      currentWidth += wordWidth + 8
    })

    currentLine.appendChild(ayahEnd)
    currentWidth += 44
  })
}

// 📖 Meal Yükle
async function loadMeal(num) {
  const cached = localStorage.getItem('mealData')
  const data = cached ? JSON.parse(cached) : await fetchMeal()
  if (!cached) localStorage.setItem('mealData', JSON.stringify(data))

  const mealList = data[num.toString()]
  if (!mealList) return

  mealText.innerHTML = ''
  mealList.forEach(item => {
    const p = document.createElement('p')
    p.textContent = `${item.verse}. ${item.text}`
    mealText.appendChild(p)
  })

  mealContainer.classList.remove('hidden')
}

async function fetchMeal() {
  const res = await fetch('meal/meal.json')
  return await res.json()
}

// 🔊 Sesli Okuma Başlat
async function startAudio() {
  const surahNum = parseInt(surahSelect.value)
  const audioSurah = surahNum.toString().padStart(3, '0')
  currentSurahNum = audioSurah

  const cached = localStorage.getItem(`surah_${surahNum}`)
  const surah = cached ? JSON.parse(cached) : await fetchSurah(surahNum)
  if (!cached) localStorage.setItem(`surah_${surahNum}`, JSON.stringify(surah))

  currentVerses = Object.entries(surah.verse)
  isPlaying = true
  playNext()
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

// ⏹️ Ses Durdur
function stopAudio() {
  if (isPlaying && currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
    isPlaying = false
  }
}

// 🧱 Yardımcılar
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
