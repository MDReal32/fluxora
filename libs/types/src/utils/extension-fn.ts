import type { Prettify } from "../common/prettify";
import type { MergeStrings } from "../main";
import type { ToString } from "./to-string";

export type ExtendableFn<TExtension = unknown> = (key: string) => TExtension;

export type ExtendFnReturnType<
  TKey extends string,
  TKeys extends string[],
  TDelimiter extends string,
  TExtension extends object,
  TExtraReturn = {}
> = Prettify<
  { readonly $raw: MergeStrings<[TKey, ...TKeys], TDelimiter> } & ToString<MergeStrings<[TKey, ...TKeys], TDelimiter>> &
    TExtension &
    TExtraReturn
>;

export type ExtendFn<
  TKey extends string,
  TDelimiter extends string,
  TConstructorExtensions extends Record<string, ExtendableFn>,
  TExtraReturn = {}
> = <TKeys extends string[], TExtension extends object>(
  ...keysWithExtensionFn:
    | TKeys
    | [
        ...TKeys,
        ((
          cb: ExtensionFn<MergeStrings<[TKey, ...TKeys], TDelimiter>, TDelimiter, TConstructorExtensions>
        ) => TExtension)?
      ]
) => ExtendFnReturnType<TKey, TKeys, TDelimiter, TExtension, TExtraReturn>;

type UpdateExtensions<
  TKey extends string,
  TDelimiter extends string,
  TConstructorExtensions extends Record<string, ExtendableFn>
> = {
  [K in keyof TConstructorExtensions]: ExtendFn<
    TKey,
    TDelimiter,
    TConstructorExtensions,
    ReturnType<TConstructorExtensions[K]>
  >;
};

export type ExtensionFn<
  TKey extends string,
  TDelimiter extends string,
  TConstructorExtensions extends Record<string, ExtendableFn>
> = UpdateExtensions<TKey, TDelimiter, TConstructorExtensions> & {
  <TKeys extends readonly string[]>(...paths: TKeys): MergeStrings<[TKey, ...TKeys], TDelimiter>;

  e: ExtendFn<TKey, TDelimiter, TConstructorExtensions>;
};
