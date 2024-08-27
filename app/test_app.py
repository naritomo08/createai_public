import sys
sys.path.append('./')  # プロジェクトのルートディレクトリをパスに追加

import pytest
from app import app, update_variable, get_png_metadata
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def test_update_variable():
    content = 'variable = "old_value"'
    updated_content = update_variable(content, 'variable', 'new_value')
    assert updated_content == 'variable = "new_value"'

@patch('app.Image.open')
def test_get_png_metadata(mock_open):
    mock_image = MagicMock()
    mock_image.width = 800
    mock_image.height = 600
    mock_image.mode = 'RGB'
    mock_image.format = 'PNG'
    mock_image.info = {'dpi': (72, 72)}
    mock_open.return_value.__enter__.return_value = mock_image

    metadata = get_png_metadata('dummy_path.png')
    assert metadata['width'] == 800
    assert metadata['height'] == 600
    assert metadata['mode'] == 'RGB'
    assert metadata['format'] == 'PNG'
    assert 'dpi' in metadata['info']

def test_error_page(client):
    with client.session_transaction() as sess:
        sess['error_message'] = "Test error message"

    response = client.get('/error_page')
    assert response.status_code == 500
    assert b"Test error message" in response.data

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'OK'
