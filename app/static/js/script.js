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
            'gazoucreate': 1,
            'sampler': 0,
            'samplerselect': 7,
            'steps': 30,
            'cfg': 7,
            'isyouon': 1,
            'topnameselect': 0,
            'topnamein': ''
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

        // topnameの初期化
        var topnameDiv = document.getElementById('topnameDiv');
        var topnameselectValue = document.getElementById('topnameselect').value;
        if (topnameselectValue == '1') {
            topnameDiv.style.display = 'block';
        } else {
            topnameDiv.style.display = 'none';
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
    document.getElementById('topnameselect').addEventListener('change', function() {
        var topnameDiv = document.getElementById('topnameDiv');
        if (this.value == '1') {
            topnameDiv.style.display = 'block';
        } else {
            topnameDiv.style.display = 'none';
        }
    });

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
