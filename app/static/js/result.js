function confirmCancel() {
    return confirm("本当にキャンセルしますか？");
}

function reflectToTop(parameters) {
    localStorage.setItem('parameters', JSON.stringify(parameters));
    // トップページにリダイレクト
    window.location.href = '/';
}

// CSRFトークン更新関数
async function updateCSRFToken() {
    try {
        const response = await fetch('/get_csrf_token');
        if (!response.ok) throw new Error('CSRFトークン取得失敗');
        const data = await response.json();
        const csrfToken = data.csrf_token;
        return csrfToken;
    } catch (error) {
        console.error('CSRFトークンの更新失敗:', error);
        throw error;
    }
}

async function showPngModal(task_id) {
    try {
        const csrfToken = await updateCSRFToken();
        const response = await fetch('/api/get_png_urls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ task_id: task_id })
        });
        const data = await response.json();
        if (!data.png_urls) throw new Error('PNG画像が見つかりません');

        const carouselContent = document.getElementById('png-carousel-content');
        carouselContent.innerHTML = '';

        data.png_urls.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            item.innerHTML = `<img data-src="${url}" class="d-block w-100" alt="PNG Image">`;
            carouselContent.appendChild(item);
        });

        const downloadPngZip = document.getElementById('downloadPngZip');
        downloadPngZip.style.display = data.status === 'completed' ? 'block' : 'none';
        downloadPngZip.href = `/download_png_zip/${task_id}`;

        new bootstrap.Modal(document.getElementById('pngModal')).show();

        const pngCarousel = document.getElementById('pngCarousel');
        new bootstrap.Carousel(pngCarousel, { interval: false });

        pngCarousel.addEventListener('slid.bs.carousel', function () {
            updateFilenameAndMetadata('pngCarousel', 'png-filename-display');
        });

        updateFilenameAndMetadata('pngCarousel', 'png-filename-display');
    } catch (error) {
        alert("PNG画像の取得に失敗しました: " + error.message);
    }
}

async function setupCarouselModal(task_id, modalId, carouselId, carouselContentId, filenameDisplayId, slideInterval = false) {
    try {
        const csrfToken = await updateCSRFToken();
        const response = await fetch('/api/get_jpg_urls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ task_id: task_id })
        });
        const data = await response.json();
        if (!data.jpg_urls) throw new Error('JPG画像が見つかりません');

        const carouselContent = document.getElementById(carouselContentId);
        carouselContent.innerHTML = '';

        data.jpg_urls.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item ${index === 0 ? 'active' : ''}`;
            item.innerHTML = `<img data-src="${url}" class="d-block w-100" alt="JPG Image">`;
            carouselContent.appendChild(item);
        });

        const downloadJpgZip = document.getElementById('downloadJpgZip');
        downloadJpgZip.style.display = data.status === 'completed' ? 'block' : 'none';
        downloadJpgZip.href = `/download_jpg_zip/${task_id}`;

        new bootstrap.Modal(document.getElementById(modalId)).show();

        const carousel = document.getElementById(carouselId);
        new bootstrap.Carousel(carousel, { interval: slideInterval });

        // スライドが切り替わったときにメタデータを更新
        carousel.addEventListener('slid.bs.carousel', function () {
            updateFilenameAndMetadata(carouselId, filenameDisplayId);
        });

        // 初回のメタデータ表示を呼び出す
        updateFilenameAndMetadata(carouselId, filenameDisplayId);
    } catch (error) {
        alert("画像の取得に失敗しました: " + error.message);
    }
}

function showJpgModal(task_id) {
    setupCarouselModal(task_id, 'jpgModal', 'jpgCarousel', 'jpg-carousel-content', 'jpg-filename-display', false);
}

function showJpgSlideModal(task_id) {
    setupCarouselModal(task_id, 'jpgModal2', 'jpgCarousel2', 'jpg-carousel-content2', 'jpg-filename-display2', 2000);
}

function updateFilenameAndMetadata(carouselId, filenameDisplayId) {
    const carousel = document.getElementById(carouselId);
    const activeImage = carousel.querySelector(".carousel-item.active img");

    if (activeImage && !activeImage.src) {
        activeImage.src = activeImage.getAttribute('data-src'); // 必要なときのみロード
    }

    const imagePath = activeImage.src;
    const filename = imagePath.substring(imagePath.lastIndexOf('/') + 1);
    document.getElementById(filenameDisplayId).textContent = filename;

    if (carouselId === 'pngCarousel') { 
        fetchMetadata(filename);
    }
}

async function fetchMetadata(filename) {
    const csrfToken = await updateCSRFToken();

    fetch('/get_metadata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ image_filename: filename })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("メタデータの取得に失敗しました: " + data.error);
            return;
        }

        const metadataDiv = document.getElementById("metadata");
        const parameters = data.info.parameters.split('\n');

        let positivePrompt = '', negativePrompt = '', settings = '';
        parameters.forEach(section => {
            if (section.startsWith('Negative prompt:')) {
                negativePrompt = section.replace('Negative prompt:', '').trim();
            } else if (section.startsWith('Steps:') || section.includes('Sampler:')) {
                settings += section.trim() + '<br>';
            } else {
                positivePrompt += section.trim() + '<br>';
            }
        });

        metadataDiv.innerHTML = `
            <p><strong>メタデータ:</strong></p>
            <p>画像の幅: ${data.width}px</p>
            <p>画像の高さ: ${data.height}px</p>
            <p>色モード: ${data.mode}</p>
            <p>フォーマット: ${data.format}</p>
            <p><strong>プロンプト:</strong><br>${positivePrompt}</p>
            <p><strong>ネガティブプロンプト:</strong><br>${negativePrompt}</p>
            <p><strong>設定:</strong><br>${settings}</p>
        `;
        metadataDiv.style.display = "block";  // メタデータが表示されるようにする
    })
    .catch(error => alert("メタデータの取得中にエラーが発生しました: " + error));
}

async function submitCancelForm() {
    if (!confirmCancel()) return; // キャンセル確認ダイアログ

    const form = document.getElementById('cancelForm');
    try {
        const csrfToken = await updateCSRFToken(); // CSRFトークンを取得
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput); // 動的にトークンを追加
        form.submit(); // フォーム送信
    } catch (error) {
        alert('フォーム送信エラー: CSRFトークンの更新に失敗しました。');
    }
}
