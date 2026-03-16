import { useRef } from 'react';

type CreationRef<T> = {
  deps: React.DependencyList;
  value: T | undefined;
};

const depsAreSame = (prevDeps: React.DependencyList, nextDeps: React.DependencyList) => {
  return prevDeps.length === nextDeps.length && prevDeps.every((dep, index) => Object.is(dep, nextDeps[index]));
};

export function useCreation<T>(factory: () => T, deps: React.DependencyList) {
  const ref = useRef<CreationRef<T>>(null);
  if (ref.current === null || !depsAreSame(ref.current.deps, deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}
