from celery import Celery
from datetime import timedelta

celery = Celery('tasks', broker='redis://redis:6379/0', backend='redis://redis:6379/0')

celery.conf.beat_schedule = {
    'delete_expired_tasks_every_minute': {
        'task': 'app.delete_expired_tasks',
        'schedule': timedelta(minutes=1),  # 1分ごとにチェック
    },
}

celery.conf.timezone = 'Asia/Tokyo'