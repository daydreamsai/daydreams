/**
 * Represents a constructor function that creates an instance of type T.
 */
type Constructor<T> = new (...args: any[]) => T;

/**
 * Represents a factory function that creates an instance of type T using the container.
 */
type Factory<T> = (container: Container) => T;

/**
 * Represents any function type.
 */
type FunctionType = (...args: any[]) => any;

/**
 * Represents a dependency injection token that can be a string, symbol, constructor, or function.
 */
type Token = string | symbol | Constructor<any> | FunctionType;

/**
 * Interface for a dependency injection container.
 */
export interface Container {
  /**
   * Registers a factory function for a token.
   * Each time the token is resolved, the factory will be called to create a new instance.
   *
   * @param token - The token to register
   * @param factory - The factory function that creates the instance
   * @returns The container instance for chaining
   */
  register: <T>(token: Token, factory: Factory<T>) => Container;

  /**
   * Registers a singleton factory function for a token.
   * The factory will be called only once when the token is first resolved,
   * and the same instance will be returned for subsequent resolutions.
   *
   * @param token - The token to register
   * @param factory - The factory function that creates the singleton instance
   * @returns The container instance for chaining
   */
  singleton: <T>(token: Token, factory: Factory<T>) => Container;

  /**
   * Registers a pre-created instance for a token.
   *
   * @param token - The token to register
   * @param instance - The instance to register
   * @returns The container instance for chaining
   */
  instance: <T>(token: Token, instance: T) => Container;

  /**
   * Creates an alias for an existing token.
   *
   * @param aliasToken - The alias token (must be a string or symbol)
   * @param originalToken - The original token to alias
   * @returns The container instance for chaining
   */
  alias: (aliasToken: string | symbol, originalToken: Token) => Container;

  /**
   * Resolves a token to its registered instance.
   *
   * @param token - The token to resolve
   * @returns The resolved instance
   * @throws Error if no registration is found for the token
   */
  resolve: <T>(token: Token) => T;
}

/**
 * Creates a new dependency injection container.
 *
 * @returns A new Container instance
 *
 * @example
 * ```typescript
 * const container = createContainer();
 *
 * // Register a transient dependency
 * container.register('logger', () => new Logger());
 *
 * // Register a singleton
 * container.singleton('database', (c) => new Database(c.resolve('config')));
 *
 * // Register a pre-created instance
 * container.instance('config', { connectionString: 'mongodb://localhost:27017' });
 *
 * // Create an alias
 * container.alias('db', 'database');
 *
 * // Resolve dependencies
 * const db = container.resolve<Database>('db');
 * ```
 */
export const createContainer = (): Container => {
  const instances = new Map<Token, any>();
  const factories = new Map<Token, Factory<any>>();
  const singletons = new Set<Token>();
  const aliases = new Map<string | symbol, Token>();

  /**
   * Converts a token to a string representation for error messages.
   */
  const getTokenString = (token: Token): string => {
    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") {
      return token.name || "anonymous function";
    }
    return "unknown token";
  };

  /**
   * Resolves a token to its original token if it's an alias.
   */
  const resolveToken = (token: Token): Token => {
    if (typeof token === "string" || typeof token === "symbol") {
      return aliases.get(token) || token;
    }
    return token;
  };

  const container: Container = {
    register: <T>(token: Token, factory: Factory<T>): Container => {
      factories.set(token, factory);
      instances.delete(token);
      return container;
    },

    singleton: <T>(token: Token, factory: Factory<T>): Container => {
      factories.set(token, factory);
      singletons.add(token);
      instances.delete(token);
      return container;
    },

    instance: <T>(token: Token, value: T): Container => {
      instances.set(token, value);
      factories.delete(token);
      singletons.delete(token);
      return container;
    },

    alias: (aliasToken: string | symbol, originalToken: Token): Container => {
      aliases.set(aliasToken, originalToken);
      return container;
    },

    resolve: <T>(token: Token): T => {
      const resolvedToken = resolveToken(token);

      if (instances.has(resolvedToken)) {
        return instances.get(resolvedToken);
      }

      const factory = factories.get(resolvedToken);
      if (!factory) {
        throw new Error(
          `No registration found for ${getTokenString(resolvedToken)}`
        );
      }

      if (singletons.has(resolvedToken)) {
        if (!instances.has(resolvedToken)) {
          instances.set(resolvedToken, factory(container));
        }
        return instances.get(resolvedToken);
      }

      return factory(container);
    },
  };

  return container;
};
