# app/Dockerfile
FROM python:3.9-slim

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . /app

WORKDIR /app

COPY aicreate/variable.py aicreate/variable.py

CMD ["python", "app.py"]