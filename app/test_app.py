import sys
from pathlib import Path

# プロジェクトのルートディレクトリを動的に追加
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.append(str(PROJECT_ROOT))

import pytest
from app import app, update_variable, get_png_metadata
from unittest.mock import patch, MagicMock
from flask import session

# テスト用依存関係の注意点を明記
"""
このテストを実行するには以下の依存関係をインストールしてください:
pip install pytest flask pillow
"""

@pytest.fixture
def client():
    """Flaskテストクライアントを作成"""
    with app.test_client() as client:
        yield client

def test_update_variable():
    """変数の値を更新する関数のテスト"""
    content = 'variable = "old_value"'
    updated_content = update_variable(content, 'variable', 'new_value')
    assert updated_content == 'variable = "new_value"'

    # 存在しない変数を指定した場合
    content = 'variable = "old_value"'
    updated_content = update_variable(content, 'non_existent_variable', 'new_value')
    assert updated_content == 'variable = "old_value"'  # 変更が行われないことを確認

@patch('app.Image.open')
def test_get_png_metadata(mock_open):
    """PNGメタデータ取得関数のテスト"""
    # モックのセットアップ
    mock_image = MagicMock()
    mock_image.width = 800
    mock_image.height = 600
    mock_image.mode = 'RGB'
    mock_image.format = 'PNG'
    mock_image.info = {'dpi': (72, 72)}
    mock_open.return_value.__enter__.return_value = mock_image

    # 正常なケース
    metadata = get_png_metadata('dummy_path.png')
    assert metadata['width'] == 800
    assert metadata['height'] == 600
    assert metadata['mode'] == 'RGB'
    assert metadata['format'] == 'PNG'
    assert 'dpi' in metadata['info']

    # ファイルが存在しない場合
    mock_open.side_effect = FileNotFoundError
    with pytest.raises(FileNotFoundError):
        get_png_metadata('non_existent_file.png')

def test_error_page(client):
    """エラーページの動作確認"""
    with client.session_transaction() as sess:
        sess['error_message'] = "Test error message"

    response = client.get('/error_page')
    assert response.status_code == 500
    assert b"Test error message" in response.data

def test_health_check(client):
    """ヘルスチェックエンドポイントのテスト"""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'OK'

    # 無効なリクエストの場合
    response = client.post('/health')  # POSTは許可されていないはず
    assert response.status_code == 405  # メソッドが許可されていない
