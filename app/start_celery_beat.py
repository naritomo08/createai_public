import subprocess

if __name__ == '__main__':
    subprocess.call(['celery', '-A', 'celery_config.celery', 'beat', '-l', 'info'])
