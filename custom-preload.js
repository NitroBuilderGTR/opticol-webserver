// custom-preload.js

window.electronAPI = {
    startWebServer: async () => {
      return ipcRenderer.invoke('start-web-server');
    },
    stopWebServer: async () => {
      return ipcRenderer.invoke('stop-web-server');
    }
  };
  
  window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) element.innerText = text;
    };
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type]);
    }
  });
  