document.addEventListener('DOMContentLoaded', function () {
    initializeParameters(); // フィールドとローカルストレージの初期化
    initializeDisplay(); // 画面表示の初期化
    initializeEventListeners(); // イベントリスナーの初期化
    startTaskFetching(); // タスク取得処理の定期実行
});

// ローカルストレージとフィールド初期化
function initializeParameters() {
    let parameters = null;
    try {
        parameters = JSON.parse(localStorage.getItem('parameters'));
    } catch (e) {
        console.error('Error parsing parameters from localStorage:', e);
    }

    if (parameters) {
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
            'topnamein': '',
            'timeout': 300
        };

        for (const [fieldId, defaultValue] of Object.entries(fields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = parameters[fieldId] || defaultValue;
            }
        }
    }

    localStorage.removeItem('parameters'); // データをクリア
}

// 画面表示の初期化
function initializeDisplay() {
    // 要素の表示・非表示を切り替える関数
    function toggleDisplay(elementId, condition) {
        var element = document.getElementById(elementId);
        element.style.display = condition ? 'block' : 'none';
    }

    // 表示・非表示の初期化
    toggleDisplay('hresDiv', document.getElementById('hres').checked);
    toggleDisplay('gazouDiv', document.getElementById('gazousize').value === '3');
    toggleDisplay('samplerDiv', document.getElementById('sampler').value === '2');
    toggleDisplay('exconfDiv', document.getElementById('exconf').checked);
    toggleDisplay('topnameDiv', document.getElementById('topnameselect').value === '1');
}

// イベントリスナーの初期化
function initializeEventListeners() {
    // 共通化されたイベントハンドラ
    function handleChange(event, elementId, conditionFn) {
        var element = document.getElementById(elementId);
        element.style.display = conditionFn(event) ? 'block' : 'none';
    }

    // 動的なリスナー登録データ
    const listeners = [
        { id: 'hres', targetId: 'hresDiv', condition: e => e.target.checked },
        { id: 'gazousize', targetId: 'gazouDiv', condition: e => e.target.value === '3' },
        { id: 'sampler', targetId: 'samplerDiv', condition: e => e.target.value === '2' },
        { id: 'exconf', targetId: 'exconfDiv', condition: e => e.target.checked },
        { id: 'topnameselect', targetId: 'topnameDiv', condition: e => e.target.value === '1' },
    ];

    // リスナーの登録
    listeners.forEach(listener => {
        document.getElementById(listener.id).addEventListener('change', function(event) {
            handleChange(event, listener.targetId, listener.condition);
        });
    });
}

// タスク取得処理を定期実行
function startTaskFetching() {
    fetchTasks();
    setInterval(fetchTasks, 5000); // 5秒ごとに更新
}

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

async function fetchTasks() {
    const csrfToken = await updateCSRFToken();

    // タスク行を作成するヘルパー関数
    function createTaskRow(task, tableBody) {
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
        csrfInput.value = csrfToken;
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

        tableBody.appendChild(tr);
    }

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

            // テーブルの内容をリセット
            processingTasksTableBody.innerHTML = '';
            completedTasksTableBody.innerHTML = '';

            // 処理中タスクを作成
            data.processing_tasks.forEach(task => createTaskRow(task, processingTasksTableBody));

            // 完了タスクを作成
            data.completed_tasks.forEach(task => createTaskRow(task, completedTasksTableBody));
        })
        .catch(error => console.error('Error fetching tasks:', error));
}

async function confirmDeleteTasks() {
    const csrfToken = await updateCSRFToken();
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

// CSRFトークン更新関数
async function updateCSRFToken(event) {
    event.preventDefault();
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

async function submitForm() {

    const form = document.getElementById('myForm');
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
