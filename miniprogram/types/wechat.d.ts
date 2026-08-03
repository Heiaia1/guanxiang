declare function App<T = Record<string, unknown>>(
  options: T & Record<string, unknown> & ThisType<T & Record<string, any>>
): void
declare function Page<T = Record<string, unknown>>(
  options: T & Record<string, unknown> & ThisType<any>
): void
declare function Component<T = Record<string, unknown>>(
  options: T & Record<string, unknown> & ThisType<any>
): void
declare function getApp<T = Record<string, unknown>>(): T
declare function getCurrentPages(): Array<Record<string, unknown>>
declare function require(path: string): any

declare const wx: {
  [key: string]: any
  getStorageSync(key: string): unknown
  setStorageSync(key: string, value: unknown): void
  removeStorageSync(key: string): void
}

declare namespace WechatMiniprogram {
  interface BaseEvent<T = Record<string, unknown>> {
    type: string
    timeStamp: number
    target: {
      id: string
      dataset: T
    }
    currentTarget: {
      id: string
      dataset: T
    }
    detail: Record<string, unknown>
  }

  interface Input extends BaseEvent {
    detail: {
      value: string
      cursor?: number
      keyCode?: number
    }
  }

  namespace Page {
    interface ICustomShareContent {
      title?: string
      path?: string
      imageUrl?: string
      promise?: Promise<ICustomShareContent>
    }
  }
}
