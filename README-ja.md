## node-red obniz node

node-redのobnizノードです

[obniz websocket api](https://obniz.io/doc/about_obniz_api)に基づいて使うことができます


## obnizとはなにか

Electronics as a Serviceという、電子回路をAPIから操作できるクラウドシステムです
[こちらのサイト](https://obniz.io/doc/)にて詳細情報を見れます



## Install

次のコマンドでインストールしてください
```
npm install node-red-contrib-obniz
```

もしくはnode-red上で、下記の方法でもインストールできます
1. node-redの"manage parlette"メニューをクリック
2. "obniz"で検索
3. "Install"ボタンをクリック


## 使い方

msg.payload にobnizクラウドへ送りたいjsonを書いてobnizノードに渡します。
jsonのコマンドリストは [こちら](https://obniz.io/doc/about_obniz_api)にあります

ディスプレイを消して、文字を出力するjsonは下記のようになります。
```json
[
   {
       "display": {
          "clear": true, 
          "text": "Hello, obniz!"
       }
   }
]
```