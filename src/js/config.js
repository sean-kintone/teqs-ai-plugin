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
      alert('設定が保存されました。アプリを更新してください。');
      window.location.href = '../../flow?app=' + kintone.app.getId();
    });
  });

  cancelButtonEl.addEventListener('click', () => {
    window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  });
})(kintone.$PLUGIN_ID);
