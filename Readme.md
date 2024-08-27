# createai_public

flaskによる画像生成APIキックサイト

## サイト動作

Web画面で枚数指定するとapp/output内に指定した枚数の画像が作成される。

## 事前作業

StableDiffuionを立ち上げたPCを用意し、APIを有効にしていること。

モデルは"animagine(3.1)"を入れてください。

VAEは"XL_VAE_C(f1)"を入れてください。

[StableDiffusion APIから画像生成してみる。](https://qiita.com/naritomo08/items/c521f1b338489bdf9ee8)

[animagineページ](https://civitai.com/models/260267/animagine-xl-v31)

[VAEページ](https://civitai.com/models/152040/xlvaec)

## 使用方法

```bash
git clone https://github.com/naritomo08/createai_public.git
cd createapi_public
rm -rf .git
docker-compose up -d
以下のURLでサイトアクセス
http://localhost

画像保管先
app/static/output
または結果画面からモーダル画像閲覧、入手可能

画像生成ログ
log_writer/output

サイトアクセスログ
nginx/nginx_logs
```

### ソース編集時の注意

ソース編集のみでは反映されないため、必ず以下のコマンドを入れること。

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### タスクを止める方法

タスクのリザルト画面または、すべてのタスク削除で
タスクを止めることができます。

## ユニットテスト仕様

1. test_update_variable
テスト対象
update_variable関数
テスト内容
文字列内の特定の変数の値を更新する処理をテストします。
具体的には、以下のテストを行います:
contentという文字列がvariable = "old_value"であるとき、この変数variableの値をnew_valueに更新した結果が、期待通りvariable = "new_value"となることを確認します。
期待される結果
updated_contentが'variable = "new_value"'であることをアサートします。

2. test_get_png_metadata
テスト対象
get_png_metadata関数
テスト内容
画像ファイルのメタデータを正しく取得できるかをテストします。
画像ファイルの読み取り部分をモックし、擬似的な画像オブジェクトを作成して、そのメタデータ（幅、高さ、モード、フォーマット、その他の情報）が期待通りに取得できるかを確認します。
期待される結果
取得されたメタデータが以下の条件を満たすことをアサートします:
幅が800ピクセルである。
高さが600ピクセルである。
カラーモードがRGBである。
画像フォーマットがPNGである。
infoにdpiが含まれている。

3. test_error_page
テスト対象
エラーページ (/error_page)
テスト内容
セッションにエラーメッセージを設定した状態で、/error_pageにアクセスしたとき、500エラーステータスが返され、セッション内のエラーメッセージがページに表示されることをテストします。
期待される結果
レスポンスステータスコードが500であることをアサートします。
ページに"Test error message"という文字列が含まれていることをアサートします。

4. test_health_check
テスト対象
ヘルスチェックエンドポイント (/health)
テスト内容
サービスが正常に稼働しているかを確認するためのヘルスチェックエンドポイントにアクセスし、正しいステータスコードとレスポンス内容が返されることをテストします。
期待される結果
レスポンスステータスコードが200であることをアサートします。
JSONレスポンスにstatusキーがあり、その値が"OK"であることをアサートします。

### ユニットテストやり方

```bash
docker-compose up -d --build createai-app
docker-compose exec -T createai-app pytest
docker-compose down
```
