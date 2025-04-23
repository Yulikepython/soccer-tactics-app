// base64エンコード/デコード用のユーティリティ
export const btoa = (str) => {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(str);
    }
    return Buffer.from(str).toString('base64');
  };
  
  export const atob = (str) => {
    if (typeof window !== 'undefined' && window.atob) {
      return window.atob(str);
    }
    return Buffer.from(str, 'base64').toString();
  };