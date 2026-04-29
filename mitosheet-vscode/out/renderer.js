var n=e=>({renderOutputItem(o,s){s.style.display="none";let t=o.json();e.postMessage?.({type:"mito:register",port:t.port,sessionId:t.session_id})},disposeOutputItem(){}});export{n as activate};
