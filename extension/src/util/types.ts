export type ApiInfo<Params> = {
  URI: string,
  method: 'GET' | 'POST',
  params?: Params,
  content_type?: 'application/json' | 'application/x-www-form-urlencoded',
  full_url?: boolean 
}

export type Params = {
  [propName: string]: any;
}

export type RequestReq<T, K> = {
  method: 'GET' | 'POST',
  headers: T,
  body?: K
}

export type Domain = {
  category: string[],
  name: string,
  domain: string
}

export type ScoreList = Params[]