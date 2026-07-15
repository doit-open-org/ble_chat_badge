// utils/eventBus.js
class EventBus {
  constructor() {
    // 用对象存储事件：key 是事件名，value 是回调函数数组（支持多个监听）
    this.events = {};
  }

  // 注册事件监听
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = []; // 初始化事件数组
    }
    this.events[eventName].push(callback);
  }

  // 触发事件（可传参数）
  emit(eventName, ...args) {
    if (this.events[eventName]) {
      // 遍历执行所有回调，并传入参数
      this.events[eventName].forEach(callback => {
        callback.apply(this, args);
      });
    }
  }

  // 解绑指定事件的指定回调
  off(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  }

  // 解绑事件的所有回调
  offAll(eventName) {
    if (eventName) {
      this.events[eventName] = []; // 清空指定事件
    } else {
      this.events = {}; // 清空所有事件
    }
  }
}

// 导出单例（全局唯一实例，确保跨文件使用同一个事件中心）
export default new EventBus();