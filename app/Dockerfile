# app/Dockerfile
FROM python:3.9-slim

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . /app

WORKDIR /app

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]