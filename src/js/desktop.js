(function (PLUGIN_ID) {
  'use strict';

  // プラグイン設定からAPIキーを取得
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const openAIToken = config.openAIToken;

  function calculateSentiment() {
    // 現在のレコードを取得
    const record = kintone.app.record.get().record;
    console.log('レコード:', record);

    // 必要なフィールドの値を取得
    const dateTime = record['日時'].value;
    const notes = record['備考'].value;
    const customerRank = record['顧客ランク'].value;

    // OpenAI用のプロンプトを準備
    const prompt = `以下の情報に基づいて、次の連絡日を提案してください：
    前回の連絡日時: ${dateTime}
    顧客ランク: ${customerRank}（A、B、またはC）
    備考: ${notes}
    提案する連絡日は、必ず今日の日付より後の未来の日付にしてください。今日または過去の日付は避けてください。
    一般的に、高ランクの顧客や有望なリードには定期的に、約2週間ごとに連絡するべきです。
    特定の問題がない限り、低ランクの顧客や見込みのないリードに時間を費やすべきではありません。
    "2012-01-11"の形式で次の連絡日のみを回答してください。回答に他の文章を含めないでください。`;

    const body = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは顧客情報に基づいて次の連絡日を提案する便利なアシスタントです。"
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };

    kintone.plugin.app.proxy(PLUGIN_ID, 'https://api.openai.com/v1/chat/completions', 'POST', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIToken}`
    }, JSON.stringify(body), (body, status, headers) => {
      // 成功時の処理
      try {
        const responseData = JSON.parse(body);
        const suggestedDate = responseData.choices[0].message.content.trim();
        console.log('OpenAIの提案:', suggestedDate);
        updateKintoneRecord(suggestedDate);
      } catch (error) {
        console.error('レスポンス処理中にエラーが発生しました:', error);
        alert('レスポンスの処理中にエラーが発生しました。もう一度お試しください。');
      }
    }, (error) => {
      // エラー時のコールバック
      console.error('エラーが発生しました:', error);
      alert('次の連絡日の計算中にエラーが発生しました。もう一度お試しください。');
    });
  }

  function updateKintoneRecord(suggestedDate) {
    const app = kintone.app.getId();
    const record = kintone.app.record.getId();

    const params = {
      app: app,
      id: record,
      record: {
        '日付': {
          value: suggestedDate
        }
      }
    };

    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params, function(resp) {
      console.log('レコードが正常に更新されました', resp);
      alert('次の連絡日が更新されました: ' + suggestedDate);
      // 更新されたレコードを表示するためにページをリロード
      location.reload();
    }, function(error) {
      console.error('レコード更新中にエラーが発生しました:', error);
      alert('レコードの更新に失敗しました。もう一度お試しください。');
    });
  }

  kintone.events.on('app.record.detail.show', (event) => {
    const headerSpace = kintone.app.record.getHeaderMenuSpaceElement();
    if (headerSpace === null) {
      throw new Error('このページでヘッダー要素が利用できません。');
    }

    const button = document.createElement('button');
    button.id = 'auto-priority-button';
    button.textContent = '自動優先度計算';
    button.style.marginTop = '10px';
    button.addEventListener('click', calculateSentiment);

    headerSpace.appendChild(button);

    return event;
  });

})(kintone.$PLUGIN_ID);