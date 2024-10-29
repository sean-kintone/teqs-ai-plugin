(function (PLUGIN_ID) {
  'use strict';

  async function calculateSentiment(records) {
    // プラグイン設定からAPIキーを取得
    const filteredRecords = records.filter(record => record.Status.value !== "完了");
    const processedRecords = filteredRecords.map(record => ({
      id: record.$id.value,
      detail: record.Detail.value,
      detailsTable: record['対応詳細'].value.map(row => row.value['文字列__複数行__1'].value).join(' ')
    }));

    const prompt = `以下の顧客サポート記録を分析し、優先度の高い上位3件を選んでください。各記録の重要性、緊急性、潜在的な影響を考慮してください。
    回答は、以下のJSONオブジェクトの配列形式で提供してください：
    records: [
      {
        "record": {
          "id": number,
          "priority": number,
          "reason": string
        }
      },
      ...
    ]
    priorityは1（最高）から3の数値で表してください。reasonは選択した理由を簡潔に説明してください。
    以下が分析対象の記録です：
    ${JSON.stringify(processedRecords, null, 2)}`;
    const body = {
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant designed to output JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    };
    try {
      const response = await kintone.plugin.app.proxy(PLUGIN_ID, 'https://api.openai.com/v1/chat/completions', 'POST', {}, JSON.stringify(body));
      const parsedResponse = JSON.parse(response[0]);
      console.log(parsedResponse)
      const content = JSON.parse(parsedResponse.choices[0].message.content);
      console.log(content)
      return content.records;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return [];
    }
  }

  function displayPriorityRecords(priorityRecords) {
    const modal = document.getElementById('priority-modal') || createModal();
    const recordsContainer = modal.querySelector('#priority-records');
    recordsContainer.innerHTML = '';
    const appId = kintone.app.getId();
    const baseUrl = `${location.origin}/k/${appId}/show#record=`;

    priorityRecords.forEach(item => {
      const recordDiv = document.createElement('div');
      recordDiv.innerHTML = `
        <h3>優先度: ${item.record.priority}</h3>
        <p><strong>記録 ID:</strong> <a href="${baseUrl}${item.record.id}" target="_blank">${item.record.id}</a></p>
        <p><strong>理由:</strong> ${item.record.reason}</p>
        <hr>
      `;
      recordsContainer.appendChild(recordDiv);
    });

    modal.style.display = 'block';
  }

  kintone.events.on('app.record.index.show', (event) => {
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
        const priorityRecords = await calculateSentiment(event.records);
        console.log('Prioritized records:', priorityRecords);
        if (priorityRecords.length > 0) {
          displayPriorityRecords(priorityRecords)
        } else {
          alert('優先度の計算結果が得られませんでした。ログを確認してください。');
        }
      } catch (error) {
        console.error('Error calculating priorities:', error);
        alert('優先度の計算中にエラーが発生しました。コンソールログを確認してください。');
      } finally {
        button.disabled = false;
        button.textContent = '自動優先度計算';
      }
    });
    headerSpace.appendChild(button);
    return event;
  });

})(kintone.$PLUGIN_ID);

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'priority-modal';
  modal.style.display = 'block';
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