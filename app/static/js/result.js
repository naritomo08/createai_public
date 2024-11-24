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
            'charachange': 2,
            'charaselect': 100,
            'styleselect': 2,
            'styleselect2': 0,
            'modelchange': 2,
            'modelselect': 7,
            'promptselect': 100,
            'promptinput': '',
            'promptex': 0,
            'promptinput2': '',
            'negativeex': 0,
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
            'timeout': 90,
            'isyousel': 7,
            'japansel': 0,
            'promptj': ''
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
    toggleDisplay('charaDiv', document.getElementById('charachange').value === '2');
    toggleDisplay('modelDiv', document.getElementById('modelchange').value === '2');
    toggleDisplay('promptinputDiv', document.getElementById('promptselect').value === '100');
    toggleDisplay('hresDiv', document.getElementById('hres').checked);
    toggleDisplay('styleDiv', document.getElementById('styleselect').value === '2');
    toggleDisplay('gazouDiv', document.getElementById('gazousize').value === '3');
    toggleDisplay('negativeDiv', document.getElementById('negativeex').value === '1');
    toggleDisplay('promptexDiv', document.getElementById('promptex').value === '1');
    toggleDisplay('samplerDiv', document.getElementById('sampler').value === '2');
    toggleDisplay('exconfDiv', document.getElementById('exconf').checked);
    toggleDisplay('topnameDiv', document.getElementById('topnameselect').value === '1');
    toggleDisplay('isyouDiv', document.getElementById('isyouon').value === '4');
    toggleDisplay('promptjDiv', document.getElementById('japansel').value === '1');

    // 特殊な処理が必要な部分
    var secretChecked = document.getElementById('secret').checked;
    var promptselect = document.getElementById('promptselect');
    if (secretChecked) {
        addSecretOptions(promptselect);
    } else {
        removeSecretOptions(promptselect);
    }
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
        { id: 'charachange', targetId: 'charaDiv', condition: e => e.target.value === '2' },
        { id: 'modelchange', targetId: 'modelDiv', condition: e => e.target.value === '2' },
        { id: 'promptselect', targetId: 'promptinputDiv', condition: e => e.target.value === '100' },
        { id: 'hres', targetId: 'hresDiv', condition: e => e.target.checked },
        { id: 'styleselect', targetId: 'styleDiv', condition: e => e.target.value === '2' },
        { id: 'gazousize', targetId: 'gazouDiv', condition: e => e.target.value === '3' },
        { id: 'negativeex', targetId: 'negativeDiv', condition: e => e.target.value === '1' },
        { id: 'promptex', targetId: 'promptexDiv', condition: e => e.target.value === '1' },
        { id: 'sampler', targetId: 'samplerDiv', condition: e => e.target.value === '2' },
        { id: 'exconf', targetId: 'exconfDiv', condition: e => e.target.checked },
        { id: 'topnameselect', targetId: 'topnameDiv', condition: e => e.target.value === '1' },
        { id: 'isyouon', targetId: 'isyouDiv', condition: e => e.target.value === '4' },
        { id: 'japansel', targetId: 'promptjDiv', condition: e => e.target.value === '1' },
    ];

    // リスナーの登録
    listeners.forEach(listener => {
        document.getElementById(listener.id).addEventListener('change', function(event) {
            handleChange(event, listener.targetId, listener.condition);
        });
    });

    // 特殊な処理が必要な部分
    document.getElementById('secret').addEventListener('change', function() {
        var promptselect = document.getElementById('promptselect');
        if (this.checked) {
            addSecretOptions(promptselect);
        } else {
            removeSecretOptions(promptselect);
        }
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

function clearPromptInput3() {
    document.getElementById('promptinput2').value = '';
}

function clearPromptInput4() {
    document.getElementById('promptj').value = '';
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

function copyPromptInput3() {
    const promptInput2 = document.getElementById('promptinput2');
    if (promptInput2) {
        copyToClipboard(promptInput2.value);
    }
}

function copyPromptInput4() {
    const promptj = document.getElementById('promptj');
    if (promptj) {
        copyToClipboard(promptj.value);
    }
}

function addSecretOptions(selectElement) {
    var options = [
        {value: '101', text: '101.R18 random'},
        {value: '102', text: '102.R18 順序(20)'},
        {value: '1', text: '1.R18 初期ポーズ'},
        {value: '2', text: '2.R18 触手'},
        {value: '3', text: '3.R18 立ちポーズ'},
        {value: '4', text: '4.R18 足開き'},
        {value: '5', text: '5.R18 フェラ'},
        {value: '6', text: '6.R18 機械姦'},
        {value: '7', text: '7.R18 M字開脚'},
        {value: '8', text: '8.R18 さんぽ'},
        {value: '9', text: '9.手縛りギャグボール'},
        {value: '10', text: '10.ハードプレイ'},
        {value: '11', text: '11.GangbangGen'},
        {value: '12', text: '12.四つん這い'},
        {value: '13', text: '13.M字拘束'},
        {value: '14', text: '14.抱えあげ'},
        {value: '15', text: '15.白仮面Rinkan'},
        {value: '16', text: '16.M字アヘ搾乳ふたなり'},
        {value: '17', text: '17.RINKAN'},
        {value: '18', text: '18.磔'},
        {value: '19', text: '19.体操'},
        // {value: '19', text: '19.くぱぁプレイ'},
        {value: '20', text: '20.チン媚びダンス'},
    ];
    options.forEach(function(optionData) {
        var option = document.createElement('option');
        option.value = optionData.value;
        option.text = optionData.text;
        option.classList.add('secret-option');
        selectElement.appendChild(option);
    });
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
