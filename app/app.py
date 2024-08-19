from flask import Flask, request, render_template, jsonify, session, redirect, url_for
import re
import redis
import uuid
from celery import Celery
import subprocess
import time
from datetime import datetime
import pytz
import json
from flask_wtf.csrf import CSRFProtect
import os

app = Flask(__name__)

# セキュリティ上の理由でシークレットキーを設定
app.secret_key = os.environ.get('SECRET_KEY', 'your_fixed_secret_key_here')

# CSRF保護を有効化
csrf = CSRFProtect(app)

redis_client = redis.Redis(host='redis', port=6379, db=0)

def log_to_redis(log_message):
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'message': log_message
    }
    redis_client.rpush('logs', json.dumps(log_entry))

# FlaskとCeleryの設定
app.config['broker_url'] = 'redis://redis:6379/0'
app.config['result_backend'] = 'redis://redis:6379/0'

celery = Celery(app.name, broker=app.config['broker_url'])
celery.conf.update(app.config)

# 同時実行数を1に設定
celery.conf.update({'worker_concurrency': 1})

# 結果の有効期限（秒単位）
RESULT_EXPIRATION_TIME = 86400

def update_variable(content, variable, value):
    if isinstance(value, str):
        value = f'"{value}"'  # 文字列の場合はダブルコーテーションで囲む
    else:
        value = str(value)  # それ以外の場合はそのまま文字列に変換
    pattern = rf'{variable}\s*=\s*.*'
    replacement = f'{variable} = {value}'
    return re.sub(pattern, replacement, content)

def convert_to_jst(timestamp):
    utc_dt = datetime.fromtimestamp(timestamp, tz=pytz.utc)
    jst = pytz.timezone('Asia/Tokyo')
    jst_dt = utc_dt.astimezone(jst)
    return jst_dt.strftime('%Y-%m-%d %H:%M:%S %Z')

@app.route('/')
def index():
    log_to_redis("Rendering index.html")
    return render_template('index.html')

@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        processing_tasks = redis_client.smembers('processing_tasks')
        processing_tasks = [task.decode('utf-8') for task in processing_tasks]

        completed_tasks = redis_client.smembers('completed_tasks')
        completed_tasks = [task.decode('utf-8') for task in completed_tasks]

        def get_task_details(task_ids, status):
            task_details = []
            for task_id in task_ids:
                params = redis_client.hgetall(f"task_params:{task_id}")
                params = {k.decode('utf-8'): v.decode('utf-8') for k, v in params.items()}
                created_at = redis_client.get(f"task_created_at:{task_id}")
                start_time = redis_client.get(f"task_start_time:{task_id}")
                end_time = redis_client.get(f"task_end_time:{task_id}")
                task_status = redis_client.hget(f"task_params:{task_id}", "status")
                if task_status:
                    task_status = task_status.decode('utf-8')
                else:
                    task_status = status
                if created_at:
                    created_at = float(created_at.decode('utf-8'))
                    created_at = convert_to_jst(created_at)
                else:
                    created_at = "N/A"
                if start_time:
                    start_time = float(start_time.decode('utf-8'))
                    start_time = convert_to_jst(start_time)
                else:
                    start_time = "N/A"
                if end_time:
                    end_time = float(end_time.decode('utf-8'))
                    end_time = convert_to_jst(end_time)
                else:
                    end_time = "N/A"
                task_details.append({
                    'id': task_id,
                    'params': params,
                    'status': task_status,
                    'created_at': created_at,
                    'start_time': start_time,
                    'end_time': end_time
                })
            return sorted(task_details, key=lambda x: x['created_at'])

        processing_task_details = get_task_details(processing_tasks, 'processing')
        completed_task_details = get_task_details(completed_tasks, 'completed')

        return jsonify({
            'processing_tasks': processing_task_details,
            'completed_tasks': completed_task_details
        })
    except Exception as e:
        log_to_redis(f"An error occurred in get_tasks route: {e}")
        return jsonify({'error': 'An error occurred'}), 500

@app.route('/run_program', methods=['POST'])
def run_program():
    try:
        log_to_redis(f"Received form data: {request.form}")
        task_id = str(uuid.uuid4())
        gazoucreate = int(request.form['gazoucreate'])
        sd_url = request.form['sd_url']
        gazousize = int(request.form['gazousize'])
        promptinput = request.form['promptinput'].replace('\n', '').replace('\r', '')
        hres = 'hres' in request.form
        hres_size = float(request.form['hres_size'])
        seed = int(request.form['seed'])
        gazouselect = int(request.form['gazouselect'])
        negativeinput = request.form['negativeinput'].replace('\n', '').replace('\r', '')
        sampler = int(request.form['sampler'])
        samplerselect = int(request.form['samplerselect'])
        steps = int(request.form['steps'])
        cfg = int(request.form['cfg'])
        hres_steps = int(request.form['hres_steps'])
        topnameselect = int(request.form['topnameselect'])
        topnamein = request.form['topnamein']
        timeout = int(request.form['timeout'])

        log_to_redis(f"Parsed form data: gazoucreate={gazoucreate}, sd_url={sd_url}, gazousize={gazousize}, promptinput={promptinput}, hres={str(hres)}, hres_size={hres_size}, seed={seed}, gazouselect={gazouselect}, negativeinput={negativeinput}, sampler={sampler}, samplerselect={samplerselect}, steps={steps}, cfg={cfg}, hres_steps={hres_steps}, topnameselect={topnameselect}, topnamein={topnamein}, timeout={timeout}")

        # タスクのパラメータと作成時刻を保存
        redis_client.hset(f"task_params:{task_id}", mapping={
            'gazoucreate': gazoucreate,
            'sd_url': sd_url,
            'gazousize': gazousize,
            'promptinput': promptinput,
            'hres': str(hres),
            'hres_size': hres_size,
            'seed': seed,
            'gazouselect': gazouselect,
            'negativeinput': negativeinput,
            'sampler': sampler,
            'samplerselect': samplerselect,
            'steps': steps,
            'cfg': cfg,
            'hres_steps': hres_steps,
            'topnameselect': topnameselect,
            'topnamein': topnamein,
            'timeout': timeout
        })
        redis_client.set(f"task_created_at:{task_id}", time.time())

        # 非同期タスクのキューに追加
        run_program_async.apply_async(args=[task_id, gazoucreate, sd_url, gazousize, promptinput, hres, hres_size, seed, gazouselect, negativeinput, sampler, samplerselect, steps, cfg, hres_steps, topnameselect, topnamein, timeout])

        # 処理中タスクIDリストに追加
        redis_client.sadd('processing_tasks', task_id)

        # セッションにタスクIDを保存してリダイレクト
        session['task_id'] = task_id
        return redirect(url_for('task_started_page'))

    except Exception as e:
        log_to_redis(f"An error occurred in run_program route: {e}")
        session['error_message'] = "画像生成のパラメータが足りません。"
        return redirect(url_for('error_page'))

@app.route('/task_started_page', methods=['GET'])
def task_started_page():
    task_id = session.get('task_id')
    if not task_id:
        return redirect(url_for('home'))  # ホームページにリダイレクトするなどのエラーハンドリング

    # task_idを表示
    return render_template('task_started.html', task_id=task_id)

@celery.task
def run_program_async(task_id, gazoucreate, sd_url, gazousize, promptinput, hres, hres_size, seed, gazouselect, negativeinput, sampler, samplerselect, steps, cfg, hres_steps, topnameselect, topnamein, timeout):
    try:
        start_time = datetime.now().timestamp()
        redis_client.set(f"task_start_time:{task_id}", start_time)
        redis_client.hset(f"task_params:{task_id}", "status", "running")

        with open('aicreate/variable.py', 'r') as file:
            base_content = file.read()

        base_content = update_variable(base_content, 'gazoucreate', gazoucreate)
        base_content = update_variable(base_content, 'sd_url', sd_url)
        base_content = update_variable(base_content, 'gazousize', gazousize)
        base_content = update_variable(base_content, 'promptinput', promptinput)
        base_content = update_variable(base_content, 'hres', hres)
        base_content = update_variable(base_content, 'hres_size', hres_size)
        base_content = update_variable(base_content, 'seed', seed)
        base_content = update_variable(base_content, 'gazouselect', gazouselect)
        base_content = update_variable(base_content, 'negativeinput', negativeinput)
        base_content = update_variable(base_content, 'sampler', sampler)
        base_content = update_variable(base_content, 'samplerselect', samplerselect)
        base_content = update_variable(base_content, 'steps', steps)
        base_content = update_variable(base_content, 'cfg', cfg)
        base_content = update_variable(base_content, 'hres_steps', hres_steps)
        base_content = update_variable(base_content, 'topnameselect', topnameselect)
        base_content = update_variable(base_content, 'topnamein', topnamein)
        base_content = update_variable(base_content, 'timeout', timeout)

        with open('aicreate/variable.py', 'w') as file:
            file.write(base_content)

        process = subprocess.Popen(['python', 'aicreate/script.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd='.')

        while process.poll() is None:
            if redis_client.sismember('cancelled_tasks', task_id):
                process.terminate()
                process.wait()  # プロセスが確実に終了するまで待つ
                end_time = datetime.now().timestamp()
                redis_client.set(f"task_end_time:{task_id}", end_time)
                raise Exception(f"Task {task_id} was cancelled.")
            time.sleep(1)

        output, error = process.communicate()
        output = output.decode().strip() if output else ""
        error = error.decode().strip() if error else ""

        # プロセスの終了コードを確認し、エラーの場合は例外を発生させる
        if process.returncode != 0 or error:
            raise Exception(f"Script failed with error: {error}")

        redis_client.setex(f"task_result:{task_id}:output", RESULT_EXPIRATION_TIME, output)
        redis_client.setex(f"task_result:{task_id}:error", RESULT_EXPIRATION_TIME, error)
        end_time = datetime.now().timestamp()
        redis_client.set(f"task_end_time:{task_id}", end_time)
        status = "completed" if not error else "failed"
        redis_client.hset(f"task_params:{task_id}", "status", status)

        redis_client.sadd('completed_tasks', task_id)
        log_task_completion(task_id, start_time, end_time, status, output, error)
    except Exception as e:
        output = ""
        error = f"An error occurred: {str(e)}"
        redis_client.setex(f"task_result:{task_id}:output", RESULT_EXPIRATION_TIME, output)
        redis_client.setex(f"task_result:{task_id}:error", RESULT_EXPIRATION_TIME, error)
        end_time = datetime.now().timestamp()
        redis_client.set(f"task_end_time:{task_id}", end_time)
        status = "failed"
        redis_client.hset(f"task_params:{task_id}", "status", status)
        if not redis_client.sismember('cancelled_tasks', task_id):
            redis_client.sadd('completed_tasks', task_id)
        log_task_completion(task_id, start_time, end_time, status, output, error)
    finally:
        redis_client.srem('processing_tasks', task_id)

@celery.task
def delete_expired_tasks():
    try:
        completed_tasks = redis_client.smembers('completed_tasks')
        current_time = time.time()

        for task_id in completed_tasks:
            task_id = task_id.decode('utf-8')
            task_end_time = redis_client.get(f"task_end_time:{task_id}")
            if not task_end_time:
                set_end_time_for_task(task_id)

        for task_id in completed_tasks:
            try:
                task_id = task_id.decode('utf-8')
                task_status = redis_client.hget(f"task_params:{task_id}", "status")
                task_end_time = redis_client.get(f"task_end_time:{task_id}")

                if task_status:
                    task_status_decoded = task_status.decode('utf-8')
                    if task_status_decoded not in ['completed', 'failed']:
                        continue

                if task_end_time:
                    task_end_time = float(task_end_time.decode('utf-8'))

                    if current_time - task_end_time > RESULT_EXPIRATION_TIME:
                        redis_client.delete(f"task_result:{task_id}:output")
                        redis_client.delete(f"task_result:{task_id}:error")
                        redis_client.delete(f"task_created_at:{task_id}")
                        redis_client.delete(f"task_start_time:{task_id}")
                        redis_client.delete(f"task_end_time:{task_id}")
                        redis_client.srem('completed_tasks', task_id)
                else:
                    log_to_redis(f"Task {task_id} has no end time, will not delete.")
            except Exception as task_error:
                log_to_redis(f"An error occurred while processing task {task_id}: {task_error}")
    except Exception as e:
        log_to_redis(f"An error occurred in delete_expired_tasks task: {e}")

def set_end_time_for_task(task_id):
    current_time = time.time()
    redis_client.set(f"task_end_time:{task_id}", current_time)

def log_task_completion(task_id, start_time, end_time, status, output, error):
    log_message = (
        f"Task ID: {task_id}\n"
        f"Status: {status}\n"
        f"Start Time: {convert_to_jst(start_time)}\n"
        f"End Time: {convert_to_jst(end_time)}\n"
        f"Output: {output}\n"
        f"Error: {error}\n"
        "----------------------------------------\n"
    )
    log_to_redis(log_message)

@app.route('/task_result', methods=['POST'])
def task_result():
    try:
        task_id = request.form['task_id']

        output = redis_client.get(f"task_result:{task_id}:output")
        error = redis_client.get(f"task_result:{task_id}:error")
        start_time = redis_client.get(f"task_start_time:{task_id}")
        end_time = redis_client.get(f"task_end_time:{task_id}")
        status = redis_client.hget(f"task_params:{task_id}", "status")

        parameters = redis_client.hgetall(f"task_params:{task_id}")

        if start_time:
            start_time = start_time.decode('utf-8')
        else:
            start_time = "N/A"

        if end_time:
            end_time = end_time.decode('utf-8')
        else:
            end_time = "N/A"

        decoded_parameters = {k.decode('utf-8'): v.decode('utf-8') for k, v in parameters.items()}

        if output is None and error is None:
            session['result_data'] = {
                'output': "",
                'error': "Task ID not found or results expired",
                'start_time': start_time,
                'end_time': end_time,
                'task_id': task_id,
                'status': "unknown",
                'parameters': decoded_parameters
            }
            return redirect(url_for('show_task_result', task_id=task_id))

        if status:
            status = status.decode('utf-8')
        else:
            status = "unknown"

        session['result_data'] = {
            'output': output.decode('utf-8') if output else "",
            'error': error.decode('utf-8') if error else "",
            'start_time': start_time,
            'end_time': end_time,
            'task_id': task_id,
            'status': status,
            'parameters': decoded_parameters
        }
        return redirect(url_for('show_task_result', task_id=task_id))

    except Exception as e:
        log_to_redis(f"An error occurred in task_result route: {e}")
        session['error_message'] = "タスクの結果を取得中にエラーが発生しました。"
        return redirect(url_for('error_page'))

@app.route('/show_task_result', methods=['GET'])
def show_task_result():
    result_data = session.pop('result_data', None)
    if not result_data:
        # セッションデータがない場合はトップページにリダイレクト
        return redirect(url_for('index'))

    return render_template('result.html', **result_data)

@app.route('/cancel_task', methods=['POST'])
def cancel_task():
    try:
        task_id = request.form['task_id']

        redis_client.sadd('cancelled_tasks', task_id)

        end_time = datetime.now().timestamp()
        redis_client.set(f"task_end_time:{task_id}", end_time)

        redis_client.srem('processing_tasks', task_id)
        redis_client.srem('completed_tasks', task_id)
        redis_client.delete(f"task_params:{task_id}")
        redis_client.delete(f"task_created_at:{task_id}")
        redis_client.delete(f"task_start_time:{task_id}")
        redis_client.delete(f"task_end_time:{task_id}")
        redis_client.delete(f"task_result:{task_id}:output")
        redis_client.delete(f"task_result:{task_id}:error")
        
        # セッションにキャンセル成功メッセージを保存し、リダイレクト
        session['success_message'] = f"タスク {task_id} はキャンセルされました。"
        return redirect(url_for('task_cancelled_page', task_id=task_id))

    except Exception as e:
        log_to_redis(f"An error occurred in cancel_task route: {e}")
        session['error_message'] = "タスクのキャンセルに失敗しました。"
        return redirect(url_for('error_page'))

@app.route('/task_cancelled_page', methods=['GET'])
def task_cancelled_page():
    success_message = session.pop('success_message', None)
    task_id = request.args.get('task_id')
    if not success_message:
        success_message = "タスクはすでにキャンセルされています。"
    
    return render_template('task_cancelled.html', task_id=task_id, success_message=success_message)

@app.route('/processing_tasks', methods=['GET'])
def processing_tasks():
    try:
        tasks = redis_client.smembers('processing_tasks')
        tasks = [task.decode('utf-8') for task in tasks]
        return jsonify(tasks)
    except Exception as e:
        log_to_redis(f"An error occurred in processing_tasks route: {e}")
        session['error_message'] = "processing_tasks failure"
        return redirect(url_for('error_page'))

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify(status="OK", timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

@app.route('/delete_all_tasks', methods=['POST'])
def delete_all_tasks():
    try:
        # 実行中のタスクを取得し、キャンセルリストに追加
        processing_tasks = redis_client.smembers('processing_tasks')
        for task_id in processing_tasks:
            redis_client.sadd('cancelled_tasks', task_id)

        # Redisからすべてのタスク関連データを削除
        redis_client.delete('processing_tasks')
        redis_client.delete('completed_tasks')

        keys = redis_client.keys('task_params:*')
        for key in keys:
            redis_client.delete(key)

        keys = redis_client.keys('task_created_at:*')
        for key in keys:
            redis_client.delete(key)

        keys = redis_client.keys('task_start_time:*')
        for key in keys:
            redis_client.delete(key)

        keys = redis_client.keys('task_end_time:*')
        for key in keys:
            redis_client.delete(key)

        keys = redis_client.keys('task_result:*')
        for key in keys:
            redis_client.delete(key)

        return jsonify({'status': 'success', 'message': 'すべてのタスクが正常に削除されました。'})
    except Exception as e:
        log_to_redis(f"delete_all_tasksルートでエラーが発生しました: {e}")
        return jsonify({'status': 'error', 'message': 'タスクの削除中にエラーが発生しました。'}), 500

# エラーハンドリング

@app.route('/error_page', methods=['GET'])
def error_page():
    error_message = session.pop('error_message', "戻るボタンを押してください。")
    return render_template('errors/error.html', error_message=error_message), 500

@app.errorhandler(404)
def show_404_page(error):
    error_message = error.description
    return render_template('errors/error.html', error_message=error_message), 404

@app.errorhandler(400)
def show_400_page(error):
    error_message = error.description
    return render_template('errors/error.html', error_message=error_message), 400

if __name__ == '__main__':
    # Flaskアプリを実行
    app.run(host='0.0.0.0', port=3100, debug=False)
