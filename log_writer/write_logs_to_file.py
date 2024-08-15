import redis
import json
import time
import os
import logging
from logging.handlers import TimedRotatingFileHandler

class CustomTimedRotatingFileHandler(TimedRotatingFileHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def doRollover(self):
        if self.stream:
            self.stream.close()
            self.stream = None
        
        current_time = int(time.time())
        dst_now = time.localtime(current_time)[-1]
        t = self.rolloverAt - self.interval
        if self.utc:
            time_tuple = time.gmtime(t)
        else:
            time_tuple = time.localtime(t)
            dst_then = time_tuple[-1]
            if dst_now != dst_then:
                if dst_now:
                    addend = 3600
                else:
                    addend = -3600
                time_tuple = time.localtime(t + addend)

        dfn = self.baseFilename.replace(".log", "") + "-" + time.strftime("%Y%m%d", time_tuple) + ".log"
        
        if os.path.exists(dfn):
            os.remove(dfn)
        
        self.rotate(self.baseFilename, dfn)
        
        if not self.delay:
            self.stream = self._open()
        
        new_rollover_at = self.computeRollover(current_time)
        while new_rollover_at <= current_time:
            new_rollover_at += self.interval
        
        if (self.when == 'MIDNIGHT' or self.when.startswith('W')) and not self.utc:
            dst_at_rollover = time.localtime(new_rollover_at)[-1]
            if dst_now != dst_at_rollover:
                if not dst_now:
                    addend = -3600
                else:
                    addend = 3600
                new_rollover_at += addend

        self.rolloverAt = new_rollover_at

# Redisクライアントの設定
redis_client = redis.Redis(host='redis', port=6379, db=0)

# ログディレクトリとファイルの設定
log_dir = './output/log'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# ログハンドラの設定
log_file = os.path.join(log_dir, 'task_log.log')
handler = CustomTimedRotatingFileHandler(log_file, when="midnight", interval=1, backupCount=7)
formatter = logging.Formatter('%(asctime)s - %(message)s')
handler.setFormatter(formatter)

# ロガーの設定
logger = logging.getLogger('task_logger')
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# タスク関連のログメッセージかどうかを判定する関数
def is_task_related_message(message):
    return any(keyword in message for keyword in ["Task", "task_id", "gazoucreate", "promptselect", "charachange", "charaselect", "modelchange", "modelselect", "sd_url", "gazousize", "promptinput", "hres", "hres_size", "completed", "failed", "cancelled"])

# Redisからログを取得してファイルに書き込む関数
def write_logs_to_file():
    while True:
        log_entry = redis_client.lpop('logs')
        if log_entry:
            log_entry = json.loads(log_entry)
            log_message = f"{log_entry['timestamp']} - {log_entry['message']}"
            if is_task_related_message(log_entry['message']):
                logger.info(log_message)
        else:
            time.sleep(10)  # Redisが空の場合、10秒待機

if __name__ == "__main__":
    write_logs_to_file()
