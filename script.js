const surahSelect = document.getElementById('surahSelect')
const verseContainer = document.getElementById('verseContainer')

// Dropdown’a 114 sureyi ekle
for (let i = 1; i <= 114; i++) {
  const option = document.createElement('option')
  option.value = i
  option.textContent = `سورة ${i}`
  surahSelect.appendChild(option)
}

surahSelect.addEventListener('change', (e) => {
  loadSurah(e.target.value)
})

loadSurah(1)

function loadSurah(num) {
  fetch(`data/surah/surah_${num}.json`)
    .then(res => res.json())
    .then(surah => {
      verseContainer.innerHTML = `
        <div class="surah-frame">
          <h2>${surah.name}</h2>
          <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        </div>
      `

      const frame = verseContainer.querySelector('.surah-frame')
      const verses = Object.entries(surah.verse)
        .filter(([key]) => key !== "verse_1" && key !== "1") // ← verse_1 tamamen devre dışı

      const lineWidth = 720
      let currentLine = createLine()
      frame.appendChild(currentLine)
      let currentWidth = 0

      verses.forEach(([key, text]) => {
        const words = text.trim().split(/\s+/)
        const ayahEnd = createAyahEnd()

        words.forEach(word => {
          const span = document.createElement('span')
          span.className = 'word'
          span.textContent = word
          frame.appendChild(span) // geçici ölçüm
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
