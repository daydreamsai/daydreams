import type { Container } from "@/types/container";
import type {
  Logger,
  ServiceManager,
  ServiceManagerState,
  ServiceProvider,
} from "@/types/managers";

export function service(config: ServiceProvider) {
  return config;
}

export function createServiceManager(container: Container): ServiceManager {
  const state: ServiceManagerState = {
    providers: [],
    booted: new Set(),
    registered: new Set(),
  };

  const registerProvider = (
    container: Container,
    provider: ServiceProvider
  ): void => {
    if (state.registered.has(provider)) return;
    state.registered.add(provider);
    if (provider.register) provider.register(container);
  };

  const bootProvider = async (
    container: Container,
    provider: ServiceProvider
  ): Promise<void> => {
    if (state.booted.has(provider)) return;
    state.booted.add(provider);
    if (provider.boot) await provider.boot(container);
  };

  return {
    state,
    register: (provider: ServiceProvider): void => {
      if (!state.providers.includes(provider)) {
        state.providers.push(provider);
        registerProvider(container, provider);
      }
    },

    bootAll: async (): Promise<void> => {
      container
        .resolve<Logger>("logger")
        .debug("service-manager:boot", "Booting services");

      for (const provider of state.providers) {
        registerProvider(container, provider);
      }

      for (const provider of state.providers) {
        await bootProvider(container, provider);
      }
    },

    isBooted: (provider: ServiceProvider): boolean =>
      state.booted.has(provider),

    isRegistered: (provider: ServiceProvider): boolean =>
      state.registered.has(provider),
  };
}
