{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.addEventListener('DOMContentLoaded', () => \{\
    // --- API Key ---\
    const API_KEY = 'P61GTYVnBgZ1UVeVKUqT9WCS';\
\
    // --- Element Selectors ---\
    const splashScreen = document.querySelector('.splash-screen');\
    const appWrapper = document.querySelector('.app-wrapper');\
    const fileUploadInput = document.getElementById('file-upload');\
    const removeBgBtn = document.getElementById('remove-bg-btn');\
    const imagePlaceholder = document.getElementById('image-placeholder');\
    const imageDisplayArea = document.getElementById('image-display-area');\
    const beforeImage = document.getElementById('before-image');\
    const afterImage = document.getElementById('after-image');\
    const afterImageWrapper = document.getElementById('after-image-wrapper');\
    const downloadBtn = document.getElementById('download-btn');\
    const downloadAllBtn = document.getElementById('download-all-btn');\
    const clearHistoryBtn = document.getElementById('clear-history-btn');\
    const historyItemsContainer = document.getElementById('history-items');\
    const colorOptions = document.querySelector('.colors');\
    const customColorPicker = document.getElementById('color-picker');\
    \
    // Before/After Slider\
    const slider = document.getElementById('before-after-slider');\
    const handle = document.getElementById('slider-handle');\
\
    // --- State Management ---\
    let history = [];\
    let currentImage = \{\
        id: null,\
        name: null,\
        originalUrl: null,\
        processedUrl: null,\
        bgColor: 'transparent'\
    \};\
    let isDragging = false;\
\
\
    // --- Initialization ---\
    const init = () => \{\
        // Hide splash screen and show app\
        setTimeout(() => \{\
            splashScreen.classList.add('hidden');\
            appWrapper.classList.add('visible');\
        \}, 1500);\
\
        // Event Listeners\
        fileUploadInput.addEventListener('change', handleFileSelect);\
        removeBgBtn.addEventListener('click', processImage);\
        downloadBtn.addEventListener('click', downloadCurrentImage);\
        downloadAllBtn.addEventListener('click', downloadAllAsZip);\
        clearHistoryBtn.addEventListener('click', clearHistory);\
        colorOptions.addEventListener('click', handleColorChange);\
        customColorPicker.addEventListener('input', handleCustomColorChange);\
\
        // Slider events for both mouse and touch\
        handle.addEventListener('mousedown', startDrag);\
        document.addEventListener('mouseup', endDrag);\
        document.addEventListener('mousemove', moveSlider);\
        \
        slider.addEventListener('touchstart', startDrag);\
        document.addEventListener('touchend', endDrag);\
        document.addEventListener('touchmove', moveSlider);\
\
        // Set up a resize observer to keep the after image aligned\
        new ResizeObserver(() => \{\
            if (!imageDisplayArea.classList.contains('hidden')) \{\
                const sliderRect = slider.getBoundingClientRect();\
                if (sliderRect.width > 0) \{\
                    afterImage.style.width = `$\{sliderRect.width\}px`;\
                \}\
            \}\
        \}).observe(slider);\
    \};\
    \
    // --- File Handling ---\
    const handleFileSelect = (e) => \{\
        const file = e.target.files[0];\
        if (!file) return;\
\
        const reader = new FileReader();\
        reader.onload = (event) => \{\
            currentImage = \{\
                id: Date.now(),\
                name: file.name.replace(/\\.[^/.]+$/, ""),\
                originalUrl: event.target.result,\
                processedUrl: null,\
                bgColor: 'transparent'\
            \};\
            \
            beforeImage.src = currentImage.originalUrl;\
            // Also set afterImage src to original initially to correctly calculate dimensions\
            afterImage.src = currentImage.originalUrl; \
\
            // Set dimensions once the image is loaded to ensure alignment\
            beforeImage.onload = () => \{\
                const sliderRect = slider.getBoundingClientRect();\
                if (sliderRect.width > 0) \{\
                   afterImage.style.width = `$\{sliderRect.width\}px`;\
                \}\
            \};\
            \
            imagePlaceholder.classList.add('hidden');\
            imageDisplayArea.classList.remove('hidden');\
            removeBgBtn.classList.remove('loading');\
            removeBgBtn.disabled = false;\
            downloadBtn.disabled = true;\
\
            // Hide the processed image until it's ready\
            afterImageWrapper.style.opacity = '0';\
\
            resetSlider();\
            updateBackgroundColor('transparent');\
        \};\
        reader.readAsDataURL(file);\
    \};\
\
    // --- API Interaction & Processing ---\
    const processImage = async () => \{\
        if (!fileUploadInput.files[0] && !currentImage.originalUrl) \{\
            alert('Please upload an image first.');\
            return;\
        \}\
\
        toggleLoading(true);\
\
        // Convert data URL back to blob for API submission\
        const blob = await (await fetch(currentImage.originalUrl)).blob();\
        \
        const formData = new FormData();\
        formData.append('image_file', blob, currentImage.name + '.jpg');\
        formData.append('size', 'auto');\
\
        try \{\
            const response = await fetch('https://api.remove.bg/v1.0/removebg', \{\
                method: 'POST',\
                headers: \{ 'X-Api-Key': API_KEY \},\
                body: formData,\
            \});\
\
            if (!response.ok) \{\
                const errorData = await response.json();\
                const errorMessage = errorData.errors?.[0]?.title || 'An unknown error occurred.';\
                throw new Error(`API Error: $\{errorMessage\}`);\
            \}\
\
            const resultBlob = await response.blob();\
            currentImage.processedUrl = URL.createObjectURL(resultBlob);\
            \
            // Set the afterImage source and make it visible\
            afterImage.src = currentImage.processedUrl;\
            afterImageWrapper.style.opacity = '1';\
            \
            downloadBtn.disabled = false;\
            \
            saveToHistory();\
\
        \} catch (error) \{\
            alert(error.message);\
        \} finally \{\
            toggleLoading(false);\
        \}\
    \};\
    \
    const toggleLoading = (isLoading) => \{\
         removeBgBtn.classList.toggle('loading', isLoading);\
         removeBgBtn.disabled = isLoading;\
    \};\
    \
    // --- Drag and Slider Functions ---\
    const startDrag = (e) => \{\
        e.preventDefault();\
        isDragging = true;\
    \}\
\
    const endDrag = () => \{\
        isDragging = false;\
    \}\
\
    function moveSlider(e) \{\
        if (!isDragging) return;\
        const rect = slider.getBoundingClientRect();\
        // Use clientX for mouse events, and the first touch point for touch events\
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;\
        let x = clientX - rect.left;\
        \
        // Constrain the slider handle within the image container\
        if (x < 0) x = 0;\
        if (x > rect.width) x = rect.width;\
        \
        const percent = (x / rect.width) * 100;\
        handle.style.left = `$\{percent\}%`;\
        afterImageWrapper.style.width = `$\{percent\}%`;\
    \}\
    \
    function resetSlider() \{\
        handle.style.left = '50%';\
        afterImageWrapper.style.width = '50%';\
        isDragging = false;\
    \}\
\
    // --- UI & State Updates ---\
    const handleColorChange = (e) => \{\
        if (e.target.classList.contains('color')) \{\
            const color = e.target.dataset.color;\
            updateBackgroundColor(color);\
            currentImage.bgColor = color;\
            if (document.querySelector('.color.active')) \{\
                document.querySelector('.color.active').classList.remove('active');\
            \}\
            e.target.classList.add('active');\
        \}\
    \};\
    \
    const handleCustomColorChange = (e) => \{\
        const color = e.target.value;\
        updateBackgroundColor(color);\
        currentImage.bgColor = color;\
        const activeColor = document.querySelector('.color.active');\
        if (activeColor) activeColor.classList.remove('active');\
    \};\
\
    const updateBackgroundColor = (color) => \{\
        afterImageWrapper.style.backgroundColor = color;\
        // Also update the main image container if the color is not transparent\
        const container = document.querySelector('.image-container');\
        if (color === 'transparent') \{\
             container.style.backgroundImage = 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)';\
        \} else \{\
             container.style.backgroundImage = 'none';\
             container.style.backgroundColor = color;\
        \}\
    \};\
\
    // --- History Management ---\
    const saveToHistory = () => \{\
        const existingIndex = history.findIndex(item => item.id === currentImage.id);\
        if (existingIndex > -1) \{\
            history[existingIndex] = \{ ...currentImage \};\
        \} else \{\
            history.unshift(\{ ...currentImage \});\
        \}\
        renderHistory();\
        // Set the current item as active\
        setTimeout(() => \{\
            const el = document.querySelector(`.history-item[data-id='$\{currentImage.id\}']`);\
            if (el) el.classList.add('active');\
        \}, 0);\
    \};\
\
    const renderHistory = () => \{\
        historyItemsContainer.innerHTML = '';\
        if (history.length === 0) \{\
            historyItemsContainer.innerHTML = '<p class="no-history">No items yet.</p>';\
            downloadAllBtn.disabled = true;\
            clearHistoryBtn.disabled = true;\
            return;\
        \}\
\
        downloadAllBtn.disabled = false;\
        clearHistoryBtn.disabled = false;\
\
        history.forEach(item => \{\
            const historyItemEl = document.createElement('div');\
            historyItemEl.classList.add('history-item');\
            historyItemEl.dataset.id = item.id;\
            historyItemEl.innerHTML = `\
                <img src="$\{item.processedUrl || item.originalUrl\}" alt="Processed thumbnail">\
                <p>$\{item.name\}.png</p>\
            `;\
            historyItemEl.addEventListener('click', () => loadFromHistory(item.id));\
            historyItemsContainer.appendChild(historyItemEl);\
        \});\
    \};\
    \
    const loadFromHistory = (id) => \{\
        const item = history.find(h => h.id === Number(id));\
        if (!item) return;\
        \
        currentImage = \{ ...item \};\
        \
        fileUploadInput.value = ''; // Clear file input\
        beforeImage.src = item.originalUrl;\
        afterImage.src = item.processedUrl || item.originalUrl;\
        \
        if(item.processedUrl) \{\
            afterImageWrapper.style.opacity = '1';\
            downloadBtn.disabled = false;\
            removeBgBtn.disabled = true;\
        \} else \{\
            afterImageWrapper.style.opacity = '0';\
            downloadBtn.disabled = true;\
            removeBgBtn.disabled = false;\
        \}\
        \
        imagePlaceholder.classList.add('hidden');\
        imageDisplayArea.classList.remove('hidden');\
\
        updateBackgroundColor(item.bgColor);\
        resetSlider();\
        \
        // Update active state in UI\
        document.querySelectorAll('.history-item.active').forEach(el => el.classList.remove('active'));\
        document.querySelector(`.history-item[data-id='$\{id\}']`).classList.add('active');\
    \};\
    \
    const clearHistory = () => \{\
        if(confirm('Are you sure you want to clear the entire history?')) \{\
            history = [];\
            renderHistory();\
            // Reset main view\
            imagePlaceholder.classList.remove('hidden');\
            imageDisplayArea.classList.add('hidden');\
            currentImage = \{\};\
        \}\
    \};\
\
    // --- Download Functionality ---\
    const downloadCurrentImage = async () => \{\
        if (!currentImage.processedUrl) return;\
\
        const canvas = document.createElement('canvas');\
        const ctx = canvas.getContext('2d');\
        const img = new Image();\
        img.crossOrigin = "anonymous";\
        \
        img.onload = () => \{\
            canvas.width = img.naturalWidth;\
            canvas.height = img.naturalHeight;\
            \
            if (currentImage.bgColor !== 'transparent') \{\
                ctx.fillStyle = currentImage.bgColor;\
                ctx.fillRect(0, 0, canvas.width, canvas.height);\
            \}\
            \
            ctx.drawImage(img, 0, 0);\
\
            canvas.toBlob((blob) => \{\
                saveAs(blob, `$\{currentImage.name\}_bg_removed.png`);\
            \}, 'image/png');\
        \};\
        \
        img.src = currentImage.processedUrl;\
    \};\
    \
    const downloadAllAsZip = async () => \{\
        if (history.length === 0) return;\
        alert('Preparing ZIP file... This may take a moment.');\
\
        const zip = new JSZip();\
        \
        for (const item of history) \{\
            if (!item.processedUrl) continue;\
            try \{\
                const response = await fetch(item.processedUrl);\
                const blob = await response.blob();\
                zip.file(`$\{item.name\}_bg_removed.png`, blob);\
            \} catch (error) \{\
                console.error(`Failed to fetch image $\{item.name\}:`, error);\
            \}\
        \}\
\
        zip.generateAsync(\{ type: 'blob' \}).then((content) => \{\
            saveAs(content, 'background_removed_images.zip');\
        \});\
    \};\
\
    // --- Start the App ---\
    init();\
\});\
\
}