import type { Prettify } from "@fluxora/types";
import type { ExtendFn, ExtendableFn, ExtensionFn } from "@fluxora/types/utils";

export const stringConstructor = <
  TBaseKey extends string,
  TExtension extends object,
  TDelimiter extends string,
  TConstructorExtensions extends Record<string, ExtendableFn>
>(
  baseKey: TBaseKey,
  delimiter: TDelimiter,
  extension: (cb: ExtensionFn<TBaseKey, TDelimiter, TConstructorExtensions>) => TExtension = () => ({}) as TExtension,
  stringConstructorExtensions?: TConstructorExtensions
): Prettify<
  { $raw: TBaseKey } & {
    [key in keyof TConstructorExtensions]: ReturnType<TConstructorExtensions[key]>;
  } & TExtension & { toString: () => TBaseKey }
> => {
  const efn = (<TKeys extends readonly string[]>(...keys: TKeys) => [baseKey, ...keys].join(delimiter)) as ExtensionFn<
    TBaseKey,
    TDelimiter,
    TConstructorExtensions
  >;
  efn.e = (...keysWithExtension) => {
    const keys = keysWithExtension.slice(0, -1) as unknown as string[];
    let newExtension = keysWithExtension.at(-1)! as unknown as any;
    if (typeof newExtension !== "function") {
      keys.push(newExtension);
      newExtension = undefined;
    }
    return stringConstructor(efn(...keys), delimiter, newExtension, stringConstructorExtensions);
  };

  let sceReturnResult = {} as { [key in keyof TConstructorExtensions]: ReturnType<TConstructorExtensions[key]> };
  if (stringConstructorExtensions) {
    const sceEntries = Object.entries(stringConstructorExtensions);
    const updatedSce = sceEntries.map(
      ([key, fn]) =>
        [
          key,
          (...keys) => {
            const constructorResult = efn.e(...keys);
            const fnResult = fn(constructorResult.$raw);
            return Object.assign({}, fnResult, constructorResult);
          }
        ] as [typeof key, ExtendFn<TBaseKey, TDelimiter, TConstructorExtensions>]
    );
    const sce = Object.fromEntries(updatedSce);
    Object.assign(efn, sce);
  }

  return Object.assign<
    { $raw: TBaseKey },
    { [key in keyof TConstructorExtensions]: ReturnType<TConstructorExtensions[key]> },
    TExtension,
    { toString: () => TBaseKey }
  >({ $raw: baseKey }, sceReturnResult, extension(efn), { toString: () => baseKey });
};

stringConstructor.new =
  <TDelimiter extends string, TConstructorExtensions extends Record<string, ExtendableFn>>(
    delimiter: TDelimiter,
    stringConstructorExtensions?: TConstructorExtensions
  ) =>
  <TBaseKey extends string, TExtension extends object>(
    baseKey: TBaseKey,
    extension: (cb: ExtensionFn<TBaseKey, TDelimiter, TConstructorExtensions>) => TExtension
  ) =>
    stringConstructor(baseKey, delimiter, extension, stringConstructorExtensions);
