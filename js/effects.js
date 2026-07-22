/**
 * AmbientFX — 비활성 (GPU 절약)
 * 배경 이펙트는 사용하지 않습니다. app.js만 로드하면 됩니다.
 * 파일을 남겨 둔 이유는 예전 문서/캐시 참조 깨짐 방지용입니다.
 */
(function (global) {
  'use strict';
  function init() {
    return { burst() {}, stop() {}, runFor() {} };
  }
  global.AmbientFX = { init, burst() {} };
  global.PortfolioFX = global.AmbientFX;
})(typeof window !== 'undefined' ? window : globalThis);
