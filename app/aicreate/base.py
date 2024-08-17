import random,base64,io,os
from PIL import Image

def topname(topnameselect,topnamein) :
    if(topnameselect == 0) :
        topname = ""
    if(topnameselect == 1) :
        topname = topnamein + "-"

    return topname

def save_image_as_png_and_jpg(topname,i,imgdata, dir_for_output_png, dir_for_output_jpg, chara, modelname, current_daytime):
    # base64デコードされた画像データをバイナリデータとして取得
    imgdata = base64.b64decode(imgdata)

    # バイナリデータをバイトストリームとして読み込む
    img = Image.open(io.BytesIO(imgdata))

    # JPG形式に変換して保存
    jpg_output_path = f"{dir_for_output_jpg}/{topname}{i}-{chara}-{modelname}-{current_daytime}.jpg"
    img.convert('RGB').save(jpg_output_path, "JPEG")

    # PNG形式で保存
    with open(f"{dir_for_output_png}/{topname}{i}-{chara}-{modelname}-{current_daytime}.png", "wb") as f:
        f.write(imgdata)

def set_permissions_recursive(dir_path, permissions):
    for root, dirs, files in os.walk(dir_path):
        for name in dirs:
            os.chmod(os.path.join(root, name), permissions)
        for name in files:
            os.chmod(os.path.join(root, name), permissions)

def selectsampler(i,samplerchange,samplerselect) :

    if (samplerchange == 0):
        select = [0,1,2,3,4,5,6,7,9,10,13,14,15,16,17]
        selectsampler = random.choice(select)
        samplernum = selectsampler
    elif (samplerchange == 1):
        if (i % 15 == 0):
            samplernum = 0
        elif  (i % 15 == 1):
            samplernum = 1
        elif  (i % 15 == 2):
            samplernum = 2
        elif  (i % 15 == 3):
            samplernum = 3
        elif  (i % 15 == 4):
            samplernum = 4
        elif  (i % 15 == 5):
            samplernum = 5
        elif  (i % 15 == 6):
            samplernum = 6
        elif  (i % 15 == 7):
            samplernum = 7
        elif  (i % 15 == 8):
            samplernum = 9
        elif  (i % 15 == 9):
            samplernum = 10
        elif  (i % 15 == 10):
            samplernum = 13
        elif  (i % 15 == 11):
            samplernum = 14
        elif  (i % 15 == 12):
            samplernum = 15
        elif  (i % 15 == 13):
            samplernum = 16
        elif  (i % 15 == 14):
            samplernum = 17
    elif (samplerchange == 2):
        samplernum = samplerselect

    return samplernum

def selectsampler2(samplernum) :

    if(samplernum == 0):
        sampler = "DPM++ 2M"
    elif(samplernum == 1):
        sampler = "DPM++ SDE"
    elif(samplernum == 2):
        sampler = "DPM++ 2M SDE"
    elif(samplernum == 3):
        sampler = "DPM++ 2M SDE Heun"
    elif(samplernum == 4):
        sampler = "DPM++ 2S a"
    elif(samplernum == 5):
        sampler = "DPM++ 3M SDE"
    elif(samplernum == 6):
        sampler = "Euler a"
    elif(samplernum == 7):
        sampler = "Euler"
    elif(samplernum == 8):
        sampler = "LMS"
    elif(samplernum == 9):
        sampler = "Heun"
    elif(samplernum == 10):
        sampler = "DPM2"
    elif(samplernum == 11):
        sampler = "DPM2 a"
    elif(samplernum == 12):
        sampler = "DPM fast"
    elif(samplernum == 13):
        sampler = "DPM adaptive"
    elif(samplernum == 14):
        sampler = "Restart"
    elif(samplernum == 15):
        sampler = "DDIM"
    elif(samplernum == 16):
        sampler = "PLMS"
    elif(samplernum == 17):
        sampler = "UniPC"
    elif(samplernum == 18):
        sampler = "LCM"

    return sampler

def sizechange(gazouchange,gazousize) :

    if (gazousize == 0):
        select = [0,1,2,3,4,5,6,7,8]
        size = random.choice(select)
    elif (gazousize == 1):
        select = [0,2,4,6]
        size = random.choice(select)
    elif (gazousize == 2):
        select = [1,3,5,7]
        size = random.choice(select)
    elif (gazousize == 3):
        size = gazouchange

    if (size==0):
        width = 640
        height = 1536
    elif  (size==1):
        width = 1536
        height = 640
    elif  (size==2):
        width = 768
        height = 1344
    elif  (size==3):
        width = 1344
        height = 768
    elif  (size==4):
        width = 832
        height = 1216
    elif  (size==5):
        width = 1216
        height = 832
    elif  (size==6):
        width = 896
        height = 1152
    elif  (size==7):
        width = 1152
        height = 896
    elif  (size==8):
        width = 1024
        height = 1024

    return width,height

def modelselect(i,modelchange,modelselect) :

    if (modelchange == 2):
        if (modelselect == 4):
            checkmodel = 4

    return checkmodel

def modelselect2(selectmodel) :

    # model select
    if  (selectmodel == 4):
        model = "animagine-xl-3.1.safetensors [e3c47aedb0]"
        modelname = "animagine"

    return model,modelname

def styleselect(i,styleselect,styleselect2) :
    if (styleselect == 2):
        styleselect = styleselect2

    return styleselect

def styleselect2(styleselect) :

    # model select
    if (styleselect == 0):
        #none
        style = ""

    return style

#VAE

vae = "xlVAEC_f1.safetensors"

script_top="score_9, score_8_up, score_7_up, source_anime, quality_masterpiece, quality_best, official art, best quality, official style, anime_cap, game cg, megami magazine,  ultra delicate hair, very aesthetic, absurdres, shiny skin, "

negapro = "score_5,score_4,jpeg artifacts,source_photo,source_realstic,source_cartoon,source_furry,low_quality,monochrome,bad_anatomy,blurry,bad hands,missing fingers,extra fingers, break, source_pony, source_furry, source_cartoon, mature female, the simpsons, overwatch, apex legends, (black_hair:2), miko, female_pubic_hair, artist name, realistic, 3d, video, source_filmmaker,text,watermark,signature,username,stamp,artist name,title/subtitle,date,footer/header, "

def scriptselect(promptselect,promptinput) :

    #スクリプト手動入力
    script100 = promptinput
    negapro100 = ""

    if  (promptselect==100):
        script=script100
        negaproex=negapro100

    return script,negaproex
