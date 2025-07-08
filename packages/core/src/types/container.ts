export type Constructor<T> = new (...args: any[]) => T;
export type Factory<T = any> = (container: Container) => T;
export type FunctionType = (...args: any[]) => any;
export type Token = string | symbol | Constructor<any> | FunctionType;

export interface Container {
  register: <T>(token: Token, factory: Factory<T>) => Container;
  singleton: <T>(token: Token, factory: Factory<T>) => Container;
  instance: <T>(token: Token, instance: T) => Container;
  alias: (aliasToken: string | symbol, originalToken: Token) => Container;
  resolve: <T>(token: Token) => T;
}
