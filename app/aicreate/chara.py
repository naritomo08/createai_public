import variable as v
import base as g
import random;

#color,キャラ ランダム選択 prompt()で利用,0でランダム、1で順序、2で固定
def colorselect(i) :
    if (v.charachange == 2):
        color = v.charaselect

    return color

#プロンプト関数(プロンプト編集で利用)

def prompt(color):

	#PromptSelect
	if color == 100 :
		girl = g.script_top + " BREAK "
		isyou = ""
		chara = "none"

	if (v.isyouon == 0):
		isyouout = isyou

	return girl,isyouout,chara
