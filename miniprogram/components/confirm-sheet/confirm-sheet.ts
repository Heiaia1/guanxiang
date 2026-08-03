Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: "请确认"
    },
    message: {
      type: String,
      value: ""
    },
    confirmText: {
      type: String,
      value: "确认"
    },
    danger: {
      type: Boolean,
      value: false
    },
    motionOff: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    stopPropagation() {},
    cancel() {
      this.triggerEvent("cancel")
    },
    confirm() {
      this.triggerEvent("confirm")
    }
  }
})
