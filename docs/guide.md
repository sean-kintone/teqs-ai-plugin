# TEQS kintone Plugin 開発セミナー

## 環境を用意する

### NodeJS

`node -v`を実行して、20以上のバージョンがインストールされているかをご確認ください

例：`v23.1.0`

## kintoneを準備する

### 開発者ライセンスを取得する

[開発者ライセンスを取得してみよう！](https://cybozu.dev/ja/kintone/developer-license/registration-form/)

kintone開発者ライセンスは、開発者がkintone APIを無料で試せる環境を提供します。顧客または自社向けの開発・テストや、開発スキルの習得に活用できます。

### デモ用アプリを追加する

![kintoneポータル画面](../images/portal.png)

ログイン後、アプリ追加画面からデモ用の「問い合わせ管理」アプリをインストールしてください。

![アプリ追加画面](../images/addApp.png)

## プラグインを作成してみよう

`npm install -g @kintone/create-plugin`

`create-kintone-plugin test-ai-plugin`

質問に対して、ホームページとアップロード以外をデフォルトで回答しましょう
ホームページも指定しないと、`customize-uploader`は失敗します。

``` txt
? Input your plug-in name in English [1-64chars] test-ai-plugin
? Input your plug-in description in English [1-200chars] test-ai-plugin
? Does your plug-in support Japanese? no
? Does your plug-in support Chinese? no
? Does your plug-in support Spanish? no
? Input your home page url for English (Optional) https://test.com
? Does your plug-in support mobile views? no
? Would you like to use @kintone/plugin-uploader? yes
```

作成したディレクトリに入って、パッケージをインストールします：

`cd test-ai-plugin`

`npm i`

### envファイルを使用してアップしましょう

`npm install dotenv`

`touch .env`

.envファイルを下記の内容でコピペする

``` txt
KINTONE_BASE_URL=https://xxx.cybozu.com
KINTONE_USERNAME=xxx
KINTONE_PASSWORD=xxx
```

ご自身のkintone環境関数を入れて保存しましょう。

### package.jsonでdotenvを使用する

uploadのコマンドの頭に 「dotenv --」 を付け足して、env関数を使用してアップを試す

``` json
"upload": "dotenv -- kintone-plugin-uploader dist/plugin.zip --watch --waiting-dialog-ms 3000"
```

## プラグインを読み込んでみよう

`npm start`

コマンドが成功したら、kintone上で確認しましょう

![kintone-portal](../images/kintonePortal-Settings.png)

![kintone-settings](../images/kintone-settings.png)

![kintone-plugin-page](../images/pluginPage.png)

## 設定画面を変更してみる

config設定は３つの要素を設置しないといけない：
- HTMLフィルド
- JSで関数保存・取得
- manifest.jsonで必須項目にする（任意）

### まずはmanifest.json

[manifest.json](../src/manifest.json)

configオブジェクト内の`required_params`に`message`（デフォルト）が必須設定になっています。
`message`を`openAIToken`に変えておきましょう。

``` json
{
...
  "config": {
    "html": "html/config.html",
    "js": [
      "js/config.js"
    ],
    "css": [
      "css/51-modern-default.css",
      "css/config.css"
    ],
    "required_params": [
      "openAIToken"
    ]
  },
...
```

### 次はHTML

[config.html](../src/html/config.html)

デフォルトでは　`message`　が必須項目として設置されています。
これを試しで`openAIToken`に変えておきます。

``` html
<section class="settings">
  <h2 class="settings-heading">設定画面</h2>
  <p class="kintoneplugin-desc">Open AI連携プラグインの設定</p>
  <form class="js-submit-settings">
    <p class="kintoneplugin-row">
      <label for="openAIToken">
        OpenAI APIトークン:
        <input type="text" class="js-text-message kintoneplugin-input-text openAIToken">
      </label>
    </p>
    <p class="kintoneplugin-row">
        <button type="button" class="js-cancel-button kintoneplugin-button-dialog-cancel">Cancel</button>
        <button class="kintoneplugin-button-dialog-ok">Save</button>
    </p>
  </form>
</section>
```

これを保存すると、設定画面に文言が変わっています。
ただ、裏で動いているJSを変えないと、関数を保存したり、取得したりすることができない。

### 最後はJS

[config.js](../src/js/config.js)

デフォルトのJSです。
中に、２か所を修正します：
- HTMLフィルド取得
- 関数の保存
``` js
(function (PLUGIN_ID) {
  const formEl = document.querySelector('.js-submit-settings');
  const cancelButtonEl = document.querySelector('.js-cancel-button');
  const messageEl = document.querySelector('.js-text-message');
  if (!(formEl && cancelButtonEl && messageEl)) {
    throw new Error('Required elements do not exist.');
  }

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (config.message) {
    messageEl.value = config.message;
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    kintone.plugin.app.setConfig({ message: messageEl.value }, () => {
      alert('The plug-in settings have been saved. Please update the app!');
      window.location.href = '../../flow?app=' + kintone.app.getId();
    });
  });

  cancelButtonEl.addEventListener('click', () => {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(kintone.$PLUGIN_ID);
```

とりあえず、`message`になっているところを`openAIToken`に変更します。

``` js
(function (PLUGIN_ID) {
  const formEl = document.querySelector('.js-submit-settings');
  const cancelButtonEl = document.querySelector('.js-cancel-button');
  const openAITokenEl = document.querySelector('.openAIToken');
  if (!(formEl && cancelButtonEl && openAITokenEl)) {
    throw new Error('Required elements do not exist.');
  }

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  if (config.openAIToken) {
    openAITokenEl.value = config.openAIToken;
  }

  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    kintone.plugin.app.setConfig({ openAIToken: openAITokenEl.value }, () => {
      alert('The plug-in settings have been saved. Please update the app!');
      window.location.href = '../../flow?app=' + kintone.app.getId();
    });
  });

  cancelButtonEl.addEventListener('click', () => {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(kintone.$PLUGIN_ID);

```

## ボタンを設置する

[desktop.js](../src/js/desktop.js)

kintone開発のあるあるファストステップです。
今回は普通のJSにしていますが、お好みのフレームワーク（Reactなど）を使用することも可能です。

``` js
  kintone.events.on('app.record.index.show', () => {
    const headerSpace = kintone.app.getHeaderMenuSpaceElement();
    if (headerSpace === null) {
      throw new Error('このページでヘッダー要素が利用できません。');
    }
    const button = document.createElement('button');
    button.id = 'auto-priority-button';
    button.textContent = '自動優先度計算';
    button.style.marginTop = '10px';
    button.addEventListener('click', async () => {
        console.log("ボタンはクリックされました。")
      try {
        // 実行する関数
      } catch (error) {
        // エラー処理
      } finally {
        // 最後の処理
      }
    });
    headerSpace.appendChild(button);
    return event;
  });
```

保存とアップすると、デフォルトメッセージだった箇所がボタンになっています。
今回は`app.record.index.show`イベントで表示していますが、kintone内のそれぞれの画面表示・保存時などのイベントはカスタマイズ可能です。

## モダルを表示してみる

別の関数を定義して、ボタン押した時に表示してみましょう。
こういう時はフレームワークやCSSライブラリーは便利になってきますね。

``` js
function createModal() {
  const modal = document.createElement('div');
  modal.id = 'priority-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>優先度の高い記録</h2>
      <div id="priority-records"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close');
  closeBtn.onclick = () => {
    modal.style.display = 'none';
  };
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  return modal;
}
```

また、CSSを定義します。

[desktop.css](../src/css/desktop.css)

``` css
  #priority-modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
  }
  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 600px;
  }
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
  }
  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
```

## kintoneレコード情報を取得する

## レコード情報をOpen AI APIに渡す

## 結果を表示する

## セキュリティー対策