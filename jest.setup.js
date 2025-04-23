const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// モックDOM環境のセットアップ
const createMockSVGElement = () => {
  return {
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    style: {},
    remove: jest.fn()
  };
};

// createElementNSのモック
document.createElementNS = (namespace, tagName) => {
  const element = createMockSVGElement();
  element.tagName = tagName.toUpperCase();
  element.namespaceURI = namespace;
  return element;
};

// SVGElement関連のグローバルモック
global.SVGElement = class SVGElement {};
global.SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0
});

// グローバルモック
global.Image = class {
  constructor() {
    setTimeout(() => this.onload && this.onload());
  }
};

global.URL.createObjectURL = jest.fn();

// ResizeObserverのモック
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// DOMRectのモック
global.DOMRect = class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
};

// getBoundingClientRectのモック
Element.prototype.getBoundingClientRect = function() {
  return new DOMRect(0, 0, 1000, 1000);
};

// その他のDOM要素のモック
HTMLElement.prototype.getBoundingClientRect = () => ({
  width: 500,
  height: 500,
  top: 0,
  left: 0,
  bottom: 500,
  right: 500
});

// SVG属性のモック化ヘルパー
const mockSVGAttributes = (element) => {
  const attributes = new Map();
  
  element.setAttribute = (name, value) => {
    attributes.set(name, value);
  };
  
  element.getAttribute = (name) => {
    return attributes.get(name);
  };
  
  return element;
};

// createElementのモック
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
  const element = originalCreateElement.call(document, tagName);
  return mockSVGAttributes(element);
};