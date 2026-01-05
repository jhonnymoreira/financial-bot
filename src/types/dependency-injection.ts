import type * as services from '@/services/index.js';

export type Services = typeof services;

export type ServicesDependencies = {
  [ServiceName in keyof Services as Uncapitalize<ServiceName>]: InstanceType<
    Services[ServiceName]
  >;
};

export type DependencyInjection = {
  services: ServicesDependencies;
};
