export interface TDK {
  title: string,
  keywords?: string,
  description?: string
}

export type IMessage<T> = {
	type: string
	data: T
}