document.addEventListener('DOMContentLoaded', function() {
    let parameters = null;
    try {
        parameters = JSON.parse(localStorage.getItem('parameters'));
    } catch (e) {
        console.error('Error parsing parameters from localStorage:', e);
    }

    if (parameters) {
        // フィールドとデフォルト値のマッピング
        const fields = {
            'sd_url': '',
            'promptinput': '',
            'negativeinput': '',
            'gazousize': 1,
            'gazouselect': 2,
            'seed': -1,
            'sampler': 0,
            'samplerselect': 7,
            'steps': 30,
            'cfg': 7,
            'gazoucreate': 1,
            'timeout': 300
        };

        // 各フィールドに対して値を設定
        for (const [fieldId, defaultValue] of Object.entries(fields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = parameters[fieldId] || defaultValue;
            }
        }
    }

    // localStorageをクリア
    localStorage.removeItem('parameters');

    // 初期化処理
    function initializeDisplay() {

        // hresの初期化
        var hresDiv = document.getElementById('hresDiv');
        var hresChecked = document.getElementById('hres').checked;
        if (hresChecked) {
            hresDiv.style.display = 'block';
        } else {
            hresDiv.style.display = 'none';
        }

        // gazousizeの初期化
        var gazouDiv = document.getElementById('gazouDiv');
        var gazousizeValue = document.getElementById('gazousize').value;
        if (gazousizeValue == '3') {
            gazouDiv.style.display = 'block';
        } else {
            gazouDiv.style.display = 'none';
        }

        // samplerの初期化
        var samplerDiv = document.getElementById('samplerDiv');
        var samplerValue = document.getElementById('sampler').value;
        if (samplerValue == '2') {
            samplerDiv.style.display = 'block';
        } else {
            samplerDiv.style.display = 'none';
        }

        // exconfの初期化
        var exconfDiv = document.getElementById('exconfDiv');
        var exconfChecked = document.getElementById('exconf').checked;
        if (exconfChecked) {
            exconfDiv.style.display = 'block';
        } else {
            exconfDiv.style.display = 'none';
        }

    }

    // ページロード時に初期化
    initializeDisplay();

    // イベントリスナー
    document.getElementById('hres').addEventListener('change', function() {
        var hresDiv = document.getElementById('hresDiv');
        if (this.checked) {
            hresDiv.style.display = 'block';
        } else {
            hresDiv.style.display = 'none';
        }
    });
    document.getElementById('gazousize').addEventListener('change', function() {
        var gazouDiv = document.getElementById('gazouDiv');
        if (this.value == '3') {
            gazouDiv.style.display = 'block';
        } else {
            gazouDiv.style.display = 'none';
        }
    });
    document.getElementById('sampler').addEventListener('change', function() {
        var samplerDiv = document.getElementById('samplerDiv');
        if (this.value == '2') {
            samplerDiv.style.display = 'block';
        } else {
            samplerDiv.style.display = 'none';
        }
    });
    document.getElementById('exconf').addEventListener('change', function() {
        var exconfDiv = document.getElementById('exconfDiv');
        if (this.checked) {
            exconfDiv.style.display = 'block';
        } else {
            exconfDiv.style.display = 'none';
        }
    });

    document.getElementById('myForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        try {
            await updateCSRFToken(); // CSRFトークンを更新
        } catch (error) {
            console.error('CSRFトークン更新中にエラー:', error);
            alert('エラーが発生しました。後でもう一度試してください。');
        }
    });

    // CSRFトークン更新関数
    async function updateCSRFToken() {
        try {
            const response = await fetch('/get_csrf_token');
            if (!response.ok) throw new Error('CSRFトークン取得失敗');
            const data = await response.json();
            const csrfToken = data.csrf_token;

            document.querySelectorAll('input[name="csrf_token"]').forEach(input => {
                input.value = csrfToken;
            });
        } catch (error) {
            console.error('CSRFトークンの更新失敗:', error);
            throw error;
        }
    }

    fetchTasks();
    setInterval(fetchTasks, 5000); // 5秒ごとにタスク情報を更新
});

function clearPromptInput() {
    document.getElementById('promptinput').value = '';
}

function clearPromptInput2() {
    document.getElementById('negativeinput').value = '';
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('コピーしました!');
        }).catch(err => {
            alert('コピーに失敗しました: ' + err);
        });
    } else if (document.execCommand) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('コピーしました!');
        } catch (err) {
            alert('コピーに失敗しました: ' + err);
        }
        document.body.removeChild(textarea);
    } else {
        alert('このブラウザではクリップボード機能がサポートされていません。');
    }
}

function copyPromptInput() {
    const promptInput = document.getElementById('promptinput');
    if (promptInput) {
        copyToClipboard(promptInput.value);
    }
}

function copyPromptInput2() {
    const negativeInput = document.getElementById('negativeinput');
    if (negativeInput) {
        copyToClipboard(negativeInput.value);
    }
}

function removeSecretOptions(selectElement) {
    var secretOptions = selectElement.querySelectorAll('.secret-option');
    secretOptions.forEach(function(option) {
        option.remove();
    });
}

function confirmCancel() {
    return confirm("本当にキャンセルしますか？");
}

function reflectToTop(parameters) {
    // パラメータをJSON形式で保存
    localStorage.setItem('parameters', JSON.stringify(parameters));
    // トップページにリダイレクト
    window.location.href = '/';
}

function fetchTasks() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    fetch('/tasks', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            const processingTasksTableBody = document.getElementById('processingTasksTableBody');
            const completedTasksTableBody = document.getElementById('completedTasksTableBody');

            processingTasksTableBody.innerHTML = '';
            completedTasksTableBody.innerHTML = '';

            data.processing_tasks.forEach(task => {
                const tr = document.createElement('tr');

                const taskIdCell = document.createElement('td');
                const form = document.createElement('form');
                form.id = `form-${task.id}`;
                form.action = '/task_result';
                form.method = 'post';
                form.style.display = 'none';

                // CSRFトークンをフォームに追加
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = csrfToken; // CSRFトークンをセット
                form.appendChild(csrfInput);

                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'task_id';
                input.value = task.id;
                form.appendChild(input);

                const link = document.createElement('a');
                link.href = '#';
                link.onclick = () => form.submit();
                link.textContent = task.id;

                taskIdCell.appendChild(form);
                taskIdCell.appendChild(link);
                tr.appendChild(taskIdCell);

                const statusCell = document.createElement('td');
                statusCell.textContent = task.status;
                tr.appendChild(statusCell);

                const createdAtCell = document.createElement('td');
                createdAtCell.textContent = task.created_at;
                tr.appendChild(createdAtCell);

                const startTimeCell = document.createElement('td');
                startTimeCell.textContent = task.start_time;
                tr.appendChild(startTimeCell);

                const endTimeCell = document.createElement('td');
                endTimeCell.textContent = task.end_time;
                tr.appendChild(endTimeCell);

                processingTasksTableBody.appendChild(tr);
            });

            data.completed_tasks.forEach(task => {
                const tr = document.createElement('tr');

                const taskIdCell = document.createElement('td');
                const form = document.createElement('form');
                form.id = `form-${task.id}`;
                form.action = '/task_result';
                form.method = 'post';
                form.style.display = 'none';

                // CSRFトークンをフォームに追加
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = csrfToken; // CSRFトークンをセット
                form.appendChild(csrfInput);

                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'task_id';
                input.value = task.id;
                form.appendChild(input);

                const link = document.createElement('a');
                link.href = '#';
                link.onclick = () => form.submit();
                link.textContent = task.id;

                taskIdCell.appendChild(form);
                taskIdCell.appendChild(link);
                tr.appendChild(taskIdCell);

                const statusCell = document.createElement('td');
                statusCell.textContent = task.status;
                tr.appendChild(statusCell);

                const createdAtCell = document.createElement('td');
                createdAtCell.textContent = task.created_at;
                tr.appendChild(createdAtCell);

                const startTimeCell = document.createElement('td');
                startTimeCell.textContent = task.start_time;
                tr.appendChild(startTimeCell);

                const endTimeCell = document.createElement('td');
                endTimeCell.textContent = task.end_time;
                tr.appendChild(endTimeCell);

                completedTasksTableBody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

function confirmDeleteTasks() {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    if (confirm('本当にすべてのタスクを削除しますか？この操作は取り消せません。')) {
        fetch('/delete_all_tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                // タスクテーブルの内容をリフレッシュ
                fetchTasks();
            } else {
                alert('エラーが発生しました: ' + data.message);
            }
        })
        .catch(error => alert('エラーが発生しました: ' + error));
    }
}

async function showPngModal(task_id) {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
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
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
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

function fetchMetadata(filename) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

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
