import requests,datetime,os,time,sys,traceback
import base as g
import variable as v
import chara as c

def Main(i,topname):

    # StableDiffusionURL
    url = v.sd_url

    option_payload = {
        "sd_model_checkpoint": model,
        "sd_vae": g.vae,
        #"CLIP_stop_at_last_layers": 2
    }

    try:
        response = requests.post(url=f'{url}/sdapi/v1/options', json=option_payload, timeout=120)
        response.raise_for_status()  # ここでエラーがあれば例外が発生します
    except requests.RequestException as e:
        print(f"Error during POST to /sdapi/v1/options: {e}")
        raise

    # Create Picture
    Imgsetting = {
    # プロンプト
    "prompt": promptselect,
    # ネガティブプロンプト
    "negative_prompt": negapro,
    "steps": v.steps,
    "sampler_index": sampler ,
    "width": width,
    "height": height,
    "cfg_scale": v.cfg,
    "seed": v.seed,
    #画像高解像度設定
    "enable_hr" :v.hres,
    "hr_prompt" :promptselect,
    "hr_negative_prompt" : negapro,
    "hr_resize_x" :0,
    "hr_resize_y" :0,
    "hr_scale" :v.hres_size,
    "hr_second_pass_steps" :v.hres_steps,
    "hr_upscaler" :"R-ESRGAN 4x+ Anime6B",
    "denoising_strength" :0.7,
    }

    try:
        resp = requests.post(url=f'{url}/sdapi/v1/txt2img', json=Imgsetting, timeout=v.timeout)
        resp.raise_for_status()  # ここでエラーがあれば例外が発生します
        json_data = resp.json()
        imgdata = json_data["images"][0]
    except requests.RequestException as e:
        print(f"Error during POST to /sdapi/v1/txt2img: {e}")
        raise

    now = datetime.datetime.now()
    current_day = now.strftime("%Y-%m-%d")
    current_daytime = now.strftime("%Y%m%d%H%M%S")
    dir_for_output_png = "./output/" + current_day + "/png"
    dir_for_output_jpg = "./output/" + current_day + "/jpg"

    os.makedirs(dir_for_output_png, exist_ok=True)
    os.makedirs(dir_for_output_jpg, exist_ok=True)

    g.save_image_as_png_and_jpg(topname,i,imgdata, dir_for_output_png, dir_for_output_jpg, chara, modelname, current_daytime)

    g.set_permissions_recursive("./output/", 0o777)

# メインルーチン

if __name__ == '__main__':

    gazouchange = v.gazouselect
    gazousize = v.gazousize

    # 作成枚数指定
    i = 0
    n = v.gazoucreate

    print("作成画像は{}枚です。".format(n))

    #計測開始
    start = time.perf_counter()

    try:

        # 繰り返し処理
        while i < n:

            width,height = g.sizechange(gazouchange,gazousize)

            if (i < n):
                gazou = n - i
                print("画像はあと{}枚です。".format(gazou))

            #プロンプト変数取得

            color = c.colorselect(i)

            girl,isyouout,chara = c.prompt(color)

            script,negaproex = g.scriptselect(v.promptselect,v.promptinput)

            styleselect = g.styleselect(i,v.styleselect,v.styleselect2)
            style = g.styleselect2(styleselect)

            promptselect = girl + " BREAK " + isyouout +  " BREAK " + style + " BREAK " + script + " BREAK " + v.promptinput2
            negapro = g.negapro + " BREAK " + negaproex + " BREAK " + v.negativeinput

            checkmodel = g.modelselect(i,v.modelchange,v.modelselect)
            model,modelname = g.modelselect2(checkmodel)

            samplernum = g.selectsampler(i,v.sampler,v.samplerselect)
            sampler = g.selectsampler2(samplernum)

            topname = g.topname(v.topnameselect,v.topnamein)

            Main(i, topname)
            time.sleep(1)

            i += 1

    except Exception as e:
        print(f"An error occurred in script.py: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)  # スタックトレースを標準エラー出力に表示
        sys.exit(1)

    #計測終了
    end = time.perf_counter()
    jobtime1 = int((end-start)/60)
    jobtime2 = int((end-start)%60)

    print("画像作成完了しました。")
    print("作成時間は{}分{}秒です。".format(jobtime1,jobtime2))
