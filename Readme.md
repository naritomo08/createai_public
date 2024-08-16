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
docker-compose up -d
以下のURLでサイトアクセス
http://localhost:3100

画像保管先
app/output

画像生成ログ
log_writer/output
```

### ソース編集時の注意

ソース編集のみでは反映されないため、必ず以下のコマンドを入れること。

```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### タスクを止める方法

状態がProicessing状態でしたらタスク詳細画面から停止することが可能ですが、
Running状態で止める際は以下どちらかの方法で停止してください
(前者の方法をおすすめします。)

* 画像生成PC側のアプリプロンプト画面を落とす

* サイトトップ画面からすべてのタスクを消して、コンテナの停止・起動を行う

```bash
docker-compose down
docker-compose up -d
```
