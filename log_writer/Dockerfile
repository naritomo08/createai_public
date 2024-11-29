# ベースイメージ
FROM python:3.9-slim

# 作業ディレクトリを設定
WORKDIR /app

# 必要なファイルをコピー
COPY . /app

# 依存ライブラリをインストール
RUN pip install --no-cache-dir -r requirements.txt

# ログディレクトリを作成
RUN mkdir -p /app/output/log

# スクリプトを実行
CMD ["python", "write_logs_to_file.py"]