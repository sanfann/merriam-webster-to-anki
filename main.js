browser.storage.sync.get().then((config) => {
  document.ondblclick = function (e) {
    const sel = (document.selection && document.selection.createRange().text) ||
      (window.getSelection && window.getSelection().toString());
    fetch(`https://www.dictionaryapi.com/api/v3/references/learners/json/${sel}?key=${config.key}`)
    .then(response => response.json())
    .then(data => {
      const content = convertToContent(data, sel);
      popDiv(e.clientX, e.clientY, content);
    });
  };
  
  document.onclick = function(e) {
    console.log(e.target);
    if (!e.target.closest('.popup')) {
      document.querySelectorAll(".popup").forEach(popup => document.body.removeChild(popup));
    }
  }
  
  function defToDom(defs) {
    const span = document.createElement('span');
    if (defs && defs.length > 0) {
      span.innerHTML = defs[0].sseq.flatMap(s => s.filter(c => c[0] == 'sense').map(c => c[1].dt)).map(dt => {
        return dt.map(d => {
          let s;
          if (d[0] == 'text') {
            s = `<span class="def">- ${d[1]}</span>`;
          } else if (d[0] == 'wsgram') {
            s = `</br><span class="wsgram">${d[1]}:</span>`;
          } else if (d[0] == 'vis') {
            s = d[1].map(v => `</br><span class="vis">&nbsp;&nbsp;*&nbsp;${v.t}</span>`).join('');
          } else if (d[0] == 'snote') {
            s = d[1].map(dd => {
              let ds;
              if (dd[0] == 't') {
                ds = `</br><span class="vis">&nbsp;&nbsp;*&nbsp;${dd[1]}</span>`;
              } else if (dd[0] == 'vis') {
                ds = dd[1].map(v => `</br><span class="vis">&nbsp;&nbsp;*&nbsp;${v.t}</span>`).join('');
              } else {
                ds = '';
              }
              return ds;
            }).join('');
          } else {
            s = '';
          }
          return s;
        }).join('');
      }).join('</br>')
      .replaceAll('{bc}','')
      .replaceAll('{ldquo}','"')
      .replaceAll('{rdquo}','"')
      .replaceAll('{it}','<i>').replaceAll('{/it}','</i>')
      .replaceAll('{sc}','<small>').replaceAll('{/sc}','</small>')
      .replaceAll('{inf}','').replaceAll('{/inf}','')
      .replaceAll('{sup}','').replaceAll('{/sup}','')
      .replaceAll('{dx}','').replaceAll('{/dx}','')
      .replaceAll('{dx_def}','').replaceAll('{/dx_def}','')
      .replaceAll('{dx_ety}','').replaceAll('{/dx_ety}','')
      .replaceAll('{ma}','').replaceAll('{/ma}','')
      .replaceAll('{gloss}','').replaceAll('{/gloss}','')
      .replaceAll('{parahw}','').replaceAll('{/parahw}','')
      .replaceAll('{phrase}','').replaceAll('{/phrase}','')
      .replaceAll('{qword}','').replaceAll('{/qword}','')
      .replaceAll('{wi}','').replaceAll('{/wi}','')
      .replaceAll('{b}','<b>').replaceAll('{/b}','</b>');
      return span;
    } else {
      return document.createTextNode('');
    }
  }
  
  function convertToContent(words, word) {
    let newContent;
    if (words && words.length > 0) {
      const spans = words.map(w => {
        const defintion = defToDom(w.def);
        let ipa = '';
        if (w.hwi.prs && w.hwi.prs.length > 0) {
          ipa = `\[/${w.hwi.prs[0].ipa}/\]`;
        }
        const span = document.createElement("span"); 
  
        const hw = document.createElement("b"); 
        hw.appendChild(document.createTextNode(w.hwi.hw));
        const fl = document.createElement("small"); 
        fl.appendChild(document.createTextNode(`\(${w.fl}\)`));
  
        const wordSpan = document.createElement("span"); 
        const defSpan = document.createElement("span"); 
        
        wordSpan.appendChild(hw);
        wordSpan.appendChild(document.createTextNode(" "));
        wordSpan.appendChild(document.createTextNode(ipa));
        wordSpan.appendChild(document.createTextNode(" "));
        wordSpan.appendChild(fl);
        wordSpan.appendChild(document.createTextNode(" "));
        const wordHtml = wordSpan.outerHTML;
        const anki = document.createElement('img')
        anki.src = browser.runtime.getURL("anki-icon.png");
        anki.addEventListener('click', () => addNote(wordHtml, defintion.outerHTML));
        wordSpan.appendChild(anki);

        defSpan.appendChild(document.createElement("br"));
        defSpan.appendChild(defintion);

        span.appendChild(wordSpan);
        span.appendChild(defSpan);
        return span;
      });
      newContent = spans.reduce((accumulator, currentValue) => {
        accumulator.append(document.createElement('br'));
        accumulator.append(document.createElement('br'));
        accumulator.append(currentValue);
        return accumulator;
      }); 
    } else {
      newContent = document.createTextNode('No result found'); 
    }
    return newContent;
  }
  
  function popDiv(x, y, content) {
    const popup = document.createElement("div"); 
    popup.className = 'popup';
    popup.appendChild(content);  
    popup.style.top = `${y-90}px`;
    popup.style.left = `${x-25}px`;
    document.body.appendChild(popup); 
  }
  
  function addNote(word, content) {
    const data = {
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: `${config.deck}`,
          modelName: "Basic",
          fields: {
            Front: word,
            Back: content
          },
          options: {
            allowDuplicate: false,
            duplicateScope: "deck"
          }
        }
      }
    };
    return fetch('http://localhost:8765', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data)
    });
  }
});
